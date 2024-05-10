const ApiError = require("./error");

/**
 * @see {@link validateWebhook}
 * @overload
 * @param {object} requestData - The request data
 * @param {string} requestData.id - The webhook ID header from the incoming request.
 * @param {string} requestData.timestamp - The webhook timestamp header from the incoming request.
 * @param {string} requestData.body - The raw body of the incoming webhook request.
 * @param {string} requestData.secret - The webhook secret, obtained from `replicate.webhooks.defaul.secret` method.
 * @param {string} requestData.signature - The webhook signature header from the incoming request, comprising one or more space-delimited signatures.
 */

/**
 * @see {@link validateWebhook}
 * @overload
 * @param {object} requestData - The request object
 * @param {object} requestData.headers - The request headers
 * @param {string} requestData.headers["webhook-id"] - The webhook ID header from the incoming request
 * @param {string} requestData.headers["webhook-timestamp"] - The webhook timestamp header from the incoming request
 * @param {string} requestData.headers["webhook-signature"] - The webhook signature header from the incoming request, comprising one or more space-delimited signatures
 * @param {string} requestData.body - The raw body of the incoming webhook request
 * @param {string} secret - The webhook secret, obtained from `replicate.webhooks.defaul.secret` method
 */

/**
 * Validate a webhook signature
 *
 * @returns {Promise<boolean>} - True if the signature is valid
 * @throws {Error} - If the request is missing required headers, body, or secret
 */
async function validateWebhook(requestData, secret) {
  let { id, timestamp, body, signature } = requestData;
  const signingSecret = secret || requestData.secret;

  if (requestData && requestData.headers && requestData.body) {
    id = requestData.headers.get("webhook-id");
    timestamp = requestData.headers.get("webhook-timestamp");
    signature = requestData.headers.get("webhook-signature");
    body = requestData.body;
  }

  if (body instanceof ReadableStream || body.readable) {
    try {
      body = await new Response(body).text();
    } catch (err) {
      throw new Error(`Error reading body: ${err.message}`);
    }
  } else if (isTypedArray(body)) {
    body = await new Blob([body]).text();
  } else if (typeof body !== "string") {
    throw new Error("Invalid body type");
  }

  if (!id || !timestamp || !signature) {
    throw new Error("Missing required webhook headers");
  }

  if (!body) {
    throw new Error("Missing required body");
  }

  if (!signingSecret) {
    throw new Error("Missing required secret");
  }

  const signedContent = `${id}.${timestamp}.${body}`;

  const computedSignature = await createHMACSHA256(
    signingSecret.split("_").pop(),
    signedContent
  );

  const expectedSignatures = signature
    .split(" ")
    .map((sig) => sig.split(",")[1]);

  return expectedSignatures.some(
    (expectedSignature) => expectedSignature === computedSignature
  );
}

/**
 * @param {string} secret - base64 encoded string
 * @param {string} data - text body of request
 */
async function createHMACSHA256(secret, data) {
  const encoder = new TextEncoder();
  let crypto = globalThis.crypto;

  // In Node 18 the `crypto` global is behind a --no-experimental-global-webcrypto flag
  if (typeof crypto === "undefined" && typeof require === "function") {
    // NOTE: Webpack (primarily as it's used by Next.js) and perhaps some
    // other bundlers do not currently support the `node` protocol and will
    // error if it's found in the source. Other platforms like CloudFlare
    // will only support requires when using the node protocol.
    //
    // As this line is purely to support Node 18.x we make an indirect request
    // to the require function which fools Webpack...
    //
    // We may be able to remove this in future as it looks like Webpack is getting
    // support for requiring using the `node:` protocol.
    // See: https://github.com/webpack/webpack/issues/18277
    crypto = require.call(null, "node:crypto").webcrypto;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64(signature);
}

/**
 * Convert a base64 encoded string into bytes.
 *
 * @param {string} the base64 encoded string
 * @return {Uint8Array}
 *
 * Two functions for encoding/decoding base64 strings using web standards. Not
 * intended to be used to encode/decode arbitrary string data.
 * See: https://developer.mozilla.org/en-US/docs/Glossary/Base64#javascript_support
 * See: https://stackoverflow.com/a/31621532
 *
 * Performance might take a hit because of the conversion to string and then to binary,
 * if this is the case we might want to look at an alternative solution.
 * See: https://jsben.ch/wnaZC
 */
function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (m) => m.codePointAt(0));
}

/**
 * Convert a base64 encoded string into bytes.
 *
 * See {@link base64ToBytes} for caveats.
 *
 * @param {Uint8Array | ArrayBuffer} the base64 encoded string
 * @return {string}
 */
function bytesToBase64(bytes) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
}

/**
 * Automatically retry a request if it fails with an appropriate status code.
 *
 * A GET request is retried if it fails with a 429 or 5xx status code.
 * A non-GET request is retried only if it fails with a 429 status code.
 *
 * If the response sets a Retry-After header,
 * the request is retried after the number of seconds specified in the header.
 * Otherwise, the request is retried after the specified interval,
 * with exponential backoff and jitter.
 *
 * @param {Function} request - A function that returns a Promise that resolves with a Response object
 * @param {object} options
 * @param {Function} [options.shouldRetry] - A function that returns true if the request should be retried
 * @param {number} [options.maxRetries] - Maximum number of retries. Defaults to 5
 * @param {number} [options.interval] - Interval between retries in milliseconds. Defaults to 500
 * @returns {Promise<Response>} - Resolves with the response object
 * @throws {ApiError} If the request failed
 */
