/**
 * Create a new prediction
 *
 * @param {object} options
 * @param {string} options.model - The model.
 * @param {string} options.version - The model version.
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @param {boolean} [options.stream] - Whether to stream the prediction output. Defaults to false
 * @returns {Promise<object>} Resolves with the created prediction
 */
async function createPrediction(options) {
  const { model, version, stream, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  let response;
  if (version) {
    response = await this.request("/predictions", {
      method: "POST",
      data: { ...data, stream, version },
    });
  } else if (model) {
    response = await this.request(`/models/${model}/predictions`, {
      method: "POST",
      data: { ...data, stream },
    });
  } else {
    throw new Error("Either model or version must be specified");
  }

  return response.json();
}

/**
 * Fetch a prediction by ID
 *
 * @param {number} prediction_id - Required. The prediction ID
 * @returns {Promise<object>} Resolves with the prediction data
 */
async function getPrediction(prediction_id) {
  const response = await this.request(`/predictions/${prediction_id}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Cancel a prediction by ID
 *
 * @param {string} prediction_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function cancelPrediction(prediction_id) {
  const response = await this.request(`/predictions/${prediction_id}/cancel`, {
    method: "POST",
  });

  return response.json();
}

/**
 * List all predictions
 *
 * @returns {Promise<object>} - Resolves with a page of predictions
 */
async function listPredictions() {
  const response = await this.request("/predictions", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  create: createPrediction,
  get: getPrediction,
  cancel: cancelPrediction,
  list: listPredictions,
};
