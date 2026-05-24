// 幻海伝説 - BattleEngine ステートマシン

// 属性相性表: chart[attacker][defender] = multiplier
const ELEMENT_CHART = {
  fire:  { fire: 1.0, water: 0.75, earth: 1.5, wind: 1.0, light: 1.0, dark: 1.0 },
  water: { fire: 1.5, water: 1.0,  earth: 1.0, wind: 0.75, light: 1.0, dark: 1.0 },
  earth: { fire: 0.75, water: 1.0, earth: 1.0, wind: 1.5, light: 1.0, dark: 1.0 },
  wind:  { fire: 1.0, water: 1.5,  earth: 0.75, wind: 1.0, light: 1.0, dark: 1.0 },
  light: { fire: 1.0, water: 1.0,  earth: 1.0, wind: 1.0, light: 1.0, dark: 2.0 },
  dark:  { fire: 1.0, water: 1.0,  earth: 1.0, wind: 1.0, light: 0.5, dark: 1.0 },
};

// チームボーナス計算
function calcTeamBonus(team) {
  const alive = team.filter(m => m.isAlive);
  if (alive.length < 3) return { skillBonus: 0, statBonus: 0, exBonus: 0 };

  const elements = new Set(alive.map(m => m.element));
  const races    = new Set(alive.map(m => m.race));

  if (races.size === 1) return { skillBonus: 0, statBonus: 0.10, exBonus: 0, label: '同種族ボーナス: スタッツ+10%' };
  if (elements.size === 1) return { skillBonus: 0.10, statBonus: 0, exBonus: 0, label: '同属性ボーナス: スキル威力+10%' };
  if (elements.size === 3 && races.size === 3) return { skillBonus: 0, statBonus: 0, exBonus: 0.15, label: '混合チームボーナス: EX獲得+15%' };
  return { skillBonus: 0, statBonus: 0, exBonus: 0 };
}

class BattleEngine {
  /**
   * @param {Monster[]} playerTeam  プレイヤーのモンスター配列 (3体)
   * @param {Monster[]} enemyTeam   敵モンスター配列 (3体)
   * @param {object}    options
   *   - difficulty: 'easy'|'normal'|'hard'
   *   - onEvent: function(event) イベントコールバック
   */
  constructor(playerTeam, enemyTeam, options = {}) {
    this.playerTeam = playerTeam;
    this.enemyTeam  = enemyTeam;
    this.options    = options;
    this.difficulty = options.difficulty || 'normal';
    this.onEvent    = options.onEvent || (() => {});

    this.state   = 'IDLE';
    this.turn    = 0;
    this.log     = [];

    this.playerActiveIdx = 0;
    this.enemyActiveIdx  = 0;

    // チームボーナス計算
    this.playerBonus = calcTeamBonus(playerTeam);
    this.enemyBonus  = calcTeamBonus(enemyTeam);

    // AI
    this.ai = new AIController(this.difficulty);
  }

  get playerActive() { return this.playerTeam[this.playerActiveIdx]; }
  get enemyActive()  { return this.enemyTeam[this.enemyActiveIdx];   }

  // バトル開始
  startBattle() {
    this.state = 'ROULETTE_SPIN';
    this.turn  = 0;
    this._nextTurn();
  }

  _nextTurn() {
    this.turn++;

    // アクティブモンスター更新（倒れた場合次へ）
    this._advanceActive('player');
    this._advanceActive('enemy');

    if (this._checkWin()) return;

    // ターン開始フラグリセット
    this.playerActive.resetTurnFlags();
    this.enemyActive.resetTurnFlags();

    // SPD比較で先攻を決める
    const playerSpd = this.playerActive.spd;
    const enemySpd  = this.enemyActive.spd;
    this.playerGoesFirst = playerSpd >= enemySpd;

    this.state = 'ROULETTE_SPIN';
    this.emit('turn_start', {
      turn: this.turn,
      playerActive: this.playerActiveIdx,
      enemyActive:  this.enemyActiveIdx,
      playerGoesFirst: this.playerGoesFirst,
      playerBonus: this.playerBonus,
      enemyBonus:  this.enemyBonus,
    });
  }

