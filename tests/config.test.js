import test from 'node:test';
import assert from 'node:assert/strict';

test('basic runtime is available',()=>{
  assert.equal(typeof globalThis.fetch,'function');
  assert.ok(Number(process.versions.node.split('.')[0])>=20);
});
