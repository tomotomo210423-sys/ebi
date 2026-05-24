// 幻海伝説 - ルーレットコントローラー
// requestAnimationFrame ループで translateX を管理。
// CSS animation-play-state は使用しない（ブラウザ間の信頼性のため）。

const ROULETTE_SLOT_DEFS = [
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'skill',      label: 'スキル', emoji: '✨', color: '#9b59b6' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'defend',     label: '防御',  emoji: '🛡️', color: '#3498db' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'guardbreak', label: '崩し',  emoji: '💥', color: '#e67e22' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'recover',    label: '回復',  emoji: '💚', color: '#2ecc71' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'skill',      label: 'スキル', emoji: '✨', color: '#9b59b6' },
  { action: 'defend',     label: '防御',  emoji: '🛡️', color: '#3498db' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'guardbreak', label: '崩し',  emoji: '💥', color: '#e67e22' },
  { action: 'skill',      label: 'スキル', emoji: '✨', color: '#9b59b6' },
  { action: 'ex',         label: 'EX',    emoji: '⭐', color: '#f1c40f' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'recover',    label: '回復',  emoji: '💚', color: '#2ecc71' },
  { action: 'defend',     label: '防御',  emoji: '🛡️', color: '#3498db' },
  { action: 'attack',     label: '攻撃',  emoji: '⚔️', color: '#e74c3c' },
  { action: 'skill',      label: 'スキル', emoji: '✨', color: '#9b59b6' },
];

const SLOT_COUNT = ROULETTE_SLOT_DEFS.length; // 20
const SLOT_WIDTH = 90; // px
const REPEAT = 4;      // 4サイクル = 80スロットのDOMを作成してシームレスループ

class RouletteController {
  constructor(stripEl, pointerEl, onStop) {
    this.strip    = stripEl;
    this.pointer  = pointerEl;
    this.onStop   = onStop;
    this.x        = 0;         // 現在のスクロール位置 (px)
    this.speed    = 0;         // px/frame
    this.state    = 'idle';    // 'idle' | 'spinning' | 'decelerating' | 'stopped'
    this.rafId    = null;
    this.enabled  = false;

    this._buildStrip();
    this._applyTransform();
  }

  _buildStrip() {
    this.strip.innerHTML = '';
    const total = SLOT_COUNT * REPEAT;
    for (let i = 0; i < total; i++) {
      const def = ROULETTE_SLOT_DEFS[i % SLOT_COUNT];
      const tile = document.createElement('div');
      tile.className = 'roulette-tile';
      tile.style.cssText = `
        width: ${SLOT_WIDTH}px;
        background: ${def.color}22;
        border-left: 3px solid ${def.color};
      `;
      tile.innerHTML = `
        <span class="roulette-emoji">${def.emoji}</span>
        <span class="roulette-label">${def.label}</span>
      `;
      this.strip.appendChild(tile);
    }
  }

  _applyTransform() {
    this.strip.style.transform = `translateX(-${this.x}px)`;
  }

  // 現在中央に来ているスロットのアクションを返す
  _getCurrentAction() {
    const cycleWidth = SLOT_COUNT * SLOT_WIDTH;
    const pos = this.x % cycleWidth;
    const idx = Math.floor(pos / SLOT_WIDTH) % SLOT_COUNT;
    return ROULETTE_SLOT_DEFS[idx].action;
  }

  // 最も近いスロット中央にスナップするための目標X
  _snapTarget() {
    const cycleWidth = SLOT_COUNT * SLOT_WIDTH;
    const pos = this.x % cycleWidth;
    const idx = Math.round(pos / SLOT_WIDTH) % SLOT_COUNT;
    const baseX = Math.floor(this.x / cycleWidth) * cycleWidth;
    return baseX + idx * SLOT_WIDTH;
  }

