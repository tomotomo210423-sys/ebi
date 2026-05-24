// 幻海伝説 - モンスターデータ (60体)
// スキルタイプ: atk=物理攻撃, mag=魔法攻撃, heal=回復, buff=強化, debuff=弱体, drain=吸命
// ターゲット: single=単体, all=全体, team=自チーム全体
// エフェクト: burn/freeze/poison/paralysis/fear/curse/confusion/seal/petrify/charm/slow

window.MONSTERS = [

  // ============================================================
  // 🔥 炎晶 (Entei / Fire) — 1〜10
  // ============================================================
  {
    id: 1, name: '炎のケンタウロス', nameEn: 'Flame Centaur',
    element: 'fire', class: 'warrior', race: 'Mythical', rarity: 2,
    emoji: '🐎', color: '#ff4500',
    baseStats: { hp: 180, atk: 75, def: 55, spd: 60 },
    skill: {
      name: '炎の突撃', nameEn: 'Flame Charge',
      type: 'atk', power: 130, hits: 1, target: 'single',
      effect: 'burn', effectChance: 0.7, effectDuration: 2,
      description: '炎を纏いながら敵に突進。燃焼状態にする可能性あり。'
    },
    exSkill: null
  },
  {
    id: 2, name: '溶岩巨人', nameEn: 'Lava Giant',
    element: 'fire', class: 'warrior', race: 'Demon', rarity: 3,
    emoji: '🗻', color: '#dc143c',
    baseStats: { hp: 210, atk: 80, def: 65, spd: 40 },
    skill: {
      name: '溶岩拳', nameEn: 'Magma Fist',
      type: 'atk', power: 150, hits: 1, target: 'single',
      effect: 'defDown', effectChance: 1.0, effectMod: -0.20,
      description: '熔けた岩石の拳で殴打。相手の防御力を20%下げる。'
    },
    exSkill: null
  },
  {
    id: 3, name: '火竜ガルドス', nameEn: 'Fire Dragon Galdos',
    element: 'fire', class: 'warrior', race: 'Dragon', rarity: 4,
    emoji: '🐉', color: '#ff6600',
    baseStats: { hp: 195, atk: 85, def: 60, spd: 55 },
    skill: {
      name: '竜炎の爪', nameEn: 'Dragon Flame Claw',
      type: 'atk', power: 80, hits: 2, target: 'single',
      effect: 'burn', effectChance: 0.4, effectDuration: 2,
      description: '炎の爪で2回連続攻撃。燃焼付与の可能性あり。'
    },
    exSkill: {
      name: '天炎翼', nameEn: 'Heaven Flame Wing',
      type: 'atk', power: 120, hits: 1, target: 'all',
      effect: 'burn', effectChance: 0.6, effectDuration: 2,
      description: '巨大な炎の翼で全敵を薙ぎ払う究極技。'
    }
  },
  {
    id: 4, name: '灼熱剣士', nameEn: 'Blazing Swordsman',
    element: 'fire', class: 'warrior', race: 'Human', rarity: 2,
    emoji: '⚔️', color: '#ff4500',
    baseStats: { hp: 165, atk: 72, def: 50, spd: 65 },
    skill: {
      name: '十字炎撃', nameEn: 'Cross Blaze',
      type: 'atk', power: 120, hits: 1, target: 'single',
      defPierce: 0.30,
      description: '炎を纏った十字斬り。敵防御の30%を無視する。'
    },
    exSkill: null
  },
  {
    id: 5, name: '炎霊の魔道士', nameEn: 'Fire Spirit Mage',
    element: 'fire', class: 'mage', race: 'Mythical', rarity: 3,
    emoji: '🔥', color: '#ff4500',
    baseStats: { hp: 130, atk: 60, def: 42, spd: 72 },
    skill: {
      name: '業火の波動', nameEn: 'Hellfire Wave',
      type: 'mag', power: 145, hits: 1, target: 'single',
      effect: 'burn', effectChance: 0.8, effectDuration: 3,
      description: '業火のエネルギー波を放つ。強力な燃焼を付与。'
    },
    exSkill: {
      name: '炎柱召喚', nameEn: 'Pillar of Flame',
      type: 'mag', power: 200, hits: 1, target: 'single',
      effect: 'burn', effectChance: 1.0, effectDuration: 3,
      description: '天から巨大な炎柱を召喚する究極魔法。'
    }
  },
  {
    id: 6, name: '太陽の巫女', nameEn: 'Sun Priestess',
    element: 'fire', class: 'mage', race: 'Angel', rarity: 4,
    emoji: '☀️', color: '#ffa500',
    baseStats: { hp: 140, atk: 55, def: 48, spd: 68 },
    skill: {
      name: '太陽の眼', nameEn: 'Eye of the Sun',
      type: 'mag', power: 130, hits: 1, target: 'single',
      effect: 'seal', effectChance: 0.8, effectDuration: 2,
      description: '太陽の光で焼き尽くし、相手のスキルを封印する。'
    },
    exSkill: null
  },
  {
    id: 7, name: '火炎の術師', nameEn: 'Pyromancer',
    element: 'fire', class: 'mage', race: 'Human', rarity: 2,
    emoji: '🌋', color: '#ff4500',
    baseStats: { hp: 120, atk: 52, def: 40, spd: 78 },
    skill: {
      name: 'ファイアボール', nameEn: 'Fireball',
      type: 'mag', power: 110, hits: 1, target: 'single',
      effect: 'burn', effectChance: 0.5, effectDuration: 1,
      description: '高速の火球を投げつける基本魔法。'
    },
    exSkill: null
  },
  {
    id: 8, name: '炎霊の呼び師', nameEn: 'Fire Spirit Caller',
    element: 'fire', class: 'summoner', race: 'Mythical', rarity: 3,
    emoji: '🔯', color: '#ff6600',
    baseStats: { hp: 155, atk: 48, def: 62, spd: 60 },
    skill: {
      name: '炎神降臨', nameEn: 'Fire God Descent',
      type: 'buff', power: 0, hits: 0, target: 'team',
      buffStat: 'atk', buffMod: 0.20, buffDuration: 2,
      description: '炎の神を召喚し、味方全員の攻撃力を2ターン20%上昇させる。'
    },
    exSkill: null
  },
  {
    id: 9, name: '煌炎の聖者', nameEn: 'Blazing Saint',
    element: 'fire', class: 'summoner', race: 'Angel', rarity: 4,
    emoji: '👼', color: '#ffd700',
    baseStats: { hp: 160, atk: 50, def: 70, spd: 55 },
    skill: {
      name: '復活の炎', nameEn: 'Resurrection Flame',
      type: 'revive', power: 0, hits: 0, target: 'ally',
      reviveHpRatio: 0.30,
      description: '倒れた味方1体をHP30%で復活させる聖なる炎。'
    },
    exSkill: null
  },
  {
    id: 10, name: '龍王フレイガルド', nameEn: 'Dragon King Freygard',
    element: 'fire', class: 'warrior', race: 'Dragon', rarity: 5,
    emoji: '🌟', color: '#ff2200',
    baseStats: { hp: 220, atk: 90, def: 68, spd: 58 },
    skill: {
      name: '炎帝の咆哮', nameEn: 'Emperor Flame Roar',
      type: 'atk', power: 140, hits: 1, target: 'all',
      effect: 'burn', effectChance: 0.5, effectDuration: 2,
      description: '炎帝の咆哮で全敵を薙ぎ払う。'
    },
    exSkill: {
      name: '幻炎の審判', nameEn: 'Phantom Flame Judgement',
      type: 'atk', power: 250, hits: 1, target: 'single',
      defPierce: 1.0,
      description: '龍王の全力。防御を完全無視した究極の一撃。'
    }
  },

  // ============================================================
  // 💧 水晶 (Suisho / Water) — 11〜20
  // ============================================================
  {
    id: 11, name: '深海の騎士', nameEn: 'Abyssal Knight',
    element: 'water', class: 'warrior', race: 'Beast', rarity: 2,
    emoji: '🦈', color: '#1e90ff',
    baseStats: { hp: 190, atk: 72, def: 68, spd: 50 },
    skill: {
      name: '海嵐の一撃', nameEn: 'Sea Storm Strike',
      type: 'atk', power: 125, hits: 1, target: 'single',
      effect: 'slow', effectChance: 0.7, effectDuration: 2,
      description: '海流を纏った強撃。相手の素早さを下げる。'
    },
    exSkill: null
  },
  {
    id: 12, name: '氷鎧騎士', nameEn: 'Ice Armor Knight',
    element: 'water', class: 'warrior', race: 'Human', rarity: 3,
    emoji: '🧊', color: '#87ceeb',
    baseStats: { hp: 185, atk: 74, def: 70, spd: 48 },
    skill: {
      name: '凍結の刃', nameEn: 'Freezing Blade',
      type: 'atk', power: 130, hits: 1, target: 'single',
      effect: 'freeze', effectChance: 0.6, effectDuration: 1,
      description: '氷の刃で斬りつける。高確率で凍結させる。'
    },
    exSkill: null
  },
  {
    id: 13, name: '海竜バルフロス', nameEn: 'Sea Dragon Balfros',
    element: 'water', class: 'warrior', race: 'Sea Serpent', rarity: 4,
    emoji: '🐲', color: '#4169e1',
    baseStats: { hp: 200, atk: 78, def: 65, spd: 52 },
    skill: {
      name: '蒼海の牙', nameEn: 'Blue Sea Fang',
      type: 'atk', power: 75, hits: 2, target: 'single',
      effect: 'slow', effectChance: 0.4, effectDuration: 2,
      description: '海竜の鋭い牙で2回噛みつく。'
    },
    exSkill: {
      name: '深淵の咆哮', nameEn: 'Abyssal Roar',
      type: 'atk', power: 110, hits: 1, target: 'all',
      effect: 'freeze', effectChance: 0.5, effectDuration: 1,
      description: '深海から放つ咆哮で全敵を凍てつかせる。'
    }
  },
  {
    id: 14, name: '水の妖精', nameEn: 'Water Fairy',
    element: 'water', class: 'mage', race: 'Angel', rarity: 2,
    emoji: '🧚', color: '#00bfff',
    baseStats: { hp: 125, atk: 50, def: 42, spd: 80 },
    skill: {
      name: '水弾', nameEn: 'Water Bullet',
      type: 'mag', power: 105, hits: 1, target: 'single',
      effect: 'charm', effectChance: 0.15, effectDuration: 2,
      description: '水の弾を放つ。稀に敵を魅了する。'
    },
    exSkill: null
  },
  {
    id: 15, name: '氷晶の術士', nameEn: 'Crystal Witch',
    element: 'water', class: 'mage', race: 'Human', rarity: 3,
    emoji: '❄️', color: '#87ceeb',
    baseStats: { hp: 130, atk: 55, def: 45, spd: 76 },
    skill: {
      name: '氷柱落とし', nameEn: 'Ice Pillar Drop',
      type: 'mag', power: 145, hits: 1, target: 'single',
      effect: 'freeze', effectChance: 0.7, effectDuration: 1,
      secondEffect: 'slow', secondEffectChance: 0.5, secondEffectDuration: 2,
      description: '巨大な氷柱を落下させる。凍結＋スロウの複合効果。'
    },
    exSkill: null
  },
  {
    id: 16, name: '月の歌姫', nameEn: 'Moon Songstress',
    element: 'water', class: 'mage', race: 'Angel', rarity: 4,
    emoji: '🌙', color: '#9370db',
    baseStats: { hp: 145, atk: 58, def: 50, spd: 70 },
    skill: {
      name: '月詠みの旋律', nameEn: 'Moonlit Melody',
      type: 'mag', power: 140, hits: 1, target: 'single',
      effect: 'charm', effectChance: 0.75, effectDuration: 2,
      description: '月光の歌声で全敵の意識を奪う。魅了付与。'
    },
    exSkill: null
  },
  {
    id: 17, name: 'クラーケン幼体', nameEn: 'Young Kraken',
    element: 'water', class: 'mage', race: 'Sea Serpent', rarity: 2,
    emoji: '🐙', color: '#483d8b',
    baseStats: { hp: 135, atk: 52, def: 48, spd: 65 },
    skill: {
      name: '墨霧', nameEn: 'Ink Fog',
      type: 'debuff', power: 0, hits: 0, target: 'single',
      debuffStat: 'accuracy', debuffMod: -0.30, debuffDuration: 2,
      description: '墨霧を吐き出し、相手の命中率を2ターン30%下げる。'
    },
    exSkill: null
  },
  {
    id: 18, name: '潮の導き手', nameEn: 'Tidecaller',
    element: 'water', class: 'summoner', race: 'Angel', rarity: 3,
    emoji: '🐚', color: '#20b2aa',
    baseStats: { hp: 160, atk: 46, def: 70, spd: 62 },
    skill: {
      name: '水の癒し', nameEn: 'Water Healing',
      type: 'heal', power: 0, hits: 0, target: 'self',
      healRatio: 0.30,
      description: '潮の力で自身のHPを最大値の30%回復する。'
    },
    exSkill: null
  },
  {
    id: 19, name: '霜の聖女', nameEn: 'Frost Maiden',
    element: 'water', class: 'summoner', race: 'Human', rarity: 4,
    emoji: '⛄', color: '#b0e0e6',
    baseStats: { hp: 155, atk: 52, def: 68, spd: 60 },
    skill: {
      name: '凍てつく守護', nameEn: 'Frozen Shield',
      type: 'buff', power: 0, hits: 0, target: 'team',
      buffStat: 'def', buffMod: 0.25, buffDuration: 2,
      immuneTo: ['freeze'],
      description: '氷の加護で味方全員の防御を25%上昇。凍結無効化。'
    },
    exSkill: null
  },
  {
    id: 20, name: '海神レヴィアタン', nameEn: 'Leviathan',
    element: 'water', class: 'warrior', race: 'Sea Serpent', rarity: 5,
    emoji: '🌊', color: '#0000cd',
    baseStats: { hp: 225, atk: 85, def: 70, spd: 55 },
    skill: {
      name: '大海嘯', nameEn: 'Great Tidal Wave',
      type: 'atk', power: 140, hits: 1, target: 'all',
      effect: 'slow', effectChance: 0.6, effectDuration: 2,
      description: '大海嘯を起こし全敵を飲み込む。'
    },
    exSkill: {
      name: '深海奥義', nameEn: 'Deep Sea Secret Art',
      type: 'atk', power: 260, hits: 1, target: 'single',
      effect: 'freeze', effectChance: 1.0, effectDuration: 2,
      description: '深海の全力を集めた最終奥義。必ず凍結させる。'
    }
  },

  // ============================================================
  // 🌿 地晶 (Chisho / Earth) — 21〜30
  // ============================================================
  {
    id: 21, name: '岩鎧の戦士', nameEn: 'Stone Sentinel',
    element: 'earth', class: 'warrior', race: 'Mythical', rarity: 2,
    emoji: '🗿', color: '#8b6914',
    baseStats: { hp: 200, atk: 70, def: 72, spd: 45 },
    skill: {
      name: '巨岩砕き', nameEn: 'Boulder Crusher',
      type: 'atk', power: 120, hits: 1, target: 'single',
      selfBuff: { stat: 'def', mod: 0.15, duration: 1 },
      description: '巨岩で殴打し、反動で自身の守備が上がる。'
    },
    exSkill: null
  },
  {
    id: 22, name: '砂漠の剣士', nameEn: 'Desert Swordsman',
    element: 'earth', class: 'warrior', race: 'Beast', rarity: 3,
    emoji: '🏜️', color: '#d2691e',
    baseStats: { hp: 180, atk: 75, def: 62, spd: 58 },
    skill: {
      name: '砂塵斬り', nameEn: 'Sand Slash',
      type: 'atk', power: 125, hits: 1, target: 'single',
      effect: 'accuracy_down', effectChance: 0.8, effectMod: -0.20, effectDuration: 2,
      description: '砂を巻き上げながら斬撃。相手の命中率を下げる。'
    },
    exSkill: null
  },
  {
    id: 23, name: '岩竜ゴルドレイク', nameEn: 'Rock Dragon Goldrak',
    element: 'earth', class: 'warrior', race: 'Dragon', rarity: 4,
    emoji: '🦕', color: '#8b6914',
    baseStats: { hp: 205, atk: 82, def: 68, spd: 48 },
    skill: {
      name: '地砕きの尾', nameEn: 'Earth-Breaking Tail',
      type: 'atk', power: 155, hits: 1, target: 'single',
      effect: 'defDown', effectChance: 1.0, effectMod: -0.25,
      description: '岩のような尾で叩きつけ、相手の防御を25%下げる。'
    },
    exSkill: {
      name: '大地震', nameEn: 'Great Earthquake',
      type: 'atk', power: 130, hits: 1, target: 'all',
      effect: 'slow', effectChance: 0.6, effectDuration: 2,
      description: '大地震を引き起こし全敵に甚大なダメージを与える。'
    }
  },
  {
    id: 24, name: '大地の賢者', nameEn: 'Terra Sage',
    element: 'earth', class: 'mage', race: 'Human', rarity: 2,
    emoji: '🌿', color: '#228b22',
    baseStats: { hp: 140, atk: 58, def: 50, spd: 65 },
    skill: {
      name: '地脈崩壊', nameEn: 'Ley Line Collapse',
      type: 'mag', power: 135, hits: 1, target: 'single',
      effect: 'paralysis', effectChance: 0.30, effectDuration: 2,
      description: '大地の力で敵を打撃。麻痺させる可能性あり。'
    },
    exSkill: null
  },
  {
    id: 25, name: '毒沼の魔女', nameEn: 'Swamp Witch',
    element: 'earth', class: 'mage', race: 'Human', rarity: 3,
    emoji: '🧙', color: '#556b2f',
    baseStats: { hp: 130, atk: 55, def: 48, spd: 70 },
    skill: {
      name: '猛毒の沼', nameEn: 'Venomous Swamp',
      type: 'mag', power: 115, hits: 1, target: 'single',
      effect: 'poison', effectChance: 1.0, effectDuration: 3,
      poisonRatio: 0.08,
      description: '強力な毒沼魔法。3ターン間毎ターン最大HPの8%を削る。'
    },
    exSkill: null
  },
  {
    id: 26, name: '古代の呪術師', nameEn: 'Ancient Shaman',
    element: 'earth', class: 'mage', race: 'Undead', rarity: 4,
    emoji: '💀', color: '#696969',
    baseStats: { hp: 145, atk: 60, def: 52, spd: 65 },
    skill: {
      name: '石化の呪い', nameEn: 'Petrification Curse',
      type: 'mag', power: 120, hits: 1, target: 'single',
      effect: 'petrify', effectChance: 0.40, effectDuration: 1,
      description: '石化の呪いをかける。40%の確率で1ターン完全に行動不能。'
    },
    exSkill: null
  },
  {
    id: 27, name: '苔むした精霊', nameEn: 'Moss Spirit',
    element: 'earth', class: 'mage', race: 'Plant', rarity: 2,
    emoji: '🌱', color: '#2e8b57',
    baseStats: { hp: 135, atk: 50, def: 55, spd: 68 },
    skill: {
      name: '茨の鞭', nameEn: 'Thorn Whip',
      type: 'mag', power: 100, hits: 1, target: 'single',
      effect: 'poison', effectChance: 0.7, effectDuration: 2,
      poisonRatio: 0.05,
      description: '茨の鞭で叩き、毒を注入する。'
    },
    exSkill: null
  },
  {
    id: 28, name: '樹霊の守護者', nameEn: 'Grove Keeper',
    element: 'earth', class: 'summoner', race: 'Plant', rarity: 3,
    emoji: '🌳', color: '#006400',
    baseStats: { hp: 170, atk: 50, def: 76, spd: 55 },
    skill: {
      name: '根の抱擁', nameEn: 'Root Embrace',
      type: 'debuff', power: 0, hits: 0, target: 'single',
      debuffs: [
        { stat: 'spd', mod: -0.25, duration: 2 },
        { stat: 'def', mod: -0.15, duration: 2 }
      ],
      description: '根で縛り付け、相手の素早さと防御を2ターン下げる。'
    },
    exSkill: null
  },
  {
    id: 29, name: '大地の守護聖人', nameEn: 'Earth Guardian Saint',
    element: 'earth', class: 'summoner', race: 'Angel', rarity: 4,
    emoji: '🛡️', color: '#8b6914',
    baseStats: { hp: 165, atk: 52, def: 80, spd: 52 },
    skill: {
      name: '石壁の加護', nameEn: 'Stone Wall Blessing',
      type: 'buff', power: 0, hits: 0, target: 'team',
      buffStat: 'def', buffMod: 0.30, buffDuration: 3,
      description: '石壁の守護で味方全員の防御力を3ターン30%上昇。'
    },
    exSkill: null
  },
  {
    id: 30, name: '山岳神バルゾード', nameEn: 'Mountain God Balzord',
    element: 'earth', class: 'warrior', race: 'Mythical', rarity: 5,
    emoji: '⛰️', color: '#8b4513',
    baseStats: { hp: 230, atk: 88, def: 75, spd: 42 },
    skill: {
      name: '天地崩壊', nameEn: 'Heaven Earth Collapse',
      type: 'atk', power: 150, hits: 1, target: 'all',
      effect: 'defDown', effectChance: 1.0, effectMod: -0.20,
      description: '天地を揺るがす大崩壊。全敵の防御を下げる。'
    },
    exSkill: {
      name: '地霊王の裁き', nameEn: 'Earth Spirit King Judgement',
      type: 'atk', power: 270, hits: 1, target: 'single',
      defPierce: 1.0,
      description: '地霊の王の全力。防御を完全貫通する究極の一撃。'
    }
  },

  // ============================================================
  // 🌪️ 風晶 (Fusho / Wind) — 31〜40
  // ============================================================
  {
    id: 31, name: '疾風の剣士', nameEn: 'Swift Swordsman',
    element: 'wind', class: 'warrior', race: 'Human', rarity: 2,
    emoji: '💨', color: '#32cd32',
    baseStats: { hp: 165, atk: 78, def: 48, spd: 80 },
    skill: {
      name: '疾風斬り', nameEn: 'Swift Wind Slash',
      type: 'atk', power: 120, hits: 1, target: 'single',
      alwaysFirst: true,
      description: '神速の斬撃。必ず相手より先に行動する。'
    },
    exSkill: null
  },
  {
    id: 32, name: '嵐の天馬', nameEn: 'Storm Pegasus',
    element: 'wind', class: 'warrior', race: 'Bird', rarity: 3,
    emoji: '🦄', color: '#7fff00',
    baseStats: { hp: 175, atk: 80, def: 52, spd: 78 },
    skill: {
      name: '嵐蹄', nameEn: 'Storm Hooves',
      type: 'atk', power: 65, hits: 2, target: 'single',
      effect: 'paralysis', effectChance: 0.25, effectDuration: 2,
      description: '嵐を纏った蹄で2回連続攻撃。麻痺付与の可能性。'
    },
    exSkill: null
  },
  {
    id: 33, name: '暴風の竜騎士', nameEn: 'Gale Dragon Knight',
    element: 'wind', class: 'warrior', race: 'Dragon', rarity: 4,
    emoji: '🌀', color: '#00fa9a',
    baseStats: { hp: 190, atk: 84, def: 55, spd: 72 },
    skill: {
      name: '竜巻突き', nameEn: 'Tornado Thrust',
      type: 'atk', power: 160, hits: 1, target: 'single',
      defPierce: 0.40,
      description: '竜巻を纏った突貫。敵防御の40%を貫通する。'
    },
    exSkill: {
      name: '嵐竜の咆哮', nameEn: 'Storm Dragon Roar',
      type: 'atk', power: 120, hits: 1, target: 'all',
      effect: 'paralysis', effectChance: 0.5, effectDuration: 2,
      description: '嵐竜の咆哮で全敵を震え上がらせる。麻痺付与。'
    }
  },
  {
    id: 34, name: '旋風の術師', nameEn: 'Cyclone Mage',
    element: 'wind', class: 'mage', race: 'Human', rarity: 2,
    emoji: '🌪️', color: '#adff2f',
    baseStats: { hp: 118, atk: 55, def: 38, spd: 88 },
    skill: {
      name: '小竜巻', nameEn: 'Mini Tornado',
      type: 'mag', power: 37, hits: 3, target: 'single',
      description: '3回連続で小型竜巻を放つ。合計111%ダメージ。'
    },
    exSkill: null
  },
  {
    id: 35, name: '嵐の魔道士', nameEn: 'Storm Sorcerer',
    element: 'wind', class: 'mage', race: 'Human', rarity: 3,
    emoji: '⛈️', color: '#32cd32',
    baseStats: { hp: 125, atk: 60, def: 42, spd: 85 },
    skill: {
      name: '竜巻の牙', nameEn: 'Tornado Fang',
      type: 'mag', power: 150, hits: 1, target: 'all',
      description: '巨大竜巻で全敵を吹き飛ばす。'
    },
    exSkill: null
  },
  {
    id: 36, name: '雷鳥の呪術師', nameEn: 'Thunderbird Shaman',
    element: 'wind', class: 'mage', race: 'Bird', rarity: 4,
    emoji: '⚡', color: '#ffd700',
    baseStats: { hp: 140, atk: 62, def: 45, spd: 80 },
    skill: {
      name: '雷嵐', nameEn: 'Thunder Storm',
      type: 'mag', power: 140, hits: 1, target: 'all',
      effect: 'paralysis', effectChance: 0.6, effectDuration: 2,
      description: '雷を帯びた嵐で全敵を打ちつける。麻痺付与。'
    },
    exSkill: null
  },
  {
    id: 37, name: '風の精霊', nameEn: 'Wind Spirit',
    element: 'wind', class: 'mage', race: 'Mythical', rarity: 2,
    emoji: '🍃', color: '#98fb98',
    baseStats: { hp: 120, atk: 48, def: 40, spd: 90 },
    skill: {
      name: '風の刃', nameEn: 'Wind Blades',
      type: 'mag', power: 35, hits: 3, target: 'single',
      description: '風の刃を3連発。最速の魔法連撃。'
    },
    exSkill: null
  },
  {
    id: 38, name: '天空の守護者', nameEn: 'Sky Guardian',
    element: 'wind', class: 'summoner', race: 'Angel', rarity: 3,
    emoji: '🕊️', color: '#e0ffff',
    baseStats: { hp: 155, atk: 52, def: 62, spd: 72 },
    skill: {
      name: '羽衣の加護', nameEn: 'Feather Mantle Blessing',
      type: 'buff', power: 0, hits: 0, target: 'team',
      buffs: [
        { stat: 'spd', mod: 0.30, duration: 2 },
        { stat: 'evasion', mod: 0.15, duration: 2 }
      ],
      description: '羽衣で味方を包み、素早さと回避率を2ターン上昇させる。'
    },
    exSkill: null
  },
  {
    id: 39, name: '風の聖者', nameEn: 'Wind Saint',
    element: 'wind', class: 'summoner', race: 'Angel', rarity: 4,
    emoji: '✨', color: '#7fff00',
    baseStats: { hp: 158, atk: 50, def: 65, spd: 70 },
    skill: {
      name: '追い風の祝福', nameEn: 'Tailwind Blessing',
      type: 'buff', power: 0, hits: 0, target: 'team',
      buffs: [
        { stat: 'atk', mod: 0.15, duration: 3 },
        { stat: 'spd', mod: 0.15, duration: 3 }
      ],
      immuneTo: ['paralysis'],
      description: '追い風の加護で攻撃力・素早さ上昇、麻痺無効化。'
    },
    exSkill: null
  },
  {
    id: 40, name: '嵐皇ジルファド', nameEn: 'Storm Emperor Zilfad',
    element: 'wind', class: 'warrior', race: 'Bird', rarity: 5,
    emoji: '🦅', color: '#00ff7f',
    baseStats: { hp: 215, atk: 90, def: 58, spd: 82 },
    skill: {
      name: '嵐王の翼撃', nameEn: 'Storm King Wing Strike',
      type: 'atk', power: 145, hits: 1, target: 'all',
      effect: 'paralysis', effectChance: 0.7, effectDuration: 2,
      description: '嵐皇の翼で全敵を叩き、麻痺させる。'
    },
    exSkill: {
      name: '天嵐の裁き', nameEn: 'Heavenly Storm Judgement',
      type: 'atk', power: 270, hits: 1, target: 'single',
      defPierce: 1.0, alwaysFirst: true,
      description: '嵐皇の全力。必ず先攻し、防御を完全無視した神速の一撃。'
    }
  },

  // ============================================================
  // ☀️ 光晶 (Kosho / Light) — 41〜50
  // ============================================================
  {
    id: 41, name: '光の剣士', nameEn: 'Light Swordsman',
    element: 'light', class: 'warrior', race: 'Human', rarity: 2,
    emoji: '✝️', color: '#ffd700',
    baseStats: { hp: 170, atk: 72, def: 55, spd: 65 },
    skill: {
      name: '聖剣の光', nameEn: 'Holy Sword Light',
      type: 'atk', power: 120, hits: 1, target: 'single',
      drainRatio: 0.10,
      description: '聖剣で斬りつけ、与えたダメージの10%をHPとして吸収。'
    },
    exSkill: null
  },
  {
    id: 42, name: '聖騎士セレスト', nameEn: 'Holy Knight Celeste',
    element: 'light', class: 'warrior', race: 'Angel', rarity: 3,
    emoji: '⚜️', color: '#ffd700',
    baseStats: { hp: 185, atk: 75, def: 62, spd: 60 },
    skill: {
      name: '正義の裁き', nameEn: 'Justice Judgement',
      type: 'atk', power: 140, hits: 1, target: 'single',
      elementBonus: { vs: 'dark', multiplier: 2.0 },
      description: '正義の聖剣で斬る。闇属性の敵には2倍のダメージ。'
    },
    exSkill: null
  },
  {
    id: 43, name: '光竜アルカン', nameEn: 'Light Dragon Arkan',
    element: 'light', class: 'warrior', race: 'Dragon', rarity: 4,
    emoji: '🌟', color: '#fffacd',
    baseStats: { hp: 195, atk: 82, def: 62, spd: 62 },
    skill: {
      name: '聖竜の爪', nameEn: 'Holy Dragon Claw',
      type: 'atk', power: 155, hits: 1, target: 'single',
      effect: 'seal', effectChance: 0.7, effectDuration: 2,
      description: '光竜の聖なる爪。相手のスキルを封印する。'
    },
    exSkill: {
      name: '聖光の牙', nameEn: 'Holy Light Fang',
      type: 'atk', power: 110, hits: 1, target: 'all',
      effect: 'seal', effectChance: 0.8, effectDuration: 2,
      description: '全敵を聖光で薙ぎ払い、スキルを封印する。'
    }
  },
  {
    id: 44, name: '月の魔術師', nameEn: 'Moon Wizard',
    element: 'light', class: 'mage', race: 'Human', rarity: 2,
    emoji: '🌕', color: '#f0e68c',
    baseStats: { hp: 128, atk: 52, def: 42, spd: 76 },
    skill: {
      name: '月光弾', nameEn: 'Moonlight Shot',
      type: 'mag', power: 108, hits: 1, target: 'single',
      effect: 'charm', effectChance: 0.20, effectDuration: 2,
      description: '月光の弾を放つ。魅了させる可能性あり。'
    },
    exSkill: null
  },
  {
    id: 45, name: '星見の賢者', nameEn: 'Stargazer Sage',
    element: 'light', class: 'mage', race: 'Mythical', rarity: 3,
    emoji: '⭐', color: '#ffd700',
    baseStats: { hp: 135, atk: 58, def: 48, spd: 72 },
    skill: {
      name: '星屑の嵐', nameEn: 'Stardust Storm',
      type: 'mag', power: 110, hits: 1, target: 'all',
      description: '無数の星屑を全敵に降り注ぐ。'
    },
    exSkill: null
  },
  {
    id: 46, name: '天啓の神官', nameEn: 'Divine Oracle',
    element: 'light', class: 'mage', race: 'Angel', rarity: 4,
    emoji: '📿', color: '#fff8dc',
    baseStats: { hp: 148, atk: 60, def: 52, spd: 68 },
    skill: {
      name: '神聖爆破', nameEn: 'Divine Explosion',
      type: 'mag', power: 160, hits: 1, target: 'single',
      ignoreElementResistance: true,
      description: '属性耐性を無視する純粋な聖なる爆発。'
    },
    exSkill: null
  },
  {
    id: 47, name: '光の精霊', nameEn: 'Light Spirit',
    element: 'light', class: 'mage', race: 'Mythical', rarity: 2,
    emoji: '💫', color: '#fffacd',
    baseStats: { hp: 122, atk: 50, def: 40, spd: 82 },
    skill: {
      name: '浄化の光', nameEn: 'Purifying Light',
      type: 'heal', power: 0, hits: 0, target: 'team',
      healRatio: 0.15,
      clearStatuses: true,
      description: '味方全員のHPを15%回復し、全ての状態異常を治癒する。'
    },
    exSkill: null
  },
  {
    id: 48, name: '聖なる召喚士', nameEn: 'Holy Summoner',
    element: 'light', class: 'summoner', race: 'Angel', rarity: 3,
    emoji: '🙏', color: '#ffd700',
    baseStats: { hp: 155, atk: 48, def: 68, spd: 62 },
    skill: {
      name: '天使の守護', nameEn: 'Angel Guardian',
      type: 'buff', power: 0, hits: 0, target: 'team',
      buffStat: 'def', buffMod: 0.20, buffDuration: 2,
      immuneTo: ['burn', 'poison', 'curse'],
      description: '天使の光で味方を包み、防御上昇＋一部状態異常を無効化。'
    },
    exSkill: null
  },
  {
    id: 49, name: '光の大天使', nameEn: 'Archangel of Light',
    element: 'light', class: 'summoner', race: 'Angel', rarity: 4,
    emoji: '👼', color: '#fffacd',
    baseStats: { hp: 162, atk: 50, def: 72, spd: 60 },
    skill: {
      name: '神の祝福', nameEn: 'Divine Blessing',
      type: 'heal', power: 0, hits: 0, target: 'team',
      healRatio: 0.25,
      additionalBuff: { stat: 'atk', mod: 0.10, duration: 2 },
      description: '神の祝福で味方全員のHP25%回復＋攻撃力2ターン上昇。'
    },
    exSkill: null
  },
  {
    id: 50, name: '光神ルシエル', nameEn: 'Light God Luciel',
    element: 'light', class: 'mage', race: 'Angel', rarity: 5,
    emoji: '☀️', color: '#ffd700',
    baseStats: { hp: 200, atk: 88, def: 65, spd: 70 },
    skill: {
      name: '創世の光', nameEn: 'Creation Light',
      type: 'mag', power: 160, hits: 1, target: 'all',
      clearEnemyBuffs: true,
      description: '創世の光で全敵を照らし、敵の強化効果を全て解除。'
    },
    exSkill: {
      name: '神聖審判', nameEn: 'Sacred Judgement',
      type: 'mag', power: 280, hits: 1, target: 'single',
      instantKillCondition: { vs: 'dark', hpThreshold: 0.5 },
      description: '神聖な審判。闇属性でHP50%未満の敵を即座に消滅させる。'
    }
  },

  // ============================================================
  // 🌑 闇晶 (Yamishо / Dark) — 51〜60
  // ============================================================
  {
    id: 51, name: '影の剣士', nameEn: 'Shadow Swordsman',
    element: 'dark', class: 'warrior', race: 'Undead', rarity: 2,
    emoji: '🗡️', color: '#6a0dad',
    baseStats: { hp: 172, atk: 74, def: 52, spd: 68 },
    skill: {
      name: '影斬り', nameEn: 'Shadow Slash',
      type: 'atk', power: 115, hits: 1, target: 'single',
      effect: 'fear', effectChance: 0.7, effectDuration: 2,
      description: '闇に潜んで斬りかかる。恐怖状態で攻撃力を下げる。'
    },
    exSkill: null
  },
  {
    id: 52, name: '死霊騎士', nameEn: 'Death Knight',
    element: 'dark', class: 'warrior', race: 'Undead', rarity: 3,
    emoji: '☠️', color: '#4b0082',
    baseStats: { hp: 185, atk: 78, def: 58, spd: 60 },
    skill: {
      name: '死の宣告', nameEn: 'Death Sentence',
      type: 'atk', power: 130, hits: 1, target: 'single',
      drainRatio: 0.20,
      description: '死霊の剣で斬り、与えたダメージの20%をHP吸収。'
    },
    exSkill: null
  },
  {
    id: 53, name: '虚影の剣鬼', nameEn: 'Void Swordsman',
    element: 'dark', class: 'warrior', race: 'Demon', rarity: 4,
    emoji: '👹', color: '#8b0000',
    baseStats: { hp: 190, atk: 85, def: 58, spd: 65 },
    skill: {
      name: '虚無の刃', nameEn: 'Void Blade',
      type: 'atk', power: 155, hits: 1, target: 'single',
      defPierce: 0.30, drainRatio: 0.25,
      description: '虚無の刃で斬る。防御30%無視＋25%吸命。'
    },
    exSkill: {
      name: '虚無の暴走', nameEn: 'Void Rampage',
      type: 'atk', power: 130, hits: 1, target: 'all',
      drainRatio: 0.15,
      description: '虚無のエネルギーを解放。全敵攻撃＋吸命。'
    }
  },
  {
    id: 54, name: '夜の魔術師', nameEn: 'Night Wizard',
    element: 'dark', class: 'mage', race: 'Human', rarity: 2,
    emoji: '🌑', color: '#191970',
    baseStats: { hp: 125, atk: 52, def: 42, spd: 76 },
    skill: {
      name: '闇の矢', nameEn: 'Dark Arrow',
      type: 'mag', power: 108, hits: 1, target: 'single',
      effect: 'fear', effectChance: 0.30, effectDuration: 2,
      description: '闇の矢を放つ。恐怖状態を付与する可能性あり。'
    },
    exSkill: null
  },
  {
    id: 55, name: '夜闇の詠唱者', nameEn: 'Nightchanter',
    element: 'dark', class: 'mage', race: 'Demon', rarity: 3,
    emoji: '🦇', color: '#6a0dad',
    baseStats: { hp: 135, atk: 58, def: 46, spd: 74 },
    skill: {
      name: '魂喰らい', nameEn: 'Soul Devour',
      type: 'mag', power: 140, hits: 1, target: 'single',
      drainRatio: 0.15,
      effect: 'curse', effectChance: 0.8, effectDuration: 3, curseRatio: 0.10,
      description: '魂を喰らう魔法。HP吸収＋呪い付与。'
    },
    exSkill: null
  },
  {
    id: 56, name: '混沌の魔道士', nameEn: 'Chaos Mage',
    element: 'dark', class: 'mage', race: 'Demon', rarity: 4,
    emoji: '🌀', color: '#4b0082',
    baseStats: { hp: 145, atk: 63, def: 50, spd: 70 },
    skill: {
      name: '混沌の炎', nameEn: 'Chaos Flame',
      type: 'mag', power: 130, hits: 1, target: 'all',
      effect: 'confusion', effectChance: 0.6, effectDuration: 1,
      description: '混沌の炎を全敵に浴びせる。混乱させる可能性あり。'
    },
    exSkill: null
  },
  {
    id: 57, name: '骸の呪術師', nameEn: 'Bone Shaman',
    element: 'dark', class: 'mage', race: 'Undead', rarity: 2,
    emoji: '🦴', color: '#808080',
    baseStats: { hp: 128, atk: 50, def: 45, spd: 72 },
    skill: {
      name: '死の呪い', nameEn: 'Death Curse',
      type: 'debuff', power: 0, hits: 0, target: 'single',
      effect: 'curse', effectChance: 1.0, effectDuration: 3, curseRatio: 0.05,
      description: '死の呪いをかける。3ターン間毎ターン最大HPの5%を削る。'
    },
    exSkill: null
  },
  {
    id: 58, name: '影縛りの巫女', nameEn: 'Shadow Shrine',
    element: 'dark', class: 'summoner', race: 'Demon', rarity: 3,
    emoji: '🖤', color: '#2f0050',
    baseStats: { hp: 158, atk: 48, def: 65, spd: 68 },
    skill: {
      name: '闇の束縛', nameEn: 'Dark Binding',
      type: 'debuff', power: 0, hits: 0, target: 'single',
      debuffs: [
        { stat: 'spd', mod: -0.25, duration: 2 },
        { stat: 'atk', mod: -0.15, duration: 2 }
      ],
      effect: 'seal', effectChance: 0.50, effectDuration: 2,
      description: '闇の鎖で縛る。速度と攻撃力を下げ、封印する可能性。'
    },
    exSkill: null
  },
  {
    id: 59, name: '深淵の呼び師', nameEn: 'Abyss Caller',
    element: 'dark', class: 'summoner', race: 'Undead', rarity: 4,
    emoji: '🕳️', color: '#000080',
    baseStats: { hp: 165, atk: 52, def: 70, spd: 62 },
    skill: {
      name: '亡者の軍勢', nameEn: 'Legion of the Dead',
      type: 'atk', power: 140, hits: 1, target: 'single',
      drainRatio: 0.15,
      teamBuff: { stat: 'atk', mod: 0.20, duration: 2 },
      description: '亡者を従え攻撃しHP吸収。さらに味方全員の攻撃力を上昇。'
    },
    exSkill: null
  },
  {
    id: 60, name: '魂喰いの魔王', nameEn: 'Abyssal Demon King',
    element: 'dark', class: 'mage', race: 'Demon', rarity: 5,
    emoji: '👿', color: '#8b0000',
    baseStats: { hp: 210, atk: 90, def: 62, spd: 68 },
    skill: {
      name: '魂喰いの嵐', nameEn: 'Soul Devouring Storm',
      type: 'mag', power: 155, hits: 1, target: 'all',
      drainRatio: 0.15,
      effect: 'curse', effectChance: 0.7, effectDuration: 3, curseRatio: 0.10,
      description: '魂喰らいの嵐で全敵を攻撃。HP吸収＋呪い付与。'
    },
    exSkill: {
      name: '滅びの審判', nameEn: 'Judgement of Ruin',
      type: 'mag', power: 300, hits: 1, target: 'single',
      reduceMaxHp: 0.30,
      description: '魔王の全力。最大HPを30%削り取る絶望の一撃。'
    }
  }
];
