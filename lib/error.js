/**
 * A representation of an API error.
 */
class ApiError extends Error {
  /**
   * Creates a representation of an API error.
   *
   * @param {string} message - Error message
   * @param {Request} request - HTTP request
   * @param {Response} response - HTTP response
   * @returns {ApiError} - An instance of ApiError
   */
  constructor(message, request, response) {
    super(message);
    this.name = "ApiError";
    this.request = request;
    this.response = response;
  }
}

module.exports = ApiError;
