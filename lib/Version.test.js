import { jest } from "@jest/globals";
import { FetchError, Response } from "node-fetch";

jest.unstable_mockModule("node-fetch", () => ({
  default: jest.fn(),
  FetchError,
}));

import { ReplicateResponseError } from "./errors.js";
import Prediction, { PredictionStatus } from "./Prediction.js";

const { default: ReplicateClient } = await import("./ReplicateClient.js");

let client;
let version;

beforeEach(() => {
  process.env.REPLICATE_API_TOKEN = "test-token-from-env";

  client = new ReplicateClient({});
  version = client.version("test-version");
});

describe("predict()", () => {
  it("makes request to create prediction", async () => {
    jest.spyOn(version, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.SUCCEEDED,
        },
        client
      )
    );

    await version.predict(
      { text: "test text" },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(version.createPrediction).toHaveBeenCalledWith({
      text: "test text",
    });
  });

  it("uses created prediction's ID to fetch update", async () => {
    jest.spyOn(version, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.STARTING,
        },
        client
      )
    );

    jest.spyOn(client, "prediction").mockImplementation((id) => {
      const prediction = new Prediction({ id }, client);

      jest.spyOn(prediction, "load").mockResolvedValue(
        new Prediction(
          {
            id,
            status: PredictionStatus.SUCCEEDED,
          },
          client
        )
      );

      return prediction;
    });

    jest
      .spyOn(client, "request")
      .mockImplementation((action) => requestMockReturnValues[action]);

    await version.predict(
      { text: "test text" },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(client.prediction).toHaveBeenCalledWith("test-prediction");
  });

  it("polls prediction status until success", async () => {
    jest.spyOn(version, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.STARTING,
        },
        client
      )
    );

    const predictionLoadResults = [
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.PROCESSING,
        },
        client
      ),
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.PROCESSING,
        },
        client
      ),
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.SUCCEEDED,
        },
        client
      ),
    ];

    const predictionLoad = jest.fn(() => predictionLoadResults.shift());

    jest.spyOn(client, "prediction").mockImplementation(() => {
      const prediction = new Prediction({ id: "test-prediction" }, client);

      jest.spyOn(prediction, "load").mockImplementation(predictionLoad);

      return prediction;
    });

    const prediction = await version.predict(
      { text: "test text" },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(prediction.status).toBe(PredictionStatus.SUCCEEDED);
    expect(predictionLoad).toHaveBeenCalledTimes(3);
  });

  it("retries polling on error", async () => {
    jest.spyOn(version, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "test-prediction",
          status: PredictionStatus.STARTING,
        },
        client
      )
    );

    const predictionLoadResults = [
      () => {
        throw new ReplicateResponseError(
          "test error",
          new Response("{}", {
            status: 500,
            statusText: "Internal Server Error",
          })
        );
      },
      () => {
        throw new ReplicateResponseError(
          "test error",
          new Response("{}", {
            status: 429,
            statusText: "Too Many Requests",
          })
        );
      },
      () =>
        new Prediction(
          {
            id: "test-prediction",
            status: PredictionStatus.SUCCEEDED,
          },
          client
        ),
    ];

    const predictionLoad = jest.fn(() => predictionLoadResults.shift()());

    jest.spyOn(client, "prediction").mockImplementation(() => {
      const prediction = new Prediction({ id: "test-prediction" }, client);

      jest.spyOn(prediction, "load").mockImplementation(predictionLoad);

      return prediction;
    });
    const backoffFn = jest.fn(() => 0);

    const prediction = await version.predict(
      { text: "test text" },
      {},
      { defaultPollingInterval: 0, backoffFn }
    );

    expect(prediction.status).toBe(PredictionStatus.SUCCEEDED);
    expect(predictionLoad).toHaveBeenCalledTimes(3);
    expect(backoffFn).toHaveBeenCalledTimes(2);
  });
});

describe("createPrediction()", () => {
  it("makes request to create prediction", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "test-prediction",
      status: PredictionStatus.SUCCEEDED,
    });

    await version.createPrediction({ text: "test text" });

    expect(client.request).toHaveBeenCalledWith("POST /v1/predictions", {
      version: "test-version",
      input: { text: "test text" },
    });
  });
});
