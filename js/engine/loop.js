/**
 * GameLoop - requestAnimationFrame based game loop with delta time
 * Cap dt to 50ms to prevent spiral-of-death on tab focus loss
 */
(function () {
  'use strict';

  class GameLoop {
    /**
     * @param {function(number): void} update - called with dt in seconds
     * @param {function(): void} render - called each frame after update
     */
    constructor(update, render) {
      this._update = update;
      this._render = render;
      this._running = false;
      this._rafId = null;
      this._lastTime = null;
      this._boundTick = this._tick.bind(this);
    }

    /** Start the loop */
    start() {
      if (this._running) return;
      this._running = true;
      this._lastTime = null;
      this._rafId = requestAnimationFrame(this._boundTick);
    }

    /** Stop the loop */
    stop() {
      this._running = false;
      if (this._rafId !== null) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
      this._lastTime = null;
    }

    /** @private */
    _tick(timestamp) {
      if (!this._running) return;

      if (this._lastTime === null) {
        this._lastTime = timestamp;
      }

      // Delta time in seconds, capped at 50ms to prevent spiral-of-death
      let dt = (timestamp - this._lastTime) / 1000;
      if (dt > 0.05) dt = 0.05;
      this._lastTime = timestamp;

      this._update(dt);
      this._render();

      this._rafId = requestAnimationFrame(this._boundTick);
    }
  }

  window.GameLoop = GameLoop;
}());
