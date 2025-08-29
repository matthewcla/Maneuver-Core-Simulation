import test from 'node:test';
import assert from 'node:assert/strict';

const loader = { style: { display: 'none' } };
const errorEl = { textContent: '' };

global.document = {
  getElementById: (id) => {
    if (id === 'loading') return loader;
    if (id === 'load-error') return errorEl;
    return null;
  }
};

global.window = { addEventListener: () => {} };
global.navigator = {};

const { loadSimulator } = await import('../js/main.js');

test('loadSimulator initializes Simulator and toggles loader', async () => {
  class FakeSimulator {}
  const importer = async () => ({ Simulator: FakeSimulator });
  await loadSimulator(importer);
  assert.equal(loader.style.display, 'none');
  assert.equal(errorEl.textContent, '');
  assert.ok(window.sim instanceof FakeSimulator);
});

test('loadSimulator surfaces error message on failure', async () => {
  const importer = async () => { throw new Error('network'); };
  let errorLogged = false;
  const origError = console.error;
  console.error = () => { errorLogged = true; };
  await loadSimulator(importer);
  console.error = origError;
  assert.equal(loader.style.display, 'none');
  assert.equal(errorEl.textContent, 'Failed to load simulator');
  assert.ok(errorLogged);
});