  _advanceActive(side) {
    const team = side === 'player' ? this.playerTeam : this.enemyTeam;
    let idx    = side === 'player' ? this.playerActiveIdx : this.enemyActiveIdx;

    if (!team[idx].isAlive) {
      let found = false;
      for (let i = 0; i < team.length; i++) {
        const ni = (idx + i) % team.length;
        if (team[ni].isAlive) {
          if (side === 'player') this.playerActiveIdx = ni;
          else                   this.enemyActiveIdx  = ni;
          found = true;
          break;
        }
      }
      if (found) {
        this.emit('monster_enter', { side, index: side === 'player' ? this.playerActiveIdx : this.enemyActiveIdx });
      }
    }
  }

  // プレイヤーのルーレット停止後に呼ばれる
  playerAction(action) {
    if (this.state !== 'ROULETTE_SPIN') return;
    this.state = 'ACTION_EXECUTE';

    if (this.playerGoesFirst) {
      this._resolveAction('player', action);
      if (this._checkWin()) return;
      this._triggerEnemyTurn();
    } else {
      this._triggerEnemyTurnFirst(action);
    }
  }

  _triggerEnemyTurn() {
    const delay = this.ai.simulateRouletteDelay();
    this.emit('enemy_thinking', { delay });
    setTimeout(() => {
      if (this.state !== 'ACTION_EXECUTE') return;
      const action = this.ai.decideAction(
        this.enemyActive, this.playerActive,
        { playerTeam: this.playerTeam, enemyTeam: this.enemyTeam }
      );
      this.emit('enemy_roulette_stop', { action });
      this._resolveAction('enemy', action);
      this._afterBothActed();
    }, delay);
  }

  _triggerEnemyTurnFirst(playerAction) {
    const delay = this.ai.simulateRouletteDelay();
    this.emit('enemy_thinking', { delay });
    setTimeout(() => {
      if (this.state !== 'ACTION_EXECUTE') return;
      const action = this.ai.decideAction(
        this.enemyActive, this.playerActive,
        { playerTeam: this.playerTeam, enemyTeam: this.enemyTeam }
      );
      this.emit('enemy_roulette_stop', { action });
      this._resolveAction('enemy', action);
      if (this._checkWin()) return;
      this._resolveAction('player', playerAction);
      this._afterBothActed();
    }, delay);
  }

  _afterBothActed() {
    if (this._checkWin()) return;

    // ターン終了時のDoT処理
    const pResult = this.playerActive.processTurnEnd();
    const eResult = this.enemyActive.processTurnEnd();

    if (pResult.events.length > 0) this.emit('turn_end_damage', { side: 'player', events: pResult.events });
    if (eResult.events.length > 0) this.emit('turn_end_damage', { side: 'enemy',  events: eResult.events });

    if (this._checkWin()) return;

    this._nextTurn();
  }

