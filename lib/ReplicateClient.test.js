import { jest } from "@jest/globals";
import { PredictionStatus } from "./Prediction.js";
import ReplicateClient from "./ReplicateClient.js";

let client;

beforeEach(() => {
  process.env.REPLICATE_API_TOKEN = "test-token-from-env";

  client = new ReplicateClient({});
});

describe("predict()", () => {
  it("makes request to create prediction", async () => {
    jest
      .spyOn(client, "request")
      .mockResolvedValue({ status: PredictionStatus.SUCCEEDED });

    await client.predict(
      "test-version",
      { text: "test text" },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(client.request).toHaveBeenCalledWith("POST /v1/predictions", {
      version: "test-version",
      input: { text: "test text" },
    });
  });

  it("uses created prediction's ID to fetch update", async () => {
    const requestMockReturnValues = {
      "POST /v1/predictions": {
        id: "test-id",
        status: PredictionStatus.STARTING,
      },
      "GET /v1/predictions/test-id": {
        id: "test-id",
        status: PredictionStatus.SUCCEEDED,
      },
    };

    jest
      .spyOn(client, "request")
      .mockImplementation((action) => requestMockReturnValues[action]);

    await client.predict(
      "test-version",
      { text: "test text" },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(client.request).toHaveBeenCalledWith("GET /v1/predictions/test-id");
  });

  it("polls prediction status until success", async () => {
    const requestMockReturnValues = {
      "POST /v1/predictions": [
        {
          id: "test-id",
          status: PredictionStatus.STARTING,
        },
      ],
      "GET /v1/predictions/test-id": [
        {
          id: "test-id",
          status: PredictionStatus.PROCESSING,
        },
        {
          id: "test-id",
          status: PredictionStatus.PROCESSING,
        },
        {
          id: "test-id",
          status: PredictionStatus.SUCCEEDED,
        },
      ],
    };

    jest
      .spyOn(client, "request")
      .mockImplementation((action) => requestMockReturnValues[action].shift());

    await client.predict(
      "test-version",
      { text: "test text" },
      {},
      { defaultPollingInterval: 0 }
    );

    expect(client.request).toHaveBeenCalledTimes(4);
    expect(client.request).toHaveLastReturnedWith({
      id: "test-id",
      status: PredictionStatus.SUCCEEDED,
    });
  });
});

describe("createPrediction()", () => {
  it("makes request to create prediction", async () => {
    jest.spyOn(client, "request").mockResolvedValue({});

    await client.createPrediction("test-version", { text: "test text" });

    expect(client.request).toHaveBeenCalledWith("POST /v1/predictions", {
      version: "test-version",
      input: { text: "test text" },
    });
  });
});

describe("getPrediction()", () => {
  it("makes request to get prediction", async () => {
    jest.spyOn(client, "request").mockResolvedValue({});

    await client.getPrediction("test-id");

    expect(client.request).toHaveBeenCalledWith("GET /v1/predictions/test-id");
  });
});
