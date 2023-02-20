import { jest } from "@jest/globals";
import { FetchError, Response } from "node-fetch";

jest.unstable_mockModule("node-fetch", () => ({
  default: jest.fn(),
  FetchError,
}));

import {
  ReplicateError,
  ReplicateRequestError,
  ReplicateResponseError,
} from "./errors.js";
import { PredictionStatus } from "./Prediction.js";

const { default: fetch } = await import("node-fetch");
const { default: ReplicateClient } = await import("./ReplicateClient.js");

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

  it("retries polling on error", async () => {
    const requestMockReturnValues = {
      "POST /v1/predictions": [
        () => ({
          id: "test-id",
          status: PredictionStatus.STARTING,
        }),
      ],
      "GET /v1/predictions/test-id": [
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
        () => ({
          id: "test-id",
          status: PredictionStatus.SUCCEEDED,
        }),
      ],
    };

    jest
      .spyOn(client, "request")
      .mockImplementation((action) =>
        requestMockReturnValues[action].shift()()
      );
    const backoffFn = jest.fn(() => 0);

    await client.predict(
      "test-version",
      { text: "test text" },
      {},
      { defaultPollingInterval: 0, backoffFn }
    );

    expect(client.request).toHaveBeenCalledTimes(4);
    expect(client.request).toHaveLastReturnedWith({
      id: "test-id",
      status: PredictionStatus.SUCCEEDED,
    });
    expect(backoffFn).toHaveBeenCalledTimes(2);
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

describe("request()", () => {
  it("throws ReplicateRequestError on failed fetch", async () => {
    fetch.mockImplementation(async () => {
      throw new FetchError("Something went wrong");
    });

    await expect(
      async () => await client.request("GET /v1/predictions/test-id")
    ).rejects.toThrowError(ReplicateRequestError);
    await expect(
      async () => await client.request("GET /v1/predictions/test-id")
    ).rejects.toThrowError(
      "Failed to make request: method=GET, url=https://api.replicate.com/v1/predictions/test-id, body=undefined"
    );
  });

  it("throws ReplicateResponseError on error status", async () => {
    fetch.mockImplementation(
      async () =>
        new Response('{"status":403,"details":"Something went wrong"}', {
          status: 403,
          statusText: "Unauthorized",
        })
    );

    await expect(
      async () => await client.request("GET /v1/predictions/test-id")
    ).rejects.toThrowError(ReplicateResponseError);
    await expect(
      async () => await client.request("GET /v1/predictions/test-id")
    ).rejects.toThrowError(
      "403 Unauthorized for GET /v1/predictions/test-id: Something went wrong"
    );
  });
});
