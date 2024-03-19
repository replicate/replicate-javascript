// Attempt to use readable-stream if available, attempt to use the built-in stream module.

const ApiError = require("./error");
const { streamAsyncIterator } = require("./util");
const {
  EventSourceParserStream,
} = require("../vendor/eventsource-parser/stream");
const { TextDecoderStream } =
  typeof globalThis.TextDecoderStream === "undefined"
    ? require("../vendor/streams-text-encoding/text-decoder-stream")
    : globalThis;

/**
 * A server-sent event.
 */
class ServerSentEvent {
  /**
   * Create a new server-sent event.
   *
   * @param {string} event The event name.
   * @param {string} data The event data.
   * @param {string} id The event ID.
   * @param {number} retry The retry time.
   */
  constructor(event, data, id, retry) {
    this.event = event;
    this.data = data;
    this.id = id;
    this.retry = retry;
  }

  /**
   * Convert the event to a string.
   */
  toString() {
    if (this.event === "output") {
      return this.data;
    }

    return "";
  }
}

/**
 * Create a new stream of server-sent events.
 *
 * @param {object} config
 * @param {string} config.url The URL to connect to.
 * @param {typeof fetch} [config.fetch] The URL to connect to.
 * @param {object} [config.options] The EventSource options.
 * @returns {ReadableStream<ServerSentEvent> & AsyncIterable<ServerSentEvent>}
 */
function createReadableStream({ url, fetch, options = {} }) {
  return new ReadableStream({
    async start(controller) {
      const init = {
        ...options,
        headers: {
          ...options.headers,
          Accept: "text/event-stream",
        },
      };
      const response = await fetch(url, init);

      if (!response.ok) {
        const text = await response.text();
        const request = new Request(url, init);
        controller.error(
          new ApiError(
            `Request to ${url} failed with status ${response.status}: ${text}`,
            request,
            response
          )
        );
      }

      const stream = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());

      for await (const event of streamAsyncIterator(stream)) {
        if (event.event === "error") {
          controller.error(new Error(event.data));
          break;
        }

        controller.enqueue(
          new ServerSentEvent(event.event, event.data, event.id)
        );

        if (event.event === "done") {
          break;
        }
      }

      controller.close();
    },
  });
}

module.exports = {
  createReadableStream,
  ServerSentEvent,
};
