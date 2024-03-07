// https://developers.cloudflare.com/workers/wrangler/api/#unstable_dev
import { unstable_dev as dev } from "wrangler";
import { test, after, before } from "node:test";
import assert from "node:assert";

let worker;

before(async () => {
  worker = await dev("index.js", {
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

test("worker streams back a response", { timeout: 1000 }, async (t) => {
  const resp = await worker.fetch("/", { signal: t.signal });
  const text = await resp.text();

  assert.ok(resp.ok, "status is 2xx");
  assert(text.length > 0, "body.length is greater than 0");
});
