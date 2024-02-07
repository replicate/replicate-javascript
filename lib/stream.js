
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

class Stream {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.readableStream = new ReadableStream({
      start: async (controller) => {
        const response = await fetch(this.url, {
          ...this.options,
          headers: {
            Accept: 'text/event-stream',
          },
        });
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let eventBuffer = '';

        const processChunk = (chunk) => {
          eventBuffer += decoder.decode(chunk, {stream: true});
          let eolIndex = eventBuffer.indexOf('\n');
          while (eolIndex >= 0) {
            const line = eventBuffer.slice(0, eolIndex).trim();
            eventBuffer = eventBuffer.slice(eolIndex + 1);
            if (line === '') {
              // End of an event
              const event = this.parseEvent(eventBuffer);
              controller.enqueue(event);
              eventBuffer = '';
            } else {
              // Accumulate data
              eventBuffer += `${line}\n`
            }

            eolIndex = eventBuffer.indexOf('\n');
          }
        };

        const push = async () => {
          const {done, value} = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          processChunk(value);
          push();
        };

        push();
      }
    });
  }

  parseEvent(rawData) {
    const lines = rawData.trim().split('\n');
    let event = 'message';
    let data = '';
    let id = null;
    let retry = null;

    for (const line of lines) {
      const [fieldName, value] = line.split(/:(.*)/, 2);
      switch (fieldName) {
        case 'event':
          event = value.trim();
          break;
        case 'data':
          data += `${value.trim()}\n`;
          break;
        case 'id':
          id = value.trim();
          break;
        case 'retry':
          retry = parseInt(value.trim(), 10);
          break;
      }
    }
    return new ServerSentEvent(event, data.trim(), id, retry);
  }
}

module.exports = {
  Stream,
  ServerSentEvent,
};
