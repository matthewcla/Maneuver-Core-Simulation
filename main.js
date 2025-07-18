if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}

function checkStandalone() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       navigator.standalone;
  if (isStandalone) {
    console.log('Running in standalone mode');
  }
}
window.addEventListener('load', checkStandalone);
