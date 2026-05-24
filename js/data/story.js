// 幻海伝説 - ストーリーデータ

window.STORY_CHAPTERS = [
  // ============================================================
  // 序章: 絆の目覚め (Tutorial)
  // ============================================================
  {
    id: 0,
    title: '序章：絆の目覚め',
    titleEn: 'Prologue: Awakening of the Bond',
    island: '始まりの島',
    element: null,
    background: 'prologue',
    unlockedByDefault: true,
    scenes: [
      { speaker: 'ナレーター', text: '宇宙の果て、星の海が広がるこの世界は「幻海」と呼ばれていた…' },
      { speaker: 'ナレーター', text: 'かつてこの海には、六つの属性の守護存在「クリスタルバウンド」が宿り、世界を守っていた。' },
      { speaker: 'ナレーター', text: 'しかし今、正体不明の闇「虚無」が幻海を侵食し始め、クリスタルバウンドたちが次々と堕落していく…' },
      { speaker: '老いた絆使い', text: '…目が覚めたか、若者よ。お前は「絆使い」として選ばれた存在だ。' },
      { speaker: '老いた絆使い', text: 'クリスタルバウンドと絆を結び、その力を引き出すことができる。今の世界にお前の力が必要だ。' },
      { speaker: '主人公', text: '絆…？クリスタルバウンドとは一体なんですか？' },
      { speaker: '老いた絆使い', text: 'この幻海に宿る守護者たちだ。まずは実際に戦って感じることが大切。この島の迷子の精霊たちと試しに戦ってみなさい。' },
    ],
    battles: [
      {
        battleIndex: 0,
        title: 'チュートリアルバトル I',
        enemyTeam: [
          { monsterId: 7, level: 1 },
          { monsterId: 14, level: 1 },
          { monsterId: 27, level: 1 }
        ]
      },
      {
        battleIndex: 1,
        title: 'チュートリアルバトル II',
        enemyTeam: [
          { monsterId: 4, level: 2 },
          { monsterId: 11, level: 2 },
          { monsterId: 24, level: 2 }
        ]
      }
    ],
    interludeAfterBattle: {
      battleIndex: 0,
      scenes: [
        { speaker: '老いた絆使い', text: 'よし、なかなかの戦いぶりだ。絆の力を感じることができたか？' },
        { speaker: '主人公', text: 'はい！クリスタルバウンドの力は凄まじいですね。' },
        { speaker: '老いた絆使い', text: 'もう一戦だ。今度は少し強い相手が来るぞ。' }
      ]
    },
    completionScenes: [
      { speaker: '老いた絆使い', text: '見事だ！お前なら幻海を救えるかもしれない。' },
      { speaker: '老いた絆使い', text: 'さあ、各地の属性の島へ向かいなさい。堕落したクリスタルバウンドを救い、虚無の侵食を止めるのだ。' },
      { speaker: '主人公', text: 'わかりました。幻海を守るために…必ず虚無を倒します！' }
    ],
    rewards: {
      unlockChapters: [1, 2],
      unlockMonsters: [1, 11, 21],
      bonusMonsters: [],
      xp: 50
    }
  },

  // ============================================================
  // 第1章: 炎晶の試練
  // ============================================================
  {
    id: 1,
    title: '第一章：炎晶の試練',
    titleEn: 'Chapter 1: Trial of the Fire Crystal',
    island: '炎晶島',
    element: 'fire',
    background: 'fire',
    unlockedByDefault: false,
    scenes: [
      { speaker: 'ナレーター', text: '溶岩が流れる炎晶島。かつては炎のクリスタルバウンドたちが守護する場所だった。' },
      { speaker: 'ナレーター', text: 'しかし今、島全体が異常な熱を帯び、炎のクリスタルバウンドたちが暴走している。' },
      { speaker: '主人公', text: '（熱い…！溶岩が島全体を覆っている。これが虚無の侵食の影響か…）' },
      { speaker: '灼熱の戦士', text: '貴様は何者だ！ここは炎晶島、よそ者は立ち入り禁止だ！' },
      { speaker: '主人公', text: 'あなたはクリスタルバウンドですか？虚無に侵食されているんじゃないですか？' },
      { speaker: '灼熱の戦士', text: '黙れ！虚無？関係ない！この炎は我の意志だ！かかってこい！' }
    ],
    battles: [
      {
        battleIndex: 0,
        title: '炎晶島の関門兵 I',
        enemyTeam: [
          { monsterId: 7, level: 2 },
          { monsterId: 4, level: 2 },
          { monsterId: 1, level: 2 }
        ]
      },
      {
        battleIndex: 1,
        title: '炎晶島の関門兵 II',
        enemyTeam: [
          { monsterId: 5, level: 3 },
          { monsterId: 2, level: 3 },
          { monsterId: 7, level: 3 }
        ]
      },
      {
        battleIndex: 2,
        title: '炎竜ガルドス（ボス）',
        isBoss: true,
        enemyTeam: [
          { monsterId: 5, level: 4 },
          { monsterId: 2, level: 4 },
          { monsterId: 3, level: 4 }
        ],
        midBattleScene: {
          trigger: { hpRatio: 0.5 },
          scenes: [
            { speaker: '火竜ガルドス', text: 'ぐっ…！このような力が…絆使いとはこれほどのものか！' },
            { speaker: '主人公', text: 'ガルドス！虚無に惑わされるな！本来の意志を取り戻してくれ！' },
            { speaker: '火竜ガルドス', text: '虚無…？我は…なぜここで戦っているのだ…？ならばこそ！全力で打ち倒してみせろ！' }
          ]
        }
      }
    ],
    completionScenes: [
      { speaker: '火竜ガルドス', text: '…見事だ。お前の絆の力で、我は目を覚ました。虚無に惑わされていたことに気づかなかった。' },
      { speaker: '主人公', text: 'ガルドス、一緒に戦ってほしい。まだ虚無に侵食された島がある。' },
      { speaker: '火竜ガルドス', text: '承知した。炎晶の誓いをもって、お前と共に戦おう。' }
    ],
    rewards: {
      unlockChapters: [3],
      unlockMonsters: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      xp: 100
    }
  },

  // ============================================================
  // 第2章: 水晶の悲歌
  // ============================================================
  {
    id: 2,
    title: '第二章：水晶の悲歌',
    titleEn: 'Chapter 2: Elegy of the Water Crystal',
    island: '水晶迷宮',
    element: 'water',
    background: 'water',
    unlockedByDefault: false,
    scenes: [
      { speaker: 'ナレーター', text: '深海の水晶洞窟が浮かぶ水晶迷宮。かつては癒しの水が湧き出す聖地だった。' },
      { speaker: 'ナレーター', text: 'だが今、その水は黒く染まり、守護者たちは姿を隠している。' },
      { speaker: '潮の導き手', text: '来るな！それ以上近づくと…あなたも黒い水に飲み込まれてしまう！' },
      { speaker: '主人公', text: '水が黒い…！これが虚無の侵食か。あなたは大丈夫ですか？' },
      { speaker: '潮の導き手', text: 'わからない…私たちの癒しの力がどんどん失われていく。あなたが本当に絆使いなら…戦って証明してみせて。' }
    ],
    battles: [
      {
        battleIndex: 0,
        title: '水晶迷宮の守衛 I',
        enemyTeam: [
          { monsterId: 14, level: 3 },
          { monsterId: 17, level: 3 },
          { monsterId: 11, level: 3 }
        ]
      },
      {
        battleIndex: 1,
        title: '水晶迷宮の守衛 II',
        enemyTeam: [
          { monsterId: 12, level: 4 },
          { monsterId: 15, level: 4 },
          { monsterId: 14, level: 4 }
        ]
      },
      {
        battleIndex: 2,
        title: '月の歌姫（中ボス）',
        isBoss: false,
        enemyTeam: [
          { monsterId: 18, level: 5 },
          { monsterId: 16, level: 5 },
          { monsterId: 15, level: 5 }
        ]
      },
      {
        battleIndex: 3,
        title: '海神レヴィアタン（ボス）',
        isBoss: true,
        enemyTeam: [
          { monsterId: 19, level: 5 },
          { monsterId: 13, level: 5 },
          { monsterId: 20, level: 5 }
        ],
        midBattleScene: {
          trigger: { hpRatio: 0.5 },
          scenes: [
            { speaker: '海神レヴィアタン', text: 'ぐおおっ！この力…！幻海の絆使いよ…お前はいかなる者だ！' },
            { speaker: '主人公', text: 'レヴィアタン！目を覚ましてくれ！幻海を守るべきお前が、虚無に操られているんだ！' },
            { speaker: '海神レヴィアタン', text: '虚無…？我は…いや、まだだ！黒い水の支配から…抜け出すために…もっと力を引き出してみせろ！' }
          ]
        }
      }
    ],
    completionScenes: [
      { speaker: '海神レヴィアタン', text: '…水晶の光が戻ってきた。絆使いよ、お前の力で我は目覚めた。礼を言う。' },
      { speaker: '潮の導き手', text: '水が澄んでいく…！癒しの力が戻ってきました！' },
      { speaker: '主人公', text: 'よかった！まだ他の島が残っている。一緒に行きましょう。' }
    ],
    rewards: {
      unlockChapters: [4],
      unlockMonsters: [12, 13, 14, 15, 16, 17, 18, 19, 20],
      xp: 120
    }
  },

  // ============================================================
  // 第3章: 地晶の砦
  // ============================================================
  {
    id: 3,
    title: '第三章：地晶の砦',
    titleEn: 'Chapter 3: Fortress of the Earth Crystal',
    island: '地晶島',
    element: 'earth',
    background: 'earth',
    unlockedByDefault: false,
    scenes: [
      { speaker: 'ナレーター', text: '古代の石造りの要塞が浮かぶ地晶島。硬固な意志の守護者が住まう場所。' },
      { speaker: 'ナレーター', text: 'しかし今、砦の門は閉ざされ、島民は外に出られなくなっている。' },
      { speaker: '砦の衛兵', text: '止まれ！この砦は山岳神バルゾード様の命令で封鎖されている。近づくことは許さん！' },
      { speaker: '主人公', text: 'バルゾード！島民を閉じ込めているのか！？虚無の影響でどうかしてしまったのか？' },
      { speaker: '山岳神バルゾード', text: 'フン…絆使いか。この砦に踏み込みたければ、我の番人たちを全員倒してみせろ。それができるなら、話を聞いてやろう。' }
    ],
    battles: [
      {
        battleIndex: 0,
        title: '地晶砦の守衛 I',
        enemyTeam: [
          { monsterId: 24, level: 4 },
          { monsterId: 27, level: 4 },
          { monsterId: 21, level: 4 }
        ]
      },
      {
        battleIndex: 1,
        title: '地晶砦の守衛 II',
        enemyTeam: [
          { monsterId: 22, level: 5 },
          { monsterId: 25, level: 5 },
          { monsterId: 24, level: 5 }
        ]
      },
      {
        battleIndex: 2,
        title: '古代の呪術師（中ボス）',
        isBoss: false,
        enemyTeam: [
          { monsterId: 29, level: 5 },
          { monsterId: 26, level: 5 },
          { monsterId: 28, level: 5 }
        ]
      },
      {
        battleIndex: 3,
        title: '山岳神バルゾード（ボス）',
        isBoss: true,
        enemyTeam: [
          { monsterId: 28, level: 6 },
          { monsterId: 23, level: 6 },
          { monsterId: 30, level: 6 }
        ],
        midBattleScene: {
          trigger: { hpRatio: 0.5 },
          scenes: [
            { speaker: '山岳神バルゾード', text: 'ぬ…！大地の守護者であるこの我が、これほど追い詰められるとは…！' },
            { speaker: '大地の賢者', text: 'バルゾード様！この絆使いの心を感じてください！虚無の惑わしではありません！' },
            { speaker: '山岳神バルゾード', text: '…賢者よ…。わかった。この一撃で全てを決める。絆使い、お前の全力を見せてみろ！' }
          ]
        }
      }
    ],
    completionScenes: [
      { speaker: '山岳神バルゾード', text: '…惚れた。絆使いよ、お前は本物だ。虚無の惑わしで島民を閉じ込めていたことは詫びよう。' },
      { speaker: '島民', text: '門が開いた！バルゾード様が正気に戻られた！' },
      { speaker: '主人公', text: 'バルゾード、あなたの力を貸してください。まだ風晶の島と、その先に闇が待っています。' }
    ],
    rewards: {
      unlockChapters: [4],
      unlockMonsters: [22, 23, 24, 25, 26, 27, 28, 29, 30],
      xp: 150
    }
  },

  // ============================================================
  // 第4章: 風晶の迷宮
  // ============================================================
  {
    id: 4,
    title: '第四章：風晶の迷宮',
    titleEn: 'Chapter 4: Labyrinth of the Wind Crystal',
    island: '風晶回廊',
    element: 'wind',
    background: 'wind',
    unlockedByDefault: false,
    scenes: [
      { speaker: 'ナレーター', text: '変形し続ける石のリング群—風晶回廊。嵐の中に浮かぶ迷宮の島。' },
      { speaker: 'ナレーター', text: '虚無の力が嵐を激化させ、島の地形が絶えず変化し続けている。' },
      { speaker: '風の精霊', text: 'だめだめ！ここは危険！嵐皇ジルファド様が正気を失って…迷宮が壊れていく！' },
      { speaker: '主人公', text: '嵐皇！？風晶の最強の守護者がやられたのか！？' },
      { speaker: '嵐皇ジルファド', text: 'ク…ク…！風は常に変化する。絆使いよ、この嵐の中でお前の本気を見せてみろ！' }
    ],
    battles: [
      {
        battleIndex: 0,
        title: '風晶回廊の嵐兵 I',
        enemyTeam: [
          { monsterId: 37, level: 5 },
          { monsterId: 34, level: 5 },
          { monsterId: 31, level: 5 }
        ]
      },
      {
        battleIndex: 1,
        title: '風晶回廊の嵐兵 II',
        enemyTeam: [
          { monsterId: 32, level: 6 },
          { monsterId: 35, level: 6 },
          { monsterId: 37, level: 6 }
        ]
      },
      {
        battleIndex: 2,
        title: '雷鳥の呪術師（中ボス）',
        isBoss: false,
        enemyTeam: [
          { monsterId: 39, level: 6 },
          { monsterId: 36, level: 6 },
          { monsterId: 38, level: 6 }
        ]
      },
      {
        battleIndex: 3,
        title: '嵐竜騎士（準ボス）',
        isBoss: false,
        enemyTeam: [
          { monsterId: 38, level: 7 },
          { monsterId: 33, level: 7 },
          { monsterId: 36, level: 7 }
        ]
      },
      {
        battleIndex: 4,
        title: '嵐皇ジルファド（ボス）',
        isBoss: true,
        enemyTeam: [
          { monsterId: 39, level: 7 },
          { monsterId: 33, level: 7 },
          { monsterId: 40, level: 7 }
        ],
        midBattleScene: {
          trigger: { hpRatio: 0.5 },
          scenes: [
            { speaker: '嵐皇ジルファド', text: 'ぐっ…！この速さを凌駕するとは…！お前は本物の絆使いか…！' },
            { speaker: '主人公', text: 'ジルファド！お前の本来の力は、風のように自由のはずだ！虚無に縛られるな！' },
            { speaker: '嵐皇ジルファド', text: '…自由…そうだ、嵐は自由。虚無などに縛られるものか！ならば…この風を超えてみせろ！' }
          ]
        }
      }
    ],
    completionScenes: [
      { speaker: '嵐皇ジルファド', text: '…やるな。お前の絆の力で、我の翼が本来の自由を取り戻した。礼を言う。' },
      { speaker: '風の精霊', text: '嵐が収まってきた！ジルファド様が正気に！' },
      { speaker: '主人公', text: 'あとは…虚無の核心がある最後の島だ。光と闇の決戦が待っている。' },
      { speaker: '嵐皇ジルファド', text: '行くか、絆使い。この嵐皇の翼で最後まで戦おう。' }
    ],
    rewards: {
      unlockChapters: [5],
      unlockMonsters: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
      xp: 200
    }
  },

  // ============================================================
  // 第5章: 光と闇の決戦
  // ============================================================
  {
    id: 5,
    title: '第五章：光と闇の決戦',
    titleEn: 'Chapter 5: Battle of Light and Dark',
    island: '幻海の核心',
    element: 'dark',
    background: 'dark',
    unlockedByDefault: false,
    scenes: [
      { speaker: 'ナレーター', text: '幻海の中心に浮かぶ、半壊した光の神殿—「幻海の核心」。' },
      { speaker: 'ナレーター', text: 'ここが虚無の発生源。そして光神ルシエルが堕落した場所だという。' },
      { speaker: '老いた絆使い', text: '（念話で）気をつけろ…！ルシエルはかつて幻海最強の守護神だった。虚無に飲まれたルシエルは計り知れない力を持つ。' },
      { speaker: '虚影の剣鬼', text: 'ここまで来たか、絆使い。だが…この先は俺が守る。ルシエル様の意志を。' },
      { speaker: '主人公', text: '虚影の剣鬼！お前まで虚無に…！いや、待て…なぜルシエルを守る？' },
      { speaker: '虚影の剣鬼', text: '虚無は悪ではない…ただ全てを等しく無にするだけだ。ルシエル様は幻海を無に帰すことで、全ての苦しみを消そうとしておられる。…だが、お前に説得できるか？俺を倒してみせろ！' }
    ],
    battles: [
      {
        battleIndex: 0,
        title: '虚無の尖兵 I',
        enemyTeam: [
          { monsterId: 54, level: 7 },
          { monsterId: 57, level: 7 },
          { monsterId: 51, level: 7 }
        ]
      },
      {
        battleIndex: 1,
        title: '虚無の尖兵 II',
        enemyTeam: [
          { monsterId: 52, level: 8 },
          { monsterId: 55, level: 8 },
          { monsterId: 54, level: 8 }
        ]
      },
      {
        battleIndex: 2,
        title: '混沌の魔道士（中ボス）',
        isBoss: false,
        enemyTeam: [
          { monsterId: 58, level: 8 },
          { monsterId: 56, level: 8 },
          { monsterId: 55, level: 8 }
        ]
      },
      {
        battleIndex: 3,
        title: '虚影の剣鬼・深淵の呼び師（準ボス）',
        isBoss: false,
        enemyTeam: [
          { monsterId: 58, level: 9 },
          { monsterId: 59, level: 9 },
          { monsterId: 53, level: 9 }
        ],
        midBattleScene: {
          trigger: { hpRatio: 0.5 },
          scenes: [
            { speaker: '虚影の剣鬼', text: 'ぐっ…！この絆の力…！俺の信念を覆すのか…！' },
            { speaker: '影縛りの巫女', text: '主よ、この絆使いの心は…純粋だ。引き返しましょう。' },
            { speaker: '虚影の剣鬼', text: '…そうか。お前の絆は本物だな、絆使い。ルシエル様を頼む。きっと…まだ救えるはずだ。' }
          ]
        }
      },
      {
        battleIndex: 4,
        title: '光神ルシエル（最終ボス第一形態）',
        isBoss: true,
        enemyTeam: [
          { monsterId: 46, level: 9 },
          { monsterId: 49, level: 9 },
          { monsterId: 50, level: 9 }
        ],
        midBattleScene: {
          trigger: { hpRatio: 0.5 },
          scenes: [
            { speaker: '光神ルシエル', text: 'なぜ…！なぜお前はここまで戦える！？絆などというものの力で…！' },
            { speaker: '主人公', text: 'ルシエル！お前が幻海を無にしようとするのは…苦しいからじゃないのか？' },
            { speaker: '光神ルシエル', text: 'っ…！お前に何がわかる！何千年も虚無の囁きを…聞き続けた苦しみが…！' },
            { speaker: '主人公', text: 'わかる。でも…幻海の全ての命がそれを感じながらも、生きることを選んでいる。絆があるから！' },
            { speaker: '光神ルシエル', text: '…絆……。もしそれが本物なら…お前に全力を見せてやる！この最後の試練を超えてみせろ！' }
          ]
        }
      },
      {
        battleIndex: 5,
        title: '魂喰いの魔王（最終ボス第二形態）',
        isBoss: true,
        preScenes: [
          { speaker: '光神ルシエル', text: 'ハアッ…！お前の絆…本物だった…。だが…虚無の核心が…私を通して…' },
          { speaker: '魂喰いの魔王', text: 'グルルル…！小賢しい絆使いめ。ルシエルは消えた。次は我が相手だ！幻海は虚無に帰す！' },
          { speaker: '主人公', text: '虚無の本体…！ここで終わらせる！みんな、最後の力を貸してくれ！' }
        ],
        enemyTeam: [
          { monsterId: 56, level: 10 },
          { monsterId: 59, level: 10 },
          { monsterId: 60, level: 10 }
        ]
      }
    ],
    completionScenes: [
      { speaker: '光神ルシエル', text: '…絆使い。お前が勝った。幻海は…助かった。すまなかった、長い間苦しませて。' },
      { speaker: '主人公', text: 'ルシエル！生きているのか！？' },
      { speaker: '光神ルシエル', text: '虚無の核が消えた。私の力もほとんど残っていないが…幻海の守護を続けることはできる。' },
      { speaker: '虚影の剣鬼', text: '…ルシエル様。よかった。本当に…よかった。' },
      { speaker: '老いた絆使い', text: '（念話で）よくやった、絆使いよ。幻海に光が戻ってきた…。お前の絆の力が、幻海を救ったのだ。' },
      { speaker: 'ナレーター', text: '虚無は消え、幻海に平和が戻った。クリスタルバウンドたちは各々の島に帰り、再び世界の守護を始めた。' },
      { speaker: 'ナレーター', text: 'しかし絆使いは知っていた—虚無は「消えた」のではなく「眠った」だけだということを。' },
      { speaker: 'ナレーター', text: 'それでも今この瞬間、幻海に絆の光が輝いていた。それで十分だった。—おわり—' }
    ],
    rewards: {
      unlockChapters: [],
      unlockMonsters: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
      xp: 500,
      isEnding: true
    }
  }
];

