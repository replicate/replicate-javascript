const crypto = require("node:crypto");

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
 * @returns {boolean} - True if the signature is valid
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
      const chunks = [];
      for await (const chunk of body) {
        chunks.push(Buffer.from(chunk));
      }
      body = Buffer.concat(chunks).toString("utf8");
    } catch (err) {
      throw new Error(`Error reading body: ${err.message}`);
    }
  } else if (body instanceof Buffer) {
    body = body.toString("utf8");
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

  const secretBytes = Buffer.from(signingSecret.split("_")[1], "base64");

  const computedSignature = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const expectedSignatures = signature
    .split(" ")
    .map((sig) => sig.split(",")[1]);

  return expectedSignatures.some(
    (expectedSignature) => expectedSignature === computedSignature
  );
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
      buffer = Buffer.from(await value.arrayBuffer());
      mime = value.type;
    } else if (Buffer.isBuffer(value)) {
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

    const data = buffer.toString("base64");
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

module.exports = { transformFileInputs, validateWebhook, withAutomaticRetries };
