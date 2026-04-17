/* =========================================================
   Maneuver sandbox simulation engine
   --------------------------------------------------------
   Units:
     position  NM  (+y = north, +x = east)
     speed     kt  (NM/hour)
     bearing   deg (0 = north, clockwise)
     time      s   (seconds, internal)
   Ownship is tracked in world coordinates and rendered at
   the center of the radar display.
   --------------------------------------------------------
   Math ported from js/arena.js (solveCPA, calculateAllData,
   getBearingRate).
   ========================================================= */

(function (global) {
  const DEG = 180 / Math.PI;
  const RAD = Math.PI / 180;

  const norm360 = (deg) => ((deg % 360) + 360) % 360;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function velFromCourseSpeed(courseDeg, speedKt) {
    const r = courseDeg * RAD;
    return { vx: Math.sin(r) * speedKt, vy: Math.cos(r) * speedKt };
  }

  function solveCPA(own, tgt) {
    const rx = tgt.x - own.x;
    const ry = tgt.y - own.y;
    const vx = tgt.vx - own.vx;
    const vy = tgt.vy - own.vy;
    const v2 = vx * vx + vy * vy;
    const tCPA = v2 < 1e-6 ? Infinity : -(rx * vx + ry * vy) / v2;
    const xC = rx + vx * tCPA;
    const yC = ry + vy * tCPA;
    const dCPA = Math.sqrt(xC * xC + yC * yC);
    return { tCPA, dCPA, xCPA: xC, yCPA: yC };
  }

  function bearingOf(dx, dy) { return norm360(Math.atan2(dx, dy) * DEG); }
  function rangeOf(dx, dy)   { return Math.hypot(dx, dy); }

  class Sim {
    constructor() {
      // Ownship at origin, heading North, 12 kt by default
      this.own = { x: 0, y: 0, course: 0, speed: 12, vx: 0, vy: 12 };
      this.contacts = [];
      this.nextId = 1;
      this.time = 0;             // seconds since start
      this.speed = 2;            // time multiplier
      this.playing = false;
      this.activeId = null;
      this.listeners = new Set();
    }

    // Subscription ---------------------------------------------
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    _emit() { for (const fn of this.listeners) fn(this); }

    // Ownship editing ------------------------------------------
    setOwnCourse(deg) {
      this.own.course = norm360(deg);
      const v = velFromCourseSpeed(this.own.course, this.own.speed);
      this.own.vx = v.vx; this.own.vy = v.vy;
      this._recomputeAll();
      this._emit();
    }
    setOwnSpeed(kt) {
      this.own.speed = clamp(kt, 0, 35);
      const v = velFromCourseSpeed(this.own.course, this.own.speed);
      this.own.vx = v.vx; this.own.vy = v.vy;
      this._recomputeAll();
      this._emit();
    }

    // Contact management ---------------------------------------
    addContact({ bearing, range, course, speed }) {
      const br = bearing * RAD;
      const x = this.own.x + Math.sin(br) * range;
      const y = this.own.y + Math.cos(br) * range;
      const v = velFromCourseSpeed(course, speed);
      const id = `T-${String(this.nextId++).padStart(2, '0')}`;
      const c = {
        id,
        x, y,
        course: norm360(course),
        speed: clamp(speed, 0, 35),
        vx: v.vx, vy: v.vy,
        bearingHistory: [],       // [{t, brg}] recent samples
        trail: [],                // world-space dots for rendering
        derived: null,
      };
      this.contacts.push(c);
      this._recomputeContact(c);
      if (!this.activeId) this.activeId = id;
      this._emit();
      return c;
    }
    removeContact(id) {
      this.contacts = this.contacts.filter((c) => c.id !== id);
      if (this.activeId === id) this.activeId = this.contacts[0]?.id ?? null;
      this._emit();
    }
    clearContacts() {
      this.contacts = [];
      this.activeId = null;
      this.nextId = 1;
      this._emit();
    }
    setActive(id) {
      if (this.contacts.some((c) => c.id === id)) {
        this.activeId = id;
        this._emit();
      }
    }
    getActive() { return this.contacts.find((c) => c.id === this.activeId) || null; }

    // Edit selected track --------------------------------------
    setTrackCourse(id, deg) {
      const c = this.contacts.find((x) => x.id === id);
      if (!c) return;
      c.course = norm360(deg);
      const v = velFromCourseSpeed(c.course, c.speed);
      c.vx = v.vx; c.vy = v.vy;
      this._recomputeContact(c);
      this._emit();
    }
    setTrackSpeed(id, kt) {
      const c = this.contacts.find((x) => x.id === id);
      if (!c) return;
      c.speed = clamp(kt, 0, 35);
      const v = velFromCourseSpeed(c.course, c.speed);
      c.vx = v.vx; c.vy = v.vy;
      this._recomputeContact(c);
      this._emit();
    }

    // Time control ---------------------------------------------
    play()  { this.playing = true;  this._emit(); }
    pause() { this.playing = false; this._emit(); }
    toggle(){ this.playing = !this.playing; this._emit(); }
    setSpeed(mult) { this.speed = mult; this._emit(); }

    // Per-frame tick (called by driver loop) -------------------
    tick(dtSec) {
      if (!this.playing) return;
      const dt = dtSec * this.speed;
      const dtH = dt / 3600;

      // integrate ownship
      this.own.x += this.own.vx * dtH;
      this.own.y += this.own.vy * dtH;

      // integrate contacts
      for (const c of this.contacts) {
        c.x += c.vx * dtH;
        c.y += c.vy * dtH;
      }

      this.time += dt;
      this._recomputeAll();
      this._sampleBearings();
      this._emit();
    }

    // --- Derived data -----------------------------------------
    _recomputeAll() {
      for (const c of this.contacts) this._recomputeContact(c);
    }

    _recomputeContact(c) {
      const dx = c.x - this.own.x;
      const dy = c.y - this.own.y;
      const range = rangeOf(dx, dy);
      const brg = bearingOf(dx, dy);

      const relVx = c.vx - this.own.vx;
      const relVy = c.vy - this.own.vy;
      const relSpd = Math.hypot(relVx, relVy);
      const relDir = relSpd < 1e-4 ? null : norm360(Math.atan2(relVx, relVy) * DEG);

      const cpa = solveCPA(this.own, c);
      const tcpaSec = cpa.tCPA * 3600;   // hours → seconds
      const hasPassed = tcpaSec < 0 || !isFinite(tcpaSec);

      // Target angle (aspect): angle from target's bow to ownship
      const ownFromTgt = norm360(brg + 180);
      const tgtAngle = norm360(ownFromTgt - c.course);

      // Bearing rate via cross product (deg/min)
      const cross = dx * relVy - dy * relVx;          // rel pos × rel vel
      const brateRadPerHour = range < 0.01 ? 0 : cross / (range * range);
      const brateDpm = (brateRadPerHour * DEG) / 60;

      // CBDR classification: risk iff dCPA < 1.0 NM AND 0 < tcpa < 15 min
      const isRisk = !hasPassed && cpa.dCPA < 1.0 && tcpaSec < 15 * 60;
      const isSteady = Math.abs(brateDpm) < 0.2 && !hasPassed;

      c.derived = {
        range, bearing: brg,
        relDir, relSpd,
        cpaRange: cpa.dCPA,
        tcpaSec,
        hasPassed,
        targetAngle: tgtAngle,
        bearingRateDpm: brateDpm,
        bearingRateWord: Math.abs(brateDpm) < 0.05 ? 'STEADY'
                          : brateDpm > 0 ? 'L' : 'R',
        isRisk,
        isSteady,
      };
    }

    _sampleBearings() {
      // Sample every 1s, keep last 60 samples
      for (const c of this.contacts) {
        const last = c.bearingHistory[c.bearingHistory.length - 1];
        if (!last || this.time - last.t >= 1) {
          c.bearingHistory.push({ t: this.time, brg: c.derived.bearing });
          if (c.bearingHistory.length > 60) c.bearingHistory.shift();
        }
        // Trail (world-space), sample every 6 seconds, keep 10
        const lastTrail = c.trail[c.trail.length - 1];
        if (!lastTrail || this.time - lastTrail.t >= 6) {
          c.trail.push({ t: this.time, x: c.x, y: c.y });
          if (c.trail.length > 10) c.trail.shift();
        }
      }
    }

    // Bearing drift over the window (last N samples) -----------
    bearingDrift(c, windowSec = 60) {
      const h = c.bearingHistory;
      if (h.length < 2) return { drift: 0, series: [] };
      const cutoff = this.time - windowSec;
      const recent = h.filter((s) => s.t >= cutoff);
      if (recent.length < 2) return { drift: 0, series: h };

      // Unwrap bearing around 0/360 to avoid jumps when plotting
      const unwrap = [recent[0].brg];
      for (let i = 1; i < recent.length; i++) {
        let next = recent[i].brg;
        const prev = unwrap[i - 1];
        while (next - prev > 180) next -= 360;
        while (next - prev < -180) next += 360;
        unwrap.push(next);
      }
      const drift = unwrap[unwrap.length - 1] - unwrap[0];
      return {
        drift,
        series: recent.map((s, i) => ({ t: s.t, brg: unwrap[i] })),
      };
    }
  }

  // Aspect word ("Red 42°", "Green 30°", "Bow", "Stern")
  function aspectLabel(targetAngle) {
    // targetAngle convention: 0 = ownship is dead ahead of target (target's bow)
    // 90 = ownship on target's stbd beam, 180 = stern, 270 = port beam.
    const ta = norm360(targetAngle);
    if (ta < 5 || ta > 355) return 'Bow';
    if (Math.abs(ta - 180) < 5) return 'Stern';
    if (ta < 180) return `Green ${Math.round(ta)}°`;
    return `Red ${Math.round(360 - ta)}°`;
  }

  global.Maneuver = {
    Sim,
    solveCPA,
    bearingOf,
    rangeOf,
    velFromCourseSpeed,
    aspectLabel,
    norm360,
  };
})(window);
