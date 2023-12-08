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
  const { stream, ...data } = options;

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
      data: { ...data, stream },
    }
  );

  return response.json();
}

module.exports = {
  predictions: {
    create: createPrediction,
  },
};
