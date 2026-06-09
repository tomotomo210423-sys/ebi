/**
 * Camera - smooth follow camera with world-bounds clamping
 */
(function () {
  'use strict';

  class Camera {
    /**
     * @param {number} viewW - viewport width in canvas pixels  (e.g. 640)
     * @param {number} viewH - viewport height in canvas pixels (e.g. 360)
     */
    constructor(viewW, viewH) {
      this._viewW   = viewW;
      this._viewH   = viewH;

      /** Current camera top-left position (canvas pixels) */
      this.x = 0;
      this.y = 0;

      /** Lerp target position */
      this._targetX = 0;
      this._targetY = 0;

      /** Lerp speed (higher = snappier) */
      this._lerpSpeed = 8;
    }

    /**
     * Set the lerp target so the camera centers on (targetX, targetY),
     * clamped to world bounds.
     *
     * @param {number} targetX  - world x of the point to follow (e.g. entity center)
     * @param {number} targetY  - world y of the point to follow
     * @param {number} worldW   - total world width  in canvas pixels
     * @param {number} worldH   - total world height in canvas pixels
     */
    follow(targetX, targetY, worldW, worldH) {
      // Ideal top-left so the target is centered
      let idealX = targetX - this._viewW / 2;
      let idealY = targetY - this._viewH / 2;

      // Clamp so we never show outside the world
      const maxX = Math.max(0, worldW - this._viewW);
      const maxY = Math.max(0, worldH - this._viewH);

      this._targetX = Math.max(0, Math.min(idealX, maxX));
      this._targetY = Math.max(0, Math.min(idealY, maxY));
    }

    /**
     * Lerp camera position toward the follow target.
     * @param {number} dt - delta time in seconds
     */
    update(dt) {
      const alpha = 1 - Math.exp(-this._lerpSpeed * dt);
      this.x += (this._targetX - this.x) * alpha;
      this.y += (this._targetY - this.y) * alpha;
    }

    /**
     * Apply camera transform to ctx.
     * Call this before drawing world objects.
     * Must be paired with restoreCtx().
     * @param {CanvasRenderingContext2D} ctx
     */
    applyToCtx(ctx) {
      ctx.save();
      ctx.translate(-Math.round(this.x), -Math.round(this.y));
    }

    /**
     * Restore the canvas transform.
     * @param {CanvasRenderingContext2D} ctx
     */
    restoreCtx(ctx) {
      ctx.restore();
    }

    /** Viewport width */
    get viewW() { return this._viewW; }

    /** Viewport height */
    get viewH() { return this._viewH; }

    /** Lerp speed (can be changed at runtime) */
    get lerpSpeed()     { return this._lerpSpeed; }
    set lerpSpeed(val)  { this._lerpSpeed = val;  }

    /** Snap camera to target immediately (no lerp) */
    snapTo(x, y) {
      this.x = x;
      this.y = y;
      this._targetX = x;
      this._targetY = y;
    }
  }

  window.Camera = Camera;
}());
