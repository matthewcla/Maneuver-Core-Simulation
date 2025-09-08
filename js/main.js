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

// Register service worker relative to this module
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register(new URL('../sw.js', import.meta.url))
    .catch(err => console.error('SW registration failed', err));
}
