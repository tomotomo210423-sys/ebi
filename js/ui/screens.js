/**
 * screens.js  -  Canvas-drawn screens for クラゲライダー・カニィとプカプカの大冒険
 *
 * All functions draw directly onto the canvas (screen-space).
 * No ES modules.  Exposes: window.Screens
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Fill a rounded rectangle */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y,     x + r, y,     r);
    ctx.closePath();
  }

  /** Draw pixel-font-style text with outline */
  function drawOutlinedText(ctx, text, x, y, fillColor, outlineColor, fontSize, align, baseline) {
    ctx.font         = 'bold ' + fontSize + 'px "MS Gothic", "Courier New", monospace';
    ctx.textAlign    = align    || 'center';
    ctx.textBaseline = baseline || 'middle';

    ctx.lineWidth    = 4;
    ctx.strokeStyle  = outlineColor || '#000000';
    ctx.lineJoin     = 'round';
    ctx.strokeText(text, x, y);

    ctx.fillStyle    = fillColor || '#ffffff';
    ctx.fillText(text, x, y);
  }

  /** Animated background bubbles (reused across screens) */
  function drawBubbles(ctx, cW, cH, count, color) {
    const t = Date.now() / 1000;
    ctx.save();
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random per bubble index
      const seed  = i * 137.508;
      const bx    = ((seed * 0.314) % 1) * cW;
      const speed = 20 + ((seed * 0.571) % 1) * 30;
      const size  = 3  + ((seed * 0.217) % 1) * 8;
      const phase = (seed * 0.743) % 1;
      const by    = cH - ((t * speed + phase * cH) % (cH + size * 2));
      const wobble = Math.sin(t * 1.5 + seed) * 4;

      ctx.beginPath();
      ctx.arc(bx + wobble, by, size, 0, Math.PI * 2);
      ctx.strokeStyle = color || 'rgba(100,180,255,0.25)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Tiny highlight
      ctx.beginPath();
      ctx.arc(bx + wobble - size * 0.3, by - size * 0.3, size * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
    }
    ctx.restore();
  }

  /** Draw a simple pixel-art crab shape (stand-in for Kani sprite) */
  function drawPixelKani(ctx, cx, cy, scale) {
    const s = scale || 3;
    // Simple crab silhouette using colored rectangles
    // Body
    ctx.fillStyle = '#e05020';
    ctx.fillRect(cx - 5*s, cy - 4*s, 10*s, 6*s);
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 3*s, cy - 4*s, s, s);
    ctx.fillRect(cx + 2*s, cy - 4*s, s, s);
    ctx.fillStyle = '#000000';
    ctx.fillRect(cx - 3*s + 1, cy - 4*s, s-1, s-1);
    ctx.fillRect(cx + 2*s + 1, cy - 4*s, s-1, s-1);
    // Claws
    ctx.fillStyle = '#ff2020';
    ctx.fillRect(cx - 8*s, cy - 3*s, 3*s, 2*s);
    ctx.fillRect(cx + 5*s, cy - 3*s, 3*s, 2*s);
    // Legs
    ctx.fillStyle = '#801800';
    ctx.fillRect(cx - 4*s, cy + 2*s, s, 3*s);
    ctx.fillRect(cx - 2*s, cy + 2*s, s, 3*s);
    ctx.fillRect(cx,       cy + 2*s, s, 3*s);
    ctx.fillRect(cx + 2*s, cy + 2*s, s, 3*s);
  }

  /** Draw a simple pixel-art jellyfish shape (stand-in for Pukpuka sprite) */
  function drawPixelPukpuka(ctx, cx, cy, scale) {
    const s = scale || 3;
    // Dome
    ctx.fillStyle = '#6acdea';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2*s, 6*s, 5*s, 0, Math.PI, 0);
    ctx.fill();
    // Dome highlight
    ctx.fillStyle = '#c8f0ff';
    ctx.beginPath();
    ctx.ellipse(cx - s, cy - 4*s, 2*s, 2*s, 0, Math.PI, 0);
    ctx.fill();
    // Tentacles
    ctx.strokeStyle = '#2a7aaa';
    ctx.lineWidth = s * 0.6;
    const tenX = [-4, -2, 0, 2, 4];
    const t = Date.now() / 500;
    for (let i = 0; i < tenX.length; i++) {
      const tx = cx + tenX[i] * s;
      const ty0 = cy + 2 * s;
      const ty1 = cy + 7 * s;
      const wave = Math.sin(t + i * 0.8) * s;
      ctx.beginPath();
      ctx.moveTo(tx, ty0);
      ctx.quadraticCurveTo(tx + wave, (ty0 + ty1) / 2, tx, ty1);
      ctx.stroke();
    }
    // Pink trim
    ctx.fillStyle = '#ff80c0';
    ctx.fillRect(cx - 6*s, cy - s, 12*s, s * 0.7);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screens object
  // ─────────────────────────────────────────────────────────────────────────
  const Screens = {

    // -----------------------------------------------------------------------
    // drawTitle  -  Title screen
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {number} cW  canvas width
    // @param {number} cH  canvas height
    // @param {number} selectedOption  0 = "はじめる", 1 = "つづきから"
    // -----------------------------------------------------------------------
    drawTitle(ctx, cW, cH, selectedOption) {
      // ── Background gradient ─────────────────────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, 0, cH);
      bgGrad.addColorStop(0, '#04041a');
      bgGrad.addColorStop(0.5, '#0a1535');
      bgGrad.addColorStop(1, '#060c22');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cW, cH);

      // ── Animated bubbles ─────────────────────────────────────────────────
      drawBubbles(ctx, cW, cH, 18, 'rgba(80,150,220,0.2)');

      // ── Distant stars ────────────────────────────────────────────────────
      ctx.save();
      const starSeed = 42;
      for (let i = 0; i < 40; i++) {
        const sx = ((i * 137.508 + starSeed) % 1 + 1) % 1 * cW;
        const sy = ((i * 97.231 + starSeed) % 1 + 1) % 1 * (cH * 0.65);
        const blink = (Math.sin(Date.now() / 900 + i) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8 + blink * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,220,255,' + (0.3 + blink * 0.5) + ')';
        ctx.fill();
      }
      ctx.restore();

      // ── Characters (Kani riding Pukpuka) ─────────────────────────────────
      const charX = cW / 2;
      const charY = cH * 0.38;
      const bob   = Math.sin(Date.now() / 700) * 4;

      drawPixelPukpuka(ctx, charX, charY + 12 + bob, 3);
      drawPixelKani   (ctx, charX, charY - 2  + bob, 3);

      // ── Title text ───────────────────────────────────────────────────────
      // Main title
      const titleGrad = ctx.createLinearGradient(cW/2 - 100, 0, cW/2 + 100, 0);
      titleGrad.addColorStop(0,   '#88eeff');
      titleGrad.addColorStop(0.4, '#ffffff');
      titleGrad.addColorStop(0.7, '#ffee88');
      titleGrad.addColorStop(1,   '#ff88cc');

      ctx.font         = 'bold 28px "MS Gothic", "Noto Sans JP", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth    = 5;
      ctx.strokeStyle  = '#001133';
      ctx.lineJoin     = 'round';
      ctx.strokeText('クラゲライダー', cW / 2, cH * 0.12);
      ctx.fillStyle    = titleGrad;
      ctx.fillText('クラゲライダー', cW / 2, cH * 0.12);

      // Subtitle
      drawOutlinedText(
        ctx,
        'カニィとプカプカの大冒険',
        cW / 2, cH * 0.20,
        '#cceeFF', '#001122', 14
      );

      // ── Menu options ─────────────────────────────────────────────────────
      const options = ['はじめる', 'つづきから'];
      const optBaseY = cH * 0.70;
      const optGap   = 38;

      for (let i = 0; i < options.length; i++) {
        const oy      = optBaseY + i * optGap;
        const selected = (i === selectedOption);
        const pulse   = (Math.sin(Date.now() / 250) + 1) / 2;  // 0-1

        // Menu box
        const bw = 160;
        const bh = 28;
        const bx = (cW - bw) / 2;
        const by = oy - bh / 2;

        roundRect(ctx, bx, by, bw, bh, 6);
        if (selected) {
          ctx.fillStyle = 'rgba(0,180,200,' + (0.55 + pulse * 0.25) + ')';
          ctx.fill();
          ctx.strokeStyle = 'rgba(100,240,255,' + (0.7 + pulse * 0.3) + ')';
          ctx.lineWidth   = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(20,40,70,0.65)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(80,120,160,0.5)';
          ctx.lineWidth   = 1;
          ctx.stroke();
        }

        // Cursor arrow
        if (selected) {
          ctx.fillStyle = '#ffee00';
          ctx.font      = '14px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('►', bx + 8, oy);
        }

        drawOutlinedText(
          ctx,
          options[i],
          cW / 2, oy,
          selected ? '#ffffff' : '#aaccdd',
          '#000814',
          13
        );
      }

      // ── Control hint ─────────────────────────────────────────────────────
      ctx.font         = '9px "MS Gothic", "Courier New", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle    = 'rgba(140,170,200,0.7)';
      ctx.fillText('← → 選択　Space / Enter 決定', cW / 2, cH - 8);
    },

    // -----------------------------------------------------------------------
    // drawStageSelect  -  Stage selection screen
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {number} cW
    // @param {number} cH
    // @param {Array}  stages        - STAGES array
    // @param {Set}    clearedStages - set of cleared stage ids
    // @param {number} selectedIdx   - currently highlighted stage index (0-3)
    // -----------------------------------------------------------------------
    drawStageSelect(ctx, cW, cH, stages, clearedStages, stageStars, selectedIdx) {
      // ── Background ───────────────────────────────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, 0, cH);
      bgGrad.addColorStop(0, '#050510');
      bgGrad.addColorStop(1, '#0a0a20');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cW, cH);

      // Stars
      ctx.save();
      for (let i = 0; i < 60; i++) {
        const sx = ((i * 173.17) % 1 + 1) % 1 * cW;
        const sy = ((i * 113.31) % 1 + 1) % 1 * cH;
        const blink = (Math.sin(Date.now() / 700 + i * 0.8) + 1) / 2;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.7 + blink * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,210,255,' + (0.2 + blink * 0.5) + ')';
        ctx.fill();
      }
      ctx.restore();

      // ── Title ────────────────────────────────────────────────────────────
      drawOutlinedText(ctx, 'ステージ選択', cW / 2, 26, '#88ddff', '#001133', 18);

      // ── Stage cards  (2×2 grid) ──────────────────────────────────────────
      const cardW   = 130;
      const cardH   = 90;
      const gapX    = 16;
      const gapY    = 14;
      const cols    = 2;
      const gridW   = cols * cardW + (cols - 1) * gapX;
      const gridX   = (cW - gridW) / 2;
      const gridY   = 56;

      // Stage accent colors
      const stageColors = ['#1a4a7a', '#0a3a1a', '#4a1a0a', '#000838'];
      const stageBorder  = ['#2266bb', '#22aa44', '#bb4422', '#2233aa'];
      const stageIcons   = ['⚓', '🌿', '⚙', '🔱'];

      for (let i = 0; i < 4; i++) {
        const stage    = stages ? stages[i] : null;
        const col      = i % cols;
        const row      = Math.floor(i / cols);
        const cx       = gridX + col * (cardW + gapX);
        const cy       = gridY + row * (cardH + gapY);
        const selected = (i === selectedIdx);
        const cleared  = clearedStages && clearedStages.includes(i + 1);
        const locked   = i > 0 && !(clearedStages && clearedStages.includes(i));

        const pulse = (Math.sin(Date.now() / 280) + 1) / 2;

        // Card background
        roundRect(ctx, cx, cy, cardW, cardH, 8);
        if (locked) {
          ctx.fillStyle = 'rgba(15,15,30,0.7)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(60,70,100,0.5)';
          ctx.lineWidth   = 1;
          ctx.stroke();
        } else if (selected) {
          ctx.fillStyle = stageColors[i] || '#1a2a4a';
          ctx.fill();
          ctx.strokeStyle = 'rgba(150,220,255,' + (0.7 + pulse * 0.3) + ')';
          ctx.lineWidth   = 2.5;
          ctx.stroke();
          // Glow effect
          ctx.shadowColor = stageBorder[i] || '#4488ff';
          ctx.shadowBlur  = 12;
          roundRect(ctx, cx, cy, cardW, cardH, 8);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = stageColors[i] || '#0a1a2a';
          ctx.fill();
          ctx.strokeStyle = (stageBorder[i] || '#224466') + '88';
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }

        if (locked) {
          // Lock icon and dim overlay
          ctx.globalAlpha = 0.45;
          ctx.font         = '22px monospace';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle    = '#aaaacc';
          ctx.fillText('🔒', cx + cardW / 2, cy + cardH / 2 - 6);
          drawOutlinedText(ctx, 'LOCKED', cx + cardW / 2, cy + cardH / 2 + 16, '#667788', '#000000', 9);
          ctx.globalAlpha = 1;
        } else {
          // Stage icon
          ctx.font         = '18px monospace';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle    = '#ffffff';
          ctx.fillText(stageIcons[i] || '●', cx + cardW / 2, cy + 8);

          // Stage name
          const sname = stage ? stage.name : ('ステージ' + (i + 1));
          ctx.font         = '9px "MS Gothic", "Courier New", monospace';
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle    = selected ? '#ffffff' : '#aaccdd';
          // Wrap long names if needed
          ctx.fillText(sname, cx + cardW / 2, cy + 30);

          // Stars (0-3 from save data)
          const stars = (stageStars && stageStars[stage.id]) || 0;
          this._drawStars(ctx, cx + cardW / 2, cy + 56, stars);

          // Selected: show cursor
          if (selected) {
            drawOutlinedText(ctx, '▶', cx + 8, cy + cardH / 2, '#ffee00', '#000000', 10);
          }
        }
      }

      // ── Control hint ─────────────────────────────────────────────────────
      ctx.font         = '9px "MS Gothic", "Courier New", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle    = 'rgba(140,170,200,0.7)';
      ctx.fillText('← → ↑ ↓ 選択　Space 決定', cW / 2, cH - 8);
    },

    /** Draw 3 stars, filled up to count */
    _drawStars(ctx, cx, cy, count) {
      const gap = 14;
      for (let i = 0; i < 3; i++) {
        const sx = cx - gap + i * gap;
        ctx.font         = '11px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = i < count ? '#ffcc00' : '#333355';
        ctx.fillText('★', sx, cy);
      }
    },

    // -----------------------------------------------------------------------
    // drawPause  -  Pause overlay
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {number} cW
    // @param {number} cH
    // @param {number} selectedOption  0 = "つづける", 1 = "タイトルへ"
    // -----------------------------------------------------------------------
    drawPause(ctx, cW, cH, selectedOption) {
      // Semi-transparent dark overlay
      ctx.fillStyle = 'rgba(0,0,30,0.72)';
      ctx.fillRect(0, 0, cW, cH);

      // Pause panel background
      const panelW = 200;
      const panelH = 130;
      const px     = (cW - panelW) / 2;
      const py     = (cH - panelH) / 2;

      roundRect(ctx, px, py, panelW, panelH, 12);
      ctx.fillStyle   = 'rgba(10,15,40,0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,150,220,0.6)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Title
      drawOutlinedText(ctx, 'ポーズ', cW / 2, py + 28, '#88ddff', '#001133', 18);

      // Divider
      ctx.strokeStyle = 'rgba(100,150,200,0.35)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(px + 20, py + 46);
      ctx.lineTo(px + panelW - 20, py + 46);
      ctx.stroke();

      // Options
      const opts = ['つづける', 'タイトルへ'];
      for (let i = 0; i < opts.length; i++) {
        const oy      = py + 68 + i * 34;
        const selected = i === selectedOption;
        const pulse   = (Math.sin(Date.now() / 250) + 1) / 2;

        if (selected) {
          roundRect(ctx, px + 20, oy - 12, panelW - 40, 24, 5);
          ctx.fillStyle = 'rgba(0,140,180,' + (0.5 + pulse * 0.2) + ')';
          ctx.fill();
          ctx.fillStyle = '#ffee00';
          ctx.font      = '10px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('►', px + 26, oy);
        }

        drawOutlinedText(
          ctx,
          opts[i],
          cW / 2, oy,
          selected ? '#ffffff' : '#8899aa',
          '#000a20', 12
        );
      }
    },

    // -----------------------------------------------------------------------
    // drawStageClear  -  Stage clear screen
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {number} cW
    // @param {number} cH
    // @param {object} stageData  - stage object
    // @param {number} score
    // @param {number} time       - elapsed time in seconds
    // @param {number} stars      - 1-3
    // -----------------------------------------------------------------------
    drawStageClear(ctx, cW, cH, stageData, score, time, stars) {
      // ── Bright celebratory background ────────────────────────────────────
      const t   = Date.now() / 1000;
      const bgGrad = ctx.createLinearGradient(0, 0, 0, cH);
      bgGrad.addColorStop(0, '#0a2a4a');
      bgGrad.addColorStop(1, '#0a0a2a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cW, cH);

      // Celebratory particle rain (deterministic)
      ctx.save();
      const colors = ['#ffcc00', '#ff8844', '#44ddff', '#44ff88', '#ff44cc', '#ffffff'];
      for (let i = 0; i < 24; i++) {
        const cx  = ((i * 137.5 + 7) % 1 + 1) % 1 * cW;
        const cy  = ((t * (20 + (i * 17.3) % 20) + (i * 53.1) % cH) % cH + cH) % cH;
        const rot = t * 2 + i;
        const col = colors[i % colors.length];
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-3, -3, 6, 6);
        ctx.restore();
      }
      ctx.restore();

      // ── Animated "ステージクリア！" ───────────────────────────────────────
      const bounce  = Math.abs(Math.sin(t * 3)) * 6;
      const shimmer = (Math.sin(t * 5) + 1) / 2;
      const clearGrad = ctx.createLinearGradient(cW/2 - 120, 0, cW/2 + 120, 0);
      clearGrad.addColorStop(0, '#ffcc00');
      clearGrad.addColorStop(0.3 + shimmer * 0.2, '#ffffff');
      clearGrad.addColorStop(0.6 + shimmer * 0.2, '#ffaa44');
      clearGrad.addColorStop(1, '#ff8888');

      ctx.font         = 'bold 24px "MS Gothic", "Noto Sans JP", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth    = 5;
      ctx.strokeStyle  = '#001133';
      ctx.lineJoin     = 'round';
      ctx.strokeText('ステージクリア！', cW / 2, cH * 0.22 - bounce);
      ctx.fillStyle    = clearGrad;
      ctx.fillText('ステージクリア！', cW / 2, cH * 0.22 - bounce);

      // Stage name
      const sname = stageData ? stageData.name : '';
      drawOutlinedText(ctx, sname, cW / 2, cH * 0.34, '#aaddff', '#001133', 11);

      // ── Stars ────────────────────────────────────────────────────────────
      const starY   = cH * 0.46;
      const starGap = 30;
      for (let i = 0; i < 3; i++) {
        const sx     = cW / 2 - starGap + i * starGap;
        const filled = i < (stars || 0);
        const scale  = filled ? (1 + Math.abs(Math.sin(t * 4 + i * 1.2)) * 0.15) : 1;

        ctx.save();
        ctx.translate(sx, starY);
        ctx.scale(scale, scale);
        ctx.font         = '22px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = filled ? '#ffcc00' : '#334';
        if (filled) {
          ctx.shadowColor = '#ffaa00';
          ctx.shadowBlur  = 10;
        }
        ctx.fillText('★', 0, 0);
        ctx.restore();
      }

      // ── Score and time ────────────────────────────────────────────────────
      const mins    = Math.floor((time || 0) / 60);
      const secs    = Math.floor((time || 0) % 60);
      const timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;

      const panelW = 200;
      const panelX = (cW - panelW) / 2;
      const panelY = cH * 0.56;

      roundRect(ctx, panelX, panelY, panelW, 60, 8);
      ctx.fillStyle = 'rgba(0,10,30,0.7)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,160,220,0.4)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      ctx.font         = '11px "MS Gothic", "Courier New", monospace';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle    = '#aaccdd';
      ctx.fillText('スコア',  panelX + 16, panelY + 18);
      ctx.fillText('タイム',  panelX + 16, panelY + 42);

      ctx.textAlign    = 'right';
      ctx.fillStyle    = '#ffffff';
      ctx.fillText((score | 0).toLocaleString(), panelX + panelW - 16, panelY + 18);
      ctx.fillText(timeStr,                       panelX + panelW - 16, panelY + 42);

      // ── Hint ─────────────────────────────────────────────────────────────
      const blink = (Math.sin(t * 4) + 1) / 2;
      ctx.font         = '10px "MS Gothic", "Courier New", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle    = 'rgba(180,220,255,' + (0.5 + blink * 0.5) + ')';
      ctx.fillText('Space / Enter  つぎへ ►', cW / 2, cH - 10);
    },

    // -----------------------------------------------------------------------
    // drawGameOver  -  Game over screen
    //
    // @param {CanvasRenderingContext2D} ctx
    // @param {number} cW
    // @param {number} cH
    // @param {number} selectedOption  0 = "リトライ", 1 = "タイトルへ"
    // -----------------------------------------------------------------------
    drawGameOver(ctx, cW, cH, selectedOption) {
      // ── Dark somber background ────────────────────────────────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, 0, cH);
      bgGrad.addColorStop(0, '#000008');
      bgGrad.addColorStop(1, '#080420');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cW, cH);

      // Slow dark bubbles
      drawBubbles(ctx, cW, cH, 8, 'rgba(40,30,80,0.2)');

      // ── Sad characters ────────────────────────────────────────────────────
      const charX = cW / 2;
      const charY = cH * 0.44;
      const droop = Math.abs(Math.sin(Date.now() / 1200)) * 3;

      // Draw sad Pukpuka (dim/dark tinted)
      ctx.save();
      ctx.globalAlpha = 0.55;
      drawPixelPukpuka(ctx, charX, charY + 12 + droop, 3);
      ctx.globalAlpha = 0.55;
      drawPixelKani   (ctx, charX, charY -  2 + droop, 3);
      ctx.restore();

      // Dark overlay on characters
      ctx.fillStyle = 'rgba(0,0,20,0.35)';
      ctx.fillRect(charX - 35, charY - 25, 70, 65);

      // ── "ゲームオーバー" text ─────────────────────────────────────────────
      const t     = Date.now() / 1000;
      const shake = Math.sin(t * 8) * 1.5;

      ctx.font         = 'bold 26px "MS Gothic", "Noto Sans JP", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth    = 5;
      ctx.strokeStyle  = '#000000';
      ctx.lineJoin     = 'round';
      ctx.strokeText('ゲームオーバー', cW / 2 + shake, cH * 0.20);
      ctx.fillStyle    = '#cc1111';
      ctx.fillText('ゲームオーバー', cW / 2 + shake, cH * 0.20);

      // ── Options ───────────────────────────────────────────────────────────
      const opts = ['リトライ', 'タイトルへ'];
      const optBaseY = cH * 0.70;
      const optGap   = 36;

      for (let i = 0; i < opts.length; i++) {
        const oy      = optBaseY + i * optGap;
        const selected = i === selectedOption;
        const pulse   = (Math.sin(Date.now() / 250) + 1) / 2;

        const bw = 150;
        const bh = 26;
        const bx = (cW - bw) / 2;
        const by = oy - bh / 2;

        roundRect(ctx, bx, by, bw, bh, 5);
        if (selected) {
          ctx.fillStyle = 'rgba(140,20,20,' + (0.55 + pulse * 0.25) + ')';
          ctx.fill();
          ctx.strokeStyle = 'rgba(220,80,80,' + (0.7 + pulse * 0.3) + ')';
          ctx.lineWidth   = 2;
          ctx.stroke();
          ctx.fillStyle = '#ffcc00';
          ctx.font      = '10px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText('►', bx + 8, oy);
        } else {
          ctx.fillStyle = 'rgba(20,10,30,0.65)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(80,50,80,0.5)';
          ctx.lineWidth   = 1;
          ctx.stroke();
        }

        drawOutlinedText(
          ctx,
          opts[i],
          cW / 2, oy,
          selected ? '#ffffff' : '#886688',
          '#000010', 12
        );
      }

      // ── Hint ─────────────────────────────────────────────────────────────
      ctx.font         = '9px "MS Gothic", "Courier New", monospace';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle    = 'rgba(120,100,140,0.6)';
      ctx.fillText('← → 選択　Space / Enter 決定', cW / 2, cH - 8);
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────────────────
  window.Screens = Screens;

}());
