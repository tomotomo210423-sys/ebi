/**
 * Projectile - all attack projectiles for player and enemies
 * クラゲライダー・カニィとプカプカの大冒険
 */
(function () {
  'use strict';

  const TILE_SIZE = 48;

  class Projectile {
    /**
     * @param {number} x       - initial world X (center)
     * @param {number} y       - initial world Y (center)
     * @param {number} vx      - horizontal velocity (px/s)
     * @param {number} vy      - vertical velocity (px/s)
     * @param {number} damage  - damage dealt on hit
     * @param {string} owner   - 'player' | 'enemy'
     * @param {string} type    - 'claw' | 'electric' | 'ink' | 'oilball' | 'spike'
     */
    constructor(x, y, vx, vy, damage, owner, type) {
      this.x      = x;
      this.y      = y;
      this.vx     = vx;
      this.vy     = vy;
      this.w      = 8;
      this.h      = 8;
      this.damage = damage;
      this.owner  = owner;   // 'player' | 'enemy'
      this.type   = type;    // 'claw' | 'electric' | 'ink' | 'oilball' | 'spike'
      this.alive  = true;

      // Per-type size overrides
      switch (type) {
        case 'claw':
          this.w = 12; this.h = 10;
          break;
        case 'electric':
          this.w = 14; this.h = 14;
          break;
        case 'ink':
          this.w = 10; this.h = 10;
          break;
        case 'oilball':
          this.w = 9; this.h = 9;
          break;
        case 'spike':
          this.w = 8; this.h = 12;
          break;
      }

      // Visual animation timer
      this._animTimer = 0;
      // Gravity flag (only ink/oilball arc slightly)
      this._gravScale = (type === 'ink' || type === 'oilball') ? 120 : 0;
      // Lifetime cap so projectiles don't fly forever
      this._lifetime  = 3.0;
    }

    /**
     * Update position and check tile collisions.
     * @param {number} dt
     * @param {object} tileMap - Physics.TileMap instance
     */
    update(dt, tileMap) {
      if (!this.alive) return;

      this._animTimer += dt;
      this._lifetime  -= dt;
      if (this._lifetime <= 0) {
        this.alive = false;
        return;
      }

      // Apply weak gravity to arcing types
      this.vy += this._gravScale * dt;

      // Move
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Tile collision check - use center of projectile
      if (tileMap) {
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        const ts = tileMap.tileSize || TILE_SIZE;

        const tx = Math.floor(cx / ts);
        const ty = Math.floor(cy / ts);

        const tile = tileMap.get(tx, ty);
        // Die on solid tiles (type 1)
        if (tile === 1) {
          this.alive = false;
          return;
        }

        // Also check world bounds
        if (
          this.x < -ts ||
          this.x > tileMap.worldWidth + ts ||
          this.y < -ts ||
          this.y > tileMap.worldHeight + ts
        ) {
          this.alive = false;
        }
      }
    }

    /**
     * Draw the projectile using simple canvas primitives.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} camX - camera X offset (world-to-screen)
     * @param {number} camY - camera Y offset (world-to-screen)
     */
    draw(ctx) {
      if (!this.alive) return;

      const sx = this.x;
      const sy = this.y;
      const cx = sx + this.w / 2;
      const cy = sy + this.h / 2;
      const t  = this._animTimer;

      ctx.save();

      switch (this.type) {

        // ------------------------------------------------------------------
        // CLAW - orange flash with slight flicker
        // ------------------------------------------------------------------
        case 'claw': {
          const alpha = 0.9 - (t % 0.1) * 4;
          ctx.globalAlpha = Math.max(0.3, alpha);

          // Outer glow
          ctx.fillStyle = '#FF8C00';
          ctx.beginPath();
          ctx.ellipse(cx, cy, this.w / 2 + 2, this.h / 2 + 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Core bright orange
          ctx.fillStyle = '#FFCC44';
          ctx.beginPath();
          ctx.ellipse(cx, cy, this.w / 2 - 1, this.h / 2 - 1, 0, 0, Math.PI * 2);
          ctx.fill();

          // Small bright center
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 2, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        // ------------------------------------------------------------------
        // ELECTRIC - yellow arc with animated rotation
        // ------------------------------------------------------------------
        case 'electric': {
          ctx.globalAlpha = 0.85 + Math.sin(t * 20) * 0.15;

          // Outer electric aura
          ctx.shadowColor = '#FFFF00';
          ctx.shadowBlur  = 8;
          ctx.fillStyle   = '#FFEE00';
          ctx.beginPath();
          ctx.ellipse(cx, cy, this.w / 2 + 1, this.h / 2 + 1, t * 6, 0, Math.PI * 2);
          ctx.fill();

          // Inner white core
          ctx.shadowBlur = 0;
          ctx.fillStyle  = '#FFFFFF';
          ctx.beginPath();
          ctx.ellipse(cx, cy, 3, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Zigzag arc lines
          ctx.strokeStyle = '#FFFF88';
          ctx.lineWidth   = 1.5;
          ctx.beginPath();
          const r = this.w / 2;
          for (let i = 0; i < 4; i++) {
            const angle = (t * 8 + i * Math.PI / 2);
            const x1 = cx + Math.cos(angle) * (r - 2);
            const y1 = cy + Math.sin(angle) * (r - 2);
            const x2 = cx + Math.cos(angle + 0.4) * (r + 2);
            const y2 = cy + Math.sin(angle + 0.4) * (r + 2);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.stroke();
          break;
        }

        // ------------------------------------------------------------------
        // INK - black blob with wobble
        // ------------------------------------------------------------------
        case 'ink': {
          ctx.globalAlpha = 0.9;

          const wobble = Math.sin(t * 12) * 1.5;

          // Outer dark aura
          ctx.fillStyle = '#1A0A2E';
          ctx.beginPath();
          ctx.ellipse(
            cx, cy,
            this.w / 2 + 1 + wobble,
            this.h / 2 + 1 - wobble * 0.5,
            0, 0, Math.PI * 2
          );
          ctx.fill();

          // Main black/purple blob
          ctx.fillStyle = '#330055';
          ctx.beginPath();
          ctx.ellipse(
            cx, cy,
            this.w / 2 + wobble * 0.5,
            this.h / 2 - wobble * 0.3,
            0, 0, Math.PI * 2
          );
          ctx.fill();

          // Ink shine spot
          ctx.fillStyle = 'rgba(180, 100, 255, 0.4)';
          ctx.beginPath();
          ctx.ellipse(cx - 1, cy - 2, 2, 1.5, -0.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        // ------------------------------------------------------------------
        // OIL BALL - brown ball with drip
        // ------------------------------------------------------------------
        case 'oilball': {
          ctx.globalAlpha = 0.92;

          // Shadow/trail
          ctx.fillStyle = 'rgba(80, 40, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(cx - this.vx * 0.02, cy, this.w / 2 + 2, this.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Main brown ball
          ctx.fillStyle = '#5C3A1E';
          ctx.beginPath();
          ctx.ellipse(cx, cy, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();

          // Oily sheen
          ctx.fillStyle = '#8B5A2B';
          ctx.beginPath();
          ctx.ellipse(cx, cy, this.w / 2 - 1, this.h / 2 - 1, 0, 0, Math.PI * 2);
          ctx.fill();

          // Shine spot
          ctx.fillStyle = 'rgba(255, 200, 120, 0.5)';
          ctx.beginPath();
          ctx.ellipse(cx - 1, cy - 2, 2, 1.5, -0.4, 0, Math.PI * 2);
          ctx.fill();

          // Drip
          ctx.fillStyle = '#5C3A1E';
          ctx.beginPath();
          ctx.moveTo(cx, cy + this.h / 2 - 1);
          ctx.lineTo(cx - 1.5, cy + this.h / 2 + 3);
          ctx.lineTo(cx + 1.5, cy + this.h / 2 + 3);
          ctx.closePath();
          ctx.fill();
          break;
        }

        // ------------------------------------------------------------------
        // SPIKE - gray sharp spike
        // ------------------------------------------------------------------
        case 'spike': {
          ctx.globalAlpha = 0.9;

          const angle = Math.atan2(this.vy, this.vx);
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          // Spike body
          ctx.fillStyle = '#888899';
          ctx.beginPath();
          ctx.moveTo(this.w / 2 + 2, 0);
          ctx.lineTo(-this.w / 2, -this.h / 2 + 1);
          ctx.lineTo(-this.w / 2 + 2, 0);
          ctx.lineTo(-this.w / 2, this.h / 2 - 1);
          ctx.closePath();
          ctx.fill();

          // Spike highlight
          ctx.fillStyle = '#CCCCDD';
          ctx.beginPath();
          ctx.moveTo(this.w / 2 + 2, 0);
          ctx.lineTo(-this.w / 2, -this.h / 2 + 1);
          ctx.lineTo(-this.w / 2 + 2, 0);
          ctx.closePath();
          ctx.fill();
          break;
        }

        default: {
          // Fallback: simple white dot
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }

      ctx.restore();
    }
  }

  window.Projectile = Projectile;

}());
