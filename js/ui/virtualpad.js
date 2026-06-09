/**
 * virtualpad.js  -  Mobile virtual gamepad overlay
 * クラゲライダー・カニィとプカプカの大冒険
 *
 * Creates HTML elements over the canvas for touch input.
 * Exposes: window.VirtualPad
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // VirtualPad
  // ─────────────────────────────────────────────────────────────────────────
  class VirtualPad {
    /**
     * @param {Input} input - the game's Input instance
     */
    constructor(input) {
      this.input     = input;
      this._el       = null;       // root container div
      this._pointers = {};         // pointerId → { key }
    }

    // -----------------------------------------------------------------------
    // mount() - create DOM elements and append to body
    // -----------------------------------------------------------------------
    mount() {
      if (this._el) return; // already mounted

      // ── Root container ───────────────────────────────────────────────────
      const pad = document.createElement('div');
      pad.id = 'virtual-pad';
      pad.style.cssText = [
        'position: fixed',
        'bottom: 0',
        'left: 0',
        'right: 0',
        'height: 160px',
        'pointer-events: none',
        'user-select: none',
        '-webkit-user-select: none',
        'z-index: 100',
      ].join(';');

      // ── Left side: D-pad ─────────────────────────────────────────────────
      const dpad = document.createElement('div');
      dpad.style.cssText = [
        'position: absolute',
        'left: 12px',
        'bottom: 12px',
        'width: 154px',
        'height: 154px',
        'pointer-events: none',
      ].join(';');

      // D-pad cross button definitions:  [key, label, col, row]
      //  Cross layout:
      //    col 0-1 = left half, col 2 = right half; row 0 = top, row 1 = mid, row 2 = bottom
      //    up:    center-top  (col 1, row 0)
      //    left:  left-mid    (col 0, row 1)
      //    right: right-mid   (col 2, row 1)
      //    down:  center-bot  (col 1, row 2)
      const BTN_SIZE = 50;
      const DPAD_DEFS = [
        { key: 'up',    label: '▲', col: 1, row: 0 },
        { key: 'left',  label: '◀', col: 0, row: 1 },
        { key: 'right', label: '▶', col: 2, row: 1 },
        { key: 'down',  label: '▼', col: 1, row: 2 },
      ];

      for (let i = 0; i < DPAD_DEFS.length; i++) {
        const def = DPAD_DEFS[i];
        const btn = this._makeButton(def.key, def.label, {
          position: 'absolute',
          left:   (def.col * (BTN_SIZE + 2)) + 'px',
          top:    (def.row * (BTN_SIZE + 2)) + 'px',
          width:  BTN_SIZE + 'px',
          height: BTN_SIZE + 'px',
          borderRadius: '6px',       // square-ish d-pad buttons
          background: 'rgba(30,50,80,0.75)',
          border: '2px solid rgba(100,160,220,0.5)',
          color: 'rgba(200,230,255,0.9)',
          fontSize: '18px',
          touchAction: 'none',
          pointerEvents: 'all',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        });
        dpad.appendChild(btn);
      }

      // ── Right side: action buttons ────────────────────────────────────────
      const actions = document.createElement('div');
      actions.style.cssText = [
        'position: absolute',
        'right: 12px',
        'bottom: 12px',
        'width: 170px',
        'height: 154px',
        'pointer-events: none',
      ].join(';');

      // Button definitions: [key, label, right, bottom, bg, activeBg]
      const ACTION_DEFS = [
        {
          key: 'jump',
          label: 'A',
          right: '10px',
          bottom: '52px',
          bg: 'rgba(0,170,160,0.8)',
          border: 'rgba(0,230,220,0.7)',
          size: 58,
        },
        {
          key: 'attack',
          label: 'B',
          right: '78px',
          bottom: '8px',
          bg: 'rgba(200,100,0,0.8)',
          border: 'rgba(255,160,50,0.7)',
          size: 52,
        },
        {
          key: 'skill',
          label: 'C',
          right: '120px',
          bottom: '60px',
          bg: 'rgba(120,0,200,0.8)',
          border: 'rgba(180,80,255,0.7)',
          size: 48,
        },
      ];

      for (let i = 0; i < ACTION_DEFS.length; i++) {
        const def = ACTION_DEFS[i];
        const btn = this._makeButton(def.key, def.label, {
          position: 'absolute',
          right:        def.right,
          bottom:       def.bottom,
          width:        def.size + 'px',
          height:       def.size + 'px',
          borderRadius: (def.size / 2) + 'px',  // circle
          background:   def.bg,
          border:       '2px solid ' + def.border,
          color:        '#ffffff',
          fontSize:     Math.round(def.size * 0.38) + 'px',
          fontWeight:   'bold',
          touchAction:  'none',
          pointerEvents: 'all',
          cursor:       'pointer',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          boxSizing:    'border-box',
          textShadow:   '0 1px 3px rgba(0,0,0,0.7)',
        });
        actions.appendChild(btn);
      }

      // Assemble
      pad.appendChild(dpad);
      pad.appendChild(actions);
      document.body.appendChild(pad);
      this._el = pad;
    }

    // -----------------------------------------------------------------------
    // unmount() - remove from DOM
    // -----------------------------------------------------------------------
    unmount() {
      if (this._el) {
        this._el.parentNode && this._el.parentNode.removeChild(this._el);
        this._el = null;
        this._pointers = {};
      }
    }

    // -----------------------------------------------------------------------
    // show() / hide()
    // -----------------------------------------------------------------------
    show() {
      if (this._el) this._el.style.display = 'block';
    }

    hide() {
      if (this._el) this._el.style.display = 'none';
    }

    // -----------------------------------------------------------------------
    // Private: create a single button element
    // -----------------------------------------------------------------------
    _makeButton(key, label, styles) {
      const btn = document.createElement('div');
      btn.setAttribute('data-vkey', key);
      btn.textContent = label;

      // Apply styles
      for (const prop in styles) {
        // Convert camelCase to CSS property name
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        btn.style[prop] = styles[prop];
      }

      // Pointer events for multi-touch
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        this._pointers[e.pointerId] = key;
        this.input.setVirtual(key, true);
        // Visual feedback
        btn.style.filter = 'brightness(1.6)';
      }, { passive: false });

      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const heldKey = this._pointers[e.pointerId];
        if (heldKey) {
          this.input.setVirtual(heldKey, false);
          delete this._pointers[e.pointerId];
        }
        btn.style.filter = '';
      }, { passive: false });

      btn.addEventListener('pointercancel', (e) => {
        const heldKey = this._pointers[e.pointerId];
        if (heldKey) {
          this.input.setVirtual(heldKey, false);
          delete this._pointers[e.pointerId];
        }
        btn.style.filter = '';
      });

      // Prevent context menu on long press
      btn.addEventListener('contextmenu', (e) => e.preventDefault());

      return btn;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────────────────
  window.VirtualPad = VirtualPad;

}());
