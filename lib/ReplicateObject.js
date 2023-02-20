import { ReplicateError } from "./errors.js";

export default class ReplicateObject {
  static fromJSON(json) {
    let props;
    try {
      props = JSON.parse(json);
    } catch {
      throw new Error(`Unable to parse JSON: ${json}`);
    }

    return new this(props);
  }

  client;

  constructor(props, client) {
    for (const key in props) {
      this[key] = props[key];
    }

    this.client = client;
  }

  async load() {
    const action = this.actionForGet();
    const props = await this.client.request(action);

    for (const key in props) {
      this[key] = props[key];
    }

    return this;
  }

  async update() {
    return this.load();
  }

  actionForGet() {
    throw new ReplicateError("Not implemented");
  }
}
