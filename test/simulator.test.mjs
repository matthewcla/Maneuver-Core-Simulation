import test from 'node:test';
import assert from 'node:assert/strict';

function dummyEl() {
  return { style: {}, open: false };
}

// Shared stubs
const baseDoc = {
  querySelector: () => dummyEl(),
  documentElement: dummyEl()
};

global.getComputedStyle = () => ({ getPropertyValue: () => '' });

test('logs error when canvas element missing', async () => {
  global.document = { ...baseDoc, getElementById: () => null };
  global.window = { devicePixelRatio: 1 };
  let messages = [];
  const orig = console.error;
  console.error = (msg) => messages.push(msg);
  const { Simulator } = await import('../js/radar-engine.js');
  new Simulator();
  console.error = orig;
  assert.ok(messages.includes('radarCanvas element not found in DOM'));
});

test('logs error when canvas context unavailable', async () => {
  const canvas = { getContext: () => null };
  global.document = {
    ...baseDoc,
    getElementById: (id) => (id === 'radarCanvas' ? canvas : dummyEl())
  };
  global.window = { devicePixelRatio: 1 };
  let messages = [];
  const orig = console.error;
  console.error = (msg) => messages.push(msg);
  const { Simulator } = await import('../js/radar-engine.js');
  new Simulator();
  console.error = orig;
  assert.ok(messages.includes('Failed to get 2D context for radarCanvas'));
});
