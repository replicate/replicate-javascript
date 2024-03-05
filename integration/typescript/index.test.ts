import { test } from "node:test";
import assert from "node:assert";
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
  assert.equal(output, "hello Tracy TypeScript");
});
