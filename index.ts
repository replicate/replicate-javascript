import APIClient, { Page } from './lib/apiClient';
import Collections from './lib/collections';
import Predictions, { WaitOptions } from './lib/predictions';
import Trainings from './lib/trainings';
import Models from './lib/models';

export { Prediction, PredictionOptions } from './lib/predictions';
export { Page } from './lib/apiClient';
export { Model, ModelVersion } from './lib/models';
export { Collection } from './lib/collections';
export { Training, TrainingOptions } from './lib/trainings';

export interface ReplicateOptions {
  auth: string;
  userAgent?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface RunOptions {
  input: object;
  wait?: boolean | WaitOptions;
  webhook?: string;
  webhook_events_filter?: string[];
}

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
  client: APIClient;
  public collections: Collections;
  public models: Models;
  public predictions: Predictions;
  public trainings: Trainings;

  /**
   * Create a new Replicate API client instance.
   *
   * @param {object} options - Configuration options for the client
   * @param {string} options.auth - Required. API access token
   * @param {string} options.userAgent - Identifier of your app
   * @param {string} [options.baseUrl] - Defaults to https://api.replicate.com/v1
   * @param {Function} [options.fetch] - Defaults to native fetch
   */
  constructor(options: ReplicateOptions) {
    this.client = new APIClient(
      options.auth,
      options.userAgent,
      options.baseUrl,
      options.fetch
    );

    this.predictions = new Predictions(this.client);
    this.collections = new Collections(this.client);
    this.models = new Models(this.client);
    this.trainings = new Trainings(this.client);
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
  async run(identifier: string, options: RunOptions): Promise<object> {
    const pattern =
      /^(?<owner>[a-zA-Z0-9-_]+?)\/(?<name>[a-zA-Z0-9-_]+?):(?<version>[0-9a-fA-F]+)$/;
    const match = identifier.match(pattern);

    if (!match) {
      throw new Error(
        'Invalid version. It must be in the format "owner/name:version"'
      );
    }

    const { version } = match.groups as {
      version: string;
      owner: string;
      name: string;
    };

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
  async *paginate<T>(endpoint: () => Promise<Page<T>>): AsyncGenerator<T[]> {
    yield* this.client.paginate(endpoint);
  }

  /**
   * The base URL being used by the API client.
   */
  get baseUrl() {
    return this.client.baseUrl;
  }

  /**
   * The user agent being used by the API client
   */
  get userAgent() {
    return this.client.userAgent;
  }
}

export default Replicate;
