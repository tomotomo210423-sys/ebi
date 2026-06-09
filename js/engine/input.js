/**
 * Input - unified keyboard + virtual pad input system
 *
 * Controls:
 *   Move:   ArrowLeft/ArrowRight/ArrowUp/ArrowDown  or  A/D/W/S
 *   Jump:   Space
 *   Attack: Z or J
 *   Skill:  X or K
 *   Pause:  Escape or P
 */
(function () {
  'use strict';

  class Input {
    constructor() {
      // Raw held state - physical keys + virtual
      this._held = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        attack: false,
        skill: false,
        pause: false,
      };

      // Virtual pad state (on-screen buttons / gamepad wrapper)
      this._virtual = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        attack: false,
        skill: false,
        pause: false,
      };

      // "Pressed this frame" flags - cleared each update()
      this._downThisFrame = {
        jump: false,
        attack: false,
        skill: false,
        pause: false,
      };

      // Previous combined state for edge detection
      this._prevCombined = {
        jump: false,
        attack: false,
        skill: false,
        pause: false,
      };

      this._onKeyDown = this._onKeyDown.bind(this);
      this._onKeyUp = this._onKeyUp.bind(this);
      window.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('keyup', this._onKeyUp);
    }

    /** Call once per frame BEFORE reading any input */
    update() {
      const combined = {
        jump:   this._held.jump   || this._virtual.jump,
        attack: this._held.attack || this._virtual.attack,
        skill:  this._held.skill  || this._virtual.skill,
        pause:  this._held.pause  || this._virtual.pause,
      };

      this._downThisFrame.jump   = combined.jump   && !this._prevCombined.jump;
      this._downThisFrame.attack = combined.attack && !this._prevCombined.attack;
      this._downThisFrame.skill  = combined.skill  && !this._prevCombined.skill;
      this._downThisFrame.pause  = combined.pause  && !this._prevCombined.pause;

      this._prevCombined.jump   = combined.jump;
      this._prevCombined.attack = combined.attack;
      this._prevCombined.skill  = combined.skill;
      this._prevCombined.pause  = combined.pause;
    }

    /**
     * Set a virtual pad key state (for on-screen buttons)
     * @param {string} key - one of: left, right, up, down, jump, attack, skill, pause
     * @param {boolean} val
     */
    setVirtual(key, val) {
      if (key in this._virtual) {
        this._virtual[key] = !!val;
      }
    }

    /** Remove keyboard listeners (call on cleanup) */
    destroy() {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
    }

    // ------------------------------------------------------------------ //
    // Held state getters (true while key is held)
    // ------------------------------------------------------------------ //

    get left()   { return this._held.left   || this._virtual.left;   }
    get right()  { return this._held.right  || this._virtual.right;  }
    get up()     { return this._held.up     || this._virtual.up;     }
    get down()   { return this._held.down   || this._virtual.down;   }
    get jump()   { return this._held.jump   || this._virtual.jump;   }
    get attack() { return this._held.attack || this._virtual.attack; }
    get skill()  { return this._held.skill  || this._virtual.skill;  }
    get pause()  { return this._held.pause  || this._virtual.pause;  }

    // ------------------------------------------------------------------ //
    // "Just pressed this frame" getters (true only on first frame pressed)
    // ------------------------------------------------------------------ //

    get jumpDown()   { return this._downThisFrame.jump;   }
    get attackDown() { return this._downThisFrame.attack; }
    get skillDown()  { return this._downThisFrame.skill;  }
    get pauseDown()  { return this._downThisFrame.pause;  }

    // ------------------------------------------------------------------ //
    // Private
    // ------------------------------------------------------------------ //

    /** @private */
    _keyToAction(code) {
      switch (code) {
        case 'ArrowLeft':  case 'KeyA': return 'left';
        case 'ArrowRight': case 'KeyD': return 'right';
        case 'ArrowUp':    case 'KeyW': return 'up';
        case 'ArrowDown':  case 'KeyS': return 'down';
        case 'Space':                   return 'jump';
        case 'KeyZ':       case 'KeyJ': return 'attack';
        case 'KeyX':       case 'KeyK': return 'skill';
        case 'Escape':     case 'KeyP': return 'pause';
        default:                        return null;
      }
    }

    /** @private */
    _onKeyDown(e) {
      const action = this._keyToAction(e.code);
      if (action) {
        this._held[action] = true;
        // Prevent browser from scrolling with arrow/space keys
        if (action === 'jump' || action === 'up' || action === 'down') {
          e.preventDefault();
        }
      }
    }

    /** @private */
    _onKeyUp(e) {
      const action = this._keyToAction(e.code);
      if (action) {
        this._held[action] = false;
      }
    }
  }

  window.Input = Input;
}());
