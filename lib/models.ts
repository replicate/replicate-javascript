import APIClient from './apiClient';
import { Prediction } from './predictions';

export interface Model {
  url: string;
  owner: string;
  name: string;
  description: string;
  visibility: 'public' | 'private';
  github_url: string;
  paper_url: string;
  license_url: string;
  run_count: number;
  cover_image_url: string;
  default_example?: Prediction;
  latest_version?: ModelVersion;
}

export interface ModelVersion {
  id: string;
  created_at: string;
  cog_version: string;
  openapi_schema: object;
}

export default class Models {
  public versions: ModelVersions;
  constructor(private client: APIClient) {
    this.versions = new ModelVersions(client);
  }

  /**
   * Get information about a model
   *
   * @param {string} model_owner - Required. The name of the user or organization that owns the model
   * @param {string} model_name - Required. The name of the model
   * @returns {Promise<Model>} Resolves with the model data
   */
  async get(model_owner: string, model_name: string): Promise<Model> {
    return this.client.request(`/models/${model_owner}/${model_name}`, {
      method: 'GET',
    });
  }
}

export class ModelVersions {
  constructor(private client: APIClient) {}

  /**
   * List model versions
   *
   * @param {string} model_owner - Required. The name of the user or organization that owns the model
   * @param {string} model_name - Required. The name of the model
   * @returns {Promise<ModelVersion[]>} Resolves with the list of model versions
   */
  async list(model_owner: string, model_name: string): Promise<ModelVersion[]> {
    return this.client.request(
      `/models/${model_owner}/${model_name}/versions`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * Get a specific model version
   *
   * @param {string} model_owner - Required. The name of the user or organization that owns the model
   * @param {string} model_name - Required. The name of the model
   * @param {string} version_id - Required. The model version
   * @returns {Promise<ModelVersion>} Resolves with the model version data
   */
  async get(
    model_owner: string,
    model_name: string,
    version_id: string
  ): Promise<ModelVersion> {
    return this.client.request(
      `/models/${model_owner}/${model_name}/versions/${version_id}`,
      {
        method: 'GET',
      }
    );
  }
}
