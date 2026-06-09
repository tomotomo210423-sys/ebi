/**
 * Player - Kani (crab) + Pukpuka (jellyfish) combined player entity
 * クラゲライダー・カニィとプカプカの大冒険
 */
(function () {
  'use strict';

  const GRAVITY  = 900;
  const MAX_FALL = 600;
  const TILE_SIZE = 48;

  // Pukpuka float parameters
  const PUKU_MAX_SPD_X    = 120;
  const PUKU_MAX_SPD_Y    = 80;
  const PUKU_ACCEL_X      = 500;
  const PUKU_ACCEL_Y      = 350;
  const PUKU_FRICTION     = 0.80;   // multiplier per frame (velocity * FRICTION^dt... we use per-second)
  const PUKU_BOB_AMP      = 3;      // pixels of sinusoidal bob
  const PUKU_BOB_FREQ     = 1.5;    // Hz

  // Kani jump parameters
  const KANI_JUMP_VY      = -350;
  const KANI_STOMP_BOUNCE = -200;   // bounce up after stomping enemy

  // Attack / skill parameters
  const CLAW_REACH        = 30;     // px in front of Kani
  const ELECTRIC_RADIUS   = 80;     // px from Pukpuka center
  const SYNCHRO_BONUS_MUL = 2;      // damage multiplier for synchro combo
  const INVINCIBLE_TIME   = 1.5;    // seconds

  // ========================================================================
  // Player
  // ========================================================================

  class Player {
    /**
     * @param {number} x - initial world X for Pukpuka (top-left)
     * @param {number} y - initial world Y for Pukpuka (top-left)
     */
    constructor(x, y) {
      // ---- Pukpuka (jellyfish) - primary movement entity ----
      this.x  = x;
      this.y  = y;
      this.vx = 0;
      this.vy = 0;
      this.w  = 36;   // 12 art × 3 scale
      this.h  = 30;   // 10 art × 3 scale
      this.hp    = 5;
      this.maxHp = 5;

      // Tile collision flags (set by Physics.resolveEntityTileCollision)
      this.onGround  = false;
      this.onOil     = false;
      this.inWater   = false;
      this.hitSpike  = false;
      this.reachedGoal = false;

      // ---- Kani (crab) state ----
      this.kaniOnPukpuka = true;
      this.kaniAbsX      = x + (this.w / 2 - 15);  // centered on pukpuka
      this.kaniAbsY      = y - 32;   // プカプカの上に乗る（少し上にオフセット）
      this.kaniVx        = 0;
      this.kaniVy        = 0;
      this.kaniW         = 30;   // 10 art × 3 scale
      this.kaniH         = 24;   //  8 art × 3 scale
      this.kaniOnGround  = false;

      // ---- Combat state ----
      this.facingRight      = true;
      this.attackTimer      = 0;   // counts down while attack hitbox is active
      this.attackCooldown   = 0;   // cooldown between attacks
      this.skillTimer       = 0;   // electric burst visual timer
      this.skillCooldown    = 0;   // cooldown between skill uses
      this.synchroTimer     = 0;   // 200ms window after stomping an enemy

      this.invincibleTimer  = 0;

      // Electric burst state
      this.electricBurstActive = false;
      this.electricBurstTimer  = 0;

      // Attack hitbox (temporary, set during attack frames)
      this._attackHitbox = null;

      // Bob oscillation timer
      this._bobTimer = 0;

      // Animators
      this._pukuIdleAnim    = new SpriteRenderer.Animator(6);
      this._pukuElecAnim    = new SpriteRenderer.Animator(8);
      this._kaniIdleAnim    = new SpriteRenderer.Animator(5);
      this._kaniWalkAnim    = new SpriteRenderer.Animator(8);
      this._kaniJumpAnim    = new SpriteRenderer.Animator(4);
      this._kaniAttackAnim  = new SpriteRenderer.Animator(8);

      // Set frame counts from sprite data if available
      this._setPukuFrameCounts();
      this._setKaniFrameCounts();

      // Internal flags
      this._isMovingH  = false;
      this._stompedThisFrame = false;
    }

    // ------------------------------------------------------------------
    // Sprite frame count helpers
    // ------------------------------------------------------------------

    _setPukuFrameCounts() {
      const pf = (typeof PUKU_FRAMES !== 'undefined' && PUKU_FRAMES);
      if (pf) {
        const idleFC = pf.idle ? pf.idle.length : (Array.isArray(pf) ? pf.length : 2);
        const elecFC = pf.electric ? pf.electric.length : idleFC;
        this._pukuIdleAnim.setFrameCount(idleFC);
        this._pukuElecAnim.setFrameCount(elecFC);
      } else {
        this._pukuIdleAnim.setFrameCount(2);
        this._pukuElecAnim.setFrameCount(2);
      }
    }

    _setKaniFrameCounts() {
      const kf = (typeof KANI_FRAMES !== 'undefined' && KANI_FRAMES);
      if (kf) {
        const toFC = (frames) => frames ? frames.length : 2;
        this._kaniIdleAnim.setFrameCount(toFC(kf.idle));
        this._kaniWalkAnim.setFrameCount(toFC(kf.walk));
        this._kaniJumpAnim.setFrameCount(toFC(kf.jump));
        this._kaniAttackAnim.setFrameCount(toFC(kf.attack));
      } else {
        this._kaniIdleAnim.setFrameCount(2);
        this._kaniWalkAnim.setFrameCount(2);
        this._kaniJumpAnim.setFrameCount(2);
        this._kaniAttackAnim.setFrameCount(2);
      }
    }

    // ------------------------------------------------------------------
    // Getters
    // ------------------------------------------------------------------

    get centerX() { return this.x + this.w / 2; }
    get centerY() { return this.y + this.h / 2; }

    get kaniHitbox() {
      return { x: this.kaniAbsX, y: this.kaniAbsY, w: this.kaniW, h: this.kaniH };
    }

    // ------------------------------------------------------------------
    // Main update
    // ------------------------------------------------------------------

    /**
     * @param {number}   dt
     * @param {Input}    input
     * @param {TileMap}  tileMap
     * @param {Enemy[]}  enemies
     * @param {Projectile[]} projectiles  - list to push player projectiles onto
     * @param {HazardManager} hazards
     */
    update(dt, input, tileMap, enemies, projectiles, hazards) {
      this._stompedThisFrame = false;

      // 1. Move Pukpuka
      this._updatePukpuka(dt, input, tileMap);

      // 2. Kani position (on Pukpuka or in air)
      this._updateKani(dt, input, tileMap, enemies, hazards);

      // 3. Jump input
      this._handleJump(input);

      // 4. Attack input (Z/J)
      this._handleAttack(dt, input, enemies, projectiles, hazards);

      // 5. Skill input (X/K)
      this._handleSkill(dt, input, enemies, projectiles, hazards);

      // 6. Synchro countdown
      if (this.synchroTimer > 0) this.synchroTimer -= dt;

      // 7. Invincibility
      if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

      // 8. Electric burst visual timer
      if (this.electricBurstActive) {
        this.electricBurstTimer -= dt;
        if (this.electricBurstTimer <= 0) {
          this.electricBurstActive = false;
        }
      }

      // 9. Check enemy projectile hits
      this._checkEnemyProjectileHits(projectiles, hazards);

      // 10. Check tile hazards (spikes, dirty water)
      if (this.hitSpike) {
        this.takeDamage(1, hazards);
      }

      // 11. Update animators
      this._updateAnimators(dt);
    }

    // ------------------------------------------------------------------
    // Pukpuka movement
    // ------------------------------------------------------------------

    _updatePukpuka(dt, input, tileMap) {
      const frictionPerSec = 3.5;  // vx decays at this rate when no input

      // Horizontal input
      if (input.right) {
        this.vx += PUKU_ACCEL_X * dt;
        this.facingRight = true;
        this._isMovingH  = true;
      } else if (input.left) {
        this.vx -= PUKU_ACCEL_X * dt;
        this.facingRight = false;
        this._isMovingH  = true;
      } else {
        // Friction deceleration
        const decel = frictionPerSec * dt;
        if (Math.abs(this.vx) < decel) {
          this.vx = 0;
        } else {
          this.vx -= Math.sign(this.vx) * decel * 60;
        }
        // Smoother: multiply by factor
        this.vx *= Math.pow(PUKU_FRICTION, dt * 10);
        this._isMovingH = false;
      }

      // Vertical input
      if (input.up) {
        this.vy -= PUKU_ACCEL_Y * dt;
      } else if (input.down) {
        this.vy += PUKU_ACCEL_Y * dt;
      } else {
        this.vy *= Math.pow(PUKU_FRICTION, dt * 8);
      }

      // Clamp velocities
      this.vx = Math.max(-PUKU_MAX_SPD_X, Math.min(PUKU_MAX_SPD_X, this.vx));
      this.vy = Math.max(-PUKU_MAX_SPD_Y, Math.min(PUKU_MAX_SPD_Y, this.vy));

      // Apply gentle sinusoidal bob (always present)
      this._bobTimer += dt;
      const bobOffset = Math.sin(this._bobTimer * PUKU_BOB_FREQ * Math.PI * 2) * PUKU_BOB_AMP * dt;

      // Move Pukpuka
      this.x += this.vx * dt;
      this.y += this.vy * dt + bobOffset;

      // Resolve Pukpuka vs tiles (it floats but cannot pass through solids)
      if (tileMap) {
        // Pukpuka doesn't fall with gravity; use tile collision only for walls/ceilings/floors
        const prevOnGround = this.onGround;
        Physics.resolveEntityTileCollision(this, tileMap);
        // If Pukpuka was pushed up by a tile, it means it hit a floor - push it up slightly so it floats
        if (this.onGround && !prevOnGround) {
          this.y -= 4;  // float margin above floor
          this.vy = Math.min(this.vy, 0);
        }

        // Clamp to world bounds
        const worldW = tileMap.worldWidth;
        const worldH = tileMap.worldHeight;
        if (this.x < 0)              { this.x = 0;              this.vx = Math.max(this.vx, 0); }
        if (this.x + this.w > worldW) { this.x = worldW - this.w; this.vx = Math.min(this.vx, 0); }
        if (this.y < 0)              { this.y = 0;              this.vy = Math.max(this.vy, 0); }
        if (this.y + this.h > worldH - TILE_SIZE) {
          this.y = worldH - TILE_SIZE - this.h;
          this.vy = Math.min(this.vy, 0);
        }
      }
    }

    // ------------------------------------------------------------------
    // Kani position
    // ------------------------------------------------------------------

    _updateKani(dt, input, tileMap, enemies, hazards) {
      if (this.kaniOnPukpuka) {
        // Kani sits on top of Pukpuka
        this.kaniAbsX = this.x + (this.w / 2 - this.kaniW / 2);
        this.kaniAbsY = this.y - this.kaniH - 8;  // プカプカドームの上に乗る
        this.kaniVx   = 0;
        this.kaniVy   = 0;
      } else {
        // Kani is airborne
        this.kaniVy = Math.min(this.kaniVy + GRAVITY * dt, MAX_FALL);

        this.kaniAbsX += this.kaniVx * dt;
        this.kaniAbsY += this.kaniVy * dt;

        // Kani tile collision when airborne
        if (tileMap) {
          const kaniEntity = {
            x: this.kaniAbsX, y: this.kaniAbsY,
            w: this.kaniW,    h: this.kaniH,
            vx: this.kaniVx,  vy: this.kaniVy,
            onGround: false,
          };
          Physics.resolveEntityTileCollision(kaniEntity, tileMap);
          this.kaniAbsX     = kaniEntity.x;
          this.kaniAbsY     = kaniEntity.y;
          this.kaniVx       = kaniEntity.vx;
          this.kaniVy       = kaniEntity.vy;
          this.kaniOnGround = kaniEntity.onGround;
        }

        // Check if Kani stomps an enemy while falling
        if (this.kaniVy > 0 && enemies) {
          for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const stompOverlap = Physics.rectOverlap(
              this.kaniAbsX, this.kaniAbsY, this.kaniW, this.kaniH,
              enemy.x, enemy.y, enemy.w, enemy.h
            );
            if (stompOverlap) {
              const kaniBottom  = this.kaniAbsY + this.kaniH;
              const enemyTop    = enemy.y;
              const fromAbove   = kaniBottom - enemyTop < 20;
              if (fromAbove) {
                // Stomp!
                const killed = enemy.takeDamage(1, this.facingRight ? 1 : -1);
                if (hazards) {
                  hazards.spawn(
                    enemy.x + enemy.w / 2,
                    enemy.y,
                    killed ? 'defeat' : 'hit'
                  );
                }
                // Bounce Kani up
                this.kaniVy = KANI_STOMP_BOUNCE;
                // Start synchro window
                this.synchroTimer       = 0.2;
                this._stompedThisFrame  = true;
                break;
              }
            }
          }
        }

        // Check if Kani has landed back on Pukpuka
        const pukuTop = this.y;
        if (this.kaniAbsY + this.kaniH >= pukuTop) {
          // Check horizontal overlap
          const kaniRight  = this.kaniAbsX + this.kaniW;
          const pukuRight  = this.x + this.w;
          const horizontalOverlap =
            this.kaniAbsX < pukuRight - 4 &&
            kaniRight     > this.x + 4;

          if (horizontalOverlap && this.kaniVy >= 0) {
            this.kaniOnPukpuka = true;
            this.kaniVy        = 0;
            this.kaniVx        = 0;
          }
        }

        // If Kani hits the ground while not on Pukpuka, keep them standing
        // (they can walk on the floor briefly before returning to Pukpuka when close)
        // Horizontal drift on ground
        if (this.kaniOnGround) {
          // Slight horizontal momentum when in air is kept
          this.kaniVx *= Math.pow(0.85, dt * 10);
        }
      }
    }

    // ------------------------------------------------------------------
    // Jump
    // ------------------------------------------------------------------

    _handleJump(input) {
      if (input.jumpDown && this.kaniOnPukpuka) {
        this.kaniOnPukpuka = false;
        this.kaniVy        = KANI_JUMP_VY;
        this.kaniVx        = this.vx * 0.5;  // inherit some pukpuka momentum
        this.kaniOnGround  = false;
        this._kaniJumpAnim.reset();
      }
    }

    // ------------------------------------------------------------------
    // Attack (Z/J) - Kani claw
    // ------------------------------------------------------------------

    _handleAttack(dt, input, enemies, projectiles, hazards) {
      // Cool down
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
      }
      if (this.attackTimer > 0) {
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          this._attackHitbox = null;
        }
      }

      if (!input.attackDown) return;
      if (this.attackCooldown > 0) return;

      // Start claw attack
      this.attackCooldown = 0.4;
      this.attackTimer    = 0.15;
      this._kaniAttackAnim.reset();

      // Claw hitbox in front of Kani
      const kx = this.kaniAbsX;
      const ky = this.kaniAbsY;
      const kw = this.kaniW;
      const kh = this.kaniH;

      let hbX;
      if (this.facingRight) {
        hbX = kx + kw;
      } else {
        hbX = kx - CLAW_REACH;
      }
      this._attackHitbox = {
        x: hbX,
        y: ky + 4,
        w: CLAW_REACH,
        h: kh - 8,
      };

      // Check enemies in hitbox
      if (enemies) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          if (Physics.rectOverlap(
            this._attackHitbox.x, this._attackHitbox.y,
            this._attackHitbox.w, this._attackHitbox.h,
            enemy.x, enemy.y, enemy.w, enemy.h
          )) {
            const killed = enemy.takeDamage(1, this.facingRight ? 1 : -1);
            if (hazards) {
              hazards.spawn(
                enemy.x + enemy.w / 2,
                enemy.y + enemy.h / 2,
                killed ? 'defeat' : 'hit'
              );
            }
          }
        }
      }

      // Spawn claw projectile flash (short-lived, owner='player')
      if (projectiles) {
        const vx = this.facingRight ? 200 : -200;
        projectiles.push(new Projectile(
          this._attackHitbox.x + (this.facingRight ? 0 : CLAW_REACH),
          this._attackHitbox.y + this._attackHitbox.h / 2,
          vx, 0,
          1, 'player', 'claw'
        ));
      }

      if (hazards) {
        hazards.spawn(
          this._attackHitbox.x + this._attackHitbox.w / 2,
          this._attackHitbox.y + this._attackHitbox.h / 2,
          'hit'
        );
      }
    }

    // ------------------------------------------------------------------
    // Skill (X/K) - Pukpuka electric burst
    // ------------------------------------------------------------------

    _handleSkill(dt, input, enemies, projectiles, hazards) {
      if (this.skillCooldown > 0) {
        this.skillCooldown -= dt;
        return;
      }

      if (!input.skillDown) return;
      if (this.skillCooldown > 0) return;

      this.skillCooldown = 1.5;

      const isSynchro = this.synchroTimer > 0;
      const damage    = isSynchro ? 2 * SYNCHRO_BONUS_MUL : 2;

      // Electric burst visual
      this.electricBurstActive = true;
      this.electricBurstTimer  = 0.35;
      this._pukuElecAnim.reset();

      const pcx = this.centerX;
      const pcy = this.centerY;

      // Damage all enemies in radius
      if (enemies) {
        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          const ex   = enemy.x + enemy.w / 2;
          const ey   = enemy.y + enemy.h / 2;
          const dx   = ex - pcx;
          const dy   = ey - pcy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= ELECTRIC_RADIUS + enemy.w / 2) {
            const killed = enemy.takeDamage(damage, dx > 0 ? 1 : -1);
            if (hazards) {
              hazards.spawn(ex, ey, killed ? 'defeat' : 'electric');
            }
          }
        }
      }

      // Synchro combo burst
      if (isSynchro && hazards) {
        hazards.spawn(pcx, pcy, 'synchro');
        this.synchroTimer = 0;
      } else if (hazards) {
        hazards.spawn(pcx, pcy, 'electric');
      }

      // Emit electric projectile ring (optional, short range)
      if (projectiles) {
        const count = 6;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const spd   = 160;
          projectiles.push(new Projectile(
            pcx, pcy,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            damage, 'player', 'electric'
          ));
        }
      }
    }

    // ------------------------------------------------------------------
    // Enemy projectile hit detection
    // ------------------------------------------------------------------

    _checkEnemyProjectileHits(projectiles, hazards) {
      if (!projectiles) return;
      for (const proj of projectiles) {
        if (!proj.alive || proj.owner !== 'enemy') continue;

        // Check against Pukpuka hitbox
        const hitPuku = Physics.rectOverlap(
          proj.x, proj.y, proj.w, proj.h,
          this.x, this.y, this.w, this.h
        );
        // Check against Kani hitbox (always, even when on Pukpuka)
        const kb = this.kaniHitbox;
        const hitKani = Physics.rectOverlap(
          proj.x, proj.y, proj.w, proj.h,
          kb.x, kb.y, kb.w, kb.h
        );

        if (hitPuku || hitKani) {
          proj.alive = false;
          this.takeDamage(proj.damage, hazards);
        }
      }
    }

    // ------------------------------------------------------------------
    // Take damage
    // ------------------------------------------------------------------

    /**
     * @param {number} amount
     * @param {HazardManager} hazards
     */
    takeDamage(amount, hazards) {
      if (this.invincibleTimer > 0) return;

      this.hp -= amount;
      if (this.hp < 0) this.hp = 0;
      this.invincibleTimer = INVINCIBLE_TIME;

      // Knockback Pukpuka (bounce back from hit direction)
      this.vy  = -60;
      this.vx *= -0.5;

      if (hazards) {
        hazards.spawn(this.centerX, this.centerY, 'hit');
      }
    }

    // ------------------------------------------------------------------
    // Animator updates
    // ------------------------------------------------------------------

    _updateAnimators(dt) {
      this._pukuIdleAnim.update(dt);
      this._pukuElecAnim.update(dt);
      this._kaniIdleAnim.update(dt);
      this._kaniWalkAnim.update(dt);
      this._kaniJumpAnim.update(dt);
      this._kaniAttackAnim.update(dt);
    }

    // ------------------------------------------------------------------
    // Draw
    // ------------------------------------------------------------------

    /**
     * Called inside camera transform (draw at world coordinates minus camX/camY externally,
     * or draw directly at world coords if camera is a ctx.translate).
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} camX
     * @param {number} camY
     * @param {HazardManager} hazards - optional, for screen-space effects
     */
    draw(ctx, camX, camY, hazards) {
      const invFlash = this.invincibleTimer > 0 &&
                       Math.floor(this.invincibleTimer / 0.08) % 2 === 1;
      if (invFlash) return;  // blink invisible while invincible

      const sx = Math.round(this.x - camX);
      const sy = Math.round(this.y - camY);

      // 1. Draw Pukpuka
      this._drawPukpuka(ctx, sx, sy);

      // 2. Draw electric burst circle
      if (this.electricBurstActive) {
        this._drawElectricBurst(ctx, sx, sy);
      }

      // 3. Draw Kani
      const ksx = Math.round(this.kaniAbsX - camX);
      const ksy = Math.round(this.kaniAbsY - camY);
      this._drawKani(ctx, ksx, ksy);

      // 4. Synchro window label
      if (this.synchroTimer > 0) {
        ctx.save();
        const alpha = Math.min(1.0, this.synchroTimer / 0.2);
        ctx.globalAlpha = alpha;
        ctx.font        = 'bold 10px monospace';
        ctx.fillStyle   = '#FFFF00';
        ctx.strokeStyle = '#333300';
        ctx.lineWidth   = 2;
        const lx = sx + this.w / 2;
        const ly = sy - 22;
        ctx.strokeText('SYNCHRO!', lx - 24, ly);
        ctx.fillText('SYNCHRO!', lx - 24, ly);
        ctx.restore();
      }
    }

    _drawPukpuka(ctx, sx, sy) {
      const pf  = (typeof PUKU_FRAMES   !== 'undefined') ? PUKU_FRAMES   : null;
      const pal = (typeof PUKU_PAL      !== 'undefined') ? PUKU_PAL      : null;
      const flipX = !this.facingRight;

      if (pf && pal) {
        if (this.electricBurstActive && pf.electric) {
          SpriteRenderer.drawSpriteFrame(ctx, pf.electric, this._pukuElecAnim.frame, sx, sy, pal, 3, flipX);
        } else {
          const frames = pf.idle || (Array.isArray(pf) ? pf : null);
          if (frames) {
            SpriteRenderer.drawSpriteFrame(ctx, frames, this._pukuIdleAnim.frame, sx, sy, pal, 3, flipX);
          }
        }
      } else {
        // Fallback: draw jellyfish placeholder
        ctx.save();
        // Bell
        const bellColor = this.electricBurstActive ? '#88FFFF' : '#CC88FF';
        ctx.fillStyle = bellColor;
        ctx.beginPath();
        ctx.ellipse(sx + this.w / 2, sy + this.h * 0.45, this.w / 2 - 2, this.h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bell shine
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(sx + this.w / 2 - 4, sy + this.h * 0.2, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Tentacles hanging down
        ctx.strokeStyle = '#AA66CC';
        ctx.lineWidth   = 2;
        const tentCount = 5;
        const bellBot   = sy + this.h * 0.88;
        for (let i = 0; i < tentCount; i++) {
          const tx   = sx + 4 + (i / (tentCount - 1)) * (this.w - 8);
          const wave = Math.sin(this._bobTimer * 3 + i * 1.2) * 3;
          ctx.beginPath();
          ctx.moveTo(tx, bellBot);
          ctx.quadraticCurveTo(tx + wave, bellBot + 8, tx + wave * 1.5, bellBot + 14);
          ctx.stroke();
        }

        // Electric glow overlay
        if (this.electricBurstActive) {
          ctx.globalAlpha = 0.5 * (this.electricBurstTimer / 0.35);
          ctx.fillStyle   = '#FFFFAA';
          ctx.beginPath();
          ctx.ellipse(sx + this.w / 2, sy + this.h * 0.45, this.w / 2 + 2, this.h * 0.48, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    _drawKani(ctx, ksx, ksy) {
      const kf  = (typeof KANI_FRAMES !== 'undefined') ? KANI_FRAMES : null;
      const pal = (typeof KANI_PAL    !== 'undefined') ? KANI_PAL    : null;
      const flipX = !this.facingRight;

      let frames, anim;
      if (this.attackTimer > 0) {
        frames = kf ? kf.attack : null;
        anim   = this._kaniAttackAnim;
      } else if (!this.kaniOnPukpuka) {
        frames = kf ? kf.jump : null;
        anim   = this._kaniJumpAnim;
      } else if (this._isMovingH && Math.abs(this.vx) > 5) {
        frames = kf ? kf.walk : null;
        anim   = this._kaniWalkAnim;
      } else {
        frames = kf ? kf.idle : null;
        anim   = this._kaniIdleAnim;
      }

      if (frames && pal) {
        SpriteRenderer.drawSpriteFrame(ctx, frames, anim.frame, ksx, ksy, pal, 3, flipX);
      } else {
        // Fallback: draw crab placeholder
        ctx.save();
        const bodyColor = this.attackTimer > 0 ? '#FF6622' : '#DD4411';
        ctx.fillStyle = bodyColor;
        // Body
        ctx.fillRect(ksx + 3, ksy + 6, this.kaniW - 6, this.kaniH - 8);
        // Shell dome
        ctx.beginPath();
        ctx.ellipse(ksx + this.kaniW / 2, ksy + this.kaniH / 2, this.kaniW / 2 - 2, this.kaniH / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eyes (little stalks)
        ctx.fillStyle = '#FFFFFF';
        const eyeOffX = this.facingRight ? 6 : -6;
        ctx.beginPath();
        ctx.arc(ksx + this.kaniW / 2 + eyeOffX, ksy + 7, 3, 0, Math.PI * 2);
        ctx.arc(ksx + this.kaniW / 2 + eyeOffX + (this.facingRight ? 5 : -5), ksy + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.arc(ksx + this.kaniW / 2 + eyeOffX + (this.facingRight ? 1 : -1), ksy + 7, 1.5, 0, Math.PI * 2);
        ctx.arc(ksx + this.kaniW / 2 + eyeOffX + (this.facingRight ? 6 : -6), ksy + 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Claws
        ctx.fillStyle = '#CC3300';
        if (this.attackTimer > 0) {
          // Extended claw
          const clawX = this.facingRight ? ksx + this.kaniW : ksx - 12;
          ctx.fillRect(clawX, ksy + 8, 12, 8);
          // Claw pinch
          ctx.fillStyle = '#FF5500';
          ctx.fillRect(clawX + (this.facingRight ? 8 : 0), ksy + 6, 6, 4);
          ctx.fillRect(clawX + (this.facingRight ? 8 : 0), ksy + 14, 6, 4);
        } else {
          // Resting claws
          ctx.fillRect(ksx, ksy + this.kaniH - 10, 8, 8);
          ctx.fillRect(ksx + this.kaniW - 8, ksy + this.kaniH - 10, 8, 8);
        }
        // Legs
        ctx.strokeStyle = '#CC3300';
        ctx.lineWidth   = 2;
        for (let i = 0; i < 3; i++) {
          const legX = ksx + 5 + i * 7;
          ctx.beginPath();
          ctx.moveTo(legX, ksy + this.kaniH - 4);
          ctx.lineTo(legX - 3, ksy + this.kaniH + 4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ksx + this.kaniW - 5 - i * 7, ksy + this.kaniH - 4);
          ctx.lineTo(ksx + this.kaniW - 2 - i * 7, ksy + this.kaniH + 4);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    _drawElectricBurst(ctx, sx, sy) {
      const pcx  = sx + this.w / 2;
      const pcy  = sy + this.h / 2;
      const t    = this.electricBurstTimer / 0.35;   // 1 -> 0
      const r    = ELECTRIC_RADIUS * (1.1 - t * 0.1);

      ctx.save();
      ctx.globalAlpha = t * 0.55;

      // Outer ring
      ctx.strokeStyle = '#FFFF88';
      ctx.lineWidth   = 3;
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur  = 10;
      ctx.beginPath();
      ctx.arc(pcx, pcy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill flash
      ctx.globalAlpha = t * 0.15;
      ctx.fillStyle   = '#FFFF44';
      ctx.beginPath();
      ctx.arc(pcx, pcy, r, 0, Math.PI * 2);
      ctx.fill();

      // Zigzag arcs
      ctx.globalAlpha  = t * 0.7;
      ctx.strokeStyle  = '#FFFFFF';
      ctx.lineWidth    = 1.5;
      ctx.shadowBlur   = 5;
      const arcCount   = 8;
      for (let i = 0; i < arcCount; i++) {
        const a1 = (i / arcCount) * Math.PI * 2 + this._bobTimer * 4;
        const a2 = a1 + 0.25;
        const r1 = r * 0.5;
        const r2 = r * 0.9;
        ctx.beginPath();
        ctx.moveTo(pcx + Math.cos(a1) * r1, pcy + Math.sin(a1) * r1);
        ctx.lineTo(pcx + Math.cos(a2) * r2, pcy + Math.sin(a2) * r2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ========================================================================
  // Export
  // ========================================================================

  window.Player = Player;

}());
