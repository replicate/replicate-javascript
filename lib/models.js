/**
 * Get information about a model
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @returns {Promise<object>} Resolves with the model data
 */
async function getModel(model_owner, model_name) {
  return this.request(`/models/${model_owner}/${model_name}`, {
    method: 'GET',
  });
}

/**
 * List model versions
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @returns {Promise<object>} Resolves with the list of model versions
 */
async function listModelVersions(model_owner, model_name) {
  return this.request(`/models/${model_owner}/${model_name}/versions`, {
    method: 'GET',
  });
}

/**
 * Get a specific model version
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {string} version_id - Required. The model version
 * @returns {Promise<object>} Resolves with the model version data
 */
async function getModelVersion(model_owner, model_name, version_id) {
  return this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}`,
    {
      method: 'GET',
    }
  );
}

module.exports = {
  get: getModel,
  versions: { list: listModelVersions, get: getModelVersion },
};
