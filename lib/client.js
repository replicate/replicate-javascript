import fetch from "node-fetch";
import pkg from "../package.json" assert { type: "json" };

class Prediction {
  static fromJSON(json) {
    const prediction = new Prediction();
    Object.assign(prediction, json);
    // TODO: make prediction.version a Version object
    return prediction;
  }
}

class PredictionCollection {
  constructor({ client }) {
    this.client = client;
  }

  async create({ version, input }) {
    const response = await this.client._request({
      method: "POST",
      path: `/v1/predictions`,
      body: {
        version,
        input,
      },
    });
    return Prediction.fromJSON(response);
  }

  async get({ id }) {
    const response = await this.client._request({
      method: "GET",
      path: `/v1/predictions/${id}`,
    });
    return Prediction.fromJSON(response);
  }

  async list() {
    const response = await this.client._request({
      method: "GET",
      path: `/v1/predictions`,
    });
    // TODO pagination
    return response.results.map((prediction) =>
      Prediction.fromJSON(prediction)
    );
  }
}

export default class Client {
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