  spin(baseSpeed = 18) {
    if (this.state === 'spinning' || this.state === 'decelerating') return;
    this.speed = baseSpeed + Math.random() * 6;
    this.state = 'spinning';
    this.enabled = false;
    cancelAnimationFrame(this.rafId);
    this._loop();
  }

  _loop() {
    if (this.state === 'spinning') {
      this.x += this.speed;
      const maxX = SLOT_COUNT * SLOT_WIDTH * (REPEAT - 1);
      if (this.x >= maxX) this.x -= SLOT_COUNT * SLOT_WIDTH * (REPEAT - 2);
      this._applyTransform();
      this.rafId = requestAnimationFrame(() => this._loop());
    } else if (this.state === 'decelerating') {
      this._decelerate();
    }
  }

  stop() {
    if (this.state !== 'spinning') return;
    this.state = 'decelerating';
    this._decelTarget = this._snapTarget();
    // 現在速度からゆっくり減速
    this.rafId = requestAnimationFrame(() => this._loop());
  }

  _decelerate() {
    if (this.state !== 'decelerating') return; // リセット後の誤発火防止
    const target = this._decelTarget;
    const diff = target - this.x;

    if (Math.abs(diff) < 1.5) {
      // スナップ完了
      this.x = target;
      this._applyTransform();
      this.state = 'stopped';
      const action = this._getCurrentAction();
      this._highlightCurrent();
      if (this.onStop) this.onStop(action);
      return;
    }

    // ease-out
    this.x += diff * 0.15;
    this._applyTransform();
    this.rafId = requestAnimationFrame(() => this._decelerate());
  }

  _highlightCurrent() {
    const cycleWidth = SLOT_COUNT * SLOT_WIDTH;
    const pos = this.x % cycleWidth;
    const idx = Math.floor(pos / SLOT_WIDTH) % SLOT_COUNT;

    Array.from(this.strip.children).forEach((tile, i) => {
      tile.classList.toggle('selected', (i % SLOT_COUNT) === idx);
    });
  }

  // AI用: 指定アクションのスロットに直接スナップ（アニメーション付き）
  spinThenStopAt(action, duration = 1500) {
    this.speed = 20;
    this.state = 'spinning';
    this.enabled = false;
    cancelAnimationFrame(this.rafId);
    this._loop();

    setTimeout(() => {
      this._forceStopAtAction(action);
    }, duration);
  }

  _forceStopAtAction(action) {
    // 次に出現するその action のスロットを探す
    const cycleWidth = SLOT_COUNT * SLOT_WIDTH;
    const currentPos = this.x % cycleWidth;
    let targetIdx = -1;

    // 現在位置より前方（スクロール方向）の最近傍スロットを探す
    for (let i = 0; i < SLOT_COUNT; i++) {
      const idx = (Math.ceil(currentPos / SLOT_WIDTH) + i) % SLOT_COUNT;
      if (ROULETTE_SLOT_DEFS[idx].action === action) {
        targetIdx = idx;
        break;
      }
    }
    if (targetIdx < 0) targetIdx = 0;

    const baseX = Math.floor(this.x / cycleWidth) * cycleWidth;
    let target = baseX + targetIdx * SLOT_WIDTH;
    if (target <= this.x) target += cycleWidth;
    this._decelTarget = target;
    this.state = 'decelerating';
  }

  reset() {
    cancelAnimationFrame(this.rafId);
    this.state  = 'idle';
    this.x      = 0;
    this.speed  = 0;
    this.enabled = false;
    this._applyTransform();
    Array.from(this.strip.children).forEach(t => t.classList.remove('selected'));
  }

  setEnabled(bool) {
    this.enabled = bool;
    const btn = document.getElementById('btn-roulette-stop');
    if (btn) {
      btn.disabled = !bool;
      btn.classList.toggle('active', bool);
    }
  }
}

window.RouletteController = RouletteController;
window.ROULETTE_SLOT_DEFS = ROULETTE_SLOT_DEFS;
