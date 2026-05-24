// 幻海伝説 - CollectionUI (コレクション・チーム選択画面)

const ELEMENT_NAMES = {
  fire: '🔥炎晶', water: '💧水晶', earth: '🌿地晶',
  wind: '🌪️風晶', light: '☀️光晶', dark: '🌑闇晶',
};
const CLASS_NAMES = {
  warrior: '⚔️剣士', mage: '🔮魔道士', summoner: '🦋召喚士',
};
const RARITY_STARS = r => '★'.repeat(r) + '☆'.repeat(5 - r);

class CollectionUI {
  constructor(gameState, options = {}) {
    this.gs      = gameState;
    this.options = options; // { mode: 'view'|'select', onTeamConfirm: fn, filterBarId, cardGridId }
    this.currentFilter   = 'all';
    this.selectedTeamIds = [...(gameState.save.selectedTeam || [])];
    this._detailMonster  = null;
    // ID オーバーライドサポート（team-select画面では別IDを使う）
    this._filterBarId = options.filterBarId || 'filter-bar';
    this._cardGridId  = options.cardGridId  || 'card-grid';
  }

  mount() {
    this._renderFilterBar();
    this._renderCardGrid();
    if (this.options.mode === 'select') {
      this._renderTeamSlots();
      this._bindConfirmBtn();
    }
    this._bindFilterBtns();
  }

  _renderFilterBar() {
    const bar = document.getElementById(this._filterBarId);
    if (!bar) return;
    bar.innerHTML = `
      <button class="filter-btn active" data-filter="all">全て</button>
      <button class="filter-btn" data-filter="fire">🔥炎晶</button>
      <button class="filter-btn" data-filter="water">💧水晶</button>
      <button class="filter-btn" data-filter="earth">🌿地晶</button>
      <button class="filter-btn" data-filter="wind">🌪️風晶</button>
      <button class="filter-btn" data-filter="light">☀️光晶</button>
      <button class="filter-btn" data-filter="dark">🌑闇晶</button>
    `;
  }

