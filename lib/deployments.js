const { transformFileInputs } = require("./util");

/**
 * Create a new prediction with a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object} options
 * @param {object} options.input - Required. An object with the model inputs
 * @param {boolean} [options.stream] - Whether to stream the prediction output. Defaults to false
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<object>} Resolves with the created prediction data
 */
async function createPrediction(deployment_owner, deployment_name, options) {
  const { stream, input, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}/predictions`,
    {
      method: "POST",
      data: {
        ...data,
        input: await transformFileInputs(input),
        stream,
      },
    }
  );

  return response.json();
}

/**
 * Get a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function getDeployment(deployment_owner, deployment_name) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "GET",
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
 * @param {DeploymentCreateRequest} config - Required. The deployment config.
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function createDeployment(deployment_config) {
  const response = await this.request("/deployments", {
    method: "POST",
    data: deployment_config,
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
 * @returns {Promise<object>} Resolves with the deployment data
 */
async function updateDeployment(
  deployment_owner,
  deployment_name,
  deployment_config
) {
  const response = await this.request(
    `/deployments/${deployment_owner}/${deployment_name}`,
    {
      method: "PATCH",
      data: deployment_config,
    }
  );

  return response.json();
}

/**
 * List all deployments
 *
 * @returns {Promise<object>} - Resolves with a page of deployments
 */
async function listDeployments() {
  const response = await this.request("/deployments", {
    method: "GET",
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
};
