const { transformFileInputs } = require("./util");

/**
 * Create a new prediction with a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object} options
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @param {boolean|integer} [options.wait] - Whether to wait until the prediction is completed before returning. If an integer is provided, it will wait for that many seconds. Defaults to false
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the created prediction data
 */
async function createPrediction(deployment_owner, deployment_name, options) {
  const { input, wait, signal, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const headers = {};
  if (wait) {
    if (typeof wait === "number") {
      const n = Math.max(1, Math.ceil(Number(wait)) || 1);
      headers["Prefer"] = `wait=${n}`;
    } else {
      headers["Prefer"] = "wait";
    }
  }

  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}/predictions`,
    {
      method: "POST",
      headers,
      data: {
        ...data,
        input: await transformFileInputs(
          this,
          input,
          this.fileEncodingStrategy
        ),
      },
      signal,
    }
  );

  return response.json();
}

/**
 * Get a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object] [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function getDeployment(
  deployment_owner,
  deployment_name,
  { signal } = {}
) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "GET",
      signal,
    }
  );

  return response.json();
}

/**
 * @typedef {Object} DeploymentCreateRequest - Request body for `deployments.create`
 * @property {string} name - the name of the deployment
 * @property {string} model - the full name of the model that you want to deploy e.g. stability-ai/sdxl
 * @property {string} version - the 64-character string ID of the model version that you want to deploy
 * @property {string} hardware - the SKU for the hardware used to run the model, via `replicate.hardware.list()`
 * @property {number} min_instances - the minimum number of instances for scaling
 * @property {number} max_instances - the maximum number of instances for scaling
 */

/**
 * Create a deployment
 *
 * @param {DeploymentCreateRequest} deployment_config - Required. The deployment config.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function createDeployment(deployment_config, { signal } = {}) {
  const response = await this.request("/deployments", {
    method: "POST",
    data: deployment_config,
    signal,
  });

  return response.json();
}

/**
 * @typedef {Object} DeploymentUpdateRequest - Request body for `deployments.update`
 * @property {string} version - the 64-character string ID of the model version that you want to deploy
 * @property {string} hardware - the SKU for the hardware used to run the model, via `replicate.hardware.list()`
 * @property {number} min_instances - the minimum number of instances for scaling
 * @property {number} max_instances - the maximum number of instances for scaling
 */

/**
 * Update an existing deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {DeploymentUpdateRequest} deployment_config - Required. The deployment changes.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function updateDeployment(
  deployment_owner,
  deployment_name,
  deployment_config,
  { signal } = {}
) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "PATCH",
      data: deployment_config,
      signal,
    }
  );

  return response.json();
}

/**
 * Delete a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<boolean>} Resolves with true if the deployment was deleted
 */
async function deleteDeployment(
  deployment_owner,
  deployment_name,
  { signal } = {}
) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "DELETE",
      signal,
    }
  );

  return response.status === 204;
}

/**
 * List all deployments
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with a page of deployments
 */
async function listDeployments({ signal } = {}) {
  const response = await this.request("/deployments", {
    method: "GET",
    signal,
  });

  return response.json();
}

module.exports = {
  predictions: {
    create: createPrediction,
  },
  get: getDeployment,
  create: createDeployment,
  update: updateDeployment,
  list: listDeployments,
  delete: deleteDeployment,
};
