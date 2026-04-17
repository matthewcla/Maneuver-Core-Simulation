/* =========================================================
   Radar renderer
   Reads from Maneuver.Sim state; draws polar grid, ownship,
   contacts, CPA indicators, and a "ghost" contact while the
   user is dropping one via long-press + drag.
   ========================================================= */

(function () {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = () => window.devicePixelRatio || 1;

  const state = {
    rangeNm: 12,
    sim: null,
    ghost: null,   // { bearing, range, course, speed } while dropping
    dim: 0,
    cx: 0, cy: 0, R: 0,
  };

  // --- Geometry helpers ---------------------------------------
  function bearingToXY(cx, cy, rPx, brg) {
    const a = (brg - 90) * Math.PI / 180;   // canvas: 0° = east, we want 0 = N
    return { x: cx + rPx * Math.cos(a), y: cy + rPx * Math.sin(a) };
  }
  // World (dx, dy) relative to ownship → canvas coords. +y world = north = canvas up.
  function worldToCanvas(dx, dy) {
    const nmToPx = state.R / state.rangeNm;
    return { x: state.cx + dx * nmToPx, y: state.cy - dy * nmToPx };
  }
  // Canvas coords → world bearing and range relative to ownship
  function canvasToPolar(px, py) {
    const dx = (px - state.cx);
    const dy = (state.cy - py);
    const nmToPx = state.R / state.rangeNm;
    const xNm = dx / nmToPx;
    const yNm = dy / nmToPx;
    const brg = ((Math.atan2(xNm, yNm) * 180) / Math.PI + 360) % 360;
    const rng = Math.hypot(xNm, yNm);
    return { bearing: brg, range: rng, xNm, yNm };
  }

  // --- Canvas fitting -----------------------------------------
  function fitDPR() {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dim = Math.max(200, Math.floor(Math.min(rect.width, rect.height)));
    canvas.width = Math.round(dim * dpr());
    canvas.height = Math.round(dim * dpr());
    canvas.style.width = dim + 'px';
    canvas.style.height = dim + 'px';
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0);
    state.dim = dim;
    state.cx = dim / 2;
    state.cy = dim / 2;
    state.R = dim / 2 - 18;
    return dim;
  }

  // --- Drawing primitives -------------------------------------
  function drawGrid() {
    const { cx, cy, R } = state;
    const RINGS = 4;

    // Faint sweep
    const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    grad.addColorStop(0, 'rgba(117,251,76,0.04)');
    grad.addColorStop(1, 'rgba(117,251,76,0.00)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    // Range rings
    ctx.lineWidth = 1;
    for (let i = 1; i <= RINGS; i++) {
      const r = (R / RINGS) * i;
      ctx.strokeStyle = i === RINGS ? 'rgba(117,251,76,0.3)' : 'rgba(74,156,46,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bearing spokes every 30°
    ctx.strokeStyle = 'rgba(42,46,56,0.85)';
    for (let b = 0; b < 360; b += 30) {
      const a = (b - 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.stroke();
    }

    // Cardinal labels
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [t, b] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
      const p = bearingToXY(cx, cy, R + 10, b);
      ctx.fillStyle = b === 0 ? '#F2F0EA' : '#8A8E97';
      ctx.fillText(t, p.x, p.y);
    }

    // Range labels on 045 arc
    ctx.fillStyle = '#61656E';
    ctx.textAlign = 'left';
    for (let i = 1; i <= RINGS; i++) {
      const r = (R / RINGS) * i;
      const v = (state.rangeNm / RINGS) * i;
      const p = bearingToXY(cx, cy, r, 45);
      ctx.fillText(v.toFixed(v < 10 ? 1 : 0), p.x + 4, p.y - 4);
    }
  }

  function drawOwnship() {
    const { cx, cy, R } = state;
    const sim = state.sim;
    if (!sim) return;

    const vecLen = Math.min(R * 0.25, (sim.own.speed / 35) * R * 0.45);
    const tip = bearingToXY(cx, cy, vecLen, sim.own.course);

    ctx.strokeStyle = '#75FB4C';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((sim.own.course) * Math.PI / 180);
    ctx.fillStyle = '#F2F0EA';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(242,240,234,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawContact(c) {
    const sim = state.sim;
    const d = c.derived;
    if (!d) return;

    // Cull contacts beyond 1.2× range (still drawn faded)
    const outside = d.range > state.rangeNm;

    const dx = c.x - sim.own.x;
    const dy = c.y - sim.own.y;
    const p = worldToCanvas(dx, dy);

    // Trail (world-space history dots)
    for (let i = 0; i < c.trail.length; i++) {
      const t = c.trail[i];
      const tp = worldToCanvas(t.x - sim.own.x, t.y - sim.own.y);
      const age = c.trail.length - i;
      ctx.fillStyle = `rgba(138,142,151,${0.25 - age * 0.02})`;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Course vector (6-minute projection)
    const vecNm = (c.speed / 60) * 6;
    const tipWorld = {
      x: (c.x - sim.own.x) + Math.sin(c.course * Math.PI / 180) * vecNm,
      y: (c.y - sim.own.y) + Math.cos(c.course * Math.PI / 180) * vecNm,
    };
    const tipCanvas = worldToCanvas(tipWorld.x, tipWorld.y);

    ctx.strokeStyle = d.isRisk ? '#FF6B2C' : 'rgba(242,240,234,0.55)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tipCanvas.x, tipCanvas.y);
    ctx.stroke();

    // Arrowhead
    ctx.save();
    ctx.translate(tipCanvas.x, tipCanvas.y);
    ctx.rotate((c.course) * Math.PI / 180);
    ctx.fillStyle = d.isRisk ? '#FF6B2C' : 'rgba(242,240,234,0.7)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 6);
    ctx.lineTo(-4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // CPA dashed line + X marker (risk or active only)
    const isActive = c.id === sim.activeId;
    if ((d.isRisk || isActive) && !d.hasPassed) {
      const tcpaH = d.tcpaSec / 3600;
      const relVx = c.vx - sim.own.vx;
      const relVy = c.vy - sim.own.vy;
      const cpaWorldX = (c.x - sim.own.x) + relVx * tcpaH;
      const cpaWorldY = (c.y - sim.own.y) + relVy * tcpaH;
      const cpaCanvas = worldToCanvas(cpaWorldX, cpaWorldY);

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = d.isRisk ? 'rgba(255,107,44,0.65)' : 'rgba(242,240,234,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(cpaCanvas.x, cpaCanvas.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = d.isRisk ? '#FF6B2C' : '#F2F0EA';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cpaCanvas.x - 4, cpaCanvas.y - 4);
      ctx.lineTo(cpaCanvas.x + 4, cpaCanvas.y + 4);
      ctx.moveTo(cpaCanvas.x + 4, cpaCanvas.y - 4);
      ctx.lineTo(cpaCanvas.x - 4, cpaCanvas.y + 4);
      ctx.stroke();
    }

    // Selection ring
    if (isActive) {
      ctx.strokeStyle = d.isRisk ? '#FF6B2C' : '#F2F0EA';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Contact dot
    ctx.globalAlpha = outside ? 0.45 : 1;
    ctx.fillStyle = d.isRisk ? '#FF6B2C' : '#F2F0EA';
    ctx.beginPath();
    ctx.arc(p.x, p.y, d.isRisk ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = isActive ? '#F2F0EA' : '#C9C7C1';
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const dxLbl = p.x - state.cx;
    const dyLbl = p.y - state.cy;
    const mag = Math.hypot(dxLbl, dyLbl) || 1;
    const lx = p.x + (dxLbl / mag) * 12;
    const ly = p.y + (dyLbl / mag) * 12;
    ctx.fillText(c.id, lx, ly);
  }

  function drawGhost() {
    if (!state.ghost) return;
    const g = state.ghost;
    const { cx, cy, R } = state;
    const nmToPx = R / state.rangeNm;

    const bx = cx + Math.sin(g.bearing * Math.PI / 180) * (g.range * nmToPx);
    const by = cy - Math.cos(g.bearing * Math.PI / 180) * (g.range * nmToPx);

    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#F2F0EA';
    ctx.beginPath();
    ctx.arc(bx, by, 4, 0, Math.PI * 2);
    ctx.fill();
    if (g.course !== null) {
      const vecNm = (g.speed || 10) / 60 * 6;
      const vx = Math.sin(g.course * Math.PI / 180) * vecNm * nmToPx;
      const vy = -Math.cos(g.course * Math.PI / 180) * vecNm * nmToPx;
      ctx.strokeStyle = '#F2F0EA';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + vx, by + vy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // --- Hit-test (for tap-to-select) ---------------------------
  function hitTestContact(px, py) {
    const sim = state.sim;
    if (!sim) return null;
    for (const c of sim.contacts) {
      const dx = c.x - sim.own.x;
      const dy = c.y - sim.own.y;
      const p = worldToCanvas(dx, dy);
      if (Math.hypot(p.x - px, p.y - py) <= 14) return c;
    }
    return null;
  }

  // --- Main draw ----------------------------------------------
  function draw() {
    fitDPR();
    ctx.clearRect(0, 0, state.dim, state.dim);
    drawGrid();
    const sim = state.sim;
    if (sim) {
      // Non-risk first so risk renders on top
      const ordered = [...sim.contacts].sort(
        (a, b) => Number(!!(a.derived?.isRisk)) - Number(!!(b.derived?.isRisk))
      );
      for (const c of ordered) drawContact(c);
    }
    drawOwnship();
    drawGhost();
  }

  // --- Public API ---------------------------------------------
  window.RadarView = {
    attach(sim) { state.sim = sim; sim.on(() => requestAnimationFrame(draw)); draw(); },
    setRange(nm) { state.rangeNm = nm; draw(); },
    getRange() { return state.rangeNm; },
    setGhost(g) { state.ghost = g; draw(); },
    canvasToPolar,
    hitTestContact,
    redraw: draw,
    canvas,
  };

  // Redraw on resize
  window.addEventListener('resize', () => requestAnimationFrame(draw));
  if ('ResizeObserver' in window && canvas.parentElement) {
    new ResizeObserver(() => requestAnimationFrame(draw)).observe(canvas.parentElement);
  }
})();
