/**
 * Create a new prediction with a deployment
 *
 * @param {string} deployment_owner - Required. The username of the user or organization who owns the deployment
 * @param {string} deployment_name - Required. The name of the deployment
 * @param {object} options
 * @param {object} options.input - Required. An object with the model inputs
 * @param {object} [options.wait] - Whether to wait for the prediction to finish. Defaults to false
 * @param {number} [options.wait.interval] - Polling interval in milliseconds. Defaults to 250
 * @param {number} [options.wait.maxAttempts] - Maximum number of polling attempts. Defaults to no limit
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<object>} Resolves with the created prediction data
 */
async function createPrediction(deployment_owner, deployment_name, options) {
  const { wait, ...data } = options;

  const prediction = this.request(`/deployments/${deployment_owner}/${deployment_name}/predictions`, {
    method: 'POST',
    data,
  });

  if (wait) {
    const { maxAttempts, interval } = wait;
    return this.wait(await prediction, { maxAttempts, interval });
  }

  return prediction;
}

module.exports = {
  predictions: {
    create: createPrediction,
  }
};