  _renderCardGrid() {
    const grid = document.getElementById(this._cardGridId);
    if (!grid) return;
    grid.innerHTML = '';

    const owned = new Set(this.gs.save.collectedMonsterIds);
    MONSTERS
      .filter(m => this.currentFilter === 'all' || m.element === this.currentFilter)
      .forEach(m => {
        const isOwned = owned.has(m.id);
        const level   = this.gs.save.monsterLevels[m.id] || 1;
        const isSelected = this.selectedTeamIds.includes(m.id);
        const card = document.createElement('div');
        card.className = `monster-card ${isOwned ? 'owned' : 'locked'} ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-element', m.element);
        card.setAttribute('data-id', m.id);
        card.innerHTML = isOwned ? this._cardInner(m, level, isSelected) : this._lockedCardInner(m);
        card.addEventListener('click', () => isOwned ? this._onCardClick(m, card) : null);
        grid.appendChild(card);
      });
  }

  _cardInner(m, level, isSelected) {
    return `
      <div class="card-rarity" style="color:${this._rarityColor(m.rarity)}">${RARITY_STARS(m.rarity)}</div>
      <div class="card-emoji" style="background:${m.color}22;">${m.emoji}</div>
      <div class="card-name">${m.name}</div>
      <div class="card-sub">${ELEMENT_NAMES[m.element]} / ${CLASS_NAMES[m.class]}</div>
      <div class="card-level">Lv. ${level}</div>
      <div class="card-stats">
        HP:${this._scaledStat(m.baseStats.hp, level)}
        AT:${this._scaledStat(m.baseStats.atk, level)}
        DF:${this._scaledStat(m.baseStats.def, level)}
        SP:${this._scaledStat(m.baseStats.spd, level)}
      </div>
      ${isSelected ? '<div class="card-selected-badge">✔ 選択中</div>' : ''}
    `;
  }

  _lockedCardInner(m) {
    return `
      <div class="card-locked-icon">🔒</div>
      <div class="card-name locked-name">???</div>
      <div class="card-sub">${ELEMENT_NAMES[m.element]}</div>
    `;
  }

  _scaledStat(base, level) {
    return Math.floor(base * (1 + (level - 1) * 0.05));
  }

  _rarityColor(r) {
    return ['#aaa','#aaa','#4caf50','#2196f3','#9c27b0','#ff9800'][r] || '#aaa';
  }

  _onCardClick(monster, cardEl) {
    if (this.options.mode === 'select') {
      this._toggleTeamSelect(monster, cardEl);
    } else {
      this._showDetail(monster);
    }
  }

  _toggleTeamSelect(monster, cardEl) {
    const idx = this.selectedTeamIds.indexOf(monster.id);
    if (idx >= 0) {
      this.selectedTeamIds.splice(idx, 1);
      cardEl.classList.remove('selected');
      cardEl.querySelector('.card-selected-badge')?.remove();
    } else {
      if (this.selectedTeamIds.length >= 3) {
        this._showFlash('チームは最大3体まで！');
        return;
      }
      this.selectedTeamIds.push(monster.id);
      cardEl.classList.add('selected');
      const badge = document.createElement('div');
      badge.className = 'card-selected-badge';
      badge.textContent = '✔ 選択中';
      cardEl.appendChild(badge);
    }
    this._updateTeamSlots();
    this._updateConfirmBtn();
  }

  _renderTeamSlots() {
    const panel = document.getElementById('team-slots-panel');
    if (!panel) return;
    panel.innerHTML = `
      <div class="team-slots-title">チーム編成（3体選択）</div>
      <div id="team-slots-row">
        ${[0,1,2].map(i => `<div class="team-slot" id="tslot-${i}"><span class="slot-empty">空き</span></div>`).join('')}
      </div>
      <button id="btn-confirm-team" disabled>バトル開始！</button>
    `;
    this._updateTeamSlots();
  }

  _updateTeamSlots() {
    [0,1,2].forEach(i => {
      const slot = document.getElementById(`tslot-${i}`);
      if (!slot) return;
      const mId = this.selectedTeamIds[i];
      if (mId) {
        const m  = MONSTERS.find(x => x.id === mId);
        const lv = this.gs.save.monsterLevels[mId] || 1;
        slot.innerHTML = `
          <div class="tslot-emoji">${m.emoji}</div>
          <div class="tslot-name">${m.name}</div>
          <div class="tslot-level">Lv.${lv}</div>
        `;
        slot.setAttribute('data-element', m.element);
        slot.classList.add('filled');
      } else {
        slot.innerHTML = '<span class="slot-empty">空き</span>';
        slot.removeAttribute('data-element');
        slot.classList.remove('filled');
      }
    });
  }

  _bindConfirmBtn() {
    const btn = document.getElementById('btn-confirm-team');
    if (btn) {
      btn.addEventListener('click', () => {
        if (this.selectedTeamIds.length !== 3) return;
        this.gs.save.selectedTeam = [...this.selectedTeamIds];
        this.gs.saveGame();
        if (this.options.onTeamConfirm) this.options.onTeamConfirm(this.selectedTeamIds);
      });
    }
  }

  _updateConfirmBtn() {
    const btn = document.getElementById('btn-confirm-team');
    if (btn) btn.disabled = (this.selectedTeamIds.length !== 3);
  }

  _bindFilterBtns() {
    const bar = document.getElementById(this._filterBarId);
    if (!bar) return;
    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this._renderCardGrid();
      });
    });
  }

  // カード詳細パネル（コレクション閲覧モード）
  _showDetail(monster) {
    let panel = document.getElementById('card-detail-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'card-detail-panel';
      panel.className = 'card-detail-panel';
      document.getElementById('screen-collection').appendChild(panel);
    }
    const level = this.gs.save.monsterLevels[monster.id] || 1;
    const skill  = monster.skill;
    const exSkill = monster.exSkill;
    panel.innerHTML = `
      <div class="detail-close" id="detail-close">✕</div>
      <div class="detail-emoji" style="color:${monster.color}">${monster.emoji}</div>
      <div class="detail-name">${monster.name}</div>
      <div class="detail-sub">${ELEMENT_NAMES[monster.element]} / ${CLASS_NAMES[monster.class]} / ${monster.race}</div>
      <div class="detail-rarity" style="color:${this._rarityColor(monster.rarity)}">${RARITY_STARS(monster.rarity)}</div>
      <div class="detail-level">Lv. ${level} / 10</div>
      <div class="detail-stats">
        <span>HP: ${this._scaledStat(monster.baseStats.hp, level)}</span>
        <span>ATK: ${this._scaledStat(monster.baseStats.atk, level)}</span>
        <span>DEF: ${this._scaledStat(monster.baseStats.def, level)}</span>
        <span>SPD: ${this._scaledStat(monster.baseStats.spd, level)}</span>
      </div>
      <div class="detail-skill-title">スキル</div>
      <div class="detail-skill">
        <strong>${skill.name}</strong><br>
        ${skill.description}
      </div>
      ${exSkill ? `
        <div class="detail-skill-title">EXスキル (Lv5解放)</div>
        <div class="detail-skill ex-skill">
          <strong>${exSkill.name}</strong><br>
          ${exSkill.description}
        </div>
      ` : ''}
    `;
    panel.style.display = 'flex';
    document.getElementById('detail-close')?.addEventListener('click', () => { panel.style.display = 'none'; });
  }

  _showFlash(msg) {
    let el = document.getElementById('collection-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'collection-flash';
      el.className = 'collection-flash';
      document.getElementById('screen-collection')?.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(this._flashTimeout);
    this._flashTimeout = setTimeout(() => { el.style.opacity = '0'; }, 1800);
  }

  getSelectedTeam() {
    return this.selectedTeamIds.map(id => {
      const level = this.gs.save.monsterLevels[id] || 1;
      return new Monster(id, level);
    });
  }

  unmount() {
    // クリーンアップ（イベントは addEventListenerなのでGCに任せる）
  }
}

window.CollectionUI = CollectionUI;
