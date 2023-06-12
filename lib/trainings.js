/**
 * Create a new training
 *
 * @param {string} model_owner - Required. The username of the user or organization who owns the model
 * @param {string} model_name - Required. The name of the model
 * @param {string} version_id - Required. The version ID
 * @param {object} options
 * @param {string} options.destination - Required. The destination for the trained version in the form "{username}/{model_name}"
 * @param {object} options.input - Required. An object with the model inputs
 * @param {string} [options.webhook] - An HTTPS URL for receiving a webhook when the training updates
 * @param {string[]} [options.webhook_events_filter] - You can change which events trigger webhook requests by specifying webhook events (`start`|`output`|`logs`|`completed`)
 * @returns {Promise<object>} Resolves with the data for the created training
 */
async function createTraining(model_owner, model_name, version_id, options) {
  const { ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error('Invalid webhook URL');
    }
  }

  const training = this.request(`/models/${model_owner}/${model_name}/versions/${version_id}/trainings`, {
    method: 'POST',
    data,
  });

  return training;
}

/**
 * Fetch a training by ID
 *
 * @param {string} training_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function getTraining(training_id) {
  return this.request(`/trainings/${training_id}`, {
    method: 'GET',
  });
}

/**
 * Cancel a training by ID
 *
 * @param {string} training_id - Required. The training ID
 * @returns {Promise<object>} Resolves with the data for the training
 */
async function cancelTraining(training_id) {
  return this.request(`/trainings/${training_id}/cancel`, {
    method: 'POST',
  });
}

/**
 * List all trainings
 *
 * @returns {Promise<object>} - Resolves with a page of trainings
 */
async function listTrainings() {
  return this.request('/trainings', {
    method: 'GET',
  });
}

module.exports = {
  create: createTraining,
  get: getTraining,
  cancel: cancelTraining,
  list: listTrainings,
};
