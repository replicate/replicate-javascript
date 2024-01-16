/** @typedef {import("./types").Prediction} Prediction */

/**
 * Create a new prediction with a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object} options
 * @param {unknown} options.input - Required. An object with the model inputs
 * @param {boolean} [options.stream] - Whether to stream the prediction output. Defaults to false
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {WebhookEventType[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<Prediction>} Resolves with the created prediction data
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

export const predictions = {
    create: createPrediction,
};
