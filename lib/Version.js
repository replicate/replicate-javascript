import { ReplicateError, ReplicateResponseError } from "./errors.js";
import Prediction from "./Prediction.js";
import ReplicateObject from "./ReplicateObject.js";
import { sleep } from "./utils.js";

export default class Version extends ReplicateObject {
  constructor({ id, ...rest }, client) {
    super(rest, client);

    if (!id) {
      throw new ReplicateError("id is required");
    }

    this.id = id;
  }

  async predict(
    input,
    { onUpdate, onTemporaryError } = {},
    {
      defaultPollingInterval = 500,
      backoffFn = (errorCount) => Math.pow(2, errorCount) * 100,
    } = {}
  ) {
    if (!input) {
      throw new ReplicateError("input is required");
    }

    let prediction = await this.createPrediction(input);

    onUpdate && onUpdate(prediction);

    let pollingInterval = defaultPollingInterval;
    let errorCount = 0;

    while (!prediction.hasTerminalStatus()) {
      await sleep(pollingInterval);
      pollingInterval = defaultPollingInterval; // Reset to default each time.

      try {
        prediction = await this.client.prediction(prediction.id).load();

        onUpdate && onUpdate(prediction);

        errorCount = 0; // Reset because we've had a non-error response.
      } catch (err) {
        if (!err instanceof ReplicateResponseError) {
          throw err;
        }

        if (
          !err.status ||
          (Math.floor(err.status / 100) !== 5 && err.status !== 429)
        ) {
          throw err;
        }

        errorCount += 1;

        onTemporaryError && onTemporaryError(err);

        pollingInterval = backoffFn(errorCount);
      }
    }

    return prediction;
  }

  async createPrediction(input) {
    // This is here and not on `Prediction` because conceptually, a prediction
    // from a version "belongs" to the version. It's an odd feature of the API
    // that the prediction creation isn't an action on the version, but we don't
    // need to expose that to users of this library.
    const predictionData = await this.client.request("POST /v1/predictions", {
      version: this.id,
      input,
    });

    return new Prediction(predictionData, this);
  }
}
