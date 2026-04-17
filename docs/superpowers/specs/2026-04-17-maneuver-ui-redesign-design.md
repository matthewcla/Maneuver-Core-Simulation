# Maneuver UI Redesign — "Instrument" Direction

**Status:** design approved · working prototype at `prototypes/redesign/`
**Date:** 2026-04-17

## Purpose

Redesign the Maneuver simulator UI to better serve its stated goal: *help sailors build mental models and instincts around relative motion through a ship's radar display.* The current UI buries the single signal that teaches collision geometry (bearing drift) in 12px body text, and boxes every metric in its own card. The redesign elevates threat awareness, consolidates data onto shared surfaces, and establishes a responsive foundation that works from a pocket phone up to a wardroom desktop.

The logo is preserved unchanged per user direction.

## Scope

**In scope:** visual direction, foundation tokens, responsive layout (desktop / tablet / mobile), information architecture of the telemetry panel, interaction model, and a working sandbox prototype with ported physics.

**Out of scope (deferred):** drill mode, coach mode, settings redesign, main-menu redesign, accessibility audit beyond focus styles, production migration of `js/arena.js`.

## Direction: "Instrument"

One of three directions presented (*Horizon*, *Studio*, *Instrument*). User chose *Instrument*: neutral near-black surface where typography does the work, one saturated accent reserved strictly for risk-relevant moments.

## Foundation

### Palette

| Token | Hex | Role |
|---|---|---|
| `ink` | `#0B0C0E` | Canvas / deepest background |
| `ink-2` | `#101218` | Telemetry panel surface |
| `steel` | `#151821` | Inline pill / chip backgrounds |
| `hull` | `#2A2E38` | Dividers and 1-px rules |
| `fog` | `#8A8E97` | Secondary text, inactive labels |
| `bone` | `#F2F0EA` | Primary text (warm off-white) |
| `bone-dim` | `#C9C7C1` | Tertiary / dim text |
| `flare` | `#FF6B2C` | **Sole accent** — risk only (CPA warning, selected-risk ring, CBDR state) |
| `radar-green` | `#75FB4C` | Ownship vector, outer range ring |
| `radar-green-dim` | `#4A9C2E` | Inner range rings and grid |

Orange is chosen for its physical-world lineage (life rings, hi-vis PPE, maritime dayshapes). Never used on chrome, buttons, or decorative surfaces.

### Typography

- Display / UI: **Inter** (500/600/700), fallback IBM Plex Sans.
- Body / labels: **IBM Plex Sans** 400/500.
- Telemetry readouts: **IBM Plex Mono** 500, `font-variant-numeric: tabular-nums`.
- Scale: 9 / 10 / 11 / 13 / 16 / 20 / 28 / 32 px.
- Labels: uppercase, 10–11 px, letter-spacing 0.14em, color `fog`.

### Spacing & Motion

- Spacing: 4 / 8 / 12 / 16 / 24 / 40 / 72 px.
- Motion: 140–200ms on `cubic-bezier(0.2, 0.8, 0.2, 1)`. Mechanical, not bouncy.

## Layout Architecture

CSS grid. Three breakpoints, one spatial logic. Radar is the hero at every size.

- **Desktop (≥1280):** two-row grid. Columns `64px rail · minmax(0,1fr) stage/transport · 340px panel`. Rail and panel span both rows; radar occupies the top row of the middle column; transport sits in the bottom row of the middle column.
- **Tablet (900–1279):** same grid, narrower columns: `56px rail · 1fr stage/transport · 320px panel`.
- **Mobile (≤900):** one-column, four-row grid in reading order: `topbar · stage (1fr) · panel (max 38dvh) · transport`. Transport is pinned to the viewport bottom for thumb reach; the panel becomes a horizontal scroll-snap deck of three cards (Track · Contacts · Ownship) and each card scrolls vertically internally. Transport bottom padding respects `env(safe-area-inset-bottom)` for iPhone home-indicator clearance.

Below 420 px, the speed chips collapse and the scrubber takes the full second row of the transport.

## Information Hierarchy

Anchored on one insight: **bearing drift is the single signal that teaches collision geometry.** Everything else is supporting evidence.

### Panel structure

1. **Track header** — tag + one-word state (`bearing steady` / `risk of collision` / `past CPA`). Color goes `flare` when risk.
2. **CBDR strip** — one row: state chip (`CBDR / STEADY / DRIFT L / DRIFT R / PAST`), 60-second bearing sparkline, and drift value (`0.2°/60s`). Whole strip goes `flare` when risk; `bone-dim` when steady but safe; `fog` when drifting normally.
3. **Hero row** — CPA distance (orange), TCPA, and a 56-px aspect dial with text readout (`Red 42°`). No card containers — raw typography.
4. **Data grid (4×2)** — Brg, Rng, Crs, Spd, Rel Dir, Rel Spd, Brg Rate, Tgt Ang. Course and Speed are click-to-edit.
5. **Contacts** — compact monospace rows sorted by TCPA ascending. Click a row or a contact dot on the radar to promote.
6. **Ownship** — single footer row, course and speed click-to-edit.

Sections are separated by 1-px horizontal rules, not borders.

### Radar

