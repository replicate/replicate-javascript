import { jest } from "@jest/globals";
import { FetchError } from "node-fetch";
import Prediction, { PredictionStatus } from "./Prediction.js";

jest.unstable_mockModule("node-fetch", () => ({
  default: jest.fn(),
  FetchError,
}));

const { default: ReplicateClient } = await import("./ReplicateClient.js");

let client;
let prediction;

beforeEach(() => {
  process.env.REPLICATE_API_TOKEN = "test-token-from-env";

  client = new ReplicateClient({});
  prediction = client.prediction("testprediction");
});

describe("load()", () => {
  it("makes request to get prediction", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testprediction",
      status: PredictionStatus.SUCCEEDED,
    });

    await prediction.load();

    expect(client.request).toHaveBeenCalledWith(
      "GET /v1/predictions/testprediction"
    );
  });

  it("returns Prediction", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testprediction",
      status: PredictionStatus.SUCCEEDED,
    });

    const returnedPrediction = await prediction.load();

    expect(returnedPrediction).toBeInstanceOf(Prediction);
  });

  it("updates Prediction in place", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testprediction",
      status: PredictionStatus.SUCCEEDED,
    });

    const returnedPrediction = await prediction.load();

    expect(returnedPrediction).toBe(prediction);
  });
});

describe("cancel()", () => {
  it("makes request to cancel prediction", async () => {
    jest.spyOn(client, "request").mockResolvedValue({
      id: "testprediction",
      status: PredictionStatus.PROCESSING,
    });

    await prediction.cancel();

    expect(client.request).toHaveBeenCalledWith(
      "POST /v1/predictions/testprediction/cancel"
    );
  });
});
