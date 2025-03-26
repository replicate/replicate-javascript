/**
 * Get the default webhook signing secret
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the signing secret for the default webhook
 */
async function getDefaultWebhookSecret({ signal } = {}) {
  const response = await this.request("/webhooks/default/secret", {
    method: "GET",
    signal,
  });

  return response.json();
}

module.exports = {
  default: {
    secret: {
      get: getDefaultWebhookSecret,
    },
  },
};
