/**
 * List hardware
 *
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - An optional AbortSignal
 * @returns {Promise<object[]>} Resolves with the array of hardware
 */
async function listHardware({ signal } = {}) {
  const response = await this.request("/hardware", {
    method: "GET",
    signal,
  });

  return response.json();
}

module.exports = {
  list: listHardware,
};