  // アクション解決
  _resolveAction(side, action) {
    const actor    = side === 'player' ? this.playerActive : this.enemyActive;
    const defender = side === 'player' ? this.enemyActive  : this.playerActive;
    const actorBonus   = side === 'player' ? this.playerBonus : this.enemyBonus;
    const defenderSide = side === 'player' ? 'enemy' : 'player';

    // 石化・凍結は行動不能
    if (actor.hasStatus('petrify') || actor.hasStatus('freeze')) {
      this.emit('action', { side, action: 'stunned', actor, defender, message: `${actor.name}は動けない！` });
      actor.removeStatus('freeze');
      return;
    }

    // 麻痺: 50%で失敗
    if (actor.hasStatus('paralysis') && Math.random() < 0.5) {
      this.emit('action', { side, action: 'paralyzed', actor, defender, message: `${actor.name}は麻痺で動けない！` });
      return;
    }

    // 混乱: ランダム対象（同チームを攻撃）
    let actualDefender = defender;
    if (actor.hasStatus('confusion') && (action === 'attack' || action === 'skill' || action === 'guardbreak')) {
      const ownTeam = side === 'player' ? this.playerTeam : this.enemyTeam;
      const targets = ownTeam.filter(m => m.isAlive && m !== actor);
      if (targets.length > 0) {
        actualDefender = targets[Math.floor(Math.random() * targets.length)];
        this.emit('action', { side, action: 'confusion', actor, defender: actualDefender, message: `${actor.name}は混乱している！` });
      }
    }

    switch (action) {
      case 'attack':
        this._doAttack(actor, actualDefender, 100, false, false, actorBonus, defenderSide);
        break;

      case 'skill': {
        const useEx = action === 'ex' || false;
        const skill = actor.getSkill(false);
        if (!skill || actor.hasStatus('seal')) {
          this.emit('action', { side, action: 'seal_block', actor, message: `${actor.name}のスキルは封印されている！` });
          this._doAttack(actor, actualDefender, 80, false, false, actorBonus, defenderSide);
          break;
        }
        this._resolveSkill(actor, actualDefender, skill, side, actorBonus, defenderSide);
        break;
      }

      case 'ex': {
        if (!actor.canUseEx) {
          this._doAttack(actor, actualDefender, 100, false, false, actorBonus, defenderSide);
          break;
        }
        const exSkill = actor.getSkill(true);
        actor.useExSkill();
        this.emit('ex_activate', { side, actor, skill: exSkill });
        this._resolveSkill(actor, actualDefender, exSkill, side, actorBonus, defenderSide, true);
        break;
      }

      case 'defend':
        actor.isDefending = true;
        this.emit('action', { side, action: 'defend', actor, message: `${actor.name}は防御態勢をとった！` });
        break;

      case 'guardbreak':
        if (actualDefender.isDefending) {
          actualDefender.isDefending  = false;
          actualDefender.isGuardBroken = true;
          this.emit('action', { side, action: 'guardbreak', actor, defender: actualDefender, message: `${actor.name}の崩し！${actualDefender.name}の防御を崩した！` });
          this._doAttack(actor, actualDefender, 120, false, true, actorBonus, defenderSide);
        } else {
          this.emit('action', { side, action: 'guardbreak_miss', actor, message: `${actor.name}の崩しは空振り！` });
        }
        break;

      case 'recover': {
        const healAmt = Math.floor(actor.maxHP * 0.25);
        const actual  = actor.heal(healAmt);
        this.emit('action', { side, action: 'recover', actor, value: actual, message: `${actor.name}はHPを${actual}回復した！` });
        break;
      }
    }
  }

