// クラゲライダー・カニィとプカプカの大冒険 - メインコントローラー

const CANVAS_W = 640;
const CANVAS_H = 360;
const SAVE_KEY = 'kaniSave';

const DEFAULT_SAVE = {
  clearedStages: [],
  stageStars: {},
  highScores: {},
  totalPlayTime: 0,
};

// ===== GameManager =====
const GameManager = {
  canvas: null,
  ctx: null,
  input: null,
  camera: null,
  loop: null,
  vpad: null,
  hud: null,

  state: 'title',
  selectedOption: 0,
  selectedStage: 0,

  player: null,
  enemies: [],
  boss: null,
  projectiles: [],
  hazards: null,
  tileMap: null,
  currentStage: null,
  score: 0,
  stageTime: 0,
  synchroGauge: 0,
  pauseSelectedOption: 0,
  goSelectedOption: 0,

  save: null,

  init() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.input = new Input();
    this.hud   = new HUD();
    this.vpad  = new VirtualPad(this.input);
    this.vpad.mount();
    this.vpad.hide();

    this._loadSave();
    this.camera = new Camera(CANVAS_W, CANVAS_H);

    this.loop = new GameLoop(
      (dt) => this._update(dt),
      ()    => this._render()
    );
    this.loop.start();

    window.addEventListener('keydown', (e) => this._handleMenuKey(e));

    // タッチ / マウスクリックによるメニュー操作
    this.canvas.addEventListener('pointerup', (e) => this._handleCanvasPointer(e));
  },

  _resizeCanvas() {
    const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    this.canvas.width  = CANVAS_W;
    this.canvas.height = CANVAS_H;
    this.canvas.style.width  = Math.floor(CANVAS_W * scale) + 'px';
    this.canvas.style.height = Math.floor(CANVAS_H * scale) + 'px';
  },

  _loadSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.save = raw ? { ...DEFAULT_SAVE, ...JSON.parse(raw) } : { ...DEFAULT_SAVE };
    } catch (_) {
      this.save = { ...DEFAULT_SAVE };
    }
  },

  _saveSave() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (_) {}
  },

  _setState(newState) {
    this.state = newState;
    this.selectedOption = 0;
    this.pauseSelectedOption = 0;
    this.goSelectedOption = 0;
    if (newState === 'playing') this.vpad.show();
    else this.vpad.hide();
  },

  _startStage(stageIdx) {
    const stageDef = STAGES[stageIdx];
    if (!stageDef) return;
    this.currentStage  = stageDef;
    this.selectedStage = stageIdx;
    this.score         = 0;
    this.stageTime     = 0;
    this.synchroGauge  = 0;

    this.tileMap = new Physics.TileMap(stageDef.map, 48);

    const ps = stageDef.playerStart;
    this.player = new Player(ps.tx * 48 + 4, ps.ty * 48 - 30);

    this.enemies = stageDef.enemySpawns.map(sp => {
      const ex = sp.tx * 48, ey = sp.ty * 48 - 24;
      switch (sp.type) {
        case 'Oily':      return new Oily(ex, ey);
        case 'Gomira':    return new Gomira(ex, ey);
        case 'Fujitsubo': return new Fujitsubo(ex, ey);
        case 'Mutsugoro': return new Mutsugoro(ex, ey);
        default:          return new Oily(ex, ey);
      }
    });

    if (stageDef.bossSpawn) {
      const bs = stageDef.bossSpawn;
      this.boss = new OctopusBoss(bs.tx * 48, bs.ty * 48 - 60);
    } else {
      this.boss = null;
    }

    this.projectiles = [];
    this.hazards     = new HazardManager();
    this.camera.x    = 0;
    this.camera.y    = 0;

    this._setState('playing');
  },

  _handleMenuKey(e) {
    const code = e.code;
    if (this.state === 'title') {
      if (code === 'ArrowUp'   || code === 'ArrowLeft')  this.selectedOption = 0;
      if (code === 'ArrowDown' || code === 'ArrowRight') this.selectedOption = 1;
      if (code === 'Space' || code === 'Enter') {
        if (this.selectedOption === 0) this._setState('stage-select');
        else { this._loadSave(); this._setState('stage-select'); }
      }
    } else if (this.state === 'stage-select') {
      if (code === 'ArrowLeft')  this.selectedStage = Math.max(0, this.selectedStage - 1);
      if (code === 'ArrowRight') this.selectedStage = Math.min(STAGES.length - 1, this.selectedStage + 1);
      if (code === 'Space' || code === 'Enter') this._startStage(this.selectedStage);
      if (code === 'Escape') this._setState('title');
    } else if (this.state === 'paused') {
      if (code === 'ArrowUp' || code === 'ArrowDown') this.pauseSelectedOption ^= 1;
      if (code === 'Space'   || code === 'Enter') {
        if (this.pauseSelectedOption === 0) this._setState('playing');
        else this._setState('title');
      }
      if (code === 'Escape') this._setState('playing');
    } else if (this.state === 'stage-clear') {
      if (code === 'Space' || code === 'Enter') {
        const next = this.selectedStage + 1;
        if (next < STAGES.length) { this.selectedStage = next; this._setState('stage-select'); }
        else this._setState('title');
      }
    } else if (this.state === 'game-over') {
      if (code === 'ArrowUp' || code === 'ArrowDown') this.goSelectedOption ^= 1;
      if (code === 'Space'   || code === 'Enter') {
        if (this.goSelectedOption === 0) this._startStage(this.selectedStage);
        else this._setState('title');
      }
    }
  },

  // ===== タッチ / クリック操作 =====
  _handleCanvasPointer(e) {
    const rect  = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top)  * scaleY;

    if (this.state === 'title') {
      const baseY = CANVAS_H * 0.70;
      const gap   = 38;
      if (cy >= baseY - 18 && cy <= baseY + 18) {
        this._setState('stage-select');
      } else if (cy >= baseY + gap - 18 && cy <= baseY + gap + 18) {
        this._loadSave();
        this._setState('stage-select');
      }

    } else if (this.state === 'stage-select') {
      const cardW = 130, cardH = 90, gapX = 16, gapY = 14, cols = 2;
      const gridW = cols * cardW + (cols - 1) * gapX;
      const gridX = (CANVAS_W - gridW) / 2;
      const gridY = 56;
      for (let i = 0; i < 4; i++) {
        const col  = i % cols;
        const row  = Math.floor(i / cols);
        const bx   = gridX + col * (cardW + gapX);
        const by   = gridY + row * (cardH + gapY);
        if (cx >= bx && cx <= bx + cardW && cy >= by && cy <= by + cardH) {
          if (this.selectedStage === i) {
            this._startStage(i);
          } else {
            this.selectedStage = i;
          }
          break;
        }
      }

    } else if (this.state === 'paused') {
      const panelH = 130;
      const py  = (CANVAS_H - panelH) / 2;
      const opt0Y = py + 68;
      const opt1Y = py + 68 + 34;
      if (cy >= opt0Y - 16 && cy <= opt0Y + 16)  this._setState('playing');
      else if (cy >= opt1Y - 16 && cy <= opt1Y + 16) this._setState('title');

    } else if (this.state === 'stage-clear') {
      const next = this.selectedStage + 1;
      if (next < STAGES.length) { this.selectedStage = next; this._setState('stage-select'); }
      else this._setState('title');

    } else if (this.state === 'game-over') {
      const baseY = CANVAS_H * 0.70;
      const gap   = 36;
      if (cy >= baseY - 16 && cy <= baseY + 16) {
        this._startStage(this.selectedStage);
      } else if (cy >= baseY + gap - 16 && cy <= baseY + gap + 16) {
        this._setState('title');
      }
    }
  },

  _update(dt) {
    this.input.update();
    if (this.state === 'playing') this._updatePlaying(dt);
  },

  _updatePlaying(dt) {
    if (this.input.pauseDown) { this._setState('paused'); return; }

    this.stageTime += dt;

    if (this.player) {
      // ボスも攻撃対象として含める
      const attackTargets = this.boss && this.boss.alive
        ? [this.boss, ...this.enemies]
        : this.enemies;
      this.player.update(dt, this.input, this.tileMap, attackTargets, this.projectiles, this.hazards);

      // ゴール判定
      const goal = this._findGoalTile();
      if (goal && Physics.rectOverlap(
        this.player.x, this.player.y, this.player.w, this.player.h,
        goal.x, goal.y, 48, 48
      )) { this._onStageClear(); return; }

      // 死亡判定
      if (this.player.hp <= 0 || this.player.y > this.tileMap.worldHeight + 100) {
        this._setState('game-over'); return;
      }

      this.synchroGauge = this.player.synchroTimer > 0
        ? Math.min(100, (this.player.synchroTimer / 0.2) * 100)
        : 0;
    }

    this.enemies = this.enemies.filter(e => e.alive);
    this.enemies.forEach(e => e.update(dt, this.player, this.projectiles, this.tileMap));

    if (this.boss && this.boss.alive) {
      this.boss.update(dt, this.player, this.projectiles, this.tileMap);
    }

    this.projectiles = this.projectiles.filter(p => p.alive);
    this.projectiles.forEach(p => p.update(dt, this.tileMap));

    if (this.hazards) this.hazards.update(dt);

    if (this.player) {
      this.camera.follow(
        this.player.x + this.player.w / 2,
        this.player.y + this.player.h / 2,
        this.tileMap.worldWidth,
        this.tileMap.worldHeight
      );
    }
    this.camera.update(dt);
  },

  _findGoalTile() {
    const map = this.tileMap;
    for (let ty = 0; ty < map.rows; ty++) {
      for (let tx = 0; tx < map.cols; tx++) {
        if (map.get(tx, ty) === 5) return { x: tx * 48, y: ty * 48 };
      }
    }
    return null;
  },

  _onStageClear() {
    const id = this.currentStage.id;
    if (!this.save.clearedStages.includes(id)) this.save.clearedStages.push(id);
    const stars = this.stageTime < 60 ? 3 : this.stageTime < 90 ? 2 : 1;
    this.save.stageStars[id] = Math.max(this.save.stageStars[id] || 0, stars);
    this.save.highScores[id] = Math.max(this.save.highScores[id] || 0, this.score);
    this._saveSave();
    this._setState('stage-clear');
  },

  _render() {
    const { ctx } = this;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    switch (this.state) {
      case 'title':
        Screens.drawTitle(ctx, CANVAS_W, CANVAS_H, this.selectedOption); break;
      case 'stage-select':
        Screens.drawStageSelect(ctx, CANVAS_W, CANVAS_H, STAGES,
          this.save.clearedStages, this.save.stageStars, this.selectedStage); break;
      case 'playing':
        this._renderPlaying(ctx); break;
      case 'paused':
        this._renderPlaying(ctx);
        Screens.drawPause(ctx, CANVAS_W, CANVAS_H, this.pauseSelectedOption); break;
      case 'stage-clear':
        this._renderPlaying(ctx);
        Screens.drawStageClear(ctx, CANVAS_W, CANVAS_H, this.currentStage, this.score,
          this.stageTime, this.save.stageStars[this.currentStage.id] || 1); break;
      case 'game-over':
        this._renderPlaying(ctx);
        Screens.drawGameOver(ctx, CANVAS_W, CANVAS_H, this.goSelectedOption); break;
    }
  },

  _renderPlaying(ctx) {
    if (!this.tileMap) return;
    this._drawBackground(ctx);
    this.camera.applyToCtx(ctx);
    this._drawTileMap(ctx);
    if (this.hazards) this.hazards.draw(ctx);
    this.enemies.forEach(e => e.draw(ctx));
    if (this.boss && this.boss.alive) this.boss.draw(ctx);
    this.projectiles.forEach(p => p.draw(ctx));
    if (this.player) this.player.draw(ctx, this.hazards);
    this.camera.restoreCtx(ctx);
    if (this.hud && this.player) {
      this.hud.drawHUD(ctx, this.player, this.boss && this.boss.alive ? this.boss : null,
        this.currentStage, this.score, this.synchroGauge, this.player.synchroTimer || 0);
    }
  },

  _drawBackground(ctx) {
    const stage = this.currentStage;
    if (!stage) return;
    const [c1, c2] = stage.bgColor || ['#0a0a1f', '#1a2a4a'];
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // 浮かぶ泡
    const t = Date.now() * 0.001;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 14; i++) {
      const bx = ((i * 173 + t * 20) % CANVAS_W);
      const by = CANVAS_H - ((t * (6 + i % 4) * 8 + i * 79) % CANVAS_H);
      ctx.beginPath();
      ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  },

  _drawTileMap(ctx) {
    const { tileMap } = this;
    const TS  = 48, PS = 3;
    const cx  = Math.floor(this.camera.x);
    const cy  = Math.floor(this.camera.y);
    const stx = Math.max(0, Math.floor(cx / TS));
    const etx = Math.min(tileMap.cols - 1, Math.ceil((cx + CANVAS_W) / TS));
    const sty = Math.max(0, Math.floor(cy / TS));
    const ety = Math.min(tileMap.rows - 1, Math.ceil((cy + CANVAS_H) / TS));
    const t   = Date.now();

    for (let ty = sty; ty <= ety; ty++) {
      for (let tx = stx; tx <= etx; tx++) {
        const tile = tileMap.get(tx, ty);
        if (!tile) continue;
        this._drawTile(ctx, tile, tx * TS, ty * TS, t, PS);
      }
    }
  },

  _drawTile(ctx, tile, wx, wy, t, PS) {
    const TS = 48;
    if (tile === 1) {
      if (window.TILE_PAL && window.TILE_GROUND) {
        SpriteRenderer.drawSpriteFrame(ctx, window.TILE_GROUND, 0, wx, wy, window.TILE_PAL, PS);
      } else {
        ctx.fillStyle = '#3a5a2a'; ctx.fillRect(wx, wy, TS, TS);
        ctx.strokeStyle = '#2a4a1a'; ctx.lineWidth = 1; ctx.strokeRect(wx + 0.5, wy + 0.5, TS - 1, TS - 1);
      }
    } else if (tile === 2) {
      if (window.TILE_PAL && window.TILE_OIL) {
        SpriteRenderer.drawSpriteFrame(ctx, window.TILE_OIL, Math.floor(t / 500) % window.TILE_OIL.length, wx, wy, window.TILE_PAL, PS);
      } else {
        ctx.fillStyle = '#100804'; ctx.fillRect(wx, wy, TS, TS);
        ctx.fillStyle = `hsla(${(t / 20) % 360},80%,50%,0.25)`; ctx.fillRect(wx + 4, wy + 4, TS - 8, TS - 8);
      }
    } else if (tile === 3) {
      if (window.TILE_PAL && window.TILE_WATER) {
        SpriteRenderer.drawSpriteFrame(ctx, window.TILE_WATER, Math.floor(t / 300) % window.TILE_WATER.length, wx, wy, window.TILE_PAL, PS);
      } else {
        ctx.fillStyle = '#081408'; ctx.fillRect(wx, wy, TS, TS);
      }
    } else if (tile === 4) {
      if (window.TILE_PAL && window.TILE_SPIKE) {
        SpriteRenderer.drawSpriteFrame(ctx, window.TILE_SPIKE, 0, wx, wy, window.TILE_PAL, PS);
      } else {
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(wx, wy, TS, TS);
        ctx.fillStyle = '#888';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath(); ctx.moveTo(wx + 5 + i * 11, wy + TS);
          ctx.lineTo(wx + 10 + i * 11, wy + TS - 18); ctx.lineTo(wx + 15 + i * 11, wy + TS); ctx.fill();
        }
      }
    } else if (tile === 5) {
      // ゴール旗
      ctx.fillStyle = 'rgba(255,215,0,0.2)'; ctx.fillRect(wx, wy, TS, TS);
      ctx.fillStyle = '#ffd700'; ctx.fillRect(wx + 20, wy + 4, 3, TS - 4);
      ctx.fillStyle = '#ff4400'; ctx.fillRect(wx + 23, wy + 4, 16, 10);
      ctx.fillStyle = '#ffd700'; ctx.fillRect(wx + 23, wy + 4, 2, 10);
    }
  },
};

window.GameManager = GameManager;

document.addEventListener('DOMContentLoaded', () => {
  GameManager.init();
});
