import { jest } from "@jest/globals";
import { FetchError, Response } from "node-fetch";

jest.unstable_mockModule("node-fetch", () => ({
  default: jest.fn(),
  FetchError,
}));

import { ReplicateResponseError } from "./errors.js";
import Model from "./Model.js";
import Prediction, { PredictionStatus } from "./Prediction.js";

const { default: ReplicateClient } = await import("./ReplicateClient.js");

let client;
let model;

beforeEach(() => {
  process.env.REPLICATE_API_TOKEN = "test-token-from-env";

  client = new ReplicateClient({});
  model = client.model("test-owner/test-name:testversion");
});

describe("constructor()", () => {
  it("maps id to version", () => {
    const model = new Model({
      owner: "test-owner",
      name: "test-name",
      id: "testversion",
    });

    expect(model.id).toBeUndefined();
    expect(model.version).toBe("testversion");
  });
});

describe("load()", () => {
  it("makes request to get model version", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testversion",
    });

    await model.load();

    expect(client.request).toHaveBeenCalledWith(
      "GET /v1/models/test-owner/test-name/versions/testversion"
    );
  });

  it("returns Model", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testversion",
    });

    const returnedModel = await model.load();

    expect(returnedModel).toBeInstanceOf(Model);
  });

  it("updates Model in place", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testversion",
    });

    const returnedModel = await model.load();

    expect(returnedModel).toBe(model);
  });
});

describe("deleteVersion()", () => {
  it("makes request to delete model version", async () => {
    jest.spyOn(client, "request").mockResolvedValue();

    await model.deleteVersion();

    expect(client.request).toHaveBeenCalledWith(
      "DELETE /v1/models/test-owner/test-name/versions/testversion"
    );
  });
});

describe("predict()", () => {
  it("makes request to create prediction", async () => {
    jest.spyOn(model, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "testprediction",
          status: PredictionStatus.SUCCEEDED,
        },
        client
      )
    );

    await model.predict(
      { input: { text: "test text" } },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(model.createPrediction).toHaveBeenCalledWith({
      text: "test text",
    });
  });

  it("uses created prediction's ID to fetch update", async () => {
    jest.spyOn(model, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "testprediction",
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

    await model.predict(
      { input: { text: "test text" } },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(client.prediction).toHaveBeenCalledWith("testprediction");
  });

  it("polls prediction status until success", async () => {
    jest.spyOn(model, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "testprediction",
          status: PredictionStatus.STARTING,
        },
        client
      )
    );

    const predictionLoadResults = [
      new Prediction(
        {
          id: "testprediction",
          status: PredictionStatus.PROCESSING,
        },
        client
      ),
      new Prediction(
        {
          id: "testprediction",
          status: PredictionStatus.PROCESSING,
        },
        client
      ),
      new Prediction(
        {
          id: "testprediction",
          status: PredictionStatus.SUCCEEDED,
        },
        client
      ),
    ];

    const predictionLoad = jest.fn(() => predictionLoadResults.shift());

    jest.spyOn(client, "prediction").mockImplementation(() => {
      const prediction = new Prediction({ id: "testprediction" }, client);

      jest.spyOn(prediction, "load").mockImplementation(predictionLoad);

      return prediction;
    });

    const prediction = await model.predict(
      { input: { text: "test text" } },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(prediction.status).toBe(PredictionStatus.SUCCEEDED);
    expect(predictionLoad).toHaveBeenCalledTimes(3);
  });

  it("retries polling on error", async () => {
    jest.spyOn(model, "createPrediction").mockResolvedValue(
      new Prediction(
        {
          id: "testprediction",
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
            id: "testprediction",
            status: PredictionStatus.SUCCEEDED,
          },
          client
        ),
    ];

    const predictionLoad = jest.fn(() => predictionLoadResults.shift()());

    jest.spyOn(client, "prediction").mockImplementation(() => {
      const prediction = new Prediction({ id: "testprediction" }, client);

      jest.spyOn(prediction, "load").mockImplementation(predictionLoad);

      return prediction;
    });
    const backoffFn = jest.fn(() => 0);

    const prediction = await model.predict(
      { input: { text: "test text" } },
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
      id: "testprediction",
      status: PredictionStatus.SUCCEEDED,
    });

    await model.createPrediction({ input: { text: "test text" } });

    expect(client.request).toHaveBeenCalledWith("POST /v1/predictions", {
      version: "testversion",
      input: { text: "test text" },
    });
  });

  it("supports webhook URL", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testprediction",
      status: PredictionStatus.SUCCEEDED,
    });

    await model.createPrediction(
      { input: { text: "test text" } },
      { webhook: "http://test.host/webhook" }
    );

    expect(client.request).toHaveBeenCalledWith("POST /v1/predictions", {
      version: "testversion",
      input: { text: "test text" },
      webhook: "http://test.host/webhook",
    });
  });

  it("supports webhook events filter", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testprediction",
      status: PredictionStatus.SUCCEEDED,
    });

    await model.createPrediction(
      { input: { text: "test text" } },
      {
        webhook: "http://test.host/webhook",
        webhookEventsFilter: ["output", "completed"],
      }
    );

    expect(client.request).toHaveBeenCalledWith("POST /v1/predictions", {
      version: "testversion",
      input: { text: "test text" },
      webhook: "http://test.host/webhook",
      webhook_events_filter: ["output", "completed"],
    });
  });
});
