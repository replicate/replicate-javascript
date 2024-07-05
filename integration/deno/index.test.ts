import { assertEquals } from "jsr:@std/assert";
import main from "./index.ts";

// Verify exported types.
import type {
  Status,
  Visibility,
  WebhookEventType,
  ApiError,
  Collection,
  Hardware,
  Model,
  ModelVersion,
  Prediction,
  Training,
  Page,
  ServerSentEvent,
} from "replicate";

Deno.test({
  name: "main",
  async fn() {
    const output = await main();
    assertEquals({ output }, { output: "hello Deno the dinosaur" });
  },
});
