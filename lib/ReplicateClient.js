import fetch, { FetchError } from "node-fetch";
import pkg from "../package.json" assert { type: "json" };
import {
  ReplicateError,
  ReplicateRequestError,
  ReplicateResponseError,
} from "./errors.js";
import Prediction from "./Prediction.js";
import Version from "./Version.js";

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

  version(id) {
    return new Version({ id }, this);
  }

  prediction(id) {
    return new Prediction({ id }, this);
  }

  async request(action, body) {
    const { method, path } = this.#parseAction(action);

    const url = new URL(path, this.baseURL).href;
    const requestInit = {
      method,
      headers: this.#headers(),
      body: JSON.stringify(body),
    };

    let resp;
    try {
      resp = await fetch(url, requestInit);
    } catch (err) {
      if (!err instanceof FetchError) {
        throw err;
      }

      throw new ReplicateRequestError(url, requestInit);
    }

    const respText = await resp.text();

    if (!resp.ok) {
      let errorMessage;
      try {
        const respJSON = JSON.parse(respText);
        errorMessage = respJSON.details;
      } catch (err) {
        if (!err instanceof SyntaxError) {
          throw err;
        }

        errorMessage = respText;
      }

      throw new ReplicateResponseError(errorMessage, resp, action);
    }

    return JSON.parse(respText);
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
