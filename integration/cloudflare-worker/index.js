import Replicate from "replicate";

const replicate = new Replicate();

export default {
  async fetch(_request, _env, _ctx) {
    const stream = new ReadableStream({
      async start(controller) {
        for await (const event of replicate.stream(
          "replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
          {
            input: {
              text: "Colin CloudFlare",
            },
          }
        )) {
          controller.enqueue(`${event}`);
        }
        controller.close();
      },
    });

    return new Response(stream);
  },
};
