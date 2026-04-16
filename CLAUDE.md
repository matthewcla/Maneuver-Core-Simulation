# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
npm install          # Install Parcel bundler
npm start            # Dev server at http://localhost:1234 with hot reload
npm run build        # Production build to ./dist/
```

No test framework or linter is configured.

## Architecture

Maneuver is a browser-based radar and collision avoidance simulator built with vanilla JavaScript (no frameworks), HTML5 Canvas, and CSS. It's bundled with Parcel and deployed as a static site on Vercel. It also functions as a PWA with service worker caching.

### Application Mode

- **Simulator** — Free-form radar simulation where users add/drop tracks, edit courses/speeds, and observe CPA/relative motion data

`GameManager` in `js/main.js` initialises the `Simulator` class in `js/arena.js`. The URL param `?mode=simulator` auto-starts the simulator.

### Core Modules (`js/`)

- **main.js** — `GameManager` class: app entry point, mode routing, service worker registration
- **arena.js** — Monolithic (~2,100 lines) main engine containing:
  - `ScenarioGenerator` — Random encounter generation (starboard cross, head-on, overtake, constrained)
  - `ContactController` — AI behavior for non-player tracks: threat detection via CPA, COLREGs-compliant maneuvering (head-on turns, give-way, overtaking speed reduction)
  - `Simulator` — Central orchestrator: 60fps game loop, canvas rendering (polar grid, range rings, tracks, CPA indicators), UI event handling, data panel updates, single-touch pointer wrappers

Note: `js/dynamics.js` (`ShipDynamics`, Nomoto steering model) exists in the repo but is not loaded by `index.html` and is unreferenced at runtime.

### Rendering

All rendering uses a single HTML5 Canvas with a polar coordinate system. Range rings at configurable scales (3, 6, 12, 24 NM). UI scale clamped to 0.7x–1.5x in `scaleUI()` and `setZoom()`. Responsive scaling via CSS custom properties.

### Styling

- `css/global.css` — Design tokens as CSS custom properties (radar green `#44a828`, spacing, font sizes, UI scale)
- `css/beta.css` — Layout, component styles, media queries for mobile
- `components/` — ~31 atomic UI component folders across 6 categories (buttons, cards, controls, icons, menus, metrics), each with `index.html` + `style.css`

### Key Domain Concepts

- **CPA** (Closest Point of Approach) — Core collision metric: bearing, range, and time
- **Relative Motion** — Vector showing how a contact moves relative to ownship
- **COLREGs** — International collision avoidance rules governing contact AI behavior
- **Ownship** — The user-controlled vessel; contacts/tracks are other vessels
