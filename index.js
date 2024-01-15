const ReplicateClass = require("./lib/replicate");
const ApiError = require("./lib/error");
require("./lib/types");

/**
 * Placeholder class used to warn of deprecated constructor.
 * @deprecated use exported Replicate class instead
 */
class DeprecatedReplicate extends ReplicateClass {
  /** 
    * @deprecated Use `import { Replicate } from "replicate";` instead
    * @param {ConstructorParameters<typeof ReplicateClass>[0]=} options 
    */
  // biome-ignore lint/complexity/noUselessConstructor: exists for the tsdoc comment
  constructor(options) {
    super(options);
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
 * @typedef {import("./lib/types").Collection} Collection
 * @typedef {import("./lib/types").ModelVersion} ModelVersion
 * @typedef {import("./lib/types").Hardware} Hardware
 * @typedef {import("./lib/types").Model} Model
 * @typedef {import("./lib/types").Prediction} Prediction
 * @typedef {import("./lib/types").Training} Training
 * @typedef {import("./lib/types").ServerSentEvent} ServerSentEvent
 * @typedef {import("./lib/types").Status} Status
 * @typedef {import("./lib/types").Visibility} Visibility
 * @typedef {import("./lib/types").WebhookEventType} WebhookEventType
 */

/**
 * @template T
 * @typedef {import("./lib/types").Page<T>} Page
 */

