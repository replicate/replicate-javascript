/** @typedef {import("./types").Hardware} Hardware */
/**
 * List hardware
 *
 * @returns {Promise<Hardware[]>} Resolves with the array of hardware
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
