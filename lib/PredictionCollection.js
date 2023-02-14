import Prediction from "./Prediction.js";

export default class PredictionCollection {
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
