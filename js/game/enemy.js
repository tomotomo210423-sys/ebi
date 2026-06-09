/**
 * Enemy classes for クラゲライダー・カニィとプカプカの大冒険
 * Stages 1 and 2 enemies with patrol AI, attack behaviours, and knockback.
 */
(function () {
  'use strict';

  const GRAVITY  = 900;
  const MAX_FALL = 600;
  const TILE_SIZE = 48;

  // ========================================================================
  // Base Enemy class
  // ========================================================================

  class Enemy {
    /**
     * @param {number} x       - world X (top-left)
     * @param {number} y       - world Y (top-left)
     * @param {number} w       - hitbox width in canvas pixels
     * @param {number} h       - hitbox height in canvas pixels
     * @param {number} hp      - starting / max HP
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
      this.alive = true;

      // Movement / orientation
      this.onGround     = false;
      this.facingRight  = false;   // start facing left so patrol goes left first

      // Timers
      this.invincibleTimer = 0;
      this.flashTimer      = 0;    // visual flash after hit

      // Patrol state
      this._patrolSpeed    = 40;   // canvas px/s
      this._patrolDir      = -1;   // -1 = left, +1 = right
      this._dirFlipCooldown = 0;   // prevents double-flip in same frame

      // Animators
      this._idleAnim   = new SpriteRenderer.Animator(6);
      this._walkAnim   = new SpriteRenderer.Animator(8);
      this._attackAnim = new SpriteRenderer.Animator(8);
      this._isMoving   = false;
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * Reduce HP, apply knockback, return true if enemy was killed.
     * @param {number} amount
     * @param {number} [knockDirX=0] - +1 or -1 for horizontal knockback direction
     */
    takeDamage(amount, knockDirX) {
      if (!this.alive) return false;
      if (this.invincibleTimer > 0) return false;

      this.hp -= amount;
      this.invincibleTimer = 0.5;
      this.flashTimer      = 0.5;

      // Apply knockback
      const kd = (knockDirX !== undefined) ? knockDirX : (this.facingRight ? -1 : 1);
      this.vx = kd * 120;
      this.vy = -80;

      if (this.hp <= 0) {
        this.hp    = 0;
        this.alive = false;
        return true;  // killed
      }
      return false;
    }

    // ------------------------------------------------------------------
    // Subclass stubs – must be overridden
    // ------------------------------------------------------------------

    /** @param {number} dt @param {object} player @param {Projectile[]} projectiles @param {object} tileMap */
    update(dt, player, projectiles, tileMap) { /* override */ }

    /** @param {CanvasRenderingContext2D} ctx @param {number} camX @param {number} camY */
    draw(ctx)                                 { /* override */ }

    // ------------------------------------------------------------------
    // Shared helpers
    // ------------------------------------------------------------------

    /**
     * Patrol movement: move in current direction, apply gravity,
     * resolve tile collision, flip direction at walls or ledge edges.
     */
    _movePatrol(dt, tileMap) {
      // Horizontal movement
      this.vx = this._patrolDir * this._patrolSpeed;

      // Apply gravity
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

      // Move
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // Resolve tiles
      if (tileMap) {
        Physics.resolveEntityTileCollision(this, tileMap);
      }

      // Flip direction on wall hit (vx killed by resolver)
      if (tileMap && this.vx === 0 && this._patrolDir !== 0 && this._dirFlipCooldown <= 0) {
        this._patrolDir *= -1;
        this.facingRight = (this._patrolDir > 0);
        this._dirFlipCooldown = 0.25;
      }

      // Flip direction at ledge edge (no ground ahead)
      if (this.onGround && tileMap && this._dirFlipCooldown <= 0) {
        const ahead = this.x + (this._patrolDir > 0 ? this.w + 2 : -2);
        const below = this.y + this.h + 4;
        const tx    = Math.floor(ahead / TILE_SIZE);
        const ty    = Math.floor(below / TILE_SIZE);
        if (tileMap.get(tx, ty) === 0) {
          this._patrolDir  *= -1;
          this.facingRight  = (this._patrolDir > 0);
          this._dirFlipCooldown = 0.25;
        }
      }

      this._isMoving = true;
    }

    /**
     * Decrement shared timers.
     */
    _tickTimers(dt) {
      if (this.invincibleTimer  > 0) this.invincibleTimer  -= dt;
      if (this.flashTimer       > 0) this.flashTimer       -= dt;
      if (this._dirFlipCooldown > 0) this._dirFlipCooldown -= dt;
    }

    /**
     * Draw a simple HP bar above the enemy.
     */
    _drawHpBar(ctx, sx, sy) {
      const barW = this.w;
      const barH = 4;
      const by   = sy - 8;

      ctx.fillStyle = '#440000';
      ctx.fillRect(sx, by, barW, barH);

      const fill = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = fill > 0.5 ? '#00CC44' : fill > 0.25 ? '#EEAA00' : '#EE2200';
      ctx.fillRect(sx, by, Math.round(barW * fill), barH);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth   = 1;
      ctx.strokeRect(sx, by, barW, barH);
    }

    /**
     * Apply flash effect: skip draw if invincible and flash phase is odd.
     */
    _shouldFlash() {
      if (this.flashTimer <= 0) return false;
      return Math.floor(this.flashTimer / 0.08) % 2 === 0;
    }
  }

  // ========================================================================
  // Oily - stage 1 oil blob
  // ========================================================================

  class Oily extends Enemy {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      super(x, y, 24, 24, 2);   // 8×8 art × 3 scale
      this.damage        = 1;
      this._patrolSpeed  = 35;
      this._shootTimer   = 1.5 + Math.random() * 1.5;  // stagger initial shot
      this._shootCooldown = 3.0;
      this._idleAnim     = new SpriteRenderer.Animator(5);
      this._walkAnim     = new SpriteRenderer.Animator(6);
      this._idleAnim.setFrameCount(
        (typeof OILY_FRAMES !== 'undefined' && OILY_FRAMES) ? OILY_FRAMES.length : 2
      );
      this._walkAnim.setFrameCount(
        (typeof OILY_FRAMES !== 'undefined' && OILY_FRAMES) ? OILY_FRAMES.length : 2
      );
      this._animTimer = 0;
    }

    update(dt, player, projectiles, tileMap) {
      if (!this.alive) return;
      this._tickTimers(dt);

      // Patrol
      this._movePatrol(dt, tileMap);

      // Shoot oil ball when player is nearby
      if (player) {
        const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
        const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        this._shootTimer -= dt;
        if (this._shootTimer <= 0 && dist < 200) {
          this._shootTimer = this._shootCooldown;
          if (projectiles) {
            const cx = this.x + this.w / 2;
            const cy = this.y + this.h / 2;
            const speed = 90;
            const len   = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            projectiles.push(new Projectile(
              cx, cy,
              (dx / len) * speed,
              (dy / len) * speed - 30,
              this.damage,
              'enemy',
              'oilball'
            ));
          }
        }
      }

      this._animTimer += dt;
      this._idleAnim.update(dt);
      this._walkAnim.update(dt);
    }

    draw(ctx) {
      if (!this.alive) return;
      if (this._shouldFlash()) return;

      const sx = Math.round(this.x);
      const sy = Math.round(this.y);
      const flipX = !this.facingRight;

      if (typeof OILY_FRAMES !== 'undefined' && OILY_FRAMES && OILY_FRAMES.length > 0 &&
          typeof OILY_PAL !== 'undefined' && OILY_PAL) {
        SpriteRenderer.drawSpriteFrame(ctx, OILY_FRAMES, this._walkAnim.frame, sx, sy, OILY_PAL, 3, flipX);
      } else {
        // Fallback placeholder
        ctx.save();
        ctx.fillStyle = this.flashTimer > 0 ? '#FFFFFF' : '#4A3020';
        ctx.fillRect(sx, sy, this.w, this.h);
        ctx.fillStyle = '#6B4A30';
        ctx.beginPath();
        ctx.arc(sx + this.w / 2, sy + this.h / 2, this.w / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        // Oil sheen
        ctx.fillStyle = 'rgba(100,200,100,0.4)';
        ctx.beginPath();
        ctx.ellipse(sx + this.w / 2, sy + this.h / 2, this.w / 2 - 4, this.h / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      this._drawHpBar(ctx, sx, sy);
    }
  }

  // ========================================================================
  // Gomira - stage 1 plastic bag
  // ========================================================================

  class Gomira extends Enemy {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      super(x, y, 30, 24, 3);   // 10×8 art × 3 scale
      this.damage          = 1;
      this._patrolSpeed    = 45;
      this._chargeTimer    = 1.5 + Math.random() * 1.5;  // stagger initial charge
      this._chargeCooldown = 3.0;
      this._chargeDuration = 0;
      this._isCharging     = false;
      this._chargeSpeed    = 160;
      this._idleAnim       = new SpriteRenderer.Animator(5);
      this._walkAnim       = new SpriteRenderer.Animator(7);
      this._idleAnim.setFrameCount(
        (typeof GOMIRA_FRAMES !== 'undefined' && GOMIRA_FRAMES) ? GOMIRA_FRAMES.length : 2
      );
      this._walkAnim.setFrameCount(
        (typeof GOMIRA_FRAMES !== 'undefined' && GOMIRA_FRAMES) ? GOMIRA_FRAMES.length : 2
      );
    }

    update(dt, player, projectiles, tileMap) {
      if (!this.alive) return;
      this._tickTimers(dt);

      this._chargeTimer -= dt;

      if (this._isCharging) {
        // Continue charge
        this._chargeDuration -= dt;
        if (this._chargeDuration <= 0) {
          this._isCharging = false;
          this._patrolDir  = this.facingRight ? 1 : -1;
        }
        // During charge, override vx directly
        const chargeVx = (this.facingRight ? 1 : -1) * this._chargeSpeed;
        this.vx = chargeVx;
        this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (tileMap) Physics.resolveEntityTileCollision(this, tileMap);
      } else {
        // Normal patrol
        this._movePatrol(dt, tileMap);

        // Check if should charge
        if (player && this._chargeTimer <= 0) {
          const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
          const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            this._isCharging     = true;
            this._chargeDuration = 0.55;
            this._chargeTimer    = this._chargeCooldown;
            this.facingRight     = dx > 0;
            this._patrolDir      = dx > 0 ? 1 : -1;
          }
        }
      }

      this._idleAnim.update(dt);
      this._walkAnim.update(dt);
    }

    draw(ctx) {
      if (!this.alive) return;
      if (this._shouldFlash()) return;

      const sx    = Math.round(this.x);
      const sy    = Math.round(this.y);
      const flipX = !this.facingRight;

      if (typeof GOMIRA_FRAMES !== 'undefined' && GOMIRA_FRAMES && GOMIRA_FRAMES.length > 0 &&
          typeof GOMIRA_PAL !== 'undefined' && GOMIRA_PAL) {
        const anim = this._isCharging ? this._attackAnim : this._walkAnim;
        SpriteRenderer.drawSpriteFrame(ctx, GOMIRA_FRAMES, anim.frame, sx, sy, GOMIRA_PAL, 3, flipX);
      } else {
        // Fallback placeholder: semi-transparent plastic-bag shape
        ctx.save();
        ctx.globalAlpha = this._isCharging ? 1.0 : 0.85;
        ctx.fillStyle   = this.flashTimer > 0 ? '#FFFFFF' : '#AADDFF';
        ctx.fillRect(sx, sy, this.w, this.h);
        // Bag outline
        ctx.strokeStyle = '#88BBDD';
        ctx.lineWidth   = 2;
        ctx.strokeRect(sx + 1, sy + 1, this.w - 2, this.h - 2);
        // Tie knot at top
        ctx.fillStyle = '#6699BB';
        ctx.fillRect(sx + this.w / 2 - 3, sy, 6, 5);
        ctx.restore();
      }

      // Charge wind-up indicator
      if (this._isCharging) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle   = '#FF8800';
        ctx.beginPath();
        const arrowDir = this.facingRight ? 1 : -1;
        const ax = sx + (this.facingRight ? this.w + 4 : -10);
        const ay = sy + this.h / 2;
        ctx.moveTo(ax, ay - 4);
        ctx.lineTo(ax + arrowDir * 10, ay);
        ctx.lineTo(ax, ay + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      this._drawHpBar(ctx, sx, sy);
    }
  }

  // ========================================================================
  // Fujitsubo - stage 2 barnacle (fixed position)
  // ========================================================================

  class Fujitsubo extends Enemy {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      super(x, y, 24, 30, 3);   // 8×10 art × 3 scale
      this.damage        = 1;
      this._patrolSpeed  = 0;   // doesn't move
      this._shootTimer   = 1.0 + Math.random() * 1.5;
      this._shootCooldown = 2.5;
      this._openTimer    = 0;   // shell open animation timer
      this._isOpen       = false;
      this._idleAnim     = new SpriteRenderer.Animator(4);
      this._openAnim     = new SpriteRenderer.Animator(6);
      this._idleAnim.setFrameCount(
        (typeof FUJI_FRAMES !== 'undefined' && FUJI_FRAMES) ? FUJI_FRAMES.length : 2
      );
      this._openAnim.setFrameCount(
        (typeof FUJI_FRAMES !== 'undefined' && FUJI_FRAMES) ? FUJI_FRAMES.length : 2
      );
    }

    update(dt, player, projectiles, tileMap) {
      if (!this.alive) return;
      this._tickTimers(dt);

      // Apply gravity so it lands on platforms when spawned in air
      if (!this.onGround) {
        this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);
        this.y += this.vy * dt;
        if (tileMap) Physics.resolveEntityTileCollision(this, tileMap);
      }

      // Shoot spike when player is nearby
      if (player) {
        const dx   = (player.x + player.w / 2) - (this.x + this.w / 2);
        const dy   = (player.y + player.h / 2) - (this.y + this.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        this._shootTimer -= dt;

        if (dist < 250) {
          this.facingRight = dx > 0;

          if (this._shootTimer <= 0) {
            this._shootTimer = this._shootCooldown;
            this._isOpen     = true;
            this._openTimer  = 0.4;

            if (projectiles) {
              const cx    = this.x + this.w / 2;
              const cy    = this.y + this.h / 2;
              const speed = 110;
              const len   = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              projectiles.push(new Projectile(
                cx, cy,
                (dx / len) * speed,
                (dy / len) * speed,
                this.damage,
                'enemy',
                'spike'
              ));
            }
          }
        }
      }

      // Shell open timer
      if (this._isOpen) {
        this._openTimer -= dt;
        if (this._openTimer <= 0) this._isOpen = false;
      }

      this._idleAnim.update(dt);
      this._openAnim.update(dt);
    }

    draw(ctx) {
      if (!this.alive) return;
      if (this._shouldFlash()) return;

      const sx    = Math.round(this.x);
      const sy    = Math.round(this.y);
      const flipX = !this.facingRight;

      if (typeof FUJI_FRAMES !== 'undefined' && FUJI_FRAMES && FUJI_FRAMES.length > 0 &&
          typeof FUJI_PAL !== 'undefined' && FUJI_PAL) {
        const anim = this._isOpen ? this._openAnim : this._idleAnim;
        SpriteRenderer.drawSpriteFrame(ctx, FUJI_FRAMES, anim.frame, sx, sy, FUJI_PAL, 3, flipX);
      } else {
        // Fallback: barnacle cone shape
        ctx.save();
        ctx.fillStyle = this.flashTimer > 0 ? '#FFFFFF' : '#887766';
        // Body cone
        ctx.beginPath();
        ctx.moveTo(sx + this.w / 2, sy);
        ctx.lineTo(sx + this.w, sy + this.h);
        ctx.lineTo(sx, sy + this.h);
        ctx.closePath();
        ctx.fill();
        // Shell plates
        ctx.strokeStyle = '#AAAAAA';
        ctx.lineWidth   = 1;
        for (let i = 1; i <= 3; i++) {
          const px = sx + this.w / 2;
          const py = sy + (this.h / 4) * i;
          ctx.beginPath();
          ctx.moveTo(px - i * 3, py);
          ctx.lineTo(px + i * 3, py);
          ctx.stroke();
        }
        if (this._isOpen) {
          // Opening shell glow
          ctx.globalAlpha = 0.7;
          ctx.fillStyle   = '#FFFF88';
          ctx.beginPath();
          ctx.arc(sx + this.w / 2, sy + 4, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Warning indicator before shooting
      if (this._shootTimer < 0.5 && this._shootTimer > 0) {
        const blinkOn = Math.floor(this._shootTimer / 0.1) % 2 === 0;
        if (blinkOn) {
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle   = '#FF4400';
          ctx.beginPath();
          ctx.arc(sx + this.w / 2, sy - 6, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      this._drawHpBar(ctx, sx, sy);
    }
  }

  // ========================================================================
  // Mutsugoro - stage 2 mudskipper
  // ========================================================================

  class Mutsugoro extends Enemy {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
      super(x, y, 30, 24, 2);   // 10×8 art × 3 scale
      this.damage       = 1;
      this._patrolSpeed = 50;
      this._jumpTimer   = 0.5 + Math.random() * 1.5;
      this._jumpCooldown = 2.0;
      this._isJumping   = false;
      this._idleAnim    = new SpriteRenderer.Animator(6);
      this._walkAnim    = new SpriteRenderer.Animator(8);
      this._jumpAnim    = new SpriteRenderer.Animator(4);
      const fc = (typeof MUTSU_FRAMES !== 'undefined' && MUTSU_FRAMES) ? MUTSU_FRAMES.length : 2;
      this._idleAnim.setFrameCount(fc);
      this._walkAnim.setFrameCount(fc);
      this._jumpAnim.setFrameCount(fc);
    }

    update(dt, player, projectiles, tileMap) {
      if (!this.alive) return;
      this._tickTimers(dt);

      this._jumpTimer -= dt;

      // Decide whether to jump
      if (player && this._jumpTimer <= 0 && this.onGround) {
        const dx   = (player.x + player.w / 2) - (this.x + this.w / 2);
        const dy   = (player.y + player.h / 2) - (this.y + this.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
          this._jumpTimer  = this._jumpCooldown;
          this._isJumping  = true;
          this.vy          = -280;
          this.vx          = (dx > 0 ? 1 : -1) * 90;
          this.facingRight = (dx > 0);
          this._patrolDir  = dx > 0 ? 1 : -1;
        }
      }

      // Apply gravity
      this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL);

      if (this._isJumping) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (tileMap) Physics.resolveEntityTileCollision(this, tileMap);
        if (this.onGround) {
          this._isJumping  = false;
          this.vx          = 0;
        }
      } else {
        this._movePatrol(dt, tileMap);
      }

      this._idleAnim.update(dt);
      this._walkAnim.update(dt);
      this._jumpAnim.update(dt);
    }

    draw(ctx) {
      if (!this.alive) return;
      if (this._shouldFlash()) return;

      const sx    = Math.round(this.x);
      const sy    = Math.round(this.y);
      const flipX = !this.facingRight;

      if (typeof MUTSU_FRAMES !== 'undefined' && MUTSU_FRAMES && MUTSU_FRAMES.length > 0 &&
          typeof MUTSU_PAL !== 'undefined' && MUTSU_PAL) {
        let anim;
        if (this._isJumping) {
          anim = this._jumpAnim;
        } else if (this._isMoving) {
          anim = this._walkAnim;
        } else {
          anim = this._idleAnim;
        }
        SpriteRenderer.drawSpriteFrame(ctx, MUTSU_FRAMES, anim.frame, sx, sy, MUTSU_PAL, 3, flipX);
      } else {
        // Fallback: mudskipper placeholder
        ctx.save();
        ctx.fillStyle = this.flashTimer > 0 ? '#FFFFFF' : '#7B8B4A';
        ctx.fillRect(sx, sy, this.w, this.h);
        // Eye
        ctx.fillStyle = '#FFFFFF';
        const eyeX = this.facingRight ? sx + this.w - 7 : sx + 5;
        ctx.beginPath();
        ctx.arc(eyeX, sy + 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(eyeX + (this.facingRight ? 1 : -1), sy + 6, 2, 0, Math.PI * 2);
        ctx.fill();
        // Fin
        ctx.fillStyle = '#5A6A3A';
        ctx.fillRect(
          this.facingRight ? sx + this.w - 6 : sx,
          sy + this.h / 2,
          6, 10
        );
        ctx.restore();
      }

      // Jump arc indicator when airborne
      if (this._isJumping) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle   = '#BBEE88';
        ctx.beginPath();
        ctx.arc(sx + this.w / 2, sy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      this._drawHpBar(ctx, sx, sy);
    }
  }

  // ========================================================================
  // Floater - floating aerial enemy, no gravity, patrol + downward projectile
  // ========================================================================

  class Floater extends Enemy {
    constructor(x, y) {
      super(x, y, 24, 20, 2);
      this.damage          = 1;
      this._patrolSpeed    = 55;
      this._floatBaseY     = y;
      this._floatTimer     = Math.random() * Math.PI * 2;
      this._shootTimer     = 1.5 + Math.random() * 2.0;
      this._shootCooldown  = 3.5;
      this._patrolDir      = Math.random() < 0.5 ? -1 : 1;
      this.facingRight     = this._patrolDir > 0;
    }

    update(dt, player, projectiles, tileMap) {
      if (!this.alive) return;
      this._tickTimers(dt);

      // Horizontal patrol — no gravity
      this.x += this._patrolDir * this._patrolSpeed * dt;

      // Sinusoidal bob
      this._floatTimer += dt;
      this.y = this._floatBaseY + Math.sin(this._floatTimer * 1.8) * 18;

      // Flip at world bounds
      const worldW = tileMap ? tileMap.worldWidth : 99999;
      if (this.x < 48 && this._dirFlipCooldown <= 0) {
        this.x = 48;
        this._patrolDir = 1; this.facingRight = true;
        this._dirFlipCooldown = 0.3;
      }
      if (this.x + this.w > worldW - 48 && this._dirFlipCooldown <= 0) {
        this.x = worldW - 48 - this.w;
        this._patrolDir = -1; this.facingRight = false;
        this._dirFlipCooldown = 0.3;
      }

      // Shoot downward when player is nearby
      this._shootTimer -= dt;
      if (this._shootTimer <= 0 && player) {
        const dx  = (player.x + player.w / 2) - (this.x + this.w / 2);
        const dy  = (player.y + player.h / 2) - (this.y + this.h / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 320 && dy > -30) {
          this._shootTimer = this._shootCooldown;
          if (projectiles) {
            const len = Math.max(1, dist);
            projectiles.push(new Projectile(
              this.x + this.w / 2, this.y + this.h,
              (dx / len) * 50, 90,
              this.damage, 'enemy', 'oilball'
            ));
          }
        } else {
          this._shootTimer = 0.5;
        }
      }

      this._idleAnim.update(dt);
      this._walkAnim.update(dt);
    }

    draw(ctx) {
      if (!this.alive) return;
      if (this._shouldFlash()) return;

      const sx = Math.round(this.x);
      const sy = Math.round(this.y);

      ctx.save();
      // Soft glow halo
      ctx.globalAlpha = 0.2 + Math.abs(Math.sin(this._floatTimer * 2)) * 0.15;
      ctx.fillStyle = '#CC88FF';
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 10, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Dome body
      ctx.fillStyle = this.flashTimer > 0 ? '#FFFFFF' : '#7744BB';
      ctx.beginPath();
      ctx.ellipse(sx + 12, sy + 9, 10, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Sheen
      ctx.fillStyle = 'rgba(200,180,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(sx + 9, sy + 6, 4, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      const ex = this.facingRight ? 4 : -4;
      ctx.fillStyle = '#FFEE44';
      ctx.beginPath();
      ctx.arc(sx + 12 + ex - 3, sy + 8, 2, 0, Math.PI * 2);
      ctx.arc(sx + 12 + ex + 3, sy + 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(sx + 12 + ex - 3 + (this.facingRight ? 1 : -1), sy + 8, 1, 0, Math.PI * 2);
      ctx.arc(sx + 12 + ex + 3 + (this.facingRight ? 1 : -1), sy + 8, 1, 0, Math.PI * 2);
      ctx.fill();

      // Tendrils
      ctx.strokeStyle = '#9966CC';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const tx = sx + 3 + i * 6;
        const wave = Math.sin(this._floatTimer * 3 + i * 0.9) * 5;
        ctx.beginPath();
        ctx.moveTo(tx, sy + 17);
        ctx.quadraticCurveTo(tx + wave, sy + 22, tx + wave, sy + 28);
        ctx.stroke();
      }
      ctx.restore();

      this._drawHpBar(ctx, sx, sy);
    }
  }

  // ========================================================================
  // Export
  // ========================================================================

  window.Enemy      = Enemy;
  window.Oily       = Oily;
  window.Gomira     = Gomira;
  window.Fujitsubo  = Fujitsubo;
  window.Mutsugoro  = Mutsugoro;
  window.Floater    = Floater;

}());
