const ReplicateClass = require("./lib/replicate");
const ApiError = require("./lib/error");
require("./lib/types");

/**
 * Placeholder class used to warn of deprecated constructor.
 * @deprecated use exported Replicate class instead
 */
class DeprecatedReplicate extends ReplicateClass {
  /** @deprecated Use `import { Replicate } from "replicate";` instead */
  // biome-ignore lint/complexity/noUselessConstructor: exists for the tsdoc comment
  constructor(...args) {
    super(...args);
  }
}

const named = { ApiError, Replicate: ReplicateClass };
const singleton = new ReplicateClass();

/**
 * Default instance of the Replicate class that gets the access token
 * from the REPLICATE_API_TOKEN environment variable.
 *
 * Create a new Replicate API client instance.
 *
 * @example
 *
 * import replicate from "replicate";
 *
 * // Run a model and await the result:
 * const model = 'owner/model:version-id'
 * const input = {text: 'Hello, world!'}
 * const output = await replicate.run(model, { input });
 *
 * @remarks
 *
 * NOTE: Use of this object as a constructor is deprecated and will
 * be removed in a future version. Import the Replicate constructor
 * instead:
 *
 * ```
 * const Replicate = require("replicate").Replicate;
 * ```
 *
 * Or in commonjs:
 *
 * ```
 * import { Replicate } from "replicate";
 * const client = new Replicate({...});
 * ```
 *
 * @type { Replicate & typeof DeprecatedReplicate & {Replicate: typeof ReplicateClass} }
 */
const replicate = new Proxy(DeprecatedReplicate, {
  get(target, prop, receiver) {
    // Should mostly behave like the singleton.
    if (named[prop]) {
      return named[prop];
    }
    // Provide Replicate & ApiError constructors.
    if (singleton[prop]) {
      return singleton[prop];
    }
    // Fallback to Replicate constructor properties.
    return Reflect.get(target, prop, receiver);
  },
  set(_target, prop, newValue, _receiver) {
    singleton[prop] = newValue;
    return true;
  }
});

module.exports = replicate;

// - Type Definitions

/** 
 * @typedef {import("./lib/replicate")} Replicate
 * @typedef {import("./lib/error")} ApiError
 * @typedef {typeof import("./lib/types").Collection} Collection
 * @typedef {typeof import("./lib/types").ModelVersion} ModelVersion
 * @typedef {typeof import("./lib/types").Hardware} Hardware
 * @typedef {typeof import("./lib/types").Model} Model
 * @typedef {typeof import("./lib/types").Prediction} Prediction
 * @typedef {typeof import("./lib/types").Training} Training
 * @typedef {typeof import("./lib/types").ServerSentEvent} ServerSentEvent
 * @typedef {typeof import("./lib/types").Status} Status
 * @typedef {typeof import("./lib/types").Visibility} Visibility
 * @typedef {typeof import("./lib/types").WebhookEventType} WebhookEventType
 */

/**
 * @template T
 * @typedef {typeof import("./lib/types").Page} Page
 */

