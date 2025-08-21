export class ViewportController {
  constructor(target) {
    this.target = target;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.enabled = true;
    this._pointers = new Map();
    this._lastPan = null;
    this._startScale = 1;
    this._startDist = 0;
    this._midpoint = null;
    this.DPR = window.devicePixelRatio || 1;

    target.addEventListener('pointerdown', this._onPointerDown.bind(this));
    target.addEventListener('pointermove', this._onPointerMove.bind(this));
    target.addEventListener('pointerup', this._onPointerUp.bind(this));
    target.addEventListener('pointercancel', this._onPointerUp.bind(this));
  }

  setEnabled(flag) {
    this.enabled = flag;
    if (!flag) {
      this._pointers.clear();
      this._lastPan = null;
    }
  }

  apply(ctx) {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }

  screenToWorld(x, y) {
    return {
      x: (x - this.offsetX) / this.scale,
      y: (y - this.offsetY) / this.scale,
    };
  }

  _getPos(e) {
    const rect = this.target.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * this.DPR,
      y: (e.clientY - rect.top) * this.DPR,
    };
  }

  _onPointerDown(e) {
    if (!this.enabled) return;
    this.target.setPointerCapture?.(e.pointerId);
    const pos = this._getPos(e);
    this._pointers.set(e.pointerId, pos);
    if (this._pointers.size === 1) {
      this._lastPan = pos;
    } else if (this._pointers.size === 2) {
      const [p1, p2] = Array.from(this._pointers.values());
      this._startDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      this._startScale = this.scale;
      this._midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }
  }

  _onPointerMove(e) {
    if (!this.enabled || !this._pointers.has(e.pointerId)) return;
    const pos = this._getPos(e);
    this._pointers.set(e.pointerId, pos);
    if (this._pointers.size === 1) {
      if (this._lastPan) {
        const dx = pos.x - this._lastPan.x;
        const dy = pos.y - this._lastPan.y;
        this.offsetX += dx;
        this.offsetY += dy;
        this._lastPan = pos;
      }
    } else if (this._pointers.size === 2) {
      const [p1, p2] = Array.from(this._pointers.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (this._startDist > 0) {
        let newScale = (dist / this._startDist) * this._startScale;
        newScale = Math.max(0.5, Math.min(4, newScale));
        const rect = this.target.getBoundingClientRect();
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        // Keep midpoint stable during zoom
        const worldBefore = this.screenToWorld(mid.x, mid.y);
        this.scale = newScale;
        const screenAfter = {
          x: worldBefore.x * this.scale,
          y: worldBefore.y * this.scale,
        };
        this.offsetX = mid.x - screenAfter.x;
        this.offsetY = mid.y - screenAfter.y;
      }
    }
  }

  _onPointerUp(e) {
    if (!this.enabled) return;
    this.target.releasePointerCapture?.(e.pointerId);
    this._pointers.delete(e.pointerId);
    if (this._pointers.size === 0) {
      this._lastPan = null;
      this._startDist = 0;
    }
  }
}
