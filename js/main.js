/**
 * Entry point for Maneuver simulator
 * Dynamically loads heavy modules to improve PWA install performance.
 */

export async function loadSimulator(importer = (path) => import(path)) {
  const loader = document.getElementById('loading');
  const errorEl = document.getElementById('load-error');
  if (loader) loader.style.display = 'block';
  if (errorEl) errorEl.textContent = '';
  try {
    const mod = await importer(`./radar-engine.js?v=__VERSION__`);
    const { Simulator } = mod;
    window.sim = new Simulator();
  } catch (err) {
    console.error('Failed to load simulator module', err);
    if (errorEl) errorEl.textContent = 'Failed to load simulator';
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => loadSimulator());
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`/sw.js?v=__VERSION__`);
}
