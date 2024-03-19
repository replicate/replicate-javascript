import { expect, test } from "bun:test";
import main from "./index.js";

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

test("main", async () => {
  const output = await main();
  expect(output).toContain("Brünnhilde Bun");
});
