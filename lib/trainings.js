/** 
 * @template T
 * @typedef {import("./types").Page<T>} Page
 */
/** @typedef {import("./types").Training} Training */

/**
 * Create a new training
 *
 * @param {string} model_owner - Required. The username of the user or organization who owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {string} version_id - Required. The version ID
 * @param {object} options
 * @param {string} options.destination - Required. The destination for the trained version in the form "{username}/{model_name}"
 * @param {unknown} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the training updates
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<Training>} Resolves with the data for the created training
 */
async function createTraining(model_owner, model_name, version_id, options) {
  const { ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}/trainings`,
    {
      method: "POST",
      data,
    }
  );

  return response.json();
}

/**
 * Fetch a training by ID
 *
 * @param {string} training_id - Required. The training ID
 * @returns {Promise<Training>} Resolves with the data for the training
 */
async function getTraining(training_id) {
  const response = await this.request(`/trainings/${training_id}`, {
    method: "GET",
  });

  return response.json();
}

/**
 * Cancel a training by ID
 *
 * @param {string} training_id - Required. The training ID
 * @returns {Promise<Training>} Resolves with the data for the training
 */
async function cancelTraining(training_id) {
  const response = await this.request(`/trainings/${training_id}/cancel`, {
    method: "POST",
  });

  return response.json();
}

/**
 * List all trainings
 *
 * @returns {Promise<Page<Training>>} - Resolves with a page of trainings
 */
async function listTrainings() {
  const response = await this.request("/trainings", {
    method: "GET",
  });

  return response.json();
}

export const create = createTraining;
export const get = getTraining;
export const cancel = cancelTraining;
export const list = listTrainings;
