const ApiError = require("./lib/error");
const ModelVersionIdentifier = require("./lib/identifier");
const { createReadableStream } = require("./lib/stream");
const {
  withAutomaticRetries,
  validateWebhook,
  parseProgressFromLogs,
  streamAsyncIterator,
} = require("./lib/util");

const accounts = require("./lib/accounts");
const collections = require("./lib/collections");
const deployments = require("./lib/deployments");
const hardware = require("./lib/hardware");
const models = require("./lib/models");
const predictions = require("./lib/predictions");
const trainings = require("./lib/trainings");
const webhooks = require("./lib/webhooks");

const packageJSON = require("./package.json");

/**
 * Replicate API client library
 *
 * @see https://replicate.com/docs/reference/http
 * @example
 * // Create a new Replicate API client instance
 * const Replicate = require("replicate");
 * const replicate = new Replicate({
 *     // get your token from https://replicate.com/account
 *     auth: process.env.REPLICATE_API_TOKEN,
 *     userAgent: "my-app/1.2.3"
 * });
 *
 * // Run a model and await the result:
 * const model = 'owner/model:version-id'
 * const input = {text: 'Hello, world!'}
 * const output = await replicate.run(model, { input });
 */
class Replicate {
  /**
   * Create a new Replicate API client instance.
   *
   * @param {object} options - Configuration options for the client
   * @param {string} options.auth - API access token. Defaults to the `REPLICATE_API_TOKEN` environment variable.
   * @param {string} options.userAgent - Identifier of your app
   * @param {string} [options.baseUrl] - Defaults to https://api.replicate.com/v1
   * @param {Function} [options.fetch] - Fetch function to use. Defaults to `globalThis.fetch`
   */
  constructor(options = {}) {
    this.auth =
      options.auth ||
      (typeof process !== "undefined" ? process.env.REPLICATE_API_TOKEN : null);
    this.userAgent =
      options.userAgent || `replicate-javascript/${packageJSON.version}`;
    this.baseUrl = options.baseUrl || "https://api.replicate.com/v1";
    this.fetch = options.fetch || globalThis.fetch;

    this.accounts = {
      current: accounts.current.bind(this),
    };

    this.collections = {
      list: collections.list.bind(this),
      get: collections.get.bind(this),
    };

    this.deployments = {
      get: deployments.get.bind(this),
      create: deployments.create.bind(this),
      update: deployments.update.bind(this),
      list: deployments.list.bind(this),
      predictions: {
        create: deployments.predictions.create.bind(this),
      },
    };

    this.hardware = {
      list: hardware.list.bind(this),
    };

    this.models = {
      get: models.get.bind(this),
      list: models.list.bind(this),
      create: models.create.bind(this),
      versions: {
        list: models.versions.list.bind(this),
        get: models.versions.get.bind(this),
      },
    };

    this.predictions = {
      create: predictions.create.bind(this),
      get: predictions.get.bind(this),
      cancel: predictions.cancel.bind(this),
      list: predictions.list.bind(this),
    };

    this.trainings = {
      create: trainings.create.bind(this),
      get: trainings.get.bind(this),
      cancel: trainings.cancel.bind(this),
      list: trainings.list.bind(this),
    };

    this.webhooks = {
      default: {
        secret: {
          get: webhooks.default.secret.get.bind(this),
        },
      },
    };
  }

  /**
   * Run a model and wait for its output.
   *
   * @param {string} ref - Required. The model version identifier in the format "owner/name" or "owner/name:version"
   * @param {object} options
   * @param {object} options.input - Required. An object with the model inputs
   * @param {object} [options.wait] - Options for waiting for the prediction to finish
   * @param {number} [options.wait.interval] - Polling interval in milliseconds. Defaults to 500
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @param {AbortSignal} [options.signal] - AbortSignal to cancel the prediction
   * @param {Function} [progress] - Callback function that receives the prediction object as it's updated. The function is called when the prediction is created, each time its updated while polling for completion, and when it's completed.
   * @throws {Error} If the reference is invalid
   * @throws {Error} If the prediction failed
   * @returns {Promise<object>} - Resolves with the output of running the model
   */
  async run(ref, options, progress) {
    const { wait, signal, ...data } = options;

    const identifier = ModelVersionIdentifier.parse(ref);

    let prediction;
    if (identifier.version) {
      prediction = await this.predictions.create({
        ...data,
        version: identifier.version,
      });
    } else if (identifier.owner && identifier.name) {
      prediction = await this.predictions.create({
        ...data,
        model: `${identifier.owner}/${identifier.name}`,
      });
    } else {
      throw new Error("Invalid model version identifier");
    }

    // Call progress callback with the initial prediction object
    if (progress) {
      progress(prediction);
    }

    prediction = await this.wait(
      prediction,
      wait || {},
      async (updatedPrediction) => {
        // Call progress callback with the updated prediction object
        if (progress) {
          progress(updatedPrediction);
        }

        // We handle the cancel later in the function.
        if (signal && signal.aborted) {
          return true; // stop polling
        }

        return false; // continue polling
      }
    );

    if (signal && signal.aborted) {
      prediction = await this.predictions.cancel(prediction.id);
    }

    // Call progress callback with the completed prediction object
    if (progress) {
      progress(prediction);
    }

    if (prediction.status === "failed") {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    return prediction.output;
  }

  /**
   * Make a request to the Replicate API.
   *
   * @param {string} route - REST API endpoint path
   * @param {object} options - Request parameters
   * @param {string} [options.method] - HTTP method. Defaults to GET
   * @param {object} [options.params] - Query parameters
   * @param {object|Headers} [options.headers] - HTTP headers
   * @param {object} [options.data] - Body parameters
   * @returns {Promise<Response>} - Resolves with the response object
   * @throws {ApiError} If the request failed
   */
  async request(route, options) {
    const { auth, baseUrl, userAgent } = this;

    let url;
    if (route instanceof URL) {
      url = route;
    } else {
      url = new URL(
        route.startsWith("/") ? route.slice(1) : route,
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
      );
    }

    const { method = "GET", params = {}, data } = options;

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const headers = {};
    if (auth) {
      headers["Authorization"] = `Bearer ${auth}`;
    }
    headers["Content-Type"] = "application/json";
    headers["User-Agent"] = userAgent;
    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers[key] = value;
      }
    }

