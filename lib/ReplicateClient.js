import fetch, { FetchError } from "node-fetch";
import pkg from "../package.json" assert { type: "json" };
import {
  ReplicateError,
  ReplicateRequestError,
  ReplicateResponseError,
} from "./errors.js";
import Model from "./Model.js";
import Prediction from "./Prediction.js";

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

  model(idOrParams) {
    let owner, name, version;

    if (typeof idOrParams === "string") {
      const idComponents = /^([\w-]+)\/([\w-]+)@(\w+)$/.exec(idOrParams);

      if (!idComponents) {
        throw new ReplicateError(`Invalid ID: ${idOrParams}`);
      }

      [, owner, name, version] = idComponents;
    } else {
      if (idOrParams.owner) {
        owner = idOrParams.owner;
        name = idOrParams.name;
      } else {
        const nameComponents = /^([\w-]+)\/([\w-]+)$/.exec(idOrParams.name);

        if (!nameComponents) {
          throw new ReplicateError(`Invalid name: ${idOrParams.name}`);
        }

        [, owner, name] = nameComponents;
      }

      version = idOrParams.version;
    }

    return new Model({ owner, name, version }, this);
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
