/* =========================================================
   App wiring — simulation loop, interactions, panel updates.
   ========================================================= */

(function () {
  const { Sim, aspectLabel, norm360 } = window.Maneuver;
  const sim = new Sim();
  window.RadarView.attach(sim);

  // --- Panel element cache ------------------------------------
  const el = {
    // track
    tag: document.getElementById('track-tag'),
    state: document.getElementById('track-state'),
    trackSection: document.getElementById('track-hero'),

    cbdr: document.getElementById('cbdr-strip'),
    cbdrState: document.getElementById('cbdr-state'),
    cbdrSpark: document.getElementById('cbdr-spark-path'),
    cbdrDelta: document.getElementById('cbdr-delta'),

    cpaRng: document.getElementById('cpa-rng-val'),
    cpaTime: document.getElementById('cpa-time'),
    aspectWedge: document.getElementById('aspect-wedge'),
    aspectVal: document.getElementById('aspect-val'),

    dBrg: document.getElementById('d-brg'),
    dRng: document.getElementById('d-rng'),
    dCrs: document.getElementById('d-crs'),
    dSpd: document.getElementById('d-spd'),
    dRdir: document.getElementById('d-rdir'),
    dRspd: document.getElementById('d-rspd'),
    dBrate: document.getElementById('d-brate'),
    dTang: document.getElementById('d-tang'),

    list: document.getElementById('contact-list'),
    count: document.getElementById('contact-count'),
    contactsSection: document.querySelector('.contacts'),

    ownCrs: document.getElementById('own-crs'),
    ownSpd: document.getElementById('own-spd'),

    clock: document.getElementById('sim-clock'),
    play: document.getElementById('play-btn'),
    speeds: document.querySelectorAll('.speed'),
    scrubFill: document.getElementById('scrub-fill'),
    scrubHead: document.getElementById('scrub-head'),

    rangeBtn: document.getElementById('range-pill'),
    rangeVal: document.getElementById('range-val'),

    clearBtn: document.getElementById('clear-btn'),
    clearMobile: document.getElementById('clear-btn-mobile'),

    editPop: document.getElementById('edit-pop'),
    editInput: document.getElementById('edit-pop-input'),
    editLabel: document.getElementById('edit-pop-label'),
  };

  // --- Formatters ---------------------------------------------
  const fmtBrg = (d) => String(Math.round(norm360(d))).padStart(3, '0') + '°';
  const fmtRng = (nm) => nm.toFixed(1);
  const fmtSpd = (kt) => String(Math.round(kt));
  const fmtCrs = (d) => String(Math.round(norm360(d))).padStart(3, '0');

  function fmtClock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }

  function fmtTcpa(sec) {
    if (!isFinite(sec) || sec < 0) return '—';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  // --- Panel updates ------------------------------------------
  function renderPanel() {
    // Clock
    el.clock.textContent = fmtClock(sim.time);
    // Scrub fill based on 20-min window
    const pct = Math.min(100, (sim.time / (20 * 60)) * 100);
    el.scrubFill.style.setProperty('--pct', pct + '%');
    el.scrubHead.style.setProperty('--pct', pct + '%');

    // Ownship
    el.ownCrs.textContent = fmtCrs(sim.own.course);
    el.ownSpd.textContent = fmtSpd(sim.own.speed);

    // Contact list
    renderContactList();

    // Active track
    const c = sim.getActive();
    if (!c || !c.derived) {
      renderEmptyTrack();
      return;
    }
    renderActiveTrack(c);
  }

  function renderContactList() {
    el.count.textContent = sim.contacts.length;
    document.body.classList.toggle('has-contacts', sim.contacts.length > 0);

    // Sort by tcpa ascending (risk / future-cpa first)
    const rows = [...sim.contacts].sort((a, b) => {
      const ta = a.derived?.tcpaSec ?? Infinity;
      const tb = b.derived?.tcpaSec ?? Infinity;
      const fa = ta < 0 ? Infinity : ta;
      const fb = tb < 0 ? Infinity : tb;
      return fa - fb;
    });

    el.list.innerHTML = rows.map((c) => {
      const d = c.derived || {};
      const risk = d.isRisk;
      const active = c.id === sim.activeId;
      const cpaRng = isFinite(d.cpaRange) && !d.hasPassed ? d.cpaRange.toFixed(1) : '—';
      const cpaT = fmtTcpa(d.tcpaSec);
      return `
        <li class="contact ${active ? 'is-active' : ''}" data-id="${c.id}">
          <span class="contact__dot ${risk ? 'contact__dot--risk' : ''}"></span>
          <span class="contact__tag">${c.id}</span>
          <span class="contact__brg">${fmtBrg(d.bearing || 0)}</span>
          <span class="contact__rng">${fmtRng(d.range || 0)}</span>
          <span class="contact__cpa"><span class="cpa-val">${cpaRng}</span><span class="cpa-t">${cpaT}</span></span>
        </li>
      `;
    }).join('');
  }

  function renderEmptyTrack() {
    el.trackSection.classList.remove('is-risk');
    el.tag.textContent = '—';
    el.state.textContent = '';
    el.cbdr.setAttribute('data-state', 'idle');
    el.cbdrState.textContent = '—';
    el.cbdrDelta.innerHTML = '—<span class="u">/m</span>';
    el.cbdrSpark.setAttribute('points', '');
    el.cpaRng.textContent = '—';
    el.cpaTime.textContent = '—';
    el.aspectWedge.setAttribute('d', '');
    el.aspectVal.textContent = '—';
    for (const k of ['dBrg', 'dRng', 'dCrs', 'dSpd', 'dRdir', 'dRspd', 'dBrate', 'dTang']) {
      el[k].textContent = '—';
    }
  }

  function renderActiveTrack(c) {
    const d = c.derived;
    el.tag.textContent = c.id;
    el.trackSection.classList.toggle('is-risk', !!d.isRisk);
    el.state.textContent = d.hasPassed ? 'past CPA'
                         : d.isRisk ? 'risk of collision'
                         : d.isSteady ? 'bearing steady' : '';

    // CBDR
    const { drift, series } = sim.bearingDrift(c, 60);
    if (series.length >= 2) {
      const ys = series.map(s => s.brg);
      const min = Math.min(...ys);
      const max = Math.max(...ys);
      const span = Math.max(0.5, max - min);
      const pts = series.map((s, i) => {
        const x = (i / (series.length - 1)) * 120;
        const y = 18 - ((s.brg - min) / span) * 16;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      el.cbdrSpark.setAttribute('points', pts);
    } else {
      el.cbdrSpark.setAttribute('points', '');
    }

    const cbdrMode = d.hasPassed ? 'idle' : d.isRisk ? 'risk' : d.isSteady ? 'steady' : 'drifting';
    el.cbdr.setAttribute('data-state', cbdrMode);
    el.cbdrState.textContent = d.hasPassed ? 'PAST'
                             : d.isRisk ? 'CBDR'
                             : d.isSteady ? 'STEADY'
                             : drift > 0 ? 'DRIFT R' : 'DRIFT L';
    const absDrift = Math.abs(drift).toFixed(1);
    el.cbdrDelta.innerHTML = `${absDrift}°<span class="u">/60s</span>`;

    // Hero numbers
    el.cpaRng.textContent = d.hasPassed ? '—' : d.cpaRange.toFixed(1);
    el.cpaTime.textContent = d.hasPassed ? '—' : fmtTcpa(d.tcpaSec);

    // Aspect dial: wedge from 0° to targetAngle
    if (!d.hasPassed) {
      const ta = d.targetAngle;
      const rad = (ta - 90) * Math.PI / 180; // 0°=top
      const large = ta > 180 ? 1 : 0;
      const ex = 42 * Math.cos(rad);
      const ey = 42 * Math.sin(rad);
      el.aspectWedge.setAttribute('d',
        `M0,0 L0,-42 A42,42 0 ${large},1 ${ex.toFixed(2)},${ey.toFixed(2)} Z`);
      el.aspectVal.textContent = aspectLabel(ta);
    } else {
      el.aspectWedge.setAttribute('d', '');
      el.aspectVal.textContent = '—';
    }

    // Data grid
    el.dBrg.textContent = fmtBrg(d.bearing);
    el.dRng.textContent = fmtRng(d.range);
    el.dCrs.textContent = fmtCrs(c.course);
    el.dSpd.textContent = fmtSpd(c.speed);
    el.dRdir.textContent = d.relDir == null ? '—' : fmtBrg(d.relDir);
    el.dRspd.textContent = d.relSpd.toFixed(1);
    el.dBrate.innerHTML =
      d.bearingRateWord === 'STEADY' ? '0.0<span class="cell__u">/m</span>'
      : `${Math.abs(d.bearingRateDpm).toFixed(2)}<span class="cell__u">${d.bearingRateWord}</span>`;
    el.dTang.textContent = aspectLabel(d.targetAngle);
  }

  // --- Driver loop (rAF) --------------------------------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    sim.tick(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // --- Subscribe panel to sim changes -------------------------
  sim.on(renderPanel);

  // Initial seed: starboard cross (risk), port crosser, overtaken target
  sim.addContact({ bearing: 45,  range: 4.0, course: 270, speed: 14 });
  sim.addContact({ bearing: 330, range: 8.0, course: 150, speed: 10 });
  sim.addContact({ bearing: 10,  range: 3.0, course: 0,   speed: 6  });

  // --- Controls -----------------------------------------------
  el.play.addEventListener('click', () => {
    sim.toggle();
    el.play.classList.toggle('is-playing', sim.playing);
  });

  el.speeds.forEach((b) => {
    b.addEventListener('click', () => {
      el.speeds.forEach((x) => { x.classList.remove('is-active'); x.setAttribute('aria-checked', 'false'); });
      b.classList.add('is-active');
      b.setAttribute('aria-checked', 'true');
      sim.setSpeed(parseInt(b.dataset.speed, 10));
    });
  });

  const RANGES = [3, 6, 12, 24];
  el.rangeBtn.addEventListener('click', () => {
    const i = RANGES.indexOf(window.RadarView.getRange());
    const next = RANGES[(i + 1) % RANGES.length];
    el.rangeVal.textContent = next;
    window.RadarView.setRange(next);
  });

  const doClear = () => sim.clearContacts();
  el.clearBtn?.addEventListener('click', doClear);
  el.clearMobile?.addEventListener('click', doClear);

  // --- Contact selection --------------------------------------
  el.list.addEventListener('click', (e) => {
    const li = e.target.closest('.contact');
    if (li) sim.setActive(li.dataset.id);
  });

  // --- Long-press + drag on canvas ----------------------------
  const canvas = window.RadarView.canvas;
  const LONG_PRESS_MS = 450;
  const MOVE_CANCEL_PX = 8;
  let press = null;

  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = pointerPos(e);
    // Tap-to-select if hitting a contact
    const hit = window.RadarView.hitTestContact(p.x, p.y);
    if (hit) {
      sim.setActive(hit.id);
      e.preventDefault();
      return;
    }
    // Start a long-press timer
    press = {
      startX: p.x, startY: p.y, t0: performance.now(),
      started: false, drop: null, pointerId: e.pointerId,
    };
    press.timer = setTimeout(() => {
      if (!press) return;
      press.started = true;
      const { bearing, range } = window.RadarView.canvasToPolar(press.startX, press.startY);
      press.drop = { bearing, range };
      window.RadarView.setGhost({ bearing, range, course: null, speed: 10 });
      canvas.setPointerCapture(press.pointerId);
    }, LONG_PRESS_MS);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!press) return;
    const p = pointerPos(e);

    if (!press.started) {
      // Cancel long-press if user moves too far before timer fires
      if (Math.hypot(p.x - press.startX, p.y - press.startY) > MOVE_CANCEL_PX) {
        clearTimeout(press.timer);
        press = null;
      }
      return;
    }

    // Post-drop: dragging sets course
    const { bearing: dropBrg, range: dropRng } = press.drop;
    const cx = canvas.width / (window.devicePixelRatio || 1) / 2;
    const cy = canvas.height / (window.devicePixelRatio || 1) / 2;
    const nmToPx = (canvas.clientWidth / 2 - 18) / window.RadarView.getRange();
    const dropX = cx + Math.sin(dropBrg * Math.PI / 180) * dropRng * nmToPx;
    const dropY = cy - Math.cos(dropBrg * Math.PI / 180) * dropRng * nmToPx;
    const dx = p.x - dropX;
    const dy = dropY - p.y;   // canvas y flipped
    const course = Math.hypot(dx, dy) < 6 ? null
                  : ((Math.atan2(dx, dy) * 180 / Math.PI) + 360) % 360;
    window.RadarView.setGhost({ bearing: dropBrg, range: dropRng, course, speed: 10 });
  });

  canvas.addEventListener('pointerup', (e) => {
    if (!press) return;
    clearTimeout(press.timer);
    if (press.started) {
      try { canvas.releasePointerCapture(press.pointerId); } catch (_) {}
      const { bearing, range } = press.drop;
      const p = pointerPos(e);
      const cx = canvas.width / (window.devicePixelRatio || 1) / 2;
      const cy = canvas.height / (window.devicePixelRatio || 1) / 2;
      const nmToPx = (canvas.clientWidth / 2 - 18) / window.RadarView.getRange();
      const dropX = cx + Math.sin(bearing * Math.PI / 180) * range * nmToPx;
      const dropY = cy - Math.cos(bearing * Math.PI / 180) * range * nmToPx;
      const dx = p.x - dropX;
      const dy = dropY - p.y;
      let course;
      if (Math.hypot(dx, dy) < 6) {
        course = bearing; // point toward ownship region if no drag
      } else {
        course = ((Math.atan2(dx, dy) * 180 / Math.PI) + 360) % 360;
      }
      const c = sim.addContact({ bearing, range, course, speed: 10 });
      sim.setActive(c.id);
    }
    window.RadarView.setGhost(null);
    press = null;
  });

  canvas.addEventListener('pointercancel', () => {
    if (press) { clearTimeout(press.timer); }
    window.RadarView.setGhost(null);
    press = null;
  });

  // --- Inline editors -----------------------------------------
  const EDITORS = {
    'own-crs':   { label: 'Own Course', get: () => fmtCrs(sim.own.course), set: (v) => sim.setOwnCourse(v), step: 5 },
    'own-spd':   { label: 'Own Speed',  get: () => fmtSpd(sim.own.speed),  set: (v) => sim.setOwnSpeed(v),  step: 1 },
    'track-crs': { label: 'Track Course', get: () => { const c = sim.getActive(); return c ? fmtCrs(c.course) : '—'; },
                   set: (v) => { const c = sim.getActive(); if (c) sim.setTrackCourse(c.id, v); }, step: 5 },
    'track-spd': { label: 'Track Speed',  get: () => { const c = sim.getActive(); return c ? fmtSpd(c.speed) : '—'; },
                   set: (v) => { const c = sim.getActive(); if (c) sim.setTrackSpeed(c.id, v); }, step: 1 },
  };

  let currentEditor = null;
  function openEditor(target) {
    const key = target.dataset.edit;
    const cfg = EDITORS[key];
    if (!cfg) return;
    const v = cfg.get();
    if (v === '—') return;
    currentEditor = { key, cfg, target };
    el.editLabel.textContent = cfg.label;
    el.editInput.value = parseFloat(v);
    el.editInput.step = cfg.step;
    const r = target.getBoundingClientRect();
    el.editPop.hidden = false;
    el.editPop.style.left = Math.max(8, r.left - 20) + 'px';
    el.editPop.style.top = (r.bottom + 6) + 'px';
    target.classList.add('is-editing');
    setTimeout(() => { el.editInput.focus(); el.editInput.select(); }, 0);
  }
  function closeEditor(commit) {
    if (!currentEditor) return;
    if (commit) {
      const v = parseFloat(el.editInput.value);
      if (!Number.isNaN(v)) currentEditor.cfg.set(v);
    }
    currentEditor.target.classList.remove('is-editing');
    el.editPop.hidden = true;
    currentEditor = null;
  }

  document.addEventListener('click', (e) => {
    const target = e.target.closest('.editable');
    if (target && !target.classList.contains('is-editing')) {
      // Close any open editor first
      closeEditor(false);
      openEditor(target);
      e.stopPropagation();
      return;
    }
    if (!el.editPop.contains(e.target)) closeEditor(false);
  });

  el.editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { closeEditor(true); e.preventDefault(); }
    if (e.key === 'Escape') { closeEditor(false); e.preventDefault(); }
  });

  // Initial render
  renderPanel();
  sim.play();
  el.play.classList.add('is-playing');
})();
