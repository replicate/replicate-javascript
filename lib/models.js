/**
 * Get information about a model
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the model data
 */
async function getModel(model_owner, model_name, { signal } = {}) {
  const response = await this.request(`/models/${model_owner}/${model_name}`, {
    method: "GET",
    signal,
  });

  return response.json();
}

/**
 * List model versions
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the list of model versions
 */
async function listModelVersions(model_owner, model_name, { signal } = {}) {
  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions`,
    {
      method: "GET",
      signal,
    }
  );

  return response.json();
}

/**
 * Get a specific model version
 *
 * @param {string} model_owner - Required. The name of the user or organization that owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {string} version_id - Required. The model version
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the model version data
 */
async function getModelVersion(
  model_owner,
  model_name,
  version_id,
  { signal } = {}
) {
  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}`,
    {
      method: "GET",
      signal,
    }
  );

  return response.json();
}

/**
 * List all public models
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the model version data
 */
async function listModels({ signal } = {}) {
  const response = await this.request("/models", {
    method: "GET",
    signal,
  });

  return response.json();
}

/**
 * Create a new model
 *
 * @param {string} model_owner - Required. The name of the user or organization that will own the model. This must be the same as the user or organization that is making the API request. In other words, the API token used in the request must belong to this user or organization.
 * @param {string} model_name - Required. The name of the model. This must be unique among all models owned by the user or organization.
 * @param {object} options
 * @param {("public"|"private")} options.visibility - Required. Whether the model should be public or private. A public model can be viewed and run by anyone, whereas a private model can be viewed and run only by the user or organization members that own the model.
 * @param {string} options.hardware - Required. The SKU for the hardware used to run the model. Possible values can be found by calling `Replicate.hardware.list()`.
 * @param {string} options.description - A description of the model.
 * @param {string} options.github_url - A URL for the model's source code on GitHub.
 * @param {string} options.paper_url - A URL for the model's paper.
 * @param {string} options.license_url - A URL for the model's license.
 * @param {string} options.cover_image_url - A URL for the model's cover image. This should be an image file.
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the model version data
 */
async function createModel(model_owner, model_name, options) {
  const { signal, ...rest } = options;
  const data = { owner: model_owner, name: model_name, ...rest };

  const response = await this.request("/models", {
    method: "POST",
    data,
    signal,
  });

  return response.json();
}

/**
 * Search for public models
 *
 * @param {string} query - The search query
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with a page of models matching the search query
 */
async function search(query, { signal } = {}) {
  const response = await this.request("/models", {
    method: "QUERY",
    headers: {
      "Content-Type": "text/plain",
    },
    data: query,
    signal,
  });

  return response.json();
}

module.exports = {
  get: getModel,
  list: listModels,
  create: createModel,
  versions: { list: listModelVersions, get: getModelVersion },
  search,
};
