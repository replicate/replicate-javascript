/**
 * List hardware
 *
 * @returns {Promise<object[]>} Resolves with the array of hardware
 */
async function listHardware() {
  const response = await this.request("/hardware", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  list: listHardware,
};
