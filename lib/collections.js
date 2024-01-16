/** @typedef {import("./types").Collection} Collection */
/** 
 * @template T
 * @typedef {import("./types").Page<T>} Page
 */

/**
 * Fetch a model collection
 *
 * @param {string} collection_slug - Required. The slug of the collection. See http://replicate.com/collections
 * @returns {Promise<Collection>} - Resolves with the collection data
 */
async function getCollection(collection_slug) {
  const response = await this.request(`/collections/${collection_slug}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Fetch a list of model collections
 *
 * @returns {Promise<Page<Collection>>} - Resolves with the collections data
 */
async function listCollections() {
  const response = await this.request("/collections", {
    method: "GET",
  });

  return response.json();
}

export const get = getCollection;
export const list = listCollections;
