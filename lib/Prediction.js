export const PredictionStatus = {
  STARTING: "starting",
  PROCESSING: "processing",
  CANCELED: "canceled",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
};

export default class Prediction {
  static fromJSON(json) {
    let props;
    try {
      props = JSON.parse(json);
    } catch {
      throw new Error(`Unable to parse JSON: ${json}`);
    }

    return new this(props);
  }

  id;
  status;

  constructor({ id, status, ...rest }) {
    this.id = id;
    this.status = status;

    for (const key in rest) {
      this[key] = rest[key];
    }
  }

  hasTerminalStatus() {
    return [
      PredictionStatus.CANCELED,
      PredictionStatus.SUCCEEDED,
      PredictionStatus.FAILED,
    ].includes(this.status);
  }
}