    const init = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    const shouldRetry =
      method === "GET"
        ? (response) => response.status === 429 || response.status >= 500
        : (response) => response.status === 429;

    // Workaround to fix `TypeError: Illegal invocation` error in Cloudflare Workers
    // https://github.com/replicate/replicate-javascript/issues/134
    const _fetch = this.fetch; // eslint-disable-line no-underscore-dangle
    const response = await withAutomaticRetries(async () => _fetch(url, init), {
      shouldRetry,
    });

    if (!response.ok) {
      const request = new Request(url, init);
      const responseText = await response.text();
      throw new ApiError(
        `Request to ${url} failed with status ${response.status} ${response.statusText}: ${responseText}.`,
        request,
        response
      );
    }

    return response;
  }

  /**
   * Stream a model and wait for its output.
   *
   * @param {string} identifier - Required. The model version identifier in the format "{owner}/{name}:{version}"
   * @param {object} options
   * @param {object} options.input - Required. An object with the model inputs
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @param {AbortSignal} [options.signal] - AbortSignal to cancel the prediction
   * @throws {Error} If the prediction failed
   * @yields {ServerSentEvent} Each streamed event from the prediction
   */
  async *stream(ref, options) {
    const { wait, signal, ...data } = options;

    const identifier = ModelVersionIdentifier.parse(ref);

    let prediction;
    if (identifier.version) {
      prediction = await this.predictions.create({
        ...data,
        version: identifier.version,
        stream: true,
      });
    } else if (identifier.owner && identifier.name) {
      prediction = await this.predictions.create({
        ...data,
        model: `${identifier.owner}/${identifier.name}`,
        stream: true,
      });
    } else {
      throw new Error("Invalid model version identifier");
    }

    if (prediction.urls && prediction.urls.stream) {
      const stream = createReadableStream({
        url: prediction.urls.stream,
        fetch: this.fetch,
        ...(signal ? { options: { signal } } : {}),
      });

      yield* streamAsyncIterator(stream);
    } else {
      throw new Error("Prediction does not support streaming");
    }
  }

  /**
   * Paginate through a list of results.
   *
   * @generator
   * @example
   * for await (const page of replicate.paginate(replicate.predictions.list) {
   *    console.log(page);
   * }
   * @param {Function} endpoint - Function that returns a promise for the next page of results
   * @yields {object[]} Each page of results
   */
  async *paginate(endpoint) {
    const response = await endpoint();
    yield response.results;
    if (response.next) {
      const nextPage = () =>
        this.request(response.next, { method: "GET" }).then((r) => r.json());
      yield* this.paginate(nextPage);
    }
  }

  /**
   * Wait for a prediction to finish.
   *
   * If the prediction has already finished,
   * this function returns immediately.
   * Otherwise, it polls the API until the prediction finishes.
   *
   * @async
   * @param {object} prediction - Prediction object
   * @param {object} options - Options
   * @param {number} [options.interval] - Polling interval in milliseconds. Defaults to 500
   * @param {Function} [stop] - Async callback function that is called after each polling attempt. Receives the prediction object as an argument. Return false to cancel polling.
   * @throws {Error} If the prediction doesn't complete within the maximum number of attempts
   * @throws {Error} If the prediction failed
   * @returns {Promise<object>} Resolves with the completed prediction object
   */
  async wait(prediction, options, stop) {
    const { id } = prediction;
    if (!id) {
      throw new Error("Invalid prediction");
    }

    if (
      prediction.status === "succeeded" ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      return prediction;
    }

    // eslint-disable-next-line no-promise-executor-return
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const interval = (options && options.interval) || 500;

    let updatedPrediction = await this.predictions.get(id);

    while (
      updatedPrediction.status !== "succeeded" &&
      updatedPrediction.status !== "failed" &&
      updatedPrediction.status !== "canceled"
    ) {
      /* eslint-disable no-await-in-loop */
      if (stop && (await stop(updatedPrediction)) === true) {
        break;
      }

      await sleep(interval);
      updatedPrediction = await this.predictions.get(prediction.id);
      /* eslint-enable no-await-in-loop */
    }

    if (updatedPrediction.status === "failed") {
      throw new Error(`Prediction failed: ${updatedPrediction.error}`);
    }

    return updatedPrediction;
  }
}

module.exports = Replicate;
module.exports.validateWebhook = validateWebhook;
module.exports.parseProgressFromLogs = parseProgressFromLogs;
