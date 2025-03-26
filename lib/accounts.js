/**
 * Get the current account
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object>} Resolves with the current account
 */
async function getCurrentAccount({ signal } = {}) {
  const response = await this.request("/account", {
    method: "GET",
    signal,
  });

  return response.json();
}

module.exports = {
  current: getCurrentAccount,
};
