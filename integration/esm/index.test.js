import { test } from 'node:test';
import assert from 'node:assert';
import main from './index.js';

test('main', async () => {
  const output = await main();
  assert.equal(output, "hello Evelyn ESM");
});
