export default class Prediction {
  static fromJSON(json) {
    const prediction = new Prediction();
    Object.assign(prediction, json);
    // TODO: make prediction.version a Version object
    return prediction;
  }
}
