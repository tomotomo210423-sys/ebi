/**
 * Hazard / Particle system - visual effects for combos, hits, etc.
 * クラゲライダー・カニィとプカプカの大冒険
 */
(function () {
  'use strict';

  const GRAVITY = 900;

  // ======================================================================
  // Particle
  // ======================================================================

  class Particle {
    /**
     * @param {number} x
     * @param {number} y
     * @param {string} color    - CSS color string
     * @param {number} size     - radius in pixels
     * @param {number} vx       - initial horizontal velocity
     * @param {number} vy       - initial vertical velocity
     * @param {number} life     - lifetime in seconds
     * @param {string} [subtype] - optional: 'spark' uses gravity, 'arc' does not
     */
    constructor(x, y, color, size, vx, vy, life, subtype) {
      this.x       = x;
      this.y       = y;
      this.color   = color;
      this.size    = size;
      this.vx      = vx;
      this.vy      = vy;
      this.life    = life;
      this.maxLife = life;
      this.subtype = subtype || 'default';
    }

    /**
     * @param {number} dt - delta time in seconds
     */
    update(dt) {
      // 'spark' type is affected by gravity
      if (this.subtype === 'spark') {
        this.vy += GRAVITY * 0.35 * dt;
      }

      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Apply friction for most types
      if (this.subtype !== 'arc') {
        this.vx *= 1 - dt * 2.5;
      }

      this.life -= dt;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
      if (this.life <= 0) return;

      const t     = this.life / this.maxLife;       // 1 -> 0
      const alpha = t;                               // fade out linearly
      const size  = this.size * (0.4 + t * 0.6);   // shrink as it fades

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      if (this.subtype === 'arc') {
        // Electric arc: draw as a short line segment
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = Math.max(1, size * 0.5);
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 4;
        ctx.beginPath();
        ctx.moveTo(this.x - this.vx * 0.04, this.y - this.vy * 0.04);
        ctx.lineTo(this.x + this.vx * 0.04, this.y + this.vy * 0.04);
        ctx.stroke();
      } else {
        // Default: filled circle
        ctx.fillStyle   = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = size * 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, size), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ======================================================================
  // HazardManager
  // ======================================================================

  class HazardManager {
    constructor() {
      /** @type {Particle[]} */
      this._particles = [];
    }

    /**
     * Spawn particles at world position (x, y).
     *
     * Types:
     *   'hit'      - 4-6 orange sparks (claw / damage hit)
     *   'synchro'  - 8 yellow/electric spark burst (combo)
     *   'splash'   - 5-7 blue water drop particles
     *   'electric' - 6 white/yellow arc particles
     *   'defeat'   - 10-12 rainbow particle burst (enemy defeated)
     *
     * @param {number} x
     * @param {number} y
     * @param {string} type
     */
    spawn(x, y, type) {
      switch (type) {

        // ------------------------------------------------------------------
        case 'hit': {
          const count = 4 + Math.floor(Math.random() * 3);   // 4-6
          for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 80;
            const color = Math.random() < 0.6 ? '#FF8800' : '#FFCC22';
            this._particles.push(new Particle(
              x + (Math.random() - 0.5) * 6,
              y + (Math.random() - 0.5) * 6,
              color,
              2 + Math.random() * 2,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed - 20,
              0.25 + Math.random() * 0.2,
              'spark'
            ));
          }
          break;
        }

        // ------------------------------------------------------------------
        case 'synchro': {
          const count = 8;
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const speed = 90 + Math.random() * 110;
            const color = (i % 3 === 0) ? '#FFFFFF' : (i % 3 === 1 ? '#FFFF44' : '#88DDFF');
            this._particles.push(new Particle(
              x, y,
              color,
              2.5 + Math.random() * 2.5,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              0.4 + Math.random() * 0.25,
              'spark'
            ));
          }
          // Extra arcs
          for (let i = 0; i < 4; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            this._particles.push(new Particle(
              x + (Math.random() - 0.5) * 10,
              y + (Math.random() - 0.5) * 10,
              '#CCFFFF',
              1.5,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              0.3 + Math.random() * 0.2,
              'arc'
            ));
          }
          break;
        }

        // ------------------------------------------------------------------
        case 'splash': {
          const count = 5 + Math.floor(Math.random() * 3);  // 5-7
          for (let i = 0; i < count; i++) {
            const angle = -Math.PI + (Math.random() - 0.5) * Math.PI * 1.4;
            const speed = 50 + Math.random() * 70;
            const color = (Math.random() < 0.5) ? '#4488FF' : '#88CCFF';
            this._particles.push(new Particle(
              x + (Math.random() - 0.5) * 8,
              y,
              color,
              2 + Math.random() * 2.5,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              0.3 + Math.random() * 0.25,
              'spark'
            ));
          }
          break;
        }

        // ------------------------------------------------------------------
        case 'electric': {
          const count = 6;
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 50 + Math.random() * 80;
            const color = (Math.random() < 0.6) ? '#FFFF88' : '#FFFFFF';
            this._particles.push(new Particle(
              x + (Math.random() - 0.5) * 12,
              y + (Math.random() - 0.5) * 12,
              color,
              1.5 + Math.random() * 1.5,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              0.3 + Math.random() * 0.2,
              'arc'
            ));
          }
          break;
        }

        // ------------------------------------------------------------------
        case 'defeat': {
          const count = 10 + Math.floor(Math.random() * 3);  // 10-12
          const rainbow = [
            '#FF4444', '#FF8844', '#FFFF44',
            '#44FF44', '#44FFFF', '#4488FF',
            '#AA44FF', '#FF44AA', '#FFFFFF',
          ];
          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
            const speed = 80 + Math.random() * 130;
            const color = rainbow[Math.floor(Math.random() * rainbow.length)];
            this._particles.push(new Particle(
              x + (Math.random() - 0.5) * 8,
              y + (Math.random() - 0.5) * 8,
              color,
              2 + Math.random() * 3,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed - 30,
              0.5 + Math.random() * 0.4,
              'spark'
            ));
          }
          break;
        }

        default:
          break;
      }
    }

    /**
     * @param {number} dt
     */
    update(dt) {
      for (let i = this._particles.length - 1; i >= 0; i--) {
        const p = this._particles[i];
        p.update(dt);
        if (p.life <= 0) {
          this._particles.splice(i, 1);
        }
      }
    }

    /**
     * Draw all particles. Call AFTER camera transform is applied so
     * particles are drawn in world-space; or call before transform
     * if the caller passes screen-space coordinates to spawn().
     * Convention: spawn() receives world coordinates, draw() is called
     * inside camera transform.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
      for (let i = 0; i < this._particles.length; i++) {
        this._particles[i].draw(ctx);
      }
    }

    /** Number of live particles (useful for debugging / perf monitoring) */
    get count() {
      return this._particles.length;
    }

    /** Clear all particles */
    clear() {
      this._particles.length = 0;
    }
  }

  // ======================================================================
  // Export
  // ======================================================================

  window.Particle     = Particle;
  window.HazardManager = HazardManager;

}());
