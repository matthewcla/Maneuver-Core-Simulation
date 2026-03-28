// Register service worker if available
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./service-worker.js', window.location.href));
  });
}

/**
 * @class GameManager
 * Handles high-level application state and mode selection.
 */
class GameManager {
  constructor() {
    this.menuOverlay = document.getElementById('main-menu');
    this.btnSimulator = document.getElementById('btn-simulator');

    // Bind methods
    this.startSimulatorMode = this.startSimulatorMode.bind(this);

    this._attachListeners();
    this._checkURLParams();
  }

  _attachListeners() {
    this.btnSimulator?.addEventListener('click', this.startSimulatorMode);

    // Main Menu navigation via Logo
    const logo = document.querySelector('.maneuverlogo');
    if (logo) {
      logo.style.cursor = 'pointer';
      logo.addEventListener('click', () => {
        this.showMenu();
        if (window.sim && window.sim.isSimulationRunning) {
          window.sim.togglePlayPause();
        }
      });
    }
  }

  _checkURLParams() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');

    if (mode === 'simulator') {
      this.startSimulatorMode();
    }
  }

  hideMenu() {
    this.menuOverlay.classList.add('hidden');
  }

  showMenu() {
    this.menuOverlay.classList.remove('hidden');
  }

  startSimulatorMode() {
    this.hideMenu();
    this.initSimulator({ mode: 'simulator' });
  }

  initSimulator(config) {
    if (window.sim) {
      window.sim.destroy();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        window.sim = new Simulator(config);
      });
    } else {
      window.sim = new Simulator(config);
    }
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // If embedded or waiting for specific scripts (like existing logic checked window.TypeForm),
  // adapt here. For this refactor, we assume direct control.

  window.gameManager = new GameManager();

  // Existing embeds logic from previous index.html code can be adapted if actually needed,
  // but requirements suggest we control the entry via Main Menu now. 
});

