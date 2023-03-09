export class ReplicateError extends Error {}

export class ReplicateRequestError extends ReplicateError {
  method;
  body;

  constructor(url, requestInit, err) {
    super(
      `Failed to make request: method=${requestInit.method}, url=${url}, body=${requestInit.body}, error=${err}`
    );

    this.method = requestInit.method;
    this.body = requestInit.body;
  }
}

export class ReplicateResponseError extends ReplicateError {
  status;

  constructor(message, response, action) {
    super(
      `${response.status} ${response.statusText}${
        action ? ` for ${action}` : ""
      }: ${message}`
    );

    this.status = response.status;
  }
}
