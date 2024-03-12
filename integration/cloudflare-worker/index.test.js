// https://developers.cloudflare.com/workers/wrangler/api/#unstable_dev
import { unstable_dev as dev } from "wrangler";
import { test, after, before, describe } from "node:test";
import assert from "node:assert";

describe("CloudFlare Worker", () => {
  /** @type {import("wrangler").UnstableDevWorker} */
  let worker;

  before(async () => {
    worker = await dev("./index.js", {
      port: 3000,
      experimental: { disableExperimentalWarning: true },
    });
  });

  after(async () => {
    if (!worker) {
      // If no worker the before hook failed to run and the process will hang.
      process.exit(1);
    }
    await worker.stop();
  });

  test("worker streams back a response", { timeout: 5000 }, async () => {
    const resp = await worker.fetch();
    const text = await resp.text();

    assert.ok(resp.ok, `expected status to be 2xx but got ${resp.status}`);
    assert(
      text.length > 0,
      "expected body to have content but got body.length of 0"
    );
    assert(
      text.includes("Colin CloudFlare"),
      `expected body to include "Colin CloudFlare" but got ${JSON.stringify(
        text
      )}`
    );
  });
});
