// Register service worker if available
if ('serviceWorker' in navigator) window.addEventListener('load', ()=>{
    navigator.serviceWorker.register(new URL('./service-worker.js', window.location.href));
});
/**
 * @class GameManager
 * Handles high-level application state and mode selection.
 */ class GameManager {
    constructor(){
        this.menuOverlay = document.getElementById('main-menu');
        this.btnSimulator = document.getElementById('btn-simulator');
        this.btnGapRunner = document.getElementById('btn-gap-runner');
        // Bind methods
        this.startSimulatorMode = this.startSimulatorMode.bind(this);
        this.startGapRunner = this.startGapRunner.bind(this);
        this._attachListeners();
        this._checkURLParams();
    }
    _attachListeners() {
        this.btnSimulator?.addEventListener('click', this.startSimulatorMode);
        this.btnGapRunner?.addEventListener('click', this.startGapRunner);
    }
    /**
   * Checks for ?mode=X URL parameter to auto-start.
   */ _checkURLParams() {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode === 'simulator') this.startSimulatorMode();
        else if (mode === 'gap_runner') this.startGapRunner();
    }
    hideMenu() {
        this.menuOverlay.classList.add('hidden');
    // Optional: remove from DOM sequence or visibility:hidden to avoid tab focus
    }
    showMenu() {
        this.menuOverlay.classList.remove('hidden');
    }
    startSimulatorMode() {
        this.hideMenu();
        this.initSimulator({
            mode: 'simulator'
        });
    }
    startGapRunner() {
        this.hideMenu();
        this.initSimulator({
            mode: 'gap_runner'
        });
    }
    initSimulator(config) {
        if (window.sim) window.sim.destroy();
        // wait for font loading if likely needed, or just start
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>{
            window.sim = new Simulator(config);
        });
        else window.sim = new Simulator(config);
    }
}
// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', ()=>{
    // If embedded or waiting for specific scripts (like existing logic checked window.TypeForm),
    // adapt here. For this refactor, we assume direct control.
    window.gameManager = new GameManager();
// Existing embeds logic from previous index.html code can be adapted if actually needed,
// but requirements suggest we control the entry via Main Menu now. 
});

//# sourceMappingURL=Maneuver-Core-Simulation.72be8890.js.map
