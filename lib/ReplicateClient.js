import fetch from "node-fetch";
import pkg from "../package.json" assert { type: "json" };
import { ReplicateError } from "./errors.js";
import Prediction from "./Prediction.js";
import { sleep } from "./utils.js";

export default class ReplicateClient {
  baseURL;
  token;

  constructor({ baseURL, token }) {
    this.baseURL = baseURL || "https://api.replicate.com";
    this.token = token || process.env.REPLICATE_API_TOKEN;

    if (!this.token) {
      throw new ReplicateError("Missing API token");
    }
  }

  // TODO: Optionally autocancel prediction on exception.
  async predict(
    version,
    input,
    { onUpdate } = {},
    { defaultPollingInterval = 500 } = {}
  ) {
    if (!version) {
      throw new ReplicateError("version is required");
    }

    if (!input) {
      throw new ReplicateError("input is required");
    }

    let prediction = await this.createPrediction(version, input);

    onUpdate && onUpdate(prediction);

    let pollingInterval = defaultPollingInterval;

    while (!prediction.hasTerminalStatus()) {
      await sleep(pollingInterval);
      pollingInterval = defaultPollingInterval; // Reset to default each time.

      prediction = await this.getPrediction(prediction.id);

      onUpdate && onUpdate(prediction);
    }

    return prediction;
  }

  async createPrediction(version, input) {
    const predictionData = await this.request("POST /v1/predictions", {
      version,
      input,
    });

    return new Prediction(predictionData);
  }

  async getPrediction(predictionID) {
    const predictionData = await this.request(
      `GET /v1/predictions/${predictionID}`
    );

    return new Prediction(predictionData);
  }

  async request(action, body) {
    const { method, path } = this.#parseAction(action);

    let resp;
    try {
      resp = await fetch(new URL(path, this.baseURL).href, {
        method,
        headers: this.#headers(),
        body: JSON.stringify(body),
      });
    } catch (err) {
      // TODO: Better error handling.
      throw err;
    }

    if (!resp.ok) {
      // TODO: Better error handling.
      console.error(await resp.text());
      throw new ReplicateError(resp.statusText);
    }

    try {
      return await resp.json();
    } catch (err) {
      // TODO: Better error handling.
      throw err;
    }
  }

  #headers() {
    return {
      Authorization: `Token ${this.token}`,
      "User-Agent": `replicate-js@${pkg.version}`,
    };
  }

  #parseAction(action) {
    const result = /^(GET|POST) (\/[^\s]+)$/.exec(action);

    if (!result) {
      throw new ReplicateError(`Invalid action: ${action}`);
    }

    const [, method, path] = result;
    return { method, path };
  }
}
