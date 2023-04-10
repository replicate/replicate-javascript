import APIClient, { Page } from './apiClient';
import { Status, WebhookEventType } from './types';

export interface WaitOptions {
  interval?: number;
  maxAttempts?: number;
}

export interface PredictionOptions {
  version: string;
  input: object;
  wait?: WaitOptions | boolean;
  webhook?: string;
  webhook_events_filter?: string[];
}

export interface Prediction {
  id: string;
  status: Status;
  version: string;
  input: object;
  output: any;
  source: 'api' | 'web';
  error?: any;
  logs?: string;
  metrics?: {
    predicti_time?: number;
  };
  webhook?: string;
  webhook_events_filter?: WebhookEventType[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export default class Predictions {
  constructor(private client: APIClient) {}

  /**
   * Create a new prediction
   *
   * @param {object} options
   * @param {string} options.version - Required. The model version
   * @param {object} options.input - Required. An object with the model inputs
   * @param {boolean|object} [options.wait] - Whether to wait for the prediction to finish. Defaults to false
   * @param {number} [options.wait.interval] - Polling interval in milliseconds. Defaults to 250
   * @param {number} [options.wait.maxAttempts] - Maximum number of polling attempts. Defaults to no limit
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @returns {Promise<object>} Resolves with the created prediction data
   */
  async create(options: PredictionOptions): Promise<Prediction> {
    const { wait, ...data } = options;

    const prediction: Prediction = await this.client.request('/predictions', {
      method: 'POST',
      data,
    });

    if (wait) {
      let waitOptions = wait === true ? {} : wait;
      return this.wait(prediction, waitOptions);
    }

    return prediction;
  }

  /**
   * Fetch a prediction by ID
   * @param predictionId
   * @returns
   */
  async get(predictionId: string): Promise<Prediction> {
    return this.client.request(`/predictions/${predictionId}`, {
      method: 'GET',
    });
  }

  /**
   * List all predictions
   *
   * @returns {Promise<object>} - Resolves with a page of predictions
   */
  async list(): Promise<Page<Prediction>> {
    return this.client.request('/predictions', {
      method: 'GET',
    });
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
  async wait(
    prediction: Prediction,
    options: WaitOptions
  ): Promise<Prediction> {
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

    let updatedPrediction: Prediction = await this.get(id);

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

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
      updatedPrediction = await this.get(prediction.id);
      /* eslint-enable no-await-in-loop */
    }

    if (updatedPrediction.status === 'failed') {
      throw new Error(`Prediction failed: ${updatedPrediction.error}`);
    }

    return updatedPrediction;
  }
}
