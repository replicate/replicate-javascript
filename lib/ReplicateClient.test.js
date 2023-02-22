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
import Model from "./Model.js";
import Prediction from "./Prediction.js";

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

describe("getModelVersions()", () => {
  beforeEach(() => {
    jest
      .spyOn(client, "request")
      .mockResolvedValue([
        { id: "testversion0" },
        { id: "testversion1" },
        { id: "testversion2" },
        { id: "testversion3" },
        { id: "testversion4" },
      ]);
  });

  it("returns array of Models", async () => {
    const models = await client.getModelVersions("test-owner/test-name");

    expect(models).toBeInstanceOf(Array);
    expect(models[0]).toBeInstanceOf(Model);
  });

  it("returns array of Models with version set", async () => {
    const models = await client.getModelVersions("test-owner/test-name");

    expect(models).toBeInstanceOf(Array);
    expect(models[0]).toBeInstanceOf(Model);
    expect(models[0].version).toBe("testversion0");
  });

  it("parses name string", async () => {
    const models = await client.getModelVersions("test-owner/test-name");

    expect(models[0].owner).toBe("test-owner");
    expect(models[0].name).toBe("test-name");
  });

  it("handles complete params", async () => {
    const models = await client.getModelVersions({
      owner: "test-owner",
      name: "test-name",
    });

    expect(models[0].owner).toBe("test-owner");
    expect(models[0].name).toBe("test-name");
  });

  it("handles params with combined name", async () => {
    const models = await client.getModelVersions({
      name: "test-owner/test-name",
    });

    expect(models[0].owner).toBe("test-owner");
    expect(models[0].name).toBe("test-name");
  });
});

describe("model()", () => {
  it("returns Model", () => {
    const model = client.model("test-owner/test-name:testversion");

    expect(model).toBeInstanceOf(Model);
  });

  it("parses ID string", () => {
    const model = client.model("test-owner/test-name:testversion");

    expect(model.owner).toBe("test-owner");
    expect(model.name).toBe("test-name");
    expect(model.version).toBe("testversion");
  });

  it("handles complete params", () => {
    const model = client.model({
      owner: "test-owner",
      name: "test-name",
      version: "testversion",
    });

    expect(model.owner).toBe("test-owner");
    expect(model.name).toBe("test-name");
    expect(model.version).toBe("testversion");
  });

  it("handles params with combined name", () => {
    const model = client.model({
      name: "test-owner/test-name",
      version: "testversion",
    });

    expect(model.owner).toBe("test-owner");
    expect(model.name).toBe("test-name");
    expect(model.version).toBe("testversion");
  });
});

describe("prediction()", () => {
  it("returns Prediction", () => {
    const prediction = client.prediction("testprediction");

    expect(prediction).toBeInstanceOf(Prediction);
  });
});

describe("request()", () => {
  it("throws ReplicateRequestError on failed fetch", async () => {
    fetch.mockImplementation(async () => {
      throw new FetchError("Something went wrong");
    });

    await expect(
      async () => await client.request("GET /v1/predictions/testprediction")
    ).rejects.toThrowError(ReplicateRequestError);
    await expect(
      async () => await client.request("GET /v1/predictions/testprediction")
    ).rejects.toThrowError(
      "Failed to make request: method=GET, url=https://api.replicate.com/v1/predictions/testprediction, body=undefined"
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
      async () => await client.request("GET /v1/predictions/testprediction")
    ).rejects.toThrowError(ReplicateResponseError);
    await expect(
      async () => await client.request("GET /v1/predictions/testprediction")
    ).rejects.toThrowError(
      "403 Unauthorized for GET /v1/predictions/testprediction: Something went wrong"
    );
  });
});
