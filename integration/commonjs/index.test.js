const { test } = require('node:test');
const assert = require('node:assert');
const main = require('./index');

test('main', async () => {
  const output = await main();
  assert.equal(output, "hello Alice");
});
