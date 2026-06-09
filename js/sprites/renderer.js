/**
 * SpriteRenderer - pixel-art drawing utilities and Animator class
 */
(function () {
  'use strict';

  /**
   * Draw a single sprite frame.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number[][]} frame     - 2D array [row][col] of palette color indices
   * @param {number}     x         - top-left canvas x position
   * @param {number}     y         - top-left canvas y position
   * @param {string[]}   palette   - array of CSS color strings; index 0 = transparent
   * @param {number}     [scale=3] - canvas pixels per art pixel
   * @param {boolean}    [flipX=false] - mirror horizontally
   */
  function drawSprite(ctx, frame, x, y, palette, scale, flipX) {
    if (scale === undefined) scale = 3;
    if (flipX === undefined) flipX = false;

    const rows = frame.length;
    if (rows === 0) return;
    const cols = frame[0].length;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = frame[row][col];
        if (idx === 0) continue; // transparent
        const color = palette[idx];
        if (!color) continue;

        const drawCol = flipX ? (cols - 1 - col) : col;
        ctx.fillStyle = color;
        ctx.fillRect(
          x + drawCol * scale,
          y + row * scale,
          scale,
          scale
        );
      }
    }
  }

  /**
   * Draw a frame from a frames array by index.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number[][][]} frames    - array of frames (each frame is 2D array)
   * @param {number}       frameIdx  - which frame to draw (wraps automatically)
   * @param {number}       x
   * @param {number}       y
   * @param {string[]}     palette
   * @param {number}       [scale=3]
   * @param {boolean}      [flipX=false]
   */
  function drawSpriteFrame(ctx, frames, frameIdx, x, y, palette, scale, flipX) {
    if (!frames || frames.length === 0) return;
    const idx = ((frameIdx % frames.length) + frames.length) % frames.length;
    drawSprite(ctx, frames[idx], x, y, palette, scale, flipX);
  }

  // ------------------------------------------------------------------ //
  // Animator
  // ------------------------------------------------------------------ //

  class Animator {
    /**
     * @param {number} [fps=8] - animation playback speed in frames-per-second
     */
    constructor(fps) {
      this._fps        = (fps !== undefined) ? fps : 8;
      this._frameCount = 1;
      this._time       = 0;
      this._frame      = 0;
    }

    /**
     * Advance the animation by dt seconds.
     * @param {number} dt
     */
    update(dt) {
      if (this._frameCount <= 1) {
        this._frame = 0;
        return;
      }
      this._time += dt;
      const frameDur = 1 / this._fps;
      while (this._time >= frameDur) {
        this._time -= frameDur;
        this._frame = (this._frame + 1) % this._frameCount;
      }
    }

    /** Current frame index (0-based, always within [0, frameCount-1]) */
    get frame() { return this._frame; }

    /**
     * Set the total number of frames to cycle through.
     * @param {number} n
     */
    setFrameCount(n) {
      this._frameCount = Math.max(1, n | 0);
      // Clamp current frame index
      if (this._frame >= this._frameCount) {
        this._frame = 0;
        this._time  = 0;
      }
    }

    /** Reset back to frame 0 */
    reset() {
      this._frame = 0;
      this._time  = 0;
    }

    /** Get/set fps at runtime */
    get fps()    { return this._fps; }
    set fps(val) { this._fps = val;  }
  }

  // ------------------------------------------------------------------ //
  // Export
  // ------------------------------------------------------------------ //

  window.SpriteRenderer = {
    drawSprite,
    drawSpriteFrame,
    Animator,
  };
}());
