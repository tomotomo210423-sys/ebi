/**
 * hud.js  -  Heads-Up Display for クラゲライダー・カニィとプカプカの大冒険
 *
 * All drawing is done in screen-space (after camera transform is restored).
 * Exposes: window.HUD
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────────────────────────────────────
  const HEART_W      = 18;   // px per heart slot
  const HEART_H      = 16;
  const HEART_GAP    = 4;
  const HEART_MARGIN = 10;   // from edge of canvas

  const BOSS_BAR_W   = 300;
  const BOSS_BAR_H   = 16;

  const SYNCHRO_W    = 120;
  const SYNCHRO_H    = 12;

  // ─────────────────────────────────────────────────────────────────────────
  // HUD class
  // ─────────────────────────────────────────────────────────────────────────
  class HUD {
    constructor() {
      // Flash state for boss damage indicator
      this._bossFlashTimer  = 0;
      this._bossLastHp      = -1;

      // Flash state for synchro window
      this._synchroFlash    = 0;
    }

    // -----------------------------------------------------------------------
    // Main draw entry point
    // Called AFTER camera.restoreCtx() so coordinates are screen-space.
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {object}  player       - player entity (has .hp, .maxHp, .skillCooldown, .skillMaxCooldown)
    // @param {object|null} boss     - boss entity (has .hp, .maxHp, .alive) or null
    // @param {object}  stage        - current stage data (has .name)
    // @param {number}  score        - current score
    // @param {number}  synchroGauge - 0-100
    // @param {number}  synchroTimer - seconds remaining in synchro window (>0 = active)
    // @param {number}  dt           - delta time for animations
    // -----------------------------------------------------------------------
    drawHUD(ctx, player, boss, stage, score, synchroGauge, synchroTimer, dt) {
      dt = dt || 0;
      this._bossFlashTimer = Math.max(0, this._bossFlashTimer - dt);
      this._synchroFlash   = Math.max(0, this._synchroFlash   - dt);

      const cW = ctx.canvas.width;
      const cH = ctx.canvas.height;

      ctx.save();

      // ── HP hearts ────────────────────────────────────────────────────────
      this._drawHearts(ctx, player, HEART_MARGIN, HEART_MARGIN);

      // ── Stage name ───────────────────────────────────────────────────────
      this._drawStageName(ctx, stage, cW);

      // ── Score ────────────────────────────────────────────────────────────
      this._drawScore(ctx, score, cW, HEART_MARGIN);

      // ── Synchro gauge ────────────────────────────────────────────────────
      this._drawSynchroGauge(ctx, synchroGauge, synchroTimer, cW, cH, player, dt);

      // ── Boss HP bar ──────────────────────────────────────────────────────
      if (boss && boss.alive) {
        // Detect damage flash
        if (this._bossLastHp > boss.hp) {
          this._bossFlashTimer = 0.25;
        }
        this._bossLastHp = boss.hp;
        this._drawBossBar(ctx, boss, cW);
      } else {
        this._bossLastHp = -1;
      }

      ctx.restore();
    }

    // -----------------------------------------------------------------------
    // Draw pixel-art HP hearts
    // -----------------------------------------------------------------------
    _drawHearts(ctx, player, ox, oy) {
      const maxHp = (player && player.maxHp) ? player.maxHp : 5;
      const hp    = (player && player.hp    != null) ? player.hp : maxHp;

      for (let i = 0; i < maxHp; i++) {
        const x = ox + i * (HEART_W + HEART_GAP);
        const y = oy;
        const filled = i < hp;

        if (filled) {
          this._drawFilledHeart(ctx, x, y);
        } else {
          this._drawEmptyHeart(ctx, x, y);
        }
      }
    }

    // Draws a filled red pixel-art heart at (x, y)
    _drawFilledHeart(ctx, x, y) {
      // Heart shape using canvas rects (pixel art style, 18×16)
      //  Row 0:  ..##..##..   cols 2-3, 6-7
      //  Row 1:  .######..   cols 1-6
      //  Row 2:  ########   cols 0-7
      //  Row 3:  ########   cols 0-7
      //  Row 4:  .######..   cols 1-6
      //  Row 5:  ..####...   cols 2-5
      //  Row 6:  ...##....   cols 3-4
      //  Row 7:  ....#....   col 4  (tip)
      const s = 2; // scale: each art pixel = 2 screen pixels

      // Outline / shadow
      ctx.fillStyle = '#5a0000';
      this._heartPixels(ctx, x, y, s, true);

      // Fill
      ctx.fillStyle = '#dd2222';
      this._heartPixels(ctx, x, y, s, false);

      // Highlight (top-left of each lobe)
      ctx.fillStyle = '#ff8888';
      ctx.fillRect(x + 2*s, y + 0*s, s, s);
      ctx.fillRect(x + 6*s, y + 0*s, s, s);
      ctx.fillRect(x + 1*s, y + 1*s, s, s);
      ctx.fillRect(x + 5*s, y + 1*s, s, s);
    }

    _drawEmptyHeart(ctx, x, y) {
      const s = 2;
      ctx.fillStyle = '#331111';
      this._heartPixels(ctx, x, y, s, false);
      ctx.fillStyle = '#551111';
      this._heartPixels(ctx, x, y, s, true);
    }

    // Helper: draw the heart pixel pattern
    // outline=true draws outer ring only; false fills interior
    _heartPixels(ctx, x, y, s, outline) {
      // Pixel map of the heart (9 cols × 8 rows)
      const mask = [
        [0,0,1,1,0,0,1,1,0],
        [0,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,1,0,0],
        [0,0,0,1,1,1,0,0,0],
        [0,0,0,0,1,0,0,0,0],
      ];

      for (let row = 0; row < mask.length; row++) {
        for (let col = 0; col < mask[row].length; col++) {
          if (!mask[row][col]) continue;
          if (outline) {
            // Check if this pixel is on the border (any neighbor is 0 or out-of-bounds)
            const up    = row > 0 ? mask[row-1][col] : 0;
            const dn    = row < mask.length-1 ? mask[row+1][col] : 0;
            const lt    = col > 0 ? mask[row][col-1] : 0;
            const rt    = col < mask[row].length-1 ? mask[row][col+1] : 0;
            if (!up || !dn || !lt || !rt) {
              ctx.fillRect(x + col * s, y + row * s, s, s);
            }
          } else {
            ctx.fillRect(x + col * s, y + row * s, s, s);
          }
        }
      }
    }

    // -----------------------------------------------------------------------
    // Draw stage name at top center
    // -----------------------------------------------------------------------
    _drawStageName(ctx, stage, cW) {
      const name = (stage && stage.name) ? stage.name : '';
      ctx.font = 'bold 11px "MS Gothic", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(name, cW / 2 + 1, HEART_MARGIN + 1);

      ctx.fillStyle = '#ccddff';
      ctx.fillText(name, cW / 2, HEART_MARGIN);
    }

    // -----------------------------------------------------------------------
    // Draw score at top right
    // -----------------------------------------------------------------------
    _drawScore(ctx, score, cW, oy) {
      const text = 'SCORE: ' + (score | 0);
      ctx.font = 'bold 11px "MS Gothic", "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(text, cW - HEART_MARGIN + 1, oy + 1);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cW - HEART_MARGIN, oy);
    }

    // -----------------------------------------------------------------------
    // Draw synchro gauge at bottom center
    // -----------------------------------------------------------------------
    _drawSynchroGauge(ctx, gauge, synchroTimer, cW, cH, player, dt) {
      const bx     = (cW - SYNCHRO_W) / 2;
      const by     = cH - 36;
      const active = synchroTimer > 0;

      // Label "SYNCHRO"
      ctx.font = '9px "MS Gothic", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      if (active) {
        // Flashing gold label
        const flash = (Math.sin(Date.now() / 80) > 0);
        ctx.fillStyle = flash ? '#ffee00' : '#ffffff';
        ctx.fillText('SYNCHRO !!!', cW / 2, by - 2);
      } else {
        ctx.fillStyle = '#aabbcc';
        ctx.fillText('SYNCHRO', cW / 2, by - 2);
      }

      // Gauge background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.strokeStyle = 'rgba(100,150,200,0.6)';
      ctx.lineWidth = 1;
      ctx.fillRect(bx - 1, by - 1, SYNCHRO_W + 2, SYNCHRO_H + 2);
      ctx.strokeRect(bx - 1, by - 1, SYNCHRO_W + 2, SYNCHRO_H + 2);

      // Gauge fill (gradient blue→yellow)
      const fillW = Math.floor(SYNCHRO_W * Math.max(0, Math.min(1, gauge / 100)));
      if (fillW > 0) {
        if (active) {
          // Flashing gold
          const t = (Math.sin(Date.now() / 100) + 1) / 2;
          ctx.fillStyle = 'rgba(' +
            Math.round(200 + 55 * t) + ',' +
            Math.round(170 + 85 * t) + ',0,0.95)';
        } else {
          // Blue at 0% → yellow-green at 50% → yellow at 100%
          const g = gauge / 100;
          const r = Math.round(0   + g * 220);
          const gr = Math.round(120 + g * 120);
          const b  = Math.round(220 - g * 220);
          ctx.fillStyle = 'rgb(' + r + ',' + gr + ',' + b + ')';
        }
        ctx.fillRect(bx, by, fillW, SYNCHRO_H);
      }

      // Active "!!!" overlay text
      if (active) {
        ctx.font = 'bold 10px "MS Gothic", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000000';
        ctx.fillText('!!!', cW / 2 + 1, by + SYNCHRO_H / 2 + 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('!!!', cW / 2, by + SYNCHRO_H / 2);
      }

      // Skill cooldown indicator (small circle to the right of synchro bar)
      if (player) {
        this._drawSkillCooldown(ctx, player, bx + SYNCHRO_W + 8, by + SYNCHRO_H / 2);
      }
    }

    // -----------------------------------------------------------------------
    // Draw skill cooldown circle
    // -----------------------------------------------------------------------
    _drawSkillCooldown(ctx, player, cx, cy) {
      const r         = 8;
      const maxCd     = player.skillMaxCooldown || 3;
      const cd        = (player.skillCooldown != null) ? player.skillCooldown : 0;
      const ready     = cd <= 0;
      const fraction  = ready ? 1 : 1 - cd / maxCd;  // 0=charging → 1=ready

      // Background circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fill();
      ctx.strokeStyle = ready ? '#aaffaa' : '#556677';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Charge arc (clockwise from top)
      if (!ready && fraction > 0) {
        const startAngle = -Math.PI / 2;
        const endAngle   = startAngle + fraction * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r - 1, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = '#4488bb';
        ctx.fill();
      } else if (ready) {
        ctx.beginPath();
        ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
        ctx.fillStyle = '#44ddaa';
        ctx.fill();
      }

      // 'S' label
      ctx.font = 'bold 8px "MS Gothic", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ready ? '#ffffff' : '#88aacc';
      ctx.fillText('S', cx, cy + 1);
    }

    // -----------------------------------------------------------------------
    // Draw boss HP bar at top-center
    // -----------------------------------------------------------------------
    _drawBossBar(ctx, boss, cW) {
      const bx     = (cW - BOSS_BAR_W) / 2;
      const by     = 30;
      const ratio  = Math.max(0, boss.hp / Math.max(1, boss.maxHp));
      const fillW  = Math.floor(BOSS_BAR_W * ratio);
      const flash  = this._bossFlashTimer > 0;

      // "BOSS" label
      ctx.font = 'bold 10px "MS Gothic", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#ffaaaa';
      ctx.fillText('BOSS', cW / 2, by - 2);

      // Background
      ctx.fillStyle = '#220000';
      ctx.strokeStyle = '#882222';
      ctx.lineWidth = 1;
      ctx.fillRect(bx - 1, by - 1, BOSS_BAR_W + 2, BOSS_BAR_H + 2);
      ctx.strokeRect(bx - 1, by - 1, BOSS_BAR_W + 2, BOSS_BAR_H + 2);

      // Fill
      if (fillW > 0) {
        if (flash) {
          // Flash white/yellow on damage
          const t = this._bossFlashTimer / 0.25;
          ctx.fillStyle = 'rgba(255,' + Math.round(200 * t) + ',' + Math.round(100 * t) + ',1)';
        } else {
          // Gradient red → orange as HP drops
          ctx.fillStyle = ratio > 0.5 ? '#cc2222' : ratio > 0.25 ? '#cc6622' : '#ee2222';
        }
        ctx.fillRect(bx, by, fillW, BOSS_BAR_H);
      }

      // HP fraction text
      ctx.font = '9px "MS Gothic", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(boss.hp + ' / ' + boss.maxHp, cW / 2, by + BOSS_BAR_H / 2);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────────────────
  window.HUD = HUD;

}());