- Polar grid, range rings at 3/6/12/24 NM, 30° bearing spokes.
- Cardinals N/E/S/W; `N` in `bone`, others in `fog`.
- Ownship: filled chevron + green vector sized to speed.
- Contacts: history trails (10-sample), course vector with arrowhead, dashed CPA line + X marker on risk tracks, dashed selection ring on active track.
- Contact labels placed outboard of the dot.

## Physics Engine

Ported from `js/arena.js` into `prototypes/redesign/sim.js`:

- `solveCPA(own, tgt)` — identical formulation, returns `{tCPA, dCPA, xCPA, yCPA}` in world units.
- Bearing / range from differential position.
- Relative motion vector, speed, direction.
- Target angle (aspect): `(bearing + 180 - track.course) mod 360`.
- Bearing rate: `(dx·relVy − dy·relVx) / range²` in rad/hr, converted to °/min.
- Position integration via simple Euler: `pos += vel · dt`.

CBDR classification (risk): `dCPA < 1.0 NM AND 0 < tcpa < 15 min`.
Steady-bearing classification: `|bearingRate| < 0.2 °/min AND NOT hasPassed`.

Not ported (deferred):
- Nomoto steering dynamics (`js/dynamics.js`) — the sandbox uses instantaneous course change for now; for drill mode, Nomoto will matter.
- `ScenarioGenerator` — sandbox seeds one hand-tuned scenario at load.
- `ContactController` COLREGs AI — contacts hold course/speed until edited by the user.

## Interactions (all built and working)

- **Long-press to drop contact:** 450 ms hold on the radar → ghost appears at that bearing/range → drag to set course vector → release to commit with default speed of 10 kt.
- **Tap to select:** tap any contact dot on the radar, or click any row in the contacts list.
- **Edit ownship course/speed:** click the underlined values in the footer. Inline popover appears; Enter applies, Esc cancels.
- **Edit track course/speed:** click Crs or Spd in the data grid. Same popover.
- **Range cycle:** Range pill in top-right of radar cycles 3 → 6 → 12 → 24 NM.
- **Play / pause:** round button in transport bar.
- **Speed chips:** 1× 2× 4× 8× multiplier on sim time.
- **Clear contacts:** X button on rail (desktop) / topbar (mobile).
- **Scrubber:** currently visual-only (advances with sim time, 20-min window). True seek-back requires a history buffer and is deferred.

## What was removed as extraneous

- Modes nav (Sandbox / Drills / Coach disabled items) — rail is now just logo + clear button.
- Stage-head breadcrumb and meta strip.
- Layers button (no-op).
- Radar hint copy.
- Vessel class descriptor.
- Aspect-note text ("target's port bow toward us").
- `GIVE WAY` badge — replaced with color-coded track state text.
- Wind section (keeps sandbox focused on relative motion, not sailing).

## Prototype files

```
prototypes/redesign/
  index.html    structure
  styles.css    full foundation and responsive layout
  sim.js        physics engine and state store
  radar.js      canvas renderer (reads sim state)
  app.js        driver loop, panel rendering, interactions
```

Served locally with `python3 -m http.server 8765` at `http://localhost:8765/prototypes/redesign/`. `file://` does not work — browsers treat file URLs as unique origins, blocking cross-file coordination.

## Migration Plan (for production)

Four bounded steps, each a self-contained PR:

1. **Tokens** — replace `css/global.css` variables with the new palette and scale. Preserve `--radar-green` so `arena.js` keeps working.
2. **Chrome** — replace `index.html` layout and the chrome portion of `css/beta.css` with the new grid and components.
3. **Panel rewrite** — replace the five telemetry cards with the consolidated panel structure. Update `_updateData*` methods in `arena.js` to write to the new DOM IDs.
4. **Interactions** — add long-press-to-drop; move range/settings into the new overlay locations; replace rewind/FF with the scrubber (which will require a history buffer for true seek).

No physics changes required. The prototype's `sim.js` is a simplified subset of `arena.js` — production keeps the existing physics.

## Known Deviations from Paper Guide

Default to dark mode despite Paper's "default light" guidance. Radar displays are dark by tradition and necessity (night vision on the bridge). A future sunlight/outdoor palette is noted for daylight mobile use.

## Open Questions

- **Sunlight palette** — warm cream ground, inverted accent, preserved phosphor green. Needs design when mobile outdoor use is validated.
- **Aspect dial interaction** — currently read-only. Could become scrubbable ("what if target were Green 30° instead?").
- **Bearing sparkline resolution** — fixed 60s window now; production should expose 30s / 60s / 3min.
- **Scrubber history buffer** — deferred; needed for true seek-back.
- **Haptics** — long-press-to-drop and contact-selection are natural haptic moments on mobile.

## Acceptance

- ✅ Foundation (palette, type, spacing, motion) approved.
- ✅ Layout architecture (3 breakpoints) approved.
- ✅ Information hierarchy and interaction changes approved.
- ✅ Prototype renders at all three breakpoints; transport stays visible; radar remains hero.
- ✅ Physics engine ported and tied to the panel + radar.
- ✅ Long-press, inline edits, play/pause, speed, range, and contact selection all working against the live simulation.
- Spec reviewed by user (pending).
