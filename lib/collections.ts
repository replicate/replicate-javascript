import APIClient from './apiClient';
import { Model } from './models';

export interface Collection {
  name: string;
  slug: string;
  description: string;
  models: Model[];
}

export default class Collections {
  constructor(private client: APIClient) {}
  /**
   * Fetch a model collection
   *
   * @param {string} collection_slug - Required. The slug of the collection. See http://replicate.com/collections
   * @returns {Promise<Collection>} - Resolves with the collection data
   */
  async get(collection_slug: string): Promise<Collection> {
    return this.client.request(`/collections/${collection_slug}`, {
      method: 'GET',
    });
  }
}