  _resolveSkill(actor, defender, skill, side, actorBonus, defenderSide, isEx = false) {
    const type = skill.type;

    if (type === 'atk' || type === 'mag') {
      const isMag = type === 'mag';
      const targets = skill.target === 'all'
        ? (side === 'player' ? this.enemyTeam : this.playerTeam).filter(m => m.isAlive)
        : [defender];

      targets.forEach(target => {
        let dmg = this._calcSkillDamage(actor, target, skill, isMag, actorBonus, isEx);

        // 吸命
        if (skill.drainRatio) {
          const drain = Math.floor(dmg * skill.drainRatio);
          actor.heal(drain);
          this.emit('drain', { side, actor, value: drain });
        }

        const actualDmg = target.takeDamage(dmg);
        const tSide = target === this.playerActive || this.playerTeam.includes(target) ? 'player' : 'enemy';
        this.emit('action', {
          side, action: 'skill', actor, defender: target, skill,
          value: actualDmg, isEx,
          elementMult: this._elementMult(actor.element, target.element),
          message: `${actor.name}の${skill.name}！ ${actualDmg}ダメージ！`
        });

        this._applySkillEffects(actor, target, skill, tSide);

        // 最大HP削減
        if (skill.reduceMaxHp) {
          const red = target.reduceMaxHP(skill.reduceMaxHp);
          this.emit('max_hp_reduce', { side: tSide, target, value: red });
        }

        // 即死判定
        if (skill.instantKillCondition) {
          const cond = skill.instantKillCondition;
          if (target.element === cond.vs && target.hpRatio <= cond.hpThreshold) {
            target.currentHP = 0;
            this.emit('instant_kill', { side: tSide, target });
          }
        }
      });

    } else if (type === 'heal') {
      const targets = skill.target === 'team' || skill.target === 'self'
        ? (skill.target === 'self' ? [actor] : (side === 'player' ? this.playerTeam : this.enemyTeam).filter(m => m.isAlive))
        : [actor];

      targets.forEach(target => {
        const healAmt = Math.floor(target.maxHP * (skill.healRatio || 0.25));
        const actual  = target.heal(healAmt);
        const tSide   = this.playerTeam.includes(target) ? 'player' : 'enemy';
        this.emit('action', { side, action: 'heal', actor, defender: target, skill, value: actual, message: `${actor.name}の${skill.name}！ HPが${actual}回復！` });

        // 追加バフ
        if (skill.additionalBuff) {
          target.addStatMod(skill.additionalBuff.stat, skill.additionalBuff.mod, skill.additionalBuff.duration);
        }
      });

      if (skill.clearStatuses) {
        const myTeam = (side === 'player' ? this.playerTeam : this.enemyTeam).filter(m => m.isAlive);
        myTeam.forEach(m => m.clearAllStatuses());
        this.emit('action', { side, action: 'cleanse', actor, message: `${actor.name}の${skill.name}で全異常が消えた！` });
      }

    } else if (type === 'buff') {
      const myTeam = (side === 'player' ? this.playerTeam : this.enemyTeam).filter(m => m.isAlive);
      const buffs  = skill.buffs || (skill.buffStat ? [{ stat: skill.buffStat, mod: skill.buffMod, duration: skill.buffDuration }] : []);

      myTeam.forEach(target => {
        buffs.forEach(b => target.addStatMod(b.stat, b.mod, b.duration));
        if (skill.immuneTo) skill.immuneTo.forEach(t => target.addImmunity(t));
      });
      this.emit('action', { side, action: 'buff', actor, skill, message: `${actor.name}の${skill.name}！` });

    } else if (type === 'debuff') {
      const targets = skill.target === 'single' ? [defender] : (side === 'player' ? this.enemyTeam : this.playerTeam).filter(m => m.isAlive);
      const debuffs = skill.debuffs || (skill.debuffStat ? [{ stat: skill.debuffStat, mod: skill.debuffMod, duration: skill.debuffDuration }] : []);

      targets.forEach(target => {
        debuffs.forEach(d => target.addStatMod(d.stat, d.mod, d.duration));
        if (skill.effect) {
          const applied = target.addStatus(skill.effect, skill.effectDuration || 2);
          if (applied) this.emit('status_applied', { target, status: skill.effect });
        }
      });
      this.emit('action', { side, action: 'debuff', actor, skill, message: `${actor.name}の${skill.name}！` });

    } else if (type === 'revive') {
      const myTeam = side === 'player' ? this.playerTeam : this.enemyTeam;
      const dead   = myTeam.filter(m => !m.isAlive);
      if (dead.length > 0) {
        const target = dead[0];
        target.currentHP = Math.floor(target.maxHP * (skill.reviveHpRatio || 0.30));
        const tSide = this.playerTeam.includes(target) ? 'player' : 'enemy';
        this.emit('action', { side, action: 'revive', actor, defender: target, skill, message: `${actor.name}の${skill.name}！ ${target.name}が復活！` });
        this.emit('monster_revive', { side: tSide, target });
      } else {
        // 復活対象なしの場合は回復
        const healAmt = Math.floor(actor.maxHP * 0.20);
        const actual  = actor.heal(healAmt);
        this.emit('action', { side, action: 'heal', actor, skill, value: actual, message: `復活対象なし。${actor.name}のHP+${actual}！` });
      }
    }
  }

  _applySkillEffects(actor, target, skill, targetSide) {
    if (skill.effect && Math.random() < (skill.effectChance || 0)) {
      const applied = target.addStatus(skill.effect, skill.effectDuration || 2, skill.curseRatio || skill.poisonRatio || null);
      if (applied) this.emit('status_applied', { target, status: skill.effect, side: targetSide });
    }
    if (skill.secondEffect && Math.random() < (skill.secondEffectChance || 0)) {
      const applied = target.addStatus(skill.secondEffect, skill.secondEffectDuration || 2);
      if (applied) this.emit('status_applied', { target, status: skill.secondEffect, side: targetSide });
    }
    // デバフ (defDown, atkDown等)
    if (skill.effect === 'defDown') {
      target.addStatMod('def', skill.effectMod || -0.15, 2);
    }
    if (skill.selfBuff) {
      actor.addStatMod(skill.selfBuff.stat, skill.selfBuff.mod, skill.selfBuff.duration);
    }
    if (skill.teamBuff) {
      const myTeam = actor === this.playerActive ? this.playerTeam : this.enemyTeam;
      myTeam.filter(m => m.isAlive).forEach(m => m.addStatMod(skill.teamBuff.stat, skill.teamBuff.mod, skill.teamBuff.duration));
    }
    // バフ解除
    if (skill.clearEnemyBuffs) {
      target.removeBuffs();
      this.emit('buff_cleared', { target });
    }
  }

