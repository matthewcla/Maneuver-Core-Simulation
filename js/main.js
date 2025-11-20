/**
 * Entry point for Maneuver simulator
 * Dynamically loads heavy modules to improve PWA install performance.
 */

async function loadSimulator() {
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'block';
  try {
    const mod = await import('./radar-engine.js');
    const { Simulator } = mod;
    window.sim = new Simulator();
  } catch (err) {
    console.error('Failed to load simulator module', err);
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

window.addEventListener('DOMContentLoaded', loadSimulator);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
