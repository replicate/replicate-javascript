const { test } = require('node:test');
const assert = require('node:assert');
const Replicate = require('replicate').Replicate;

const replicate = new Replicate();

async function main() {
  return await replicate.run(
    "replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa",
    {
      input: {
        text: "Claire CommonJS"
      }
    }
  );
};

test('main', async () => {
  const output = await main();
  assert.equal(output, "hello Claire CommonJS");
});
