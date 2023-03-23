/**
 * Create a new prediction
 *
 * @param {object} options
 * @param {string} options.version - Required. The model version
 * @param {object} options.input - Required. An object with the model inputs
 * @param {boolean|object} [options.wait] - Whether to wait for the prediction to finish. Defaults to false
 * @param {number} [options.wait.interval] - Polling interval in milliseconds. Defaults to 250
 * @param {number} [options.wait.maxAttempts] - Maximum number of polling attempts. Defaults to no limit
 * @param {string} [options.webhook_completed] - A URL which will receive a POST request upon completion of the prediction
 * @returns {Promise<object>} Resolves with the created prediction data
 */
async function createPrediction(options) {
  const { wait, ...data } = options;

  const prediction = this.request('/predictions', {
    method: 'POST',
    data,
  });

  if (wait) {
    const { maxAttempts, interval } = options.wait;
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
 * List all predictions
 *
 * @returns {Promise<object>} - Resolves with the list of predictions
 */
async function listPredictions() {
  return this.request('/predictions', {
    method: 'GET',
  });
}

module.exports = {
  create: createPrediction,
  get: getPrediction,
  list: listPredictions,
};
