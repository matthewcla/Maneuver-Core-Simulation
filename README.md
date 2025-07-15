# Maneuver Simulator

## Overview
Maneuver is a browser-based simulator for learning radar and collision avoidance concepts.  
It displays a radar screen, lets you play/pause a simulated scenario, add or drop tracks, and show wind data or closest point of approach (CPA) information.

## Running Locally
1. Clone or download this repository.
2. Install dependencies with `npm install`. This installs Parcel for bundling.
3. Run `npm run build` to generate the `dist/` directory if needed.
4. Open `index.html` (or `dist/index.html` after building) in any modern desktop browser.

### Vercel Setup
If deploying on Vercel, either skip the build step when the `dist/` folder is
checked in, or ensure dependencies are installed so `npm run build` can run
successfully.

## Touch Gestures
- **Long‑press drag:** hold a pointer on the radar for about 400 ms and then move
  to pan the radar container.
- **Pinch zoom:** with two pointers on the radar, pinch in or out to change the
  zoom level. Zooming only affects the radar display.

## Safety Disclaimer
This software is **not** a certified navigational tool. It is meant purely for educational and entertainment purposes. Do **not** rely on it for real‑world navigation or collision avoidance. Always use official, approved navigational equipment in real situations.

## Contact
Questions or feedback? Email: `AheadFlank.ai@gmail.com`
