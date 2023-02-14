import fetch from "node-fetch";
import pkg from "../package.json" assert { type: "json" };
import PredictionCollection from "./PredictionCollection.js";

export default class ReplicateClient {
  constructor({ token }) {
    this.token = token || process.env.REPLICATE_API_TOKEN;
    this.predictions = new PredictionCollection({ client: this });
  }

  async _request({ method, path, body }) {
    const response = await fetch(`https://api.replicate.com${path}`, {
      method: method,
      headers: this._headers(),
      body: JSON.stringify(body),
    });
    return await response.json();
  }

  _headers() {
    return {
      Authorization: `Token ${this.token}`,
      "User-Agent": `replicate-js@${pkg.version}`,
    };
  }
}
