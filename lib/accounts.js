/**
 * Get the current account
 *
 * @returns {Promise<object>} Resolves with the current account
 */
async function getCurrentAccount() {
  const response = await this.request("/account", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  current: getCurrentAccount,
};
