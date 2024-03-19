/**
 * @template T
 * @typedef {import("./types").Page<T>} Page
 */

/**
 * @typedef {import("./types").Prediction} Prediction
 * @typedef {Object} BasePredictionOptions
 * @property {unknown} input - Required. An object with the model inputs
 * @property {string} [webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @property {string[]} [webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @property {boolean} [stream] - Whether to stream the prediction output. Defaults to false
 *
 * @typedef {Object} ModelPredictionOptions
 * @property {string} model The model name (for official models)
 * @property {never=} version
 *
 * @typedef {Object} VersionPredictionOptions
 * @property {string} version The model version
 * @property {never=} model
 */

const { transformFileInputs } = require("./util");

/**
 * Create a new prediction
 *
 * @param {BasePredictionOptions & (ModelPredictionOptions | VersionPredictionOptions)} options
 * @returns {Promise<Prediction>} Resolves with the created prediction
 */
async function createPrediction(options) {
  const { model, version, stream, input, ...data } = options;

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
      data: {
        ...data,
        input: await transformFileInputs(input),
        version,
        stream,
      },
    });
  } else if (model) {
    response = await this.request(`/models/${model}/predictions`, {
      method: "POST",
      data: {
        ...data,
        input: await transformFileInputs(input),
        stream,
      },
    });
  } else {
    throw new Error("Either model or version must be specified");
  }

  return response.json();
}

/**
 * Fetch a prediction by ID
 *
 * @param {string} prediction_id - Required. The prediction ID
 * @returns {Promise<Prediction>} Resolves with the prediction data
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
 * @returns {Promise<Prediction>} Resolves with the data for the training
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
 * @returns {Promise<Page<Prediction>>} - Resolves with a page of predictions
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
