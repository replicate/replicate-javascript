import { ReplicateError, ReplicateResponseError } from "./errors.js";
import Prediction from "./Prediction.js";
import ReplicateObject from "./ReplicateObject.js";
import { noop, sleep } from "./utils.js";

export default class Model extends ReplicateObject {
  static propertyMap = {
    id: "version",
  };

  constructor({ owner, name, version, ...rest }, client) {
    super(rest, client);

    if (owner) {
      this.owner = owner;
    }

    if (!this.owner) {
      throw new ReplicateError("owner is required");
    }

    if (name) {
      this.name = name;
    }

    if (!this.name) {
      throw new ReplicateError("name is required");
    }

    if (version) {
      this.version = version;
    }

    if (!this.version) {
      throw new ReplicateError("version is required");
    }
  }

  actionForGet() {
    return `GET /v1/models/${this.owner}/${this.name}/versions/${this.version}`;
  }

  async deleteVersion() {
    await this.client.request(
      `DELETE /v1/models/${this.owner}/${this.name}/versions/${this.version}`
    );
  }

  async predict(
    input,
    {
      onUpdate = noop,
      onTemporaryError = noop,
      onCancel = noop,
      onCancelError = noop,
    } = {},
    {
      defaultPollingInterval = 500,
      backoffFn = (errorCount) => Math.pow(2, errorCount) * 100,
      cancelOnFatalError = false,
    } = {}
  ) {
    if (!input) {
      throw new ReplicateError("input is required");
    }

    let prediction = await this.createPrediction(input);

    try {
      onUpdate(prediction);

      let pollingInterval = defaultPollingInterval;
      let errorCount = 0;

      while (!prediction.hasTerminalStatus()) {
        await sleep(pollingInterval);
        pollingInterval = defaultPollingInterval; // Reset to default each time.

        try {
          prediction = await this.client.prediction(prediction.id).load();

          onUpdate(prediction);

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

          onTemporaryError(err);

          pollingInterval = backoffFn(errorCount);
        }
      }
    } catch (err) {
      if (cancelOnFatalError) {
        // We intentionally don't await this, so we don't block.
        prediction
          .cancel()
          .catch((e) => {
            onCancelError(e);

            throw e;
          })
          .then(() => {
            onCancel();
          });
      }

      throw err;
    }

    return prediction;
  }

  async createPrediction(input) {
    // This is here and not on `Prediction` because conceptually, a prediction
    // from a model "belongs" to the model. It's an odd feature of the API that
    // the prediction creation isn't an action on the model (or that it doesn't
    // actually use the model information, only the version), but we don't need
    // to expose that to users of this library.
    const predictionData = await this.client.request("POST /v1/predictions", {
      version: this.version,
      input,
    });

    return new Prediction(predictionData, this);
  }
}
