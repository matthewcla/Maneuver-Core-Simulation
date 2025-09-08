import test from 'node:test';
import assert from 'node:assert';
import { ObjectPool } from '../js/object-pool.js';

test('acquire uses factory when pool is empty', () => {
  let created = 0;
  const pool = new ObjectPool(() => {
    created += 1;
    return {};
  });
  pool.acquire();
  assert.strictEqual(created, 1);
});

test('released objects are reused', () => {
  const pool = new ObjectPool(() => ({ value: 42 }));
  const first = pool.acquire();
  pool.release(first);
  const second = pool.acquire();
  assert.strictEqual(second, first);
});