  _doAttack(actor, defender, powerPct, isMag, isGuardBreak, actorBonus, defenderSide) {
    const dmg = this._calcDamage(actor, defender, powerPct, isMag, actorBonus);
    const actual = defender.takeDamage(dmg);
    const elemMult = this._elementMult(actor.element, defender.element);
    this.emit('action', {
      side: actor === this.playerActive ? 'player' : 'enemy',
      action: isGuardBreak ? 'guardbreak_hit' : 'attack',
      actor, defender, value: actual,
      elementMult: elemMult,
      message: `${actor.name}の攻撃！ ${actual}ダメージ！`
    });
  }

  _calcDamage(actor, defender, powerPct = 100, isMag = false, bonus = {}) {
    const atk = actor.atk;
    const def = isMag ? Math.floor(defender.def * 0.5) : defender.def;
    let base = Math.floor((atk * powerPct / 100) - def * 0.4);
    base = Math.max(1, base);

    // 防御中: 50%カット
    if (defender.isDefending) base = Math.floor(base * 0.4);
    // ガードブレイク状態（直前に崩された）
    if (defender.isGuardBroken) base = Math.floor(base * 1.5);

    // 属性倍率
    base = Math.floor(base * this._elementMult(actor.element, defender.element));

    // チームボーナス（スタッツ+%）
    if (bonus.statBonus) base = Math.floor(base * (1 + bonus.statBonus));

    // ランダム係数 ±10%
    base = Math.floor(base * (0.9 + Math.random() * 0.2));

    return Math.max(1, base);
  }

  _calcSkillDamage(actor, defender, skill, isMag = false, bonus = {}, isEx = false) {
    const power = (skill.power || 100) * (isEx ? 1 : 1);
    let base = this._calcDamage(actor, defender, power, isMag, bonus);

    // 防御貫通
    if (skill.defPierce) {
      const piercedDef = isMag ? Math.floor(defender.def * 0.5) : defender.def;
      const bonus2 = Math.floor(piercedDef * 0.4 * skill.defPierce); // 貫通分の追加ダメージ
      base += bonus2;
    }

    // クラスボーナス（剣士: 物理+15%, 魔道士: 魔法+15%）
    if (!isMag && actor.class === 'warrior') base = Math.floor(base * 1.15);
    if (isMag  && actor.class === 'mage')    base = Math.floor(base * 1.15);

    // スキルチームボーナス
    if (bonus.skillBonus) base = Math.floor(base * (1 + bonus.skillBonus));

    // 特定属性ボーナス（聖騎士セレスト等）
    if (skill.elementBonus && defender.element === skill.elementBonus.vs) {
      base = Math.floor(base * skill.elementBonus.multiplier);
    }

    // 属性耐性無視
    if (skill.ignoreElementResistance) {
      const elemMult = this._elementMult(actor.element, defender.element);
      if (elemMult < 1) base = Math.floor(base / elemMult); // 耐性分を戻す
    }

    return Math.max(1, base);
  }

  _elementMult(atkElem, defElem) {
    if (!ELEMENT_CHART[atkElem] || !ELEMENT_CHART[atkElem][defElem]) return 1.0;
    return ELEMENT_CHART[atkElem][defElem];
  }

  _checkWin() {
    const playerAlive = this.playerTeam.some(m => m.isAlive);
    const enemyAlive  = this.enemyTeam.some(m => m.isAlive);

    if (!enemyAlive) {
      this.state = 'BATTLE_END';
      this.emit('battle_end', { winner: 'player' });
      return true;
    }
    if (!playerAlive) {
      this.state = 'BATTLE_END';
      this.emit('battle_end', { winner: 'enemy' });
      return true;
    }
    return false;
  }

  emit(type, data = {}) {
    this.onEvent({ type, ...data });
    this.log.push({ type, turn: this.turn, ...data });
  }
}

window.BattleEngine = BattleEngine;
window.ELEMENT_CHART = ELEMENT_CHART;
