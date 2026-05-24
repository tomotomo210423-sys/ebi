// 幻海伝説 - メインコントローラー / GameState

const SAVE_KEY = 'genkaiSave';

const DEFAULT_SAVE = {
  version: 2,
  playerName: '絆使い',
  unlockedChapters: [0],
  completedChapters: [],
  collectedMonsterIds: [1, 11, 21],
  monsterLevels: { 1: 1, 11: 1, 21: 1 },
  monsterXP:    { 1: 0, 11: 0, 21: 0 },
  selectedTeam: [1, 11, 21],
  totalBattles: 0,
  totalWins:    0,
};

const GameState = {
  save: null,
  currentScreen: 'title',
  _context: {},
  _activeUI: null,
  _activeBattleUI: null,
  _activeRoulette: null,

  init() {
    this.loadGame();
    this._bindTitleButtons();
    this.navigateTo('title');
  },

  // ===== セーブ / ロード =====
  saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch (e) { console.warn('Save failed', e); }
  },

  loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.save = { ...DEFAULT_SAVE, ...parsed };
        // オブジェクト型フィールドをマージ
        this.save.monsterLevels = { ...DEFAULT_SAVE.monsterLevels, ...parsed.monsterLevels };
        this.save.monsterXP    = { ...DEFAULT_SAVE.monsterXP,    ...parsed.monsterXP    };
      } else {
        this.save = { ...DEFAULT_SAVE };
      }
    } catch (e) {
      console.warn('Load failed, resetting', e);
      this.save = { ...DEFAULT_SAVE };
    }
  },

  resetGame() {
    localStorage.removeItem(SAVE_KEY);
    this.save = { ...DEFAULT_SAVE };
    this.navigateTo('title');
  },

  // ===== 画面遷移 =====
  navigateTo(screenId, ctx = {}) {
    this._context = ctx;

    // 前の画面のUIをクリーンアップ
    if (this._activeBattleUI) { this._activeBattleUI.unmount(); this._activeBattleUI = null; }
    if (this._activeRoulette) { this._activeRoulette.reset(); this._activeRoulette = null; }
    if (this._activeUI) { this._activeUI.unmount && this._activeUI.unmount(); this._activeUI = null; }

    // 全スクリーン非表示
    document.querySelectorAll('.screen').forEach(el => {
      el.classList.remove('active');
      el.style.display = 'none';
    });

    // 対象スクリーン表示
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.style.display = '';
      target.classList.add('active');
    }

    this.currentScreen = screenId;
    this._onScreenEnter(screenId, ctx);
  },

  _onScreenEnter(screenId, ctx) {
    switch (screenId) {
      case 'title':
        this._updateTitleStats();
        break;

      case 'story':
        const storyUI = new StoryUI(this);
        storyUI.mount();
        this._activeUI = storyUI;
        break;

      case 'team-select':
        this._setupTeamSelect(ctx);
        break;

      case 'battle':
        this._setupBattle(ctx);
        break;

      case 'collection':
        this._setupCollection();
        break;

      case 'free-battle':
        this._setupFreeBattle();
        break;
    }
  },

  _bindTitleButtons() {
    document.getElementById('btn-story')?.addEventListener('click', () => this.navigateTo('story'));
    document.getElementById('btn-collection')?.addEventListener('click', () => this.navigateTo('collection'));
    document.getElementById('btn-free-battle')?.addEventListener('click', () => this.navigateTo('free-battle'));
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (confirm('データをリセットしますか？')) this.resetGame();
    });
  },

  _updateTitleStats() {
    const owned   = document.getElementById('title-owned');
    const battles = document.getElementById('title-battles');
    const wins    = document.getElementById('title-wins');
    if (owned)   owned.textContent   = `コレクション: ${this.save.collectedMonsterIds.length}/60体`;
    if (battles) battles.textContent = `総バトル数: ${this.save.totalBattles}`;
    if (wins)    wins.textContent    = `勝利数: ${this.save.totalWins}`;
  },

  // ===== チーム選択 =====
  _setupTeamSelect(ctx) {
    const colUI = new CollectionUI(this, {
      mode: 'select',
      filterBarId: 'ts-filter-bar',
      cardGridId:  'ts-card-grid',
      onTeamConfirm: (teamIds) => {
        this.save.selectedTeam = teamIds;
        this.saveGame();
        if (ctx.afterSelect) ctx.afterSelect(teamIds);
        else this.navigateTo('battle', { playerTeam: teamIds.map(id => new Monster(id, this.save.monsterLevels[id] || 1)) });
      }
    });
    colUI.mount();
    this._activeUI = colUI;

    // 戻るボタン
    document.getElementById('btn-back-from-team')?.addEventListener('click', () => {
      this.navigateTo(ctx.from || 'title');
    });
  },

  // ===== バトル =====
  _setupBattle(ctx) {
    const { playerTeam, enemyTeam, difficulty, battleTitle, isBoss, midBattleScene, onComplete } = ctx;

    // バトルタイトル表示
    const titleEl = document.getElementById('battle-title');
    if (titleEl) {
      titleEl.textContent = battleTitle || 'バトル';
      titleEl.className   = isBoss ? 'battle-title boss' : 'battle-title';
    }

    // 結果オーバーレイリセット
    const overlay = document.getElementById('battle-result-overlay');
    if (overlay) overlay.style.display = 'none';

    // ルーレット
    const stripEl   = document.getElementById('roulette-strip');
    const pointerEl = document.getElementById('roulette-pointer');
    if (!stripEl) return;

    const engine = new BattleEngine(playerTeam, enemyTeam, {
      difficulty: difficulty || 'normal',
      onEvent: () => {},
    });

    const roulette = new RouletteController(stripEl, pointerEl, (action) => {
      // EX枠処理
      let finalAction = action;
      if (action === 'ex') {
        finalAction = playerTeam[engine.playerActiveIdx]?.canUseEx ? 'ex' : 'attack';
      }
      engine.playerAction(finalAction);
    });

    const battleUI = new BattleUI(engine, roulette, (won) => {
      this.save.totalBattles++;
      if (won) this.save.totalWins++;

      // バトル後のXP付与（モンスターのレベルアップはStoryUIで処理）
      if (won) {
        playerTeam.forEach(m => {
          if (!m.isAlive) return;
          const earned = 30;
          this.save.monsterXP[m.id] = (this.save.monsterXP[m.id] || 0) + earned;
          let lv = this.save.monsterLevels[m.id] || 1;
          while (lv < 10 && this.save.monsterXP[m.id] >= lv * 100) {
            this.save.monsterXP[m.id] -= lv * 100;
            lv++;
            this.save.monsterLevels[m.id] = lv;
          }
        });
        this.saveGame();
      }

      if (onComplete) {
        onComplete(won);
      } else {
        this.navigateTo('title');
      }
    }, {
      midBattleScene: midBattleScene,
      onMidBattleScene: midBattleScene ? (scenes, done) => this._runMidBattleCutscene(scenes, done) : null,
    });

    this._activeRoulette = roulette;
    this._activeBattleUI = battleUI;
    engine.onEvent = (ev) => battleUI._handleEngineEvent(ev);

    battleUI.mount();

    // 戻るボタン（フリーバトル用）
    document.getElementById('btn-battle-back')?.addEventListener('click', () => {
      if (confirm('バトルを中断しますか？')) this.navigateTo('title');
    });
  },

  _runMidBattleCutscene(scenes, onDone) {
    const box = document.getElementById('cutscene-box');
    if (!box) { onDone(); return; }
    box.style.display = 'flex';

    let idx = 0;
    const speaker = document.getElementById('cutscene-speaker');
    const line    = document.getElementById('cutscene-line');
    const next    = document.getElementById('cutscene-next');

    const show = () => {
      if (idx >= scenes.length) {
        box.style.display = 'none';
        next.removeEventListener('click', handler);
        onDone();
        return;
      }
      const sc = scenes[idx++];
      if (speaker) speaker.textContent = sc.speaker;
      if (line)    line.textContent    = sc.text;
    };
    const handler = () => show();
    next?.removeEventListener('click', this._midHandler);
    this._midHandler = handler;
    next?.addEventListener('click', handler);
    show();
  },

  // ===== コレクション =====
  _setupCollection() {
    const colUI = new CollectionUI(this, { mode: 'view' });
    colUI.mount();
    this._activeUI = colUI;

    document.getElementById('btn-back-from-collection')?.addEventListener('click', () => {
      this.navigateTo('title');
    });
  },

  // ===== フリーバトル =====
  _setupFreeBattle() {
    const panel = document.getElementById('free-battle-list');
    if (!panel) return;
    panel.innerHTML = '';

    FREE_BATTLE_PRESETS.forEach((preset, i) => {
      const btn = document.createElement('button');
      btn.className = 'free-battle-btn';
      btn.textContent = preset.name;
      btn.addEventListener('click', () => {
        this.navigateTo('team-select', {
          from: 'free-battle',
          afterSelect: (teamIds) => {
            const playerTeam = teamIds.map(id => new Monster(id, this.save.monsterLevels[id] || 1));
            const enemyTeam  = preset.teamMonsters.map(e => new Monster(e.monsterId, e.level));
            this.navigateTo('battle', {
              playerTeam, enemyTeam,
              difficulty: 'normal',
              battleTitle: `フリーバトル vs ${preset.name}`,
              onComplete: (won) => {
                this.navigateTo('free-battle');
              }
            });
          }
        });
      });
      panel.appendChild(btn);
    });

    document.getElementById('btn-back-from-free')?.addEventListener('click', () => {
      this.navigateTo('title');
    });
  },
};

window.GameState = GameState;

// ===== 起動 =====
document.addEventListener('DOMContentLoaded', () => {
  GameState.init();
});
