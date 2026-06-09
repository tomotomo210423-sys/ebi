/**
 * Boss classes for クラゲライダー・カニィとプカプカの大冒険
 * Stage 1 Boss: Giant Polluted Octopus (巨大汚染タコ)
 */
(function () {
  'use strict';

  const GRAVITY  = 900;
  const MAX_FALL = 600;
  const TILE_SIZE = 48;

  // ========================================================================
  // Base Boss class
  // ========================================================================

  class Boss {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} hp
     */
    constructor(x, y, w, h, hp) {
      this.x    = x;
      this.y    = y;
      this.w    = w;
      this.h    = h;
      this.vx   = 0;
      this.vy   = 0;
      this.hp   = hp;
      this.maxHp = hp;
      this.phase = 1;
      this.alive = true;

      this.onGround       = false;
      this.facingRight    = false;

      this.invincibleTimer = 0;
      this.attackTimer    = 0;
      this.phaseTimer     = 0;

      this._flashTimer    = 0;
      this._phaseFlash    = 0;   // short flash on phase transition
    }

    /**
     * Apply damage and trigger phase changes at 66% and 33% HP.
     * Returns true if the boss was killed.
     * @param {number} amount
     * @param {number} [knockDirX=0]
     */
    takeDamage(amount, knockDirX) {
      if (!this.alive) return false;
      if (this.invincibleTimer > 0) return false;

      this.hp -= amount;
      this.invincibleTimer = 0.35;
      this._flashTimer     = 0.35;

      if (this.hp <= 0) {
        this.hp    = 0;
        this.alive = false;
        return true;
      }

      // Phase transitions
      const pct = this.hp / this.maxHp;
      const newPhase = pct > 0.66 ? 1 : pct > 0.33 ? 2 : 3;
      if (newPhase > this.phase) {
        this.phase      = newPhase;
        this._phaseFlash = 1.0;
        this._onPhaseChange(newPhase);
      }

      return false;
    }

    /** Override in subclasses to react to phase transitions */
    _onPhaseChange(newPhase) { /* override */ }

    /** Subclass must implement */
    update(dt, player, projectiles, tileMap) { /* override */ }

    /** Subclass must implement */
    draw(ctx, camX, camY) { /* override */ }

    _tickTimers(dt) {
      if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
      if (this._flashTimer     > 0) this._flashTimer     -= dt;
      if (this._phaseFlash     > 0) this._phaseFlash     -= dt;
    }

    _shouldFlash() {
      if (this._flashTimer <= 0) return false;
      return Math.floor(this._flashTimer / 0.06) % 2 === 0;
    }

    /**
     * Draw HP bar for the boss (wider, displayed at top of boss sprite).
     */
    _drawHpBar(ctx, sx, sy) {
      const barW = this.w;
      const barH = 6;
      const by   = sy - 12;

      // Track
      ctx.fillStyle = '#330000';
      ctx.fillRect(sx, by, barW, barH);

      // Fill
      const fill = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle =
        this.phase === 3 ? '#EE2200' :
        this.phase === 2 ? '#EEAA00' :
                           '#00CC44';
      ctx.fillRect(sx, by, Math.round(barW * fill), barH);

      // Border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth   = 1;
      ctx.strokeRect(sx, by, barW, barH);

      // Phase markers
      const m1 = Math.round(barW * 0.66);
      const m2 = Math.round(barW * 0.33);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(sx + m1, by);
      ctx.lineTo(sx + m1, by + barH);
      ctx.moveTo(sx + m2, by);
      ctx.lineTo(sx + m2, by + barH);
      ctx.stroke();
    }
  }

  // ========================================================================
  // OctopusBoss - Stage 1: Giant Polluted Octopus (巨大汚染タコ)
  // ========================================================================

  class OctopusBoss extends Boss {
    /**
     * @param {number} x   - world X (top-left)
     * @param {number} y   - world Y (top-left)
     */
    constructor(x, y) {
      // 24×20 art × 3 scale = 72×60 canvas pixels
      super(x, y, 72, 60, 30);

      // Starting position for patrol sway
      this._startX = x;

      // Phase timers and cooldowns
      this._inkTimer          = 0;
      this._tentacleTimer     = 0;
      this._tentacleActive    = false;
      this._tentacleDuration  = 0;
      this._tentacleWarning   = false;  // flash before slam
      this._tentacleWarnTimer = 0;

      // Phase 3 charge
      this._chargeTimer       = 0;
      this._isCharging        = false;
      this._chargeDuration    = 0;
      this._chargeTargetX     = 0;

      // Sway oscillation
      this._swayTimer = 0;

      // Body animation
      this._bodyAnim     = new SpriteRenderer.Animator(5);
      this._angryAnim    = new SpriteRenderer.Animator(8);
      this._tentacleAnim = new SpriteRenderer.Animator(6);
      const fc = (typeof BOSS_OCTO_FRAMES !== 'undefined' && BOSS_OCTO_FRAMES) ?
                  BOSS_OCTO_FRAMES.length : 2;
      this._bodyAnim.setFrameCount(fc);
      this._angryAnim.setFrameCount(fc);
      this._tentacleAnim.setFrameCount(fc);

      // Phase-based speeds / cooldowns
      this._baseSpeed   = 28;
      this._inkCooldown = 2.5;
      this._tentacleCooldown = 4.0;

      // Tentacle hitbox (extended below body)
      this.tentacleHitbox = null;

      // Visual state
      this._angerAlpha = 0;   // red tint amount for phase 3
    }

    _onPhaseChange(newPhase) {
      if (newPhase === 2) {
        this._inkCooldown      = 1.5;
        this._tentacleCooldown = 3.5;
        this._baseSpeed        = 40;
      }
      if (newPhase === 3) {
        this._inkCooldown      = 1.2;
        this._tentacleCooldown = 2.8;
        this._baseSpeed        = 60;
        this._chargeTimer      = 3.0;
      }
    }

    update(dt, player, projectiles, tileMap) {
      if (!this.alive) return;
      this._tickTimers(dt);

      this._swayTimer  += dt;
      this._inkTimer   -= dt;
      this._tentacleTimer -= dt;
      if (this._chargeTimer > 0) this._chargeTimer -= dt;

      // ---- Movement ----
      this._updateMovement(dt, player, tileMap);

      // ---- Attacks ----
      this._updateAttacks(dt, player, projectiles);

      // ---- Tentacle hitbox ----
      if (this._tentacleActive) {
        this.tentacleHitbox = {
          x: this.x + 6,
          y: this.y + this.h,
          w: this.w - 12,
          h: 36
        };
      } else {
        this.tentacleHitbox = null;
      }

      // ---- Animators ----
      this._bodyAnim.update(dt);
      this._angryAnim.update(dt);
      this._tentacleAnim.update(dt);

      // ---- Anger alpha (phase 3) ----
      if (this.phase === 3) {
        this._angerAlpha = 0.15 + 0.15 * Math.sin(this._swayTimer * 6);
      } else {
        this._angerAlpha = 0;
      }
    }

    _updateMovement(dt, player, tileMap) {
      const phase = this.phase;
      const speed = this._baseSpeed;

      if (this._isCharging) {
        // Phase 3 charge: rush toward target X
        this._chargeDuration -= dt;
        const dx = this._chargeTargetX - this.x;
        this.vx  = Math.sign(dx) * speed * 2.5;
        this.vy  = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (tileMap) Physics.resolveEntityTileCollision(this, tileMap);

        if (this._chargeDuration <= 0 || Math.abs(dx) < 8) {
          this._isCharging = false;
          this.vx = 0;
        }
      } else {
        // Sinusoidal sway left/right around start position
        const range = phase === 1 ? 80 : phase === 2 ? 110 : 140;
        const freq  = phase === 1 ? 0.4 : phase === 2 ? 0.55 : 0.7;
        const targetX = this._startX + Math.sin(this._swayTimer * freq) * range;
        const dx = targetX - this.x;
        this.vx  = Math.sign(dx) * Math.min(Math.abs(dx) * 2, speed);

        this.facingRight = (player) ? (player.x + player.w / 2) > (this.x + this.w / 2) : false;

        // Gravity
        this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (tileMap) Physics.resolveEntityTileCollision(this, tileMap);

        // Clamp x near start
        if (this.x < this._startX - range - 20) { this.x = this._startX - range - 20; this.vx = 0; }
        if (this.x > this._startX + range + 20) { this.x = this._startX + range + 20; this.vx = 0; }
      }
    }

    _updateAttacks(dt, player, projectiles) {
      if (!player || !projectiles) return;

      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;
      const pcx = player.x + player.w / 2;
      const pcy = player.y + player.h / 2;

      // ---- Ink attack ----
      if (this._inkTimer <= 0) {
        this._inkTimer = this._inkCooldown;
        this._fireInk(cx, cy, pcx, pcy, projectiles);
      }

      // ---- Tentacle slam (phase 2+) ----
      if (this.phase >= 2) {
        if (this._tentacleActive) {
          this._tentacleDuration -= dt;
          if (this._tentacleDuration <= 0) {
            this._tentacleActive  = false;
            this._tentacleWarning = false;
          }
        } else if (this._tentacleWarnTimer > 0) {
          this._tentacleWarnTimer -= dt;
          if (this._tentacleWarnTimer <= 0) {
            this._tentacleWarning  = false;
            this._tentacleActive   = true;
            this._tentacleDuration = 0.8;
          }
        } else if (this._tentacleTimer <= 0) {
          this._tentacleTimer     = this._tentacleCooldown;
          this._tentacleWarning   = true;
          this._tentacleWarnTimer = 0.5;
        }
      }

      // ---- Phase 3 charge ----
      if (this.phase === 3 && this._chargeTimer <= 0 && !this._isCharging) {
        this._isCharging      = true;
        this._chargeDuration  = 0.6;
        this._chargeTargetX   = pcx - this.w / 2;
        this._chargeTimer     = 4.0 + Math.random() * 2.0;
      }
    }

    _fireInk(fromX, fromY, toX, toY, projectiles) {
      const phase = this.phase;
      const shots = phase === 3 ? 3 : phase === 2 ? 2 : 1;
      const spread = 0.25;  // radians spread for multi-shot

      for (let i = 0; i < shots; i++) {
        const angle  = Math.atan2(toY - fromY, toX - fromX);
        const offset = shots > 1 ? (i - (shots - 1) / 2) * spread : 0;
        const a      = angle + offset;
        const speed  = 120 + Math.random() * 20;
        projectiles.push(new Projectile(
          fromX, fromY,
          Math.cos(a) * speed,
          Math.sin(a) * speed,
          1,
          'enemy',
          'ink'
        ));
      }
    }

    draw(ctx, camX, camY) {
      if (!this.alive) return;

      const sx = Math.round(this.x - camX);
      const sy = Math.round(this.y - camY);
      const flipX = !this.facingRight;

      // Tentacle warning flash line
      if (this._tentacleWarning) {
        const blinkOn = Math.floor(this._tentacleWarnTimer / 0.08) % 2 === 0;
        if (blinkOn) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.strokeStyle = '#FF4400';
          ctx.lineWidth   = 3;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(sx + 6, sy + this.h);
          ctx.lineTo(sx + 6, sy + this.h + 36);
          ctx.moveTo(sx + this.w - 6, sy + this.h);
          ctx.lineTo(sx + this.w - 6, sy + this.h + 36);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }
      }

      // Tentacle slam hitbox visual
      if (this._tentacleActive && this.tentacleHitbox) {
        ctx.save();
        const tb = this.tentacleHitbox;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle   = '#882200';

        // Draw tentacle as two prongs
        const leftX  = sx + 6;
        const rightX = sx + this.w - 18;
        const topY   = sy + this.h - 4;
        const botY   = sy + this.h + 36;
        ctx.fillRect(leftX, topY, 12, botY - topY);
        ctx.fillRect(rightX, topY, 12, botY - topY);

        // Suckers
        ctx.fillStyle = '#CC4400';
        for (let row = 0; row < 4; row++) {
          const ry = topY + row * 9 + 4;
          ctx.beginPath();
          ctx.arc(leftX  + 6, ry, 3, 0, Math.PI * 2);
          ctx.arc(rightX + 6, ry, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Skip body if hit flash
      if (!this._shouldFlash()) {
        if (typeof BOSS_OCTO_FRAMES !== 'undefined' && BOSS_OCTO_FRAMES && BOSS_OCTO_FRAMES.length > 0 &&
            typeof BOSS_OCTO_PAL !== 'undefined' && BOSS_OCTO_PAL) {
          const anim = this.phase === 3 ? this._angryAnim : this._bodyAnim;
          SpriteRenderer.drawSpriteFrame(ctx, BOSS_OCTO_FRAMES, anim.frame, sx, sy, BOSS_OCTO_PAL, 3, flipX);
        } else {
          this._drawFallback(ctx, sx, sy, flipX);
        }

        // Phase 3 red anger tint overlay
        if (this._angerAlpha > 0) {
          ctx.save();
          ctx.globalAlpha  = this._angerAlpha;
          ctx.fillStyle    = '#FF2200';
          ctx.fillRect(sx, sy, this.w, this.h);
          ctx.restore();
        }

        // Phase transition flash
        if (this._phaseFlash > 0) {
          ctx.save();
          ctx.globalAlpha = this._phaseFlash * 0.6;
          ctx.fillStyle   = '#FFFFFF';
          ctx.fillRect(sx, sy, this.w, this.h);
          ctx.restore();
        }
      }

      this._drawHpBar(ctx, sx, sy);

      // Boss name tag on first contact
      if (this.hp === this.maxHp || this.phase > 1) {
        // Only draw label when at full HP (just spawned / first frame)
      }
    }

    _drawFallback(ctx, sx, sy, flipX) {
      ctx.save();

      // Body blob - large oval
      const bodyColor =
        this.phase === 3 ? '#882222' :
        this.phase === 2 ? '#663355' :
                           '#445566';
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.ellipse(
        sx + this.w / 2,
        sy + this.h * 0.4,
        this.w / 2 - 2,
        this.h * 0.45,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // Mantle / head dome
      ctx.fillStyle = '#556677';
      ctx.beginPath();
      ctx.ellipse(
        sx + this.w / 2,
        sy + this.h * 0.28,
        this.w / 2 - 6,
        this.h * 0.28,
        0, 0, Math.PI * 2
      );
      ctx.fill();

      // Eyes
      const eyeOffX = flipX ? -10 : 10;
      ctx.fillStyle = '#FFEE00';
      ctx.beginPath();
      ctx.arc(sx + this.w / 2 - eyeOffX, sy + this.h * 0.28, 6, 0, Math.PI * 2);
      ctx.arc(sx + this.w / 2 + eyeOffX, sy + this.h * 0.28, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(sx + this.w / 2 - eyeOffX + (flipX ? -2 : 2), sy + this.h * 0.28, 3, 0, Math.PI * 2);
      ctx.arc(sx + this.w / 2 + eyeOffX + (flipX ? -2 : 2), sy + this.h * 0.28, 3, 0, Math.PI * 2);
      ctx.fill();

      // Tentacles hanging down (8 of them)
      const tentCount = 8;
      const bodyBottom = sy + this.h * 0.7;
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth   = 4;
      for (let i = 0; i < tentCount; i++) {
        const tx = sx + 8 + (i / (tentCount - 1)) * (this.w - 16);
        const wave = Math.sin(this._swayTimer * 3 + i * 0.8) * 6;
        ctx.beginPath();
        ctx.moveTo(tx, bodyBottom);
        ctx.quadraticCurveTo(
          tx + wave,
          bodyBottom + 14,
          tx + wave * 1.5,
          bodyBottom + 28
        );
        ctx.stroke();
      }

      // Oil splotch / pollution markings
      ctx.globalAlpha = 0.35;
      ctx.fillStyle   = '#003300';
      const splotches = [[12, 18, 10, 7], [40, 30, 8, 6], [22, 42, 12, 8]];
      for (const [ox, oy, rw, rh] of splotches) {
        ctx.beginPath();
        ctx.ellipse(sx + ox, sy + oy, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ========================================================================
  // Export
  // ========================================================================

  window.Boss        = Boss;
  window.OctopusBoss = OctopusBoss;

}());
