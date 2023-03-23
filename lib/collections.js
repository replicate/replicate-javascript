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

module.exports = { get: getCollection };
