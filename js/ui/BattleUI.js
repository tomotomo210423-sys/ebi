// 幻海伝説 - BattleUI

const STATUS_LABELS = {
  burn: '🔥燃焼', freeze: '❄️凍結', paralysis: '⚡麻痺',
  poison: '☠️毒', fear: '😨恐怖', curse: '💀呪い',
  confusion: '💫混乱', seal: '🔇封印', petrify: '🗿石化',
  charm: '💕魅了', slow: '🐢スロウ',
};

const ELEMENT_LABELS = {
  fire: '炎晶', water: '水晶', earth: '地晶',
  wind: '風晶', light: '光晶', dark: '闇晶',
};

class BattleUI {
  constructor(engine, roulette, onBattleEnd, options = {}) {
    this.engine   = engine;
    this.roulette = roulette;
    this.onBattleEnd = onBattleEnd;
    this.options  = options;
    this._pendingPlayerAction = null;
    this._awaitingInput = false;
    this._midBattleQueue = [];
    this._cutsceneActive = false;
  }

  mount() {
    this._renderTeamSlots();
    this._updateAllHPBars();
    this._bindEvents();

    // バトル開始
    this.engine.startBattle();
  }

  _renderTeamSlots() {
    ['player', 'enemy'].forEach(side => {
      const row = document.getElementById(`${side}-row`);
      if (!row) return;
      row.innerHTML = '';
      const team = side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam;
      team.forEach((monster, idx) => {
        const slot = document.createElement('div');
        slot.className = `monster-slot ${side}`;
        slot.id = `slot-${side}-${idx}`;
        slot.setAttribute('data-element', monster.element);
        slot.innerHTML = `
          <div class="monster-emoji">${monster.emoji}</div>
          <div class="monster-name">${monster.name}</div>
          <div class="hp-bar-wrap">
            <div class="hp-bar-fill" id="hp-${side}-${idx}" style="width:100%"></div>
          </div>
          <div class="hp-text" id="hp-text-${side}-${idx}">
            ${monster.currentHP}/${monster.maxHP}
          </div>
          <div class="status-icons" id="status-${side}-${idx}"></div>
          <div class="ex-gauge-wrap" style="display:${side==='player'?'block':'none'}">
            <div class="ex-gauge-fill" id="ex-${side}-${idx}" style="width:0%"></div>
          </div>
        `;
        row.appendChild(slot);
      });
    });
    this._updateActiveHighlight();
  }

  _updateAllHPBars() {
    ['player', 'enemy'].forEach(side => {
      const team = side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam;
      team.forEach((m, idx) => this._updateHPBar(m, side, idx));
    });
  }

  _updateHPBar(monster, side, idx) {
    const bar  = document.getElementById(`hp-${side}-${idx}`);
    const text = document.getElementById(`hp-text-${side}-${idx}`);
    if (!bar || !text) return;

    const ratio = monster.isAlive ? (monster.currentHP / monster.maxHP) : 0;
    bar.style.width = `${Math.max(0, ratio * 100).toFixed(1)}%`;

    // 色変化: 緑→黄→赤
    if (ratio > 0.5) bar.style.background = 'var(--hp-high)';
    else if (ratio > 0.25) bar.style.background = 'var(--hp-mid)';
    else bar.style.background = 'var(--hp-low)';

    text.textContent = monster.isAlive
      ? `${monster.currentHP}/${monster.maxHP}`
      : '--- DEFEATED ---';

    const slot = document.getElementById(`slot-${side}-${idx}`);
    if (slot) slot.classList.toggle('defeated', !monster.isAlive);

    // EXゲージ
    const exBar = document.getElementById(`ex-${side}-${idx}`);
    if (exBar && side === 'player') {
      exBar.style.width = `${monster.exGauge}%`;
      exBar.style.background = monster.exReady ? '#f1c40f' : '#555';
    }

    // 状態アイコン
    this._updateStatusIcons(monster, side, idx);
  }

