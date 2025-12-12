if ('serviceWorker' in navigator) window.addEventListener('load', ()=>{
    navigator.serviceWorker.register(new URL('./service-worker.js', window.location.href));
});

//# sourceMappingURL=Maneuver-Core-Simulation.72be8890.js.map
