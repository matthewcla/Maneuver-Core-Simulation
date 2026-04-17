# Remove Gap Runner Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Gap Runner game mode code, leaving only the Simulator mode.

**Architecture:** Gap Runner is woven through 4 source files (`js/main.js`, `js/arena.js`, `index.html`, `css/beta.css`). The removal touches: mode selection UI, HUD/overlay HTML, CSS styling, GameManager routing, Simulator constructor state, initialization branching, the `generateTSS()` method, game loop integration, scoring/penalty/level/damage methods, commit button logic, TSS rendering, and the `btnScen` click handler's gap_runner branch. After removal, the app should auto-start in Simulator mode with no menu screen, or keep the menu with only the Simulator button.

**Tech Stack:** Vanilla JavaScript, HTML5, CSS3, Parcel bundler

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `js/main.js` | Remove `startGapRunner`, `btnGapRunner`, and `gap_runner` URL param handling |
| Modify | `js/arena.js` | Remove Gap Runner state, `loadGapRunnerScenario`, `checkGapRunnerStatus`, `completeLevel`, `gameOver`, `applyPenalty`, `flashDamage`, `updateGapRunnerHUD`, `triggerDamageOverlay`, `startCommit`, `stopCommit`, `generateTSS`, `drawTSS`, `drawWaypoint`, TSS rendering block, and all `gap_runner` mode conditionals |
| Modify | `index.html` | Remove Gap Runner button, HUD div, damage overlay, level overlay, game-over overlay |
| Modify | `css/beta.css` | Remove `.hud`, `.damage-overlay`, `.level-overlay`, `.gap-runner-active` rules |
| Modify | `CLAUDE.md` | Remove Gap Runner references from architecture docs |

---

### Task 1: Create feature branch

- [ ] **Step 1: Create and switch to a new branch**

```bash
git checkout -b remove-gap-runner
```

- [ ] **Step 2: Verify branch**

```bash
git branch --show-current
```

Expected: `remove-gap-runner`

---

### Task 2: Remove Gap Runner HTML elements from `index.html`

**Files:**
- Modify: `index.html:307` (Gap Runner button)
- Modify: `index.html:312-318` (HUD + damage overlay)
- Modify: `index.html:320-335` (level overlay + game-over overlay)

- [ ] **Step 1: Remove the Gap Runner menu button**

In `index.html`, remove this line:

```html
        <button id="btn-gap-runner" class="menu-button">Gap Runner</button>
```

- [ ] **Step 2: Remove the Gap Runner HUD div**

Remove this block (lines 312-316):

```html
  <div id="gap-runner-hud" class="hud hidden">
    <div class="hud-row"><span class="hud-label">Level: </span><span id="hud-level">1</span></div>
    <div class="hud-row"><span class="hud-label">Score: </span><span id="hud-score">0</span></div>
    <div class="hud-row"><span class="hud-label">Time: </span><span id="hud-time">00:00</span></div>
  </div>
```

- [ ] **Step 3: Remove the damage overlay**

Remove this line (318):

```html
  <div id="damage-overlay" class="damage-overlay hidden"></div>
```

- [ ] **Step 4: Remove the level-complete overlay**

Remove this block (lines 320-325):

```html
  <div id="level-overlay" class="level-overlay hidden">
    <div class="menu-content">
      <h1 class="menu-title">Level Complete</h1>
      <div id="level-message" style="color: var(--primary-500); font-family: 'IBM Plex Mono'; font-size: 1.5rem;"></div>
    </div>
  </div>
```

- [ ] **Step 5: Remove the game-over overlay**

Remove this block (lines 327-335):