  _updateStatusIcons(monster, side, idx) {
    const el = document.getElementById(`status-${side}-${idx}`);
    if (!el) return;
    el.innerHTML = monster.statusEffects
      .map(s => `<span class="status-icon" title="${s.type}(${s.duration}T)">${STATUS_LABELS[s.type] || s.type}</span>`)
      .join('');
  }

  _updateActiveHighlight() {
    ['player', 'enemy'].forEach(side => {
      const activeIdx = side === 'player' ? this.engine.playerActiveIdx : this.engine.enemyActiveIdx;
      const team = side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam;
      team.forEach((_, idx) => {
        const slot = document.getElementById(`slot-${side}-${idx}`);
        if (slot) slot.classList.toggle('active', idx === activeIdx);
      });
    });
  }

  _bindEvents() {
    // ルーレット停止ボタン
    const stopBtn = document.getElementById('btn-roulette-stop');
    if (stopBtn) {
      this._stopHandler = () => {
        if (!this.roulette.enabled) return;
        this.roulette.stop();
      };
      stopBtn.addEventListener('click', this._stopHandler);
    }

    // スペースキー
    this._keyHandler = (e) => {
      if (e.code === 'Space' && this.roulette.enabled) {
        e.preventDefault();
        this.roulette.stop();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // エンジンイベント購読
    this.engine.onEvent = (event) => this._handleEngineEvent(event);
  }

  _handleEngineEvent(event) {
    switch (event.type) {
      case 'turn_start':
        this._onTurnStart(event);
        break;
      case 'action':
        this._onAction(event);
        break;
      case 'ex_activate':
        this._onExActivate(event);
        break;
      case 'status_applied':
        this._onStatusApplied(event);
        break;
      case 'turn_end_damage':
        this._onTurnEndDamage(event);
        break;
      case 'enemy_thinking':
        this._onEnemyThinking(event);
        break;
      case 'enemy_roulette_stop':
        this._onEnemyRouletteStop(event);
        break;
      case 'monster_enter':
        this._onMonsterEnter(event);
        break;
      case 'monster_revive':
        this._onMonsterRevive(event);
        break;
      case 'drain':
        this._onDrain(event);
        break;
      case 'buff_cleared':
        this._onBuffCleared(event);
        break;
      case 'battle_end':
        this._onBattleEnd(event);
        break;
    }
  }

  _onTurnStart(event) {
    this._updateActiveHighlight();
    this._appendLog(`── ターン ${event.turn} ──`, 'turn-divider');

    // 先攻表示
    const firstLabel = event.playerGoesFirst ? '⚡ あなたが先攻！' : '⚡ 敵が先攻！';
    const indicator = document.getElementById('turn-indicator');
    if (indicator) {
      indicator.textContent = firstLabel;
      indicator.className   = `turn-indicator ${event.playerGoesFirst ? 'player-first' : 'enemy-first'}`;
      indicator.style.opacity = '1';
      setTimeout(() => { indicator.style.opacity = '0'; }, 1200);
    }

    // チームボーナス表示
    if (event.playerBonus && event.playerBonus.label) {
      this._appendLog(event.playerBonus.label, 'bonus');
    }

    // ミッドバトルシーンチェック（storyオプション）
    if (this.options.midBattleScenes) {
      this._checkMidBattleScene();
    }

    // ルーレット起動（前ターンの状態をリセットしてから開始）
    setTimeout(() => {
      this.roulette.reset();
      this.roulette.spin();
      this.roulette.setEnabled(true);
      const hint = document.getElementById('roulette-hint');
      if (hint) hint.textContent = 'SPACEまたはSTOPで停止！';
    }, 400);
  }

  _onAction(event) {
    const { side, action, actor, defender, value, elementMult, message } = event;

    // メッセージログ
    this._appendLog(message, action === 'heal' || action === 'recover' ? 'heal' : side);

    // 属性有利/不利メッセージ
    if (elementMult && (action === 'attack' || action === 'skill')) {
      if (elementMult >= 2.0) this._showBanner('❤️‍🔥 絶大な効果！', 'super');
      else if (elementMult >= 1.5) this._showBanner('効果抜群！', 'super');
      else if (elementMult <= 0.75) this._showBanner('…いまひとつ', 'weak');
    }

    // HP更新
    if (defender) {
      const defSide = this.engine.playerTeam.includes(defender) ? 'player' : 'enemy';
      const defIdx  = (defSide === 'player' ? this.engine.playerTeam : this.engine.enemyTeam).indexOf(defender);
      this._updateHPBar(defender, defSide, defIdx);
      if (value > 0) this._showDamageFloat(value, defSide, defIdx, action === 'heal' || action === 'recover');
      if (value > 0 && (action === 'attack' || action === 'skill' || action === 'guardbreak_hit')) {
        this._animateHit(defSide, defIdx);
        this._animateAttack(side, action === 'player' ? this.engine.playerActiveIdx : this.engine.enemyActiveIdx);
      }
    }
    if (actor) {
      const actSide = this.engine.playerTeam.includes(actor) ? 'player' : 'enemy';
      const actIdx  = (actSide === 'player' ? this.engine.playerTeam : this.engine.enemyTeam).indexOf(actor);
      this._updateHPBar(actor, actSide, actIdx);
    }
  }

  _onExActivate(event) {
    this._showBanner('⭐ EXスキル発動！！', 'ex');
    this._appendLog(`⭐ ${event.actor.name} がEXスキル「${event.skill.name}」を発動！`, 'ex');
    const side = this.engine.playerTeam.includes(event.actor) ? 'player' : 'enemy';
    const idx  = (side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam).indexOf(event.actor);
    this._animateExActivate(side, idx);
  }

  _onStatusApplied(event) {
    const { target, status, side } = event;
    const targetSide = side || (this.engine.playerTeam.includes(target) ? 'player' : 'enemy');
    const idx = (targetSide === 'player' ? this.engine.playerTeam : this.engine.enemyTeam).indexOf(target);
    this._updateHPBar(target, targetSide, idx);
    const label = STATUS_LABELS[status] || status;
    this._appendLog(`${target.name}は${label}状態になった！`, 'status');
  }

  _onTurnEndDamage(event) {
    const { side, events: evts } = event;
    const team = side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam;
    const activeIdx = side === 'player' ? this.engine.playerActiveIdx : this.engine.enemyActiveIdx;
    evts.forEach(e => {
      const label = { burn_damage: '燃焼', poison_damage: '毒', curse_damage: '呪い' }[e.type] || e.type;
      this._appendLog(`${team[activeIdx].name}は${label}で${e.value}ダメージ！`, 'dot');
      this._updateHPBar(team[activeIdx], side, activeIdx);
      this._showDamageFloat(e.value, side, activeIdx, false);
    });
  }

  _onEnemyThinking(event) {
    this.roulette.setEnabled(false);
    const hint = document.getElementById('roulette-hint');
    if (hint) hint.textContent = '敵のターン…';

    setTimeout(() => {
      if (this.engine.state === 'ACTION_EXECUTE') {
        this.roulette.spinThenStopAt('attack', Math.min(event.delay - 400, 1000));
      }
    }, 300);
  }

  _onEnemyRouletteStop(event) {
    const def = ROULETTE_SLOT_DEFS.find(s => s.action === event.action);
    const label = def ? `${def.emoji} ${def.label}` : event.action;
    this._appendLog(`敵: ${label}`, 'enemy');
  }

  _onMonsterEnter(event) {
    const { side, index } = event;
    const team = side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam;
    const m = team[index];
    this._appendLog(`${m.name} が登場！`, 'enter');
    this._updateActiveHighlight();
    this._pulseSlot(side, index);
  }

  _onMonsterRevive(event) {
    const { side, target } = event;
    const team = side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam;
    const idx  = team.indexOf(target);
    this._updateHPBar(target, side, idx);
    this._appendLog(`${target.name}が復活した！`, 'revive');
  }

  _onDrain(event) {
    const side = this.engine.playerTeam.includes(event.actor) ? 'player' : 'enemy';
    const idx  = (side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam).indexOf(event.actor);
    this._updateHPBar(event.actor, side, idx);
    this._showDamageFloat(event.value, side, idx, true);
  }

  _onBuffCleared(event) {
    const side = this.engine.playerTeam.includes(event.target) ? 'player' : 'enemy';
    const idx  = (side === 'player' ? this.engine.playerTeam : this.engine.enemyTeam).indexOf(event.target);
    this._updateStatusIcons(event.target, side, idx);
  }

  _onBattleEnd(event) {
    const { winner } = event;
    this.roulette.setEnabled(false);
    this.roulette.reset();

    const overlay = document.getElementById('battle-result-overlay');
    if (overlay) {
      overlay.className = `result-overlay ${winner === 'player' ? 'victory' : 'defeat'}`;
      overlay.innerHTML = winner === 'player'
        ? '<div class="result-text">⚡ VICTORY ⚡</div><div class="result-sub">勝利！</div>'
        : '<div class="result-text">💀 DEFEAT 💀</div><div class="result-sub">敗北…</div>';
      overlay.style.display = 'flex';
    }

    setTimeout(() => {
      if (this.onBattleEnd) this.onBattleEnd(winner === 'player');
    }, 2000);
  }

  // ===== アニメーション =====

  _animateAttack(side, idx) {
    const slot = document.getElementById(`slot-${side}-${idx}`);
    if (!slot) return;
    slot.classList.add('attacking');
    setTimeout(() => slot.classList.remove('attacking'), 300);
  }

  _animateHit(side, idx) {
    const slot = document.getElementById(`slot-${side}-${idx}`);
    if (!slot) return;
    slot.classList.add('hit');
    setTimeout(() => slot.classList.remove('hit'), 400);
  }

  _animateExActivate(side, idx) {
    const slot = document.getElementById(`slot-${side}-${idx}`);
    if (!slot) return;
    slot.classList.add('ex-activate');
    setTimeout(() => slot.classList.remove('ex-activate'), 800);
  }

  _pulseSlot(side, idx) {
    const slot = document.getElementById(`slot-${side}-${idx}`);
    if (!slot) return;
    slot.classList.add('entering');
    setTimeout(() => slot.classList.remove('entering'), 600);
  }

  _showDamageFloat(value, side, idx, isHeal = false) {
    const slot = document.getElementById(`slot-${side}-${idx}`);
    if (!slot) return;
    const el = document.createElement('div');
    el.className = `damage-float ${isHeal ? 'heal' : 'damage'}`;
    el.textContent = isHeal ? `+${value}` : `-${value}`;
    slot.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  _showBanner(text, type = '') {
    const banner = document.getElementById('battle-banner');
    if (!banner) return;
    banner.textContent = text;
    banner.className   = `battle-banner ${type}`;
    banner.style.opacity = '1';
    clearTimeout(this._bannerTimeout);
    this._bannerTimeout = setTimeout(() => { banner.style.opacity = '0'; }, 1200);
  }

  _appendLog(message, cls = '') {
    const log = document.getElementById('battle-log');
    if (!log) return;
    const line = document.createElement('div');
    line.className = `log-line ${cls}`;
    line.textContent = message;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;

    // 古い行を削除（最大20行）
    while (log.children.length > 20) {
      log.removeChild(log.firstChild);
    }
  }

  _checkMidBattleScene() {
    if (!this.options.midBattleScene) return;
    const scene = this.options.midBattleScene;
    if (this._midSceneDone) return;

    const enemyActive = this.engine.enemyActive;
    if (enemyActive.hpRatio <= scene.trigger.hpRatio) {
      this._midSceneDone = true;
      this.roulette.setEnabled(false);
      if (this.options.onMidBattleScene) {
        this.options.onMidBattleScene(scene.scenes, () => {
          // カットシーン終了後ルーレット再開
          this.roulette.spin();
          this.roulette.setEnabled(true);
        });
      }
    }
  }

  unmount() {
    const stopBtn = document.getElementById('btn-roulette-stop');
    if (stopBtn && this._stopHandler) stopBtn.removeEventListener('click', this._stopHandler);
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
  }
}

window.BattleUI = BattleUI;
