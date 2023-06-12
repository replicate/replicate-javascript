/**
 * Create a new prediction
 *
 * @param {object} options
 * @param {string} options.version - Required. The model version
 * @param {object} options.input - Required. An object with the model inputs
 * @param {boolean|object} [options.wait] - Whether to wait for the prediction to finish. Defaults to false
 * @param {number} [options.wait.interval] - Polling interval in milliseconds. Defaults to 250
 * @param {number} [options.wait.maxAttempts] - Maximum number of polling attempts. Defaults to no limit
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<object>} Resolves with the created prediction data
 */
async function createPrediction(options) {
  const { wait, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error('Invalid webhook URL');
    }
  }

  const prediction = this.request('/predictions', {
    method: 'POST',
    data,
  });

  if (wait) {
    const { maxAttempts, interval } = wait;

    // eslint-disable-next-line no-promise-executor-return
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(interval || 250);

    return this.wait(await prediction, { maxAttempts, interval });
  }

  return prediction;
}

/**
 * Fetch a prediction by ID
 *
 * @param {number} prediction_id - Required. The prediction ID
 * @returns {Promise<object>} Resolves with the prediction data
 */
async function getPrediction(prediction_id) {
  return this.request(`/predictions/${prediction_id}`, {
    method: 'GET',
  });
}

/**
 * Cancel a prediction by ID
 *
 * @param {string} prediction_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function cancelPrediction(prediction_id) {
  return this.request(`/predictions/${prediction_id}/cancel`, {
    method: 'POST',
  });
}

/**
 * List all predictions
 *
 * @returns {Promise<object>} - Resolves with a page of predictions
 */
async function listPredictions() {
  return this.request('/predictions', {
    method: 'GET',
  });
}

module.exports = {
  create: createPrediction,
  get: getPrediction,
  cancel: cancelPrediction,
  list: listPredictions,
};
