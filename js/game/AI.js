// 幻海伝説 - AIコントローラー

class AIController {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;

    // 各難易度の基本重み（合計100）
    this.baseWeights = {
      easy:   { attack: 45, skill: 20, defend: 15, guardbreak: 10, recover: 8, ex: 2 },
      normal: { attack: 35, skill: 25, defend: 15, guardbreak: 12, recover: 10, ex: 3 },
      hard:   { attack: 28, skill: 32, defend: 12, guardbreak: 15, recover: 10, ex: 3 },
    };
  }

  /**
   * アクションを決定する
   * @param {Monster} actor  行動するCPUモンスター
   * @param {Monster} target 攻撃対象（プレイヤーのアクティブモンスター）
   * @param {{ playerTeam: Monster[], enemyTeam: Monster[], exReady: boolean }} ctx
   * @returns {string} 'attack' | 'skill' | 'defend' | 'guardbreak' | 'recover' | 'ex'
   */
  decideAction(actor, target, ctx) {
    const hpRatio = actor.hpRatio;
    const targetHpRatio = target.hpRatio;
    const weights = { ...this.baseWeights[this.difficulty] || this.baseWeights.normal };

    // EXゲージが使える場合
    if (actor.canUseEx && actor.exSkillData) {
      weights.ex = 50; // 強く優先
    } else {
      weights.ex = 0;
    }

    // HP低下時は回復優先
    if (hpRatio < 0.25) {
      weights.recover += 40;
      weights.defend  += 20;
      weights.attack  = Math.max(5, weights.attack - 30);
    } else if (hpRatio < 0.45) {
      weights.recover += 20;
      weights.defend  += 10;
    }

    // 封印中はスキルとEX不可
    if (actor.hasStatus('seal')) {
      weights.skill = 0;
      weights.ex    = 0;
    }

    // スキルがない場合
    if (!actor.skillData) {
      weights.skill = 0;
      weights.ex    = 0;
    }

    // 相手HP低下時は攻撃的に
    if (targetHpRatio < 0.35) {
      weights.skill  += 20;
      weights.attack += 10;
      weights.defend  = Math.max(3, weights.defend - 15);
      weights.recover = Math.max(3, weights.recover - 10);
    }

    // 相手が防御中ならガードブレイク優先
    if (target.isDefending) {
      weights.guardbreak += 40;
      weights.attack      = Math.max(5, weights.attack - 20);
    }

    // スキルのタイプによる調整
    if (actor.skillData) {
      const sType = actor.skillData.type;
      if ((sType === 'buff' || sType === 'heal') && hpRatio > 0.8) {
        weights.skill = Math.max(5, weights.skill - 15); // HP高い時は補助スキル優先下げ
      }
    }

    // Hard難易度: スキルレベル解放レベル以上かつHP余裕あればスキル多用
    if (this.difficulty === 'hard' && actor.level >= 5 && hpRatio > 0.6) {
      weights.skill += 15;
    }

    return this._weightedRandom(weights);
  }

  _weightedRandom(weights) {
    const actions = Object.keys(weights);
    const total = actions.reduce((sum, k) => sum + weights[k], 0);
    let rand = Math.random() * total;
    for (const action of actions) {
      rand -= weights[action];
      if (rand <= 0) return action;
    }
    return 'attack';
  }

  // AI用ルーレット停止タイミング（見た目上の演出用）
  simulateRouletteDelay() {
    // 0.8〜2.5秒のランダムな遅延
    return 800 + Math.random() * 1700;
  }
}

window.AIController = AIController;
