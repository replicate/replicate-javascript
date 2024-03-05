// Attempt to use readable-stream if available, attempt to use the built-in stream module.

const ApiError = require("./error");

let Readable;
try {
  Readable = require("readable-stream").Readable;
} catch (e) {
  try {
    Readable = require("stream").Readable;
  } catch (e) {
    Readable = null;
  }
}

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
 * A stream of server-sent events.
 */
class Stream extends Readable {
  /**
   * Create a new stream of server-sent events.
   *
   * @param {object} config
   * @param {string} config.url The URL to connect to.
   * @param {typeof fetch} [config.fetch] The fetch implementation to use.
   * @param {object} [config.options] The fetch options.
   */
  constructor({ url, fetch = globalThis.fetch, options = {} }) {
    if (!Readable) {
      throw new Error(
        "Readable streams are not supported. Please use Node.js 18 or later, or install the readable-stream package."
      );
    }

    super();
    this.url = url;
    this.fetch = fetch;
    this.options = options;

    this.event = null;
    this.data = [];
    this.lastEventId = null;
    this.retry = null;
  }

  decode(line) {
    if (!line) {
      if (!this.event && !this.data.length && !this.lastEventId) {
        return null;
      }

      const sse = new ServerSentEvent(
        this.event,
        this.data.join("\n"),
        this.lastEventId
      );

      this.event = null;
      this.data = [];
      this.retry = null;

      return sse;
    }

    if (line.startsWith(":")) {
      return null;
    }

    const [field, value] = line.split(": ");
    if (field === "event") {
      this.event = value;
    } else if (field === "data") {
      this.data.push(value);
    } else if (field === "id") {
      this.lastEventId = value;
    }

    return null;
  }

  async *[Symbol.asyncIterator]() {
    const init = {
      ...this.options,
      headers: {
        Accept: "text/event-stream",
      },
    };
    const response = await this.fetch(this.url, init);

    if (!response.ok) {
      // The cross-fetch shim doesn't accept Request objects so we create one here.
      const request = new Request(this.url, init);
      const text = await response.text();
      throw new ApiError(
        `Request to ${request.url} failed with status ${response.status} ${response.statusText}: ${text}.`,
        request,
        response
      );
    }

    let partialChunk = "";
    for await (const chunk of response.body) {
      const decoder = new TextDecoder("utf-8");
      const text = partialChunk + decoder.decode(chunk);
      const lines = text.split("\n");

      // We want to ensure that the last line is not a fragment
      // so we keep it and append it to the start of the next
      // chunk.
      partialChunk = lines.pop();

      for (const line of lines) {
        const sse = this.decode(line);
        if (sse) {
          if (sse.event === "error") {
            throw new Error(sse.data);
          }

          yield sse;

          if (sse.event === "done") {
            return;
          }
        }
      }
    }

    // Process the final line and ensure we have captured the final event.
    this.decode(partialChunk);
    const sse = this.decode("");
    if (sse) {
      if (sse.event === "error") {
        throw new Error(sse.data);
      }

      yield sse;
    }
  }
}

module.exports = {
  Stream,
  ServerSentEvent,
};
