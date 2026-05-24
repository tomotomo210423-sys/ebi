// 幻海伝説 - Monsterクラス

class Monster {
  constructor(dataId, level = 1) {
    const data = MONSTERS.find(m => m.id === dataId);
    if (!data) throw new Error(`Monster id ${dataId} not found`);

    this.id        = data.id;
    this.name      = data.name;
    this.nameEn    = data.nameEn;
    this.element   = data.element;
    this.class     = data.class;
    this.race      = data.race;
    this.rarity    = data.rarity;
    this.emoji     = data.emoji;
    this.color     = data.color;
    this.skillData = data.skill;
    this.exSkillData = data.exSkill || null;
    this.level     = Math.min(Math.max(level, 1), 10);

    // スケーリングされたスタッツ
    const s = data.baseStats;
    this.maxHP = this._scale(s.hp, this.level);
    this.baseAtk = this._scale(s.atk, this.level);
    this.baseDef = this._scale(s.def, this.level);
    this.baseSpd = this._scale(s.spd, this.level);

    // バトル中の現在値
    this.currentHP = this.maxHP;
    this.exGauge   = 0;    // 0〜100
    this.exReady   = false; // EXゲージが満タンかつLv5以上

    // バトル状態フラグ
    this.isDefending    = false;
    this.isGuardBroken  = false;
    this.statusEffects  = [];  // [{ type, duration, value }]
    this.statMods       = [];  // [{ stat, mod, duration }]
    this.immunities     = [];  // ['freeze', ...]

    // 一時的なスタッツ修正値（各ターン先頭で計算）
    this._cachedAtk = this.baseAtk;
    this._cachedDef = this.baseDef;
    this._cachedSpd = this.baseSpd;
    this._cachedEvasion = 0;
    this._cachedAccuracy = 0;

    this._recalcStats();
  }

  // Lv1比で+5%/Lv
  _scale(base, level) {
    return Math.floor(base * (1 + (level - 1) * 0.05));
  }

  _recalcStats() {
    let atkMult = 1, defMult = 1, spdMult = 1, evasionAdd = 0, accMod = 0;
    for (const mod of this.statMods) {
      if (mod.stat === 'atk') atkMult += mod.mod;
      else if (mod.stat === 'def') defMult += mod.mod;
      else if (mod.stat === 'spd') spdMult += mod.mod;
      else if (mod.stat === 'evasion') evasionAdd += mod.mod;
      else if (mod.stat === 'accuracy') accMod += mod.mod;
    }
    // 恐怖: ATK-25%
    if (this.hasStatus('fear')) atkMult -= 0.25;
    // スロウ: SPD-30%
    if (this.hasStatus('slow')) spdMult -= 0.30;

    this._cachedAtk = Math.floor(this.baseAtk * Math.max(0.1, atkMult));
    this._cachedDef = Math.floor(this.baseDef * Math.max(0.1, defMult));
    this._cachedSpd = Math.floor(this.baseSpd * Math.max(0.1, spdMult));
    this._cachedEvasion = evasionAdd;
    this._cachedAccuracy = accMod;
  }

  get atk() { return this._cachedAtk; }
  get def() { return this._cachedDef; }
  get spd() { return this._cachedSpd; }
  get evasion() { return this._cachedEvasion; }
  get isAlive() { return this.currentHP > 0; }
  get hpRatio() { return this.currentHP / this.maxHP; }
  get exLevelRequired() { return 5; }
  get canUseEx() {
    return this.exReady && this.level >= this.exLevelRequired && this.exSkillData !== null;
  }

  takeDamage(amount) {
    const prev = this.currentHP;
    this.currentHP = Math.max(0, this.currentHP - amount);
    const actual = prev - this.currentHP;
    // EXゲージ増加
    this.exGauge = Math.min(100, this.exGauge + actual * 0.3);
    if (this.exGauge >= 100 && this.level >= this.exLevelRequired && this.exSkillData) {
      this.exReady = true;
    }
    return actual;
  }

  heal(amount) {
    const prev = this.currentHP;
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    return this.currentHP - prev;
  }

  reduceMaxHP(ratio) {
    const reduction = Math.floor(this.maxHP * ratio);
    this.maxHP = Math.max(1, this.maxHP - reduction);
    this.currentHP = Math.min(this.currentHP, this.maxHP);
    return reduction;
  }

  // 状態異常付与（重複しない、新しい方で上書き）
  addStatus(type, duration, value = null) {
    if (this.immunities.includes(type)) return false;
    this.statusEffects = this.statusEffects.filter(s => s.type !== type);
    this.statusEffects.push({ type, duration, value });
    this._recalcStats();
    return true;
  }

  removeStatus(type) {
    this.statusEffects = this.statusEffects.filter(s => s.type !== type);
    this._recalcStats();
  }

  clearAllStatuses() {
    this.statusEffects = [];
    this._recalcStats();
  }

  hasStatus(type) {
    return this.statusEffects.some(s => s.type === type);
  }

  addImmunity(type) {
    if (!this.immunities.includes(type)) this.immunities.push(type);
    this.removeStatus(type);
  }

  addStatMod(stat, mod, duration) {
    this.statMods.push({ stat, mod, duration });
    this._recalcStats();
  }

  removeBuffs() {
    this.statMods = this.statMods.filter(m => m.mod < 0);
    this.statusEffects = this.statusEffects.filter(s => ['burn','poison','curse','freeze','paralysis','fear','slow','confusion','seal','petrify','charm'].includes(s.type));
    this._recalcStats();
  }

  // ターン終了時の処理。返り値: { events: [{ type, value }] }
  processTurnEnd() {
    const events = [];

    // DoT処理
    const burn = this.statusEffects.find(s => s.type === 'burn');
    if (burn) {
      const dmg = Math.floor(this.maxHP * 0.08);
      this.currentHP = Math.max(0, this.currentHP - dmg);
      events.push({ type: 'burn_damage', value: dmg });
    }
    const poison = this.statusEffects.find(s => s.type === 'poison');
    if (poison) {
      const dmg = Math.floor(this.maxHP * (poison.value || 0.05));
      this.currentHP = Math.max(0, this.currentHP - dmg);
      events.push({ type: 'poison_damage', value: dmg });
    }
    const curse = this.statusEffects.find(s => s.type === 'curse');
    if (curse) {
      const dmg = Math.floor(this.maxHP * (curse.value || 0.10));
      this.currentHP = Math.max(0, this.currentHP - dmg);
      events.push({ type: 'curse_damage', value: dmg });
    }

    // デュレーション減少
    this.statusEffects = this.statusEffects
      .map(s => ({ ...s, duration: s.duration - 1 }))
      .filter(s => s.duration > 0);
    this.statMods = this.statMods
      .map(m => ({ ...m, duration: m.duration - 1 }))
      .filter(m => m.duration > 0);

    this._recalcStats();
    return { events };
  }

  // ターン開始時リセット（防御フラグ等）
  resetTurnFlags() {
    this.isDefending   = false;
    this.isGuardBroken = false;
  }

  useExSkill() {
    if (!this.canUseEx) return false;
    this.exReady = false;
    this.exGauge = 0;
    return true;
  }

  // アクティブスキル取得（EX優先）
  getSkill(useEx = false) {
    if (useEx && this.canUseEx) return this.exSkillData;
    return this.skillData;
  }

  // デバッグ用
  toString() {
    return `${this.name}(Lv${this.level}) HP:${this.currentHP}/${this.maxHP}`;
  }

  // シリアライズ（セーブ用）
  toSaveData() {
    return { id: this.id, level: this.level };
  }
}

window.Monster = Monster;
