import { jest } from "@jest/globals";
import { ReplicateError } from "./errors.js";
import { PredictionStatus } from "./Prediction.js";
import ReplicateClient from "./ReplicateClient.js";

let client;

beforeEach(() => {
  process.env.REPLICATE_API_TOKEN = "test-token-from-env";

  client = new ReplicateClient({});
});

describe("baseURL", () => {
  it("is baseURL provided to constructor", () => {
    const client = new ReplicateClient({
      baseURL: "http://test.host",
    });

    expect(client.baseURL).toEqual("http://test.host");
  });

  it("defaults to https://api.replicate.com", () => {
    const client = new ReplicateClient({});

    expect(client.baseURL).toEqual("https://api.replicate.com");
  });
});

describe("token", () => {
  it("is token provided to constructor", () => {
    const client = new ReplicateClient({
      token: "test-token-from-constructor",
    });

    expect(client.token).toEqual("test-token-from-constructor");
  });

  it("defaults to REPLICATE_API_TOKEN env var", () => {
    const client = new ReplicateClient({});

    expect(client.token).toEqual("test-token-from-env");
  });
});

describe("constructor()", () => {
  it("throws when no token is provided or set in env", () => {
    delete process.env.REPLICATE_API_TOKEN;

    expect(() => new ReplicateClient({})).toThrowError(ReplicateError);
  });
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
