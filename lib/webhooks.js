/**
 * Get the default webhook signing secret
 *
 * @returns {Promise<{key: string}>} Resolves with the signing secret for the default webhook
 */
async function getDefaultWebhookSecret() {
  const response = await this.request("/webhooks/default/secret", {
    method: "GET",
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
