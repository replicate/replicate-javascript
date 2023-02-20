export class ReplicateError extends Error {}

export class ReplicateRequestError extends ReplicateError {
  method;
  body;

  constructor(url, requestInit) {
    super(
      `Failed to make request: method=${requestInit.method}, url=${url}, body=${requestInit.body}`
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