// フリーバトル用の敵チームプリセット
window.FREE_BATTLE_PRESETS = [
  { name: '炎の軍勢', teamMonsters: [{ monsterId: 1, level: 3 }, { monsterId: 5, level: 3 }, { monsterId: 8, level: 3 }] },
  { name: '水の護衛', teamMonsters: [{ monsterId: 11, level: 3 }, { monsterId: 15, level: 3 }, { monsterId: 18, level: 3 }] },
  { name: '大地の要塞', teamMonsters: [{ monsterId: 21, level: 3 }, { monsterId: 28, level: 3 }, { monsterId: 29, level: 3 }] },
  { name: '嵐の刃', teamMonsters: [{ monsterId: 31, level: 3 }, { monsterId: 35, level: 3 }, { monsterId: 38, level: 3 }] },
  { name: '聖光の使者', teamMonsters: [{ monsterId: 42, level: 4 }, { monsterId: 47, level: 4 }, { monsterId: 49, level: 4 }] },
  { name: '虚無の軍団', teamMonsters: [{ monsterId: 52, level: 4 }, { monsterId: 55, level: 4 }, { monsterId: 58, level: 4 }] },
  { name: '竜の王国', teamMonsters: [{ monsterId: 3, level: 5 }, { monsterId: 13, level: 5 }, { monsterId: 23, level: 5 }] },
  { name: '天使の軍勢', teamMonsters: [{ monsterId: 9, level: 5 }, { monsterId: 48, level: 5 }, { monsterId: 49, level: 5 }] },
];
