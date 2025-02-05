/**
 * Fetch a model collection
 *
 * @param {string} collection_slug - Required. The slug of the collection. See http://replicate.com/collections
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with the collection data
 */
async function getCollection(collection_slug, { signal } = {}) {
  const response = await this.request(`/collections/${collection_slug}`, {
    method: "GET",
    signal,
  });

  return response.json();
}

/**
 * Fetch a list of model collections
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with the collections data
 */
async function listCollections({ signal } = {}) {
  const response = await this.request("/collections", {
    method: "GET",
    signal,
  });

  return response.json();
}

module.exports = { get: getCollection, list: listCollections };