async function withAutomaticRetries(request, options = {}) {
  const shouldRetry = options.shouldRetry || (() => false);
  const maxRetries = options.maxRetries || 5;
  const interval = options.interval || 500;
  const jitter = options.jitter || 100;

  // eslint-disable-next-line no-promise-executor-return
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let attempts = 0;
  do {
    let delay = interval * 2 ** attempts + Math.random() * jitter;

    /* eslint-disable no-await-in-loop */
    try {
      const response = await request();
      if (response.ok || !shouldRetry(response)) {
        return response;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const retryAfter = error.response.headers.get("Retry-After");
        if (retryAfter) {
          if (!Number.isInteger(retryAfter)) {
            // Retry-After is a date
            const date = new Date(retryAfter);
            if (!Number.isNaN(date.getTime())) {
              delay = date.getTime() - new Date().getTime();
            }
          } else {
            // Retry-After is a number of seconds
            delay = retryAfter * 1000;
          }
        }
      }
    }

    if (Number.isInteger(maxRetries) && maxRetries > 0) {
      if (Number.isInteger(delay) && delay > 0) {
        await sleep(interval * 2 ** (options.maxRetries - maxRetries));
      }
      attempts += 1;
    }
    /* eslint-enable no-await-in-loop */
  } while (attempts < maxRetries);

  return request();
}

const MAX_DATA_URI_SIZE = 10_000_000;

/**
 * Walks the inputs and transforms any binary data found into a
 * base64-encoded data URI.
 *
 * @param {object} inputs - The inputs to transform
 * @returns {object} - The transformed inputs
 * @throws {Error} If the size of inputs exceeds a given threshould set by MAX_DATA_URI_SIZE
 */
async function transformFileInputs(inputs) {
  let totalBytes = 0;
  const result = await transform(inputs, async (value) => {
    let buffer;
    let mime;

    if (value instanceof Blob) {
      // Currently we use a NodeJS only API for base64 encoding, as
      // we move to support the browser we could support either using
      // btoa (which does string encoding), the FileReader API or
      // a JavaScript implenentation like base64-js.
      // See: https://developer.mozilla.org/en-US/docs/Glossary/Base64
      // See: https://github.com/beatgammit/base64-js
      buffer = await value.arrayBuffer();
      mime = value.type;
    } else if (isTypedArray(value)) {
      buffer = value;
    } else {
      return value;
    }

    totalBytes += buffer.byteLength;
    if (totalBytes > MAX_DATA_URI_SIZE) {
      throw new Error(
        `Combined filesize of prediction ${totalBytes} bytes exceeds 10mb limit for inline encoding, please provide URLs instead`
      );
    }

    const data = bytesToBase64(buffer);
    mime = mime ?? "application/octet-stream";

    return `data:${mime};base64,${data}`;
  });

  return result;
}

// Walk a JavaScript object and transform the leaf values.
async function transform(value, mapper) {
  if (Array.isArray(value)) {
    let copy = [];
    for (const val of value) {
      copy = await transform(val, mapper);
    }
    return copy;
  }

  if (isPlainObject(value)) {
    const copy = {};
    for (const key of Object.keys(value)) {
      copy[key] = await transform(value[key], mapper);
    }
    return copy;
  }

  return await mapper(value);
}

function isTypedArray(arr) {
  return (
    arr instanceof Int8Array ||
    arr instanceof Int16Array ||
    arr instanceof Int32Array ||
    arr instanceof Uint8Array ||
    arr instanceof Uint8ClampedArray ||
    arr instanceof Uint16Array ||
    arr instanceof Uint32Array ||
    arr instanceof Float32Array ||
    arr instanceof Float64Array
  );
}

// Test for a plain JS object.
// Source: lodash.isPlainObject
function isPlainObject(value) {
  const isObjectLike = typeof value === "object" && value !== null;
  if (!isObjectLike || String(value) !== "[object Object]") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof Ctor === "function" &&
    Ctor instanceof Ctor &&
    Function.prototype.toString.call(Ctor) ===
      Function.prototype.toString.call(Object)
  );
}

/**
 * Parse progress from prediction logs.
 *
 * This function supports log statements in the following format,
 * which are generated by https://github.com/tqdm/tqdm and similar libraries:
 *
 * ```
 * 76%|████████████████████████████         | 7568/10000 [00:33<00:10, 229.00it/s]
 * ```
 *
 * @example
 * const progress = parseProgressFromLogs("76%|████████████████████████████         | 7568/10000 [00:33<00:10, 229.00it/s]");
 * console.log(progress);
 * // {
 * //   percentage: 0.76,
 * //   current: 7568,
 * //   total: 10000,
 * // }
 *
 * @param {object|string} input - A prediction object or string.
 * @returns {(object|null)} - An object with the percentage, current, and total, or null if no progress can be parsed.
 */
function parseProgressFromLogs(input) {
  const logs = typeof input === "object" && input.logs ? input.logs : input;
  if (!logs || typeof logs !== "string") {
    return null;
  }

  const pattern = /^\s*(\d+)%\s*\|.+?\|\s*(\d+)\/(\d+)/;
  const lines = logs.split("\n").reverse();

  for (const line of lines) {
    const matches = line.match(pattern);

    if (matches && matches.length === 4) {
      return {
        percentage: parseInt(matches[1], 10) / 100,
        current: parseInt(matches[2], 10),
        total: parseInt(matches[3], 10),
      };
    }
  }

  return null;
}

/**
 * Helper to make any `ReadableStream` iterable, this is supported
 * by most server runtimes but browsers still haven't implemented
 * it yet.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream#browser_compatibility
 *
 * @template T
 * @param {ReadableStream<T>} stream an instance of a `ReadableStream`
 * @yields {T} a chunk/event from the stream
 */
async function* streamAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

module.exports = {
  transformFileInputs,
  validateWebhook,
  withAutomaticRetries,
  parseProgressFromLogs,
  streamAsyncIterator,
};
