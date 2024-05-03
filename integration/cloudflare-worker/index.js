import Replicate from "replicate";

export default {
  async fetch(_request, env, _ctx) {
    const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

    try {
      const controller = new AbortController();
      const output = replicate.stream(
        "replicate/canary:30e22229542eb3f79d4f945dacb58d32001b02cc313ae6f54eef27904edf3272",
        {
          input: {
            text: "Colin CloudFlare",
          },
          signal: controller.signal,
        }
      );
      const stream = new ReadableStream({
        async start(controller) {
          for await (const event of output) {
            controller.enqueue(new TextEncoder().encode(`${event}`));
          }
          controller.enqueue(new TextEncoder().encode("\n"));
          controller.close();
        },
      });

      return new Response(stream);
    } catch (err) {
      return Response("", { status: 500 });
    }
  },
};
