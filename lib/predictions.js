const { transformFileInputs } = require("./util");

/**
 * Create a new prediction
 *
 * @param {object} options
 * @param {string} options.model - The model.
 * @param {string} options.version - The model version.
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the prediction has new output
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @param {boolean|integer} [options.wait] - Whether to wait until the prediction is completed before returning. If an integer is provided, it will wait for that many seconds. Defaults to false
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the created prediction
 */
async function createPrediction(options) {
  const { model, version, input, wait, signal, ...data } = options;

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

  let response;
  if (version) {
    response = await this.request("/predictions", {
      method: "POST",
      headers,
      data: {
        ...data,
        input: await transformFileInputs(
          this,
          input,
          this.fileEncodingStrategy
        ),
        version,
      },
      signal,
    });
  } else if (model) {
    response = await this.request(`/models/${model}/predictions`, {
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
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the prediction data
 */
async function getPrediction(prediction_id, { signal } = {}) {
  const response = await this.request(`/predictions/${prediction_id}`, {
    method: "GET",
    signal,
  });

  return response.json();
}

/**
 * Cancel a prediction by ID
 *
 * @param {string} prediction_id - Required. The training ID
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function cancelPrediction(prediction_id, { signal } = {}) {
  const response = await this.request(`/predictions/${prediction_id}/cancel`, {
    method: "POST",
    signal,
  });

  return response.json();
}

/**
 * List all predictions
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} - Resolves with a page of predictions
 */
async function listPredictions({ signal } = {}) {
  const response = await this.request("/predictions", {
    method: "GET",
    signal,
  });

  return response.json();
}

module.exports = {
  create: createPrediction,
  get: getPrediction,
  cancel: cancelPrediction,
  list: listPredictions,
};
