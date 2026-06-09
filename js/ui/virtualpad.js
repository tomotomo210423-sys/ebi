/**
 * virtualpad.js  -  Mobile virtual gamepad with analog joystick
 * クラゲライダー・カニィとプカプカの大冒険
 *
 * Left side : Analog joystick (maps to up/down/left/right)
 * Right side : A (jump) · B (attack) · C (skill) buttons
 * Exposes: window.VirtualPad
 */
(function () {
  'use strict';

  // Joystick geometry
  const BASE_R  = 56;   // outer ring radius (px)
  const THUMB_R = 22;   // thumb knob radius
  const MAX_R   = BASE_R - THUMB_R;
  const DEAD    = 0.22; // normalised dead-zone

  // ─────────────────────────────────────────────────────────────────────────
  class VirtualPad {
    constructor(input) {
      this.input        = input;
      this._el          = null;
      this._pointers    = {};      // pointerId → actionKey (for A/B/C buttons)
      this._stickId     = null;   // pointerId owning the joystick
      this._stickOX     = 0;      // joystick origin X (clientX of base centre)
      this._stickOY     = 0;
      this._stickThumb  = null;   // thumb <div> reference
    }

    // -----------------------------------------------------------------------
    mount() {
      if (this._el) return;

      const pad = document.createElement('div');
      pad.id = 'virtual-pad';
      pad.style.cssText = [
        'position:fixed',
        'bottom:0',
        'left:0',
        'right:0',
        'height:180px',
        'pointer-events:none',
        'user-select:none',
        '-webkit-user-select:none',
        'z-index:100',
        'display:none',
      ].join(';');

      pad.appendChild(this._buildJoystick());
      pad.appendChild(this._buildActionButtons());

      document.body.appendChild(pad);
      this._el = pad;
    }

    // -----------------------------------------------------------------------
    unmount() {
      if (this._el) {
        this._el.parentNode && this._el.parentNode.removeChild(this._el);
        this._el = null;
        this._pointers = {};
        this._stickId  = null;
      }
    }

    show() { if (this._el) this._el.style.display = 'block'; }
    hide() { if (this._el) this._el.style.display = 'none';  }

    // -----------------------------------------------------------------------
    // Joystick
    // -----------------------------------------------------------------------
    _buildJoystick() {
      const diam = BASE_R * 2;

      // Outer container (receives touch events)
      const base = document.createElement('div');
      base.style.cssText = [
        'position:absolute',
        'left:16px',
        'bottom:16px',
        'width:'  + diam + 'px',
        'height:' + diam + 'px',
        'border-radius:50%',
        'background:rgba(20,40,70,0.52)',
        'border:2px solid rgba(100,160,220,0.40)',
        'pointer-events:all',
        'touch-action:none',
        'cursor:pointer',
        'user-select:none',
        '-webkit-user-select:none',
        'box-shadow:0 0 18px rgba(0,80,180,0.25)',
      ].join(';');

      // Inner guide ring
      const guide = document.createElement('div');
      const gr    = Math.round(MAX_R * 0.95);
      guide.style.cssText = [
        'position:absolute',
        'left:' + (BASE_R - gr) + 'px',
        'top:'  + (BASE_R - gr) + 'px',
        'width:'  + gr * 2 + 'px',
        'height:' + gr * 2 + 'px',
        'border-radius:50%',
        'border:1px solid rgba(100,160,220,0.18)',
        'pointer-events:none',
      ].join(';');
      base.appendChild(guide);

      // Cross-hair lines (visual guide)
      const mkLine = (h) => {
        const l = document.createElement('div');
        l.style.cssText = [
          'position:absolute',
          'background:rgba(100,160,220,0.12)',
          'border-radius:2px',
          'pointer-events:none',
          h ? ('left:0;top:' + (BASE_R - 1) + 'px;width:100%;height:2px')
            : ('top:0;left:' + (BASE_R - 1) + 'px;height:100%;width:2px'),
        ].join(';');
        return l;
      };
      base.appendChild(mkLine(true));
      base.appendChild(mkLine(false));

      // Thumb knob
      const thumb = document.createElement('div');
      const tOff  = BASE_R - THUMB_R;
      thumb.style.cssText = [
        'position:absolute',
        'left:' + tOff + 'px',
        'top:'  + tOff + 'px',
        'width:'  + THUMB_R * 2 + 'px',
        'height:' + THUMB_R * 2 + 'px',
        'border-radius:50%',
        'background:radial-gradient(circle at 35% 35%, rgba(180,230,255,0.9), rgba(80,160,240,0.75))',
        'border:2px solid rgba(160,220,255,0.85)',
        'pointer-events:none',
        'box-shadow:0 3px 10px rgba(0,80,200,0.45)',
      ].join(';');
      base.appendChild(thumb);
      this._stickThumb = thumb;

      // ── Pointer tracking ────────────────────────────────────────────────
      const setKeys = (nx, ny) => {
        this.input.setVirtual('left',  nx < -DEAD);
        this.input.setVirtual('right', nx >  DEAD);
        this.input.setVirtual('up',    ny < -DEAD);
        this.input.setVirtual('down',  ny >  DEAD);
      };

      const moveThumb = (dx, dy) => {
        const dist  = Math.sqrt(dx * dx + dy * dy);
        const clamp = Math.min(dist, MAX_R);
        const ang   = Math.atan2(dy, dx);
        const cx    = Math.cos(ang) * clamp;
        const cy    = Math.sin(ang) * clamp;
        thumb.style.left = (tOff + cx) + 'px';
        thumb.style.top  = (tOff + cy) + 'px';
        const dead = 5;
        const nx = dist > dead ? Math.cos(ang) * Math.min(1, dist / MAX_R) : 0;
        const ny = dist > dead ? Math.sin(ang) * Math.min(1, dist / MAX_R) : 0;
        setKeys(nx, ny);
      };

      const resetThumb = () => {
        thumb.style.left = tOff + 'px';
        thumb.style.top  = tOff + 'px';
        setKeys(0, 0);
        this._stickId = null;
      };

      base.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._stickId !== null) return;
        this._stickId = e.pointerId;
        base.setPointerCapture(e.pointerId);
        const r = base.getBoundingClientRect();
        this._stickOX = r.left + BASE_R;
        this._stickOY = r.top  + BASE_R;
        moveThumb(e.clientX - this._stickOX, e.clientY - this._stickOY);
        base.style.opacity = '1';
      }, { passive: false });

      base.addEventListener('pointermove', (e) => {
        e.preventDefault();
        if (e.pointerId !== this._stickId) return;
        moveThumb(e.clientX - this._stickOX, e.clientY - this._stickOY);
      }, { passive: false });

      base.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (e.pointerId !== this._stickId) return;
        resetThumb();
        base.style.opacity = '';
      }, { passive: false });

      base.addEventListener('pointercancel', (e) => {
        if (e.pointerId !== this._stickId) return;
        resetThumb();
        base.style.opacity = '';
      });

      base.addEventListener('contextmenu', (e) => e.preventDefault());

      return base;
    }

    // -----------------------------------------------------------------------
    // Action buttons  A / B / C
    // -----------------------------------------------------------------------
    _buildActionButtons() {
      const wrap = document.createElement('div');
      wrap.style.cssText = [
        'position:absolute',
        'right:12px',
        'bottom:12px',
        'width:186px',
        'height:166px',
        'pointer-events:none',
      ].join(';');

      const DEFS = [
        // [key, label, rightPx, bottomPx, size, bg, border]
        ['jump',   'A',  '8px',  '62px', 58, 'rgba(0,170,160,0.82)',  'rgba(0,230,220,0.72)'],
        ['attack', 'B', '78px',  '10px', 52, 'rgba(200,100,0,0.82)',  'rgba(255,160,50,0.72)'],
        ['skill',  'C','122px',  '70px', 48, 'rgba(120,0,200,0.82)',  'rgba(180,80,255,0.72)'],
      ];

      for (const [key, label, right, bottom, size, bg, border] of DEFS) {
        const btn = this._makeButton(key, label, right, bottom, size, bg, border);
        wrap.appendChild(btn);
      }

      return wrap;
    }

    _makeButton(key, label, right, bottom, size, bg, border) {
      const btn = document.createElement('div');
      btn.setAttribute('data-vkey', key);
      btn.textContent = label;
      btn.style.cssText = [
        'position:absolute',
        'right:'  + right,
        'bottom:' + bottom,
        'width:'  + size + 'px',
        'height:' + size + 'px',
        'border-radius:' + (size / 2) + 'px',
        'background:' + bg,
        'border:2px solid ' + border,
        'color:#ffffff',
        'font-size:' + Math.round(size * 0.38) + 'px',
        'font-weight:bold',
        'font-family:"MS Gothic","Courier New",monospace',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'pointer-events:all',
        'touch-action:none',
        'cursor:pointer',
        'user-select:none',
        '-webkit-user-select:none',
        'box-sizing:border-box',
        'text-shadow:0 1px 3px rgba(0,0,0,0.7)',
        'box-shadow:0 3px 8px rgba(0,0,0,0.35)',
        '-webkit-tap-highlight-color:transparent',
      ].join(';');

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        this._pointers[e.pointerId] = key;
        this.input.setVirtual(key, true);
        btn.style.filter = 'brightness(1.7)';
      }, { passive: false });

      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const k = this._pointers[e.pointerId];
        if (k) { this.input.setVirtual(k, false); delete this._pointers[e.pointerId]; }
        btn.style.filter = '';
      }, { passive: false });

      btn.addEventListener('pointercancel', (e) => {
        const k = this._pointers[e.pointerId];
        if (k) { this.input.setVirtual(k, false); delete this._pointers[e.pointerId]; }
        btn.style.filter = '';
      });

      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      return btn;
    }
  }

  window.VirtualPad = VirtualPad;
}());
