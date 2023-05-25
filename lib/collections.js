/**
 * Fetch a model collection
 *
 * @param {string} collection_slug - Required. The slug of the collection. See http://replicate.com/collections
 * @returns {Promise<object>} - Resolves with the collection data
 */
async function getCollection(collection_slug) {
  return this.request(`/collections/${collection_slug}`, {
    method: 'GET',
  });
}

/**
 * Fetch a list of model collections
 *
 * @returns {Promise<object>} - Resolves with the collections data
 */
async function listCollections() {
  return this.request('/collections', {
    method: 'GET',
  });
}

module.exports = { get: getCollection, list: listCollections };
