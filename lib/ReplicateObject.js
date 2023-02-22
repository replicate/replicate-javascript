import camelcaseKeys from "camelcase-keys";
import { ReplicateError } from "./errors.js";

export default class ReplicateObject {
  static propertyMap = {};

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
    this.#setProps(props);
    this.client = client;
  }

  async load() {
    const action = this.actionForGet();
    const props = await this.client.request(action);

    this.#setProps(props);

    return this;
  }

  async update() {
    return this.load();
  }

  actionForGet() {
    throw new ReplicateError("Not implemented");
  }

  #setProps(props) {
    const camelcasedProps = camelcaseKeys(props);

    for (const key in camelcasedProps) {
      this[this.constructor.propertyMap[key] || key] = camelcasedProps[key];
    }
  }
}
