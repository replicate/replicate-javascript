import APIClient from './apiClient';
import { Status, WebhookEventType } from './types';

export interface TrainingOptions {
  destination: `${string}/${string}`;
  input: object;
  webhook?: string;
  webhook_events_filter?: WebhookEventType[];
}

export interface Training {
  id: string;
  version: string;
  status: Status;
  input: object;
  output: object | null;
  error: any;
  logs: any;
  started_at: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export default class Trainings {
  constructor(private client: APIClient) {}

  /**
   * Create a new training
   *
   * @param {string} model_owner - Required. The username of the user or organization who owns the model
   * @param {string} model_name - Required. The name of the model
   * @param {string} version_id - Required. The version ID
   * @param {object} options
   * @param {string} options.destination - Required. The destination for the trained version in the form "{username}/{model_name}"
   * @param {object} options.input - Required. An object with the model inputs
   * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the training updates
   * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
   * @returns {Promise<Training>} Resolves with the data for the created training
   */
  async create(
    model_owner: string,
    model_name: string,
    version_id: string,
    options: TrainingOptions
  ): Promise<Training> {
    const { ...data } = options;

    return await this.client.request(
      `/models/${model_owner}/${model_name}/versions/${version_id}/trainings`,
      {
        method: 'POST',
        data,
      }
    );
  }

  /**
   * Fetch a training by ID
   *
   * @param {string} training_id - Required. The training ID
   * @returns {Promise<object>} Resolves with the data for the training
   */
  async get(training_id: string): Promise<Training> {
    return this.client.request(`/trainings/${training_id}`, {
      method: 'GET',
    });
  }

  /**
   * Cancel a training by ID
   *
   * @param {string} training_id - Required. The training ID
   * @returns {Promise<object>} Resolves with the data for the training
   */
  async cancel(training_id: string): Promise<Training> {
    return this.client.request(`/trainings/${training_id}/cancel`, {
      method: 'POST',
    });
  }
}