```html
  <div id="game-over-overlay" class="level-overlay hidden">
    <div class="menu-content">
      <h1 class="menu-title" style="color: var(--radar-dark-orange);">Game Over</h1>
      <div id="game-over-message"
        style="color: white; font-family: 'IBM Plex Mono'; font-size: 1.5rem; margin-bottom: 2rem;">Collision Detected
      </div>
      <button id="btn-restart" class="menu-button">Return to Menu</button>
    </div>
  </div>
```

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: remove Gap Runner HTML elements (button, HUD, overlays)"
```

---

### Task 3: Remove Gap Runner CSS from `css/beta.css`

**Files:**
- Modify: `css/beta.css:920-921` (level-overlay hidden rule — shared with main-menu)
- Modify: `css/beta.css:926-939` (level-overlay base rule)
- Modify: `css/beta.css:997-1063` (HUD, damage-overlay, gap-runner-active styles)
- Modify: `css/beta.css:1083-1243` (mobile portrait + landscape gap-runner-active overrides)

- [ ] **Step 1: Remove `.level-overlay.hidden` from the shared hidden rule**

The rule at line 920 is:

```css
.main-menu.hidden,
.level-overlay.hidden {
```

Change it to just:

```css
.main-menu.hidden {
```

- [ ] **Step 2: Remove the `.level-overlay` base rule**

Remove lines 926-939:

```css
.level-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  /* Slightly transparent */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}
```

- [ ] **Step 3: Remove the Gap Runner HUD & Overlay CSS block**

Remove everything from the `/* --- Gap Runner HUD & Overlay --- */` comment (line 997) through the `.gap-runner-active #future, .gap-runner-active #past` rule (line 1063). This includes:
- `.hud` styles (lines 997-1018)
- `.hud-row` (lines 1020-1024)
- `.damage-overlay` and variants (lines 1026-1045)
- Mobile gap-runner tweaks (lines 1047-1057)
- `.gap-runner-active #future, .gap-runner-active #past` (lines 1059-1063)

- [ ] **Step 4: Remove all mobile portrait `gap-runner-active` rules**

Remove lines 1083-1158 (all `body.mobile-portrait.gap-runner-active` selectors).

- [ ] **Step 5: Remove all mobile landscape `gap-runner-active` rules**

Remove lines 1173-1243 (all `body.mobile-landscape.gap-runner-active` selectors).

- [ ] **Step 6: Commit**

```bash
git add css/beta.css
git commit -m "feat: remove Gap Runner CSS (HUD, overlays, mobile overrides)"
```

---

### Task 4: Remove Gap Runner from `js/main.js`

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Remove Gap Runner references from GameManager**

Replace the entire `GameManager` class with this cleaned version that removes `btnGapRunner`, `startGapRunner`, and the `gap_runner` URL param branch:

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add js/main.js
git commit -m "feat: remove Gap Runner from GameManager"
```

---

### Task 5: Remove Gap Runner from `js/arena.js` — Constructor & State

**Files:**
- Modify: `js/arena.js:349-369` (Gap Runner overlay refs + state in constructor block 1)
- Modify: `js/arena.js:426-459` (Gap Runner state block 2 + hudElements)

- [ ] **Step 1: Remove Gap Runner overlay DOM refs (lines 349-373)**

Remove this block from the constructor:

```javascript
        // --- Gap Runner Overlays ---
        this.levelOverlay = document.getElementById('level-overlay');
        this.levelMessage = document.getElementById('level-message');
        this.gameOverOverlay = document.getElementById('game-over-overlay');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.btnRestart = document.getElementById('btn-restart');

        // Gap Runner State
        this.gapRunnerScore = 0;
        this.currentLevelScore = 0;
        this.levelStartTime = 0;
        this.penaltyRegistry = new Set();

        // Gap Runner DOM Container (Consolidated)
        this.hudElements = {
            container: document.getElementById('gap-runner-hud'),
            level: document.getElementById('hud-level'),
            score: document.getElementById('hud-score'),
            time: document.getElementById('hud-time'),
            damageOverlay: document.getElementById('damage-overlay')
        };

        this.btnRestart?.addEventListener('click', () => {
            location.reload();
        });
```

- [ ] **Step 2: Remove Gap Runner state block 2 (lines 426-459)**

Remove this block (everything between `orderedVectorEndpoint` closing brace and `this.tracks = [`):

```javascript
        // --- Gap Runner State ---
        this.gapRunnerScore = 0;
        // Initialize Score for this level
        this.currentLevelScore = 5000;
        this.penaltyRegistry = new Set();
        this.perfectGapRegistry = new Set();

        // Combo / "Clean Wake" Tracking
        this.isCommitting = false;
        this.laneChangeCount = 0;
        this.lanesCrossed = 0;
        // Determine initial lane index (based on y position approx)
        // Lanes are approx 3nm wide zones?
        // Let's define zones:
        // Zone 0: South Start (y < -4)
        // Zone 1: Westbound Lane (y: -4 to -1)
        // Zone 2: Separation (y: -1 to 1)
        // Zone 3: Eastbound Lane (y: 1 to 4)
        // Zone 4: North Goal (y > 4)
        this.lastLaneIndex = 0; // Start at South
        this.lastOrderedCourse = this.ownShip.orderedCourse;

        // UI Setup
        this.btnPast.classList.add('hidden');
        this.btnFuture.classList.add('hidden');
        if (this.btnCommit) this.btnCommit.classList.add('hidden');

        this.hudElements = {
            container: document.getElementById('gap-runner-hud'),
            level: document.getElementById('hud-level'),
            score: document.getElementById('hud-score'),
            time: document.getElementById('hud-time'),
            damageOverlay: document.getElementById('damage-overlay')
        };
```

- [ ] **Step 3: Commit**

```bash
git add js/arena.js
git commit -m "feat: remove Gap Runner state and DOM refs from Simulator constructor"
```

---

### Task 6: Remove Gap Runner from `js/arena.js` — Initialization & Scenario Loading

**Files:**
- Modify: `js/arena.js:537-540` (`_initialize` gap_runner branch)
- Modify: `js/arena.js:582-635` (`loadGapRunnerScenario` method)

- [ ] **Step 1: Simplify `_initialize` method**

Replace the mode conditional:

```javascript
        if (this.config.mode === 'gap_runner') {
            this.loadGapRunnerScenario(1);
        } else {
            document.body.classList.remove('gap-runner-active');
            this.addTrack();
            this.addTrack();
        }
```

With just the simulator initialization:

```javascript
        this.addTrack();
        this.addTrack();
```

- [ ] **Step 2: Remove the entire `loadGapRunnerScenario` method**

Remove the method from `loadGapRunnerScenario(level = 1) {` through its closing `}` (lines 582-635).

- [ ] **Step 3: Commit**

```bash
git add js/arena.js
git commit -m "feat: remove loadGapRunnerScenario and gap_runner init branch"
```

---

### Task 7: Remove Gap Runner from `js/arena.js` — Event Handlers

**Files:**
- Modify: `js/arena.js:751-763` (`btnScen` click handler gap_runner branch)
- Modify: `js/arena.js:929-931` (`destroy` method gap-runner cleanup)

- [ ] **Step 1: Simplify `btnScen` click handler**

Replace the entire `btnScen` event listener:

```javascript
        this.btnScen?.addEventListener('click', () => {
            if (this.config.mode === 'gap_runner') {
                // GAP RUNNER: Restart from Level 1
                this.loadGapRunnerScenario(1);

                // Ensure simulation resumes if it was paused or game over
                if (!this.isSimulationRunning) {
                    this.isSimulationRunning = true;
                    this.btnPlayPause.classList.remove('pause');
                    this.startGameLoop();
                    // Update speed indicator to normal 1x just in case
                    this.simulationSpeed = 1;
                    this.updateSpeedIndicator();
                }
            } else {
                // SIMULATOR: Generate new scenario (preserve current config)
                const currentConfig = this.config;
                window.sim.destroy();
                window.sim = new Simulator(currentConfig);
            }
        });
```

With just the simulator branch:

```javascript
        this.btnScen?.addEventListener('click', () => {
            const currentConfig = this.config;
            window.sim.destroy();
            window.sim = new Simulator(currentConfig);
        });
```

- [ ] **Step 2: Remove gap-runner cleanup from `destroy()` method**

Remove these lines from the `destroy()` method:

```javascript
        // Cleanup UI
        document.body.classList.remove('gap-runner-active');
        this.hudElements?.container?.classList.add('hidden');
        this.hudElements?.damageOverlay?.classList.remove('active');
```

- [ ] **Step 3: Commit**

```bash
git add js/arena.js
git commit -m "feat: remove Gap Runner from event handlers and destroy method"
```

---

### Task 8: Remove Gap Runner from `js/arena.js` — Game Logic Methods

**Files:**
- Modify: `js/arena.js:1201-1477` (all Gap Runner game logic methods)
- Modify: `js/arena.js:1257-1260` (`updatePhysics` gap_runner branch)

- [ ] **Step 1: Remove gap_runner check from `updatePhysics`**

Remove this block from `updatePhysics`:

```javascript
        if (this.config.mode === 'gap_runner') {
            this.checkGapRunnerStatus(deltaTime);
            if (!this.isSimulationRunning) return;
        }
```

- [ ] **Step 2: Remove `startCommit` method**

Remove the entire method (lines 1233-1240):

```javascript
    startCommit() {
        if (this.config.mode !== 'gap_runner') return;
        if (!this.isSimulationRunning) this.togglePlayPause();
        this.simulationSpeed = 50;
        this.isCommitting = true;
        this.updateButtonStyles();
        this.markSceneDirty();
    }
```

- [ ] **Step 3: Remove `stopCommit` method**

Remove the entire method (lines 1245-1251):

```javascript
    stopCommit() {
        if (this.config.mode !== 'gap_runner') return;
        this.simulationSpeed = 1;
        this.isCommitting = false;
        this.updateButtonStyles();
        this.markSceneDirty();
    }
```

- [ ] **Step 4: Remove the first `updateGapRunnerHUD` method (lines 1201-1213)**

```javascript
    updateGapRunnerHUD() {
        if (!this.hudElements.score) return;

        // Total Score = Banked Score + Current Level Projected Score
        const total = Math.floor(this.gapRunnerScore + this.currentLevelScore);
        this.hudElements.score.textContent = total.toLocaleString();

        const now = performance.now();
        const elapsed = Math.floor((now - this.levelStartTime) / 1000);
        const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const ss = (elapsed % 60).toString().padStart(2, '0');
        this.hudElements.time.textContent = `${mm}:${ss}`;
    }
```

- [ ] **Step 5: Remove `triggerDamageOverlay` method (lines 1215-1228)**

```javascript
    triggerDamageOverlay() {
        const ov = this.hudElements.damageOverlay;
        if (!ov) return;
        ov.classList.remove('hidden');
        // Force reflow
        void ov.offsetWidth;
        ov.classList.add('active');

        // Remove after short flash
        setTimeout(() => {
            ov.classList.remove('active');
            setTimeout(() => ov.classList.add('hidden'), 300); // Wait for transition
        }, 500);
    }
```

- [ ] **Step 6: Remove `checkGapRunnerStatus` method (lines 1297-1408)**

Remove the entire method from `checkGapRunnerStatus(deltaTime) {` through its closing `}`.

- [ ] **Step 7: Remove `applyPenalty` method (lines 1410-1414)**

```javascript
    applyPenalty(trackId, amount) {
        this.penaltyRegistry.add(trackId);
        this.currentLevelScore = Math.max(0, this.currentLevelScore - amount);
        this.flashDamage();
        this.updateGapRunnerHUD();
    }
```

- [ ] **Step 8: Remove `flashDamage` method (lines 1417-1430)**

```javascript
    flashDamage() {
        if (!this.hudElements.damageOverlay) return;
        this.hudElements.damageOverlay.classList.remove('hidden');
        // Trigger reflow
        void this.hudElements.damageOverlay.offsetWidth;
        this.hudElements.damageOverlay.classList.add('active');

        setTimeout(() => {
            this.hudElements.damageOverlay.classList.remove('active');
            setTimeout(() => {
                this.hudElements.damageOverlay.classList.add('hidden');
            }, 300); // Wait for transition
        }, 300); // 300ms flash
    }
```

- [ ] **Step 9: Remove second `updateGapRunnerHUD` method (lines 1432-1443)**

```javascript
    updateGapRunnerHUD() {
        if (!this.hudElements.score) return;

        // Total Score = Banked Score + Current Level Projected Score
        const total = Math.floor(this.gapRunnerScore + this.currentLevelScore);
        this.hudElements.score.textContent = total.toLocaleString();

        const now = performance.now();
        const elapsed = Math.floor((now - this.levelStartTime) / 1000);
        const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const ss = (elapsed % 60).toString().padStart(2, '0');
        this.hudElements.time.textContent = `${mm}:${ss}`;
    }
```

- [ ] **Step 10: Remove `completeLevel` method (lines 1446-1468)**

```javascript
    completeLevel() {
        this.isSimulationRunning = false;

        // Calculate "Clean Wake" Bonus
        let multiplier = 1;
        if (this.laneChangeCount <= 2) {
            multiplier = 1.5;
            this.currentLevelScore = Math.floor(this.currentLevelScore * multiplier);
        }

        this.gameManager.showLevelOverlay(`Level ${this.currentLevel} Complete!\nScore: ${this.currentLevelScore}\n(Multiplier: x${multiplier})`);

        // Add to total gap runner score
        this.gapRunnerScore += this.currentLevelScore;

        // Increase level
        this.currentLevel++;
        setTimeout(() => {
            document.getElementById('level-overlay').classList.add('hidden');
            this.loadGapRunnerScenario(this.currentLevel);
            this.isSimulationRunning = true; // Wait for scenario load roughly? Or strict timing
        }, 3000);
    }
```

- [ ] **Step 11: Remove `gameOver` method (lines 1470-1476)**

```javascript
    gameOver() {
        this.isSimulationRunning = false;
        // this.gapRunnerActive = false; // Keep active so we don't return to sim mode, just stuck in game over
        if (this.gameOverOverlay) {
            this.gameOverOverlay.classList.remove('hidden');
        }
    }
```

- [ ] **Step 12: Commit**

```bash
git add js/arena.js
git commit -m "feat: remove Gap Runner game logic methods from Simulator"
```

---

### Task 9: Remove Gap Runner from `js/arena.js` — TSS Rendering & ScenarioGenerator

**Files:**
- Modify: `js/arena.js:150-228` (`generateTSS` method in ScenarioGenerator)
- Modify: `js/arena.js:230-235` (`_spawnSimple` helper — keep only if used by `makeScenario`)
- Modify: `js/arena.js:1596-1602` (TSS rendering block in `drawRadar`)
- Modify: `js/arena.js:1640-1679` (`drawTSS` and `drawWaypoint` methods)

- [ ] **Step 1: Remove the `generateTSS` method from ScenarioGenerator**

Remove the entire `generateTSS(level)` method (lines 150-228).

- [ ] **Step 2: Check if `_spawnSimple` is used outside `generateTSS`**

Search for `_spawnSimple` in arena.js. If it is only used by `generateTSS`, remove it too (lines 230-235).

- [ ] **Step 3: Remove TSS rendering block from `drawRadar`**

Remove this block:

```javascript
        // --- TSS Rendering ---
        if (this.tssData) {
            this.drawTSS(center, radius);
            if (this.tssData.waypoint) {
                this.drawWaypoint(center, radius);
            }
        }
```

- [ ] **Step 4: Remove `drawTSS` method (lines 1640-1662)**

Remove the entire method.

- [ ] **Step 5: Remove `drawWaypoint` method (lines 1665-1679+)**

Remove the entire method.

- [ ] **Step 6: Commit**

```bash
git add js/arena.js
git commit -m "feat: remove generateTSS, drawTSS, drawWaypoint from arena.js"
```

---

### Task 10: Remove commit button Gap Runner logic from `js/arena.js`

**Files:**
- Modify: `js/arena.js:728-746` (commit button event listeners)

- [ ] **Step 1: Remove commit button event listeners**

The commit button (`btnCommit`) with its `startCommit`/`stopCommit` handlers is Gap Runner-only. Remove the entire block that sets up the commit button listeners (the `if (this.btnCommit)` block with `mousedown`, `touchstart`, `mouseup`, `touchend`, `mouseleave` handlers).

- [ ] **Step 2: Remove `btnCommit` DOM reference**

Find and remove `this.btnCommit = document.getElementById('commit-btn');` from the constructor.

- [ ] **Step 3: Commit**

```bash
git add js/arena.js
git commit -m "feat: remove commit button Gap Runner logic"
```

---

### Task 11: Clean up remaining Gap Runner references

- [ ] **Step 1: Search for any remaining gap runner references**

```bash
grep -rn -i "gap.runner\|gap_runner\|gapRunner\|GapRunner\|tssData\|gapRunnerScore\|gapRunnerActive\|gapRunnerLevel\|currentLevelScore\|penaltyRegistry\|perfectGapRegistry\|laneChangeCount\|lanesCrossed\|lastLaneIndex\|hudElements\|levelOverlay\|gameOverOverlay\|btnRestart\|isCommitting\|damage-overlay\|level-overlay\|game-over" js/ css/ index.html CLAUDE.md
```

Fix any remaining references found.

- [ ] **Step 2: Update CLAUDE.md**

Remove references to Gap Runner mode. Update the "Two Application Modes" section to reflect that the app is now Simulator-only. Remove the Gap Runner bullet point and simplify the mode description.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: clean up remaining Gap Runner references"
```

---

### Task 12: Verify the app runs correctly

- [ ] **Step 1: Start the dev server**

```bash
npm start
```

- [ ] **Step 2: Open http://localhost:1234 in a browser and verify:**

- Main menu shows only "Simulator" button (no "Gap Runner")
- Clicking Simulator launches the radar simulation normally
- No console errors related to missing Gap Runner elements
- Regenerate button works (creates new scenario)
- Play/pause, fast-forward, rewind all work
- Track selection and data panels work

- [ ] **Step 3: Search for any remaining dead code**

```bash
grep -rn "gap\|hud\|damage\|gameOver\|levelOver\|tss\|waypoint\|commit" js/arena.js | grep -iv "comment\|committed"
```

Review output and remove any orphaned references.

- [ ] **Step 4: Final commit if needed**

```bash
git add -A
git commit -m "fix: clean up any remaining dead Gap Runner code"
```
