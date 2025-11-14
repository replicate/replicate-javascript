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
 * @param {boolean} [config.options.useFileOutput] Whether to use the file output stream.
 * @returns {ReadableStream<ServerSentEvent> & AsyncIterable<ServerSentEvent>}
 */
function createReadableStream({ url, fetch, options = {} }) {
  const { useFileOutput = true, headers = {}, ...initOptions } = options;
  const shouldProcessFileOutput = useFileOutput && isFileStream(url);

  return new ReadableStream({
    async start(controller) {
      const init = {
        ...initOptions,
        headers: {
          ...headers,
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

        let data = event.data;
        if (
          event.event === "output" &&
          shouldProcessFileOutput &&
          typeof data === "string"
        ) {
          data = createFileOutput({ url: data, fetch });
        }
        controller.enqueue(new ServerSentEvent(event.event, data, event.id));

        if (event.event === "done") {
          break;
        }
      }

      controller.close();
    },
  });
}

/**
 * Create a new readable stream for an output file
 * created by running a Replicate model.
 *
 * @param {object} config
 * @param {string} config.url The URL to connect to.
 * @param {typeof fetch} [config.fetch] The fetch function.
 * @returns {ReadableStream<Uint8Array>}
 */
function createFileOutput({ url, fetch }) {
  let type = "application/octet-stream";

  class FileOutput extends ReadableStream {
    async blob() {
      const chunks = [];
      for await (const chunk of this) {
        chunks.push(chunk);
      }
      return new Blob(chunks, { type });
    }

    url() {
      return new URL(url);
    }

    toString() {
      return url;
    }
  }

  return new FileOutput({
    async start(controller) {
      const response = await fetch(url);

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

      if (response.headers.get("Content-Type")) {
        type = response.headers.get("Content-Type");
      }

      try {
        for await (const chunk of streamAsyncIterator(response.body)) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

function isFileStream(url) {
  try {
    return new URL(url).pathname.startsWith("/v1/files/");
  } catch {}
  return false;
}

module.exports = {
  createFileOutput,
  createReadableStream,
  ServerSentEvent,
};
