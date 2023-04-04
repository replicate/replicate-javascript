const axios = require('axios');

const collections = require('./lib/collections');
const models = require('./lib/models');
const predictions = require('./lib/predictions');
const packageJSON = require('./package.json');

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
   * @param {string} options.auth - Required. API access token
   * @param {string} options.userAgent - Identifier of your app
   * @param {string} [options.baseUrl] - Defaults to https://api.replicate.com/v1
   */
  constructor(options) {
    this.auth = options.auth;
    this.userAgent =
      options.userAgent || `replicate-javascript/${packageJSON.version}`;
    this.baseUrl = options.baseUrl || 'https://api.replicate.com/v1';
    this.instance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Token ${this.auth}`,
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json',
      },
    });

    this.collections = {
      get: collections.get.bind(this),
    };

    this.models = {
      get: models.get.bind(this),
      versions: {
        list: models.versions.list.bind(this),
        get: models.versions.get.bind(this),
      },
    };

    this.predictions = {
      create: predictions.create.bind(this),
      get: predictions.get.bind(this),
      list: predictions.list.bind(this),
    };
  }

  /**
   * Run a model and wait for its output.
   *
   * @param {string} identifier - Required. The model version identifier in the format "{owner}/{name}:{version}"
   * @param {object} options
   * @param {object} options.input - Required. An object with the model inputs
   * @param {boolean|object} [options.wait] - Whether to wait for the prediction to finish. Defaults to false
   * @param {number} [options.wait.interval] - Polling interval in milliseconds. Defaults to 250
   * @param {number} [options.wait.maxAttempts] - Maximum number of polling attempts. Defaults to no limit
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @throws {Error} If the prediction failed
   * @returns {Promise<object>} - Resolves with the output of running the model
   */
  async run(identifier, options) {
    const pattern =
      /^(?<owner>[a-zA-Z0-9-_]+?)\/(?<name>[a-zA-Z0-9-_]+?):(?<version>[0-9a-fA-F]+)$/;
    const match = identifier.match(pattern);

    if (!match) {
      throw new Error(
        'Invalid version. It must be in the format "owner/name:version"'
      );
    }

    const { version } = match.groups;
    const prediction = await this.predictions.create({
      wait: true,
      ...options,
      version,
    });

    if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    return prediction.output;
  }

  /**
   * Make a request to the Replicate API.
   *
   * @param {string} route - REST API endpoint path
   * @param {object} parameters - URL, query, and request body parameters for the given route
   * @returns {Promise<object>} - Resolves with the API response data
   */
  async request(route, parameters) {
    const response = await this.instance(route, parameters);
    return response.data;
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
      const nextPage = () => this.request(response.next, { method: 'GET' });
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
   * @param {number} [options.interval] - Polling interval in milliseconds. Defaults to 250
   * @param {number} [options.maxAttempts] - Maximum number of polling attempts. Defaults to no limit
   * @throws {Error} If the prediction doesn't complete within the maximum number of attempts
   * @throws {Error} If the prediction failed
   * @returns {Promise<object>} Resolves with the completed prediction object
   */
  async wait(prediction, options) {
    const { id } = prediction;
    if (!id) {
      throw new Error('Invalid prediction');
    }

    if (
      prediction.status === 'succeeded' ||
      prediction.status === 'failed' ||
      prediction.status === 'canceled'
    ) {
      return prediction;
    }

    let updatedPrediction = await this.predictions.get(id);

    // eslint-disable-next-line no-promise-executor-return
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    let attempts = 0;
    const interval = options.interval || 250;
    const maxAttempts = options.maxAttempts || null;

    while (
      updatedPrediction.status !== 'succeeded' &&
      updatedPrediction.status !== 'failed' &&
      updatedPrediction.status !== 'canceled'
    ) {
      attempts += 1;
      if (maxAttempts && attempts > maxAttempts) {
        throw new Error(
          `Prediction ${id} did not finish after ${maxAttempts} attempts`
        );
      }

      /* eslint-disable no-await-in-loop */
      await sleep(interval);
      updatedPrediction = await this.predictions.get(prediction.id);
      /* eslint-enable no-await-in-loop */
    }

    if (updatedPrediction.status === 'failed') {
      throw new Error(`Prediction failed: ${updatedPrediction.error}`);
    }

    return updatedPrediction;
  }
}

module.exports = Replicate;
