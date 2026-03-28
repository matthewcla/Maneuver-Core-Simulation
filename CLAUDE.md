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
- **dynamics.js** — `ShipDynamics` class: Nomoto steering model physics for DDG-51-class vessel. Exports independently. Handles heading, yaw rate, speed, and position integration
- **arena.js** — Monolithic (~2,700 lines) main engine containing:
  - `ScenarioGenerator` — Random encounter generation (starboard cross, head-on, overtake, constrained) and TSS level generation
  - `ContactController` — AI behavior for non-player tracks: threat detection via CPA, COLREGs-compliant maneuvering (head-on turns, give-way, overtaking speed reduction)
  - `Simulator` — Central orchestrator: 60fps game loop, canvas rendering (polar grid, range rings, tracks, CPA indicators, TSS boundaries), UI event handling, data panel updates, touch gestures (long-press drag, pinch zoom)

### Rendering

All rendering uses a single HTML5 Canvas with a polar coordinate system. Range rings at configurable scales (3, 6, 12, 24 NM). Zoom range 0.5x–4x. Responsive scaling via `scaleUI()` and CSS custom properties.

### Styling

- `css/global.css` — Design tokens as CSS custom properties (radar green `#44a828`, spacing, font sizes, UI scale)
- `css/beta.css` — Layout, component styles, media queries for mobile
- `components/` — 58 atomic UI component folders (buttons, icons, cards, controls), each with `index.html` + `style.css`

### Key Domain Concepts

- **CPA** (Closest Point of Approach) — Core collision metric: bearing, range, and time
- **Relative Motion** — Vector showing how a contact moves relative to ownship
- **COLREGs** — International collision avoidance rules governing contact AI behavior
- **TSS** — Traffic Separation Scheme with eastbound/westbound lanes and a separation zone
- **Ownship** — The user-controlled vessel; contacts/tracks are other vessels
