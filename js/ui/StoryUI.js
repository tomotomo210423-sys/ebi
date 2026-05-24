// 幻海伝説 - StoryUI (ストーリーモード画面)

const CHAPTER_BG_COLORS = {
  prologue: 'linear-gradient(135deg, #0a0e2a 0%, #1a1a4a 100%)',
  fire:     'linear-gradient(135deg, #1a0a00 0%, #3a1800 100%)',
  water:    'linear-gradient(135deg, #00101a 0%, #00203a 100%)',
  earth:    'linear-gradient(135deg, #0a0800 0%, #1a1400 100%)',
  wind:     'linear-gradient(135deg, #001a0a 0%, #002a10 100%)',
  light:    'linear-gradient(135deg, #1a1a00 0%, #2a2a00 100%)',
  dark:     'linear-gradient(135deg, #100010 0%, #200020 100%)',
};

const ELEMENT_GLOWS = {
  fire: '#ff4500', water: '#1e90ff', earth: '#8b6914',
  wind: '#32cd32', light: '#ffd700', dark: '#6a0dad',
};

class StoryUI {
  constructor(gameState) {
    this.gs = gameState;
  }

  mount() {
    this._renderChapterList();
  }

  _renderChapterList() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    list.innerHTML = '';

    STORY_CHAPTERS.forEach(chapter => {
      const unlocked   = this.gs.save.unlockedChapters.includes(chapter.id) || chapter.unlockedByDefault;
      const completed  = this.gs.save.completedChapters.includes(chapter.id);
      const card = document.createElement('div');
      card.className = `chapter-card ${unlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`;
      card.style.background = unlocked ? CHAPTER_BG_COLORS[chapter.background || 'prologue'] : '';

      const glow = chapter.element ? ELEMENT_GLOWS[chapter.element] : '#888';
      if (unlocked) card.style.boxShadow = `0 0 12px ${glow}44, inset 0 0 30px ${glow}11`;

      card.innerHTML = unlocked ? `
        <div class="chapter-num">第${chapter.id === 0 ? '序' : chapter.id}章</div>
        <div class="chapter-island">${chapter.island}</div>
        <div class="chapter-title">${chapter.title}</div>
        ${completed ? '<div class="chapter-clear">✅ クリア済み</div>' : ''}
        <div class="chapter-battles">${chapter.battles.length}バトル</div>
      ` : `
        <div class="chapter-lock">🔒</div>
        <div class="chapter-title locked-title">？？？</div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => this._startChapter(chapter));
      }
      list.appendChild(card);
    });
  }

  _startChapter(chapter) {
    this._currentChapter = chapter;
    this._battleIndex = 0;

    // 背景設定
    const screen = document.getElementById('screen-story');
    if (screen) screen.style.background = CHAPTER_BG_COLORS[chapter.background || 'prologue'];

    // チャプター紹介
    this._showIslandIntro(chapter, () => {
      this._runCutscene(chapter.scenes, () => {
        this._promptTeamSelect();
      });
    });
  }

  _showIslandIntro(chapter, onDone) {
    const intro = document.getElementById('chapter-intro');
    if (!intro) { onDone(); return; }

    const glow = chapter.element ? ELEMENT_GLOWS[chapter.element] : '#888';
    intro.innerHTML = `
      <div class="intro-overlay" style="background: radial-gradient(ellipse at center, ${glow}33 0%, transparent 70%)">
        <div class="intro-island">${chapter.island}</div>
        <div class="intro-title">${chapter.title}</div>
      </div>
    `;
    intro.style.display = 'flex';
    setTimeout(() => {
      intro.style.display = 'none';
      onDone();
    }, 2000);
  }

  _runCutscene(scenes, onComplete) {
    if (!scenes || scenes.length === 0) { onComplete(); return; }

    const box = document.getElementById('cutscene-box');
    if (!box) { onComplete(); return; }
    box.style.display = 'flex';

    let idx = 0;
    const show = () => {
      if (idx >= scenes.length) {
        box.style.display = 'none';
        onComplete();
        return;
      }
      const scene = scenes[idx];
      const speaker = document.getElementById('cutscene-speaker');
      const line    = document.getElementById('cutscene-line');
      if (speaker) speaker.textContent = scene.speaker;
      if (line)    this._typewriter(line, scene.text, () => {});
      idx++;
    };

    const next = document.getElementById('cutscene-next');
    this._cutsceneHandler = () => show();
    if (next) {
      next.removeEventListener('click', this._cutsceneHandler);
      next.addEventListener('click', this._cutsceneHandler);
    }
    show();
  }

  _typewriter(el, text, onDone) {
    el.textContent = '';
    let i = 0;
    const speed = 30; // ms/char
    const tick = () => {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, speed);
      } else {
        onDone();
      }
    };
    tick();
  }

  _promptTeamSelect() {
    // チーム選択画面へ遷移
    window.GameState.navigateTo('team-select', {
      afterSelect: (teamIds) => this._startBattles(teamIds),
      context: 'story',
      chapterId: this._currentChapter.id,
    });
  }

  _startBattles(teamIds) {
    this._teamIds = teamIds;
    this._runBattle(0);
  }

  _runBattle(battleIdx) {
    const chapter = this._currentChapter;
    if (battleIdx >= chapter.battles.length) {
      this._onChapterComplete();
      return;
    }
    const battleData = chapter.battles[battleIdx];

    // バトル前カットシーン
    if (battleData.preScenes) {
      this._runCutscene(battleData.preScenes, () => {
        this._launchBattle(chapter, battleData, battleIdx);
      });
    } else {
      this._launchBattle(chapter, battleData, battleIdx);
    }
  }

  _launchBattle(chapter, battleData, battleIdx) {
    const playerTeam = this._teamIds.map(id => {
      const level = this.gs.save.monsterLevels[id] || 1;
      return new Monster(id, level);
    });
    const enemyTeam = battleData.enemyTeam.map(e => new Monster(e.monsterId, e.level));

    const difficulty = this._getDifficulty(chapter.id, battleIdx);

    window.GameState.navigateTo('battle', {
      playerTeam,
      enemyTeam,
      difficulty,
      battleTitle: battleData.title,
      isBoss: battleData.isBoss,
      midBattleScene: battleData.midBattleScene || null,
      onComplete: (won) => {
        if (won) {
          this._onBattleWon(chapter, battleData, battleIdx);
        } else {
          this._onBattleLost(chapter, battleIdx);
        }
      },
    });
  }

  _getDifficulty(chapterId, battleIdx) {
    if (chapterId === 0) return 'easy';
    if (chapterId <= 2) return 'normal';
    return 'hard';
  }

  _onBattleWon(chapter, battleData, battleIdx) {
    // 幕間シーン
    const interlude = chapter.interludeAfterBattle;
    if (interlude && interlude.battleIndex === battleIdx) {
      window.GameState.navigateTo('story');
      this._runCutscene(interlude.scenes, () => {
        this._runBattle(battleIdx + 1);
      });
    } else {
      this._runBattle(battleIdx + 1);
    }
  }

  _onBattleLost(chapter, battleIdx) {
    // 敗北後、チーム再選択
    window.GameState.navigateTo('story');
    this._showRetryPrompt(chapter, battleIdx);
  }

  _showRetryPrompt(chapter, battleIdx) {
    const box = document.getElementById('cutscene-box');
    if (!box) return;
    box.style.display = 'flex';

    const speaker = document.getElementById('cutscene-speaker');
    const line    = document.getElementById('cutscene-line');
    if (speaker) speaker.textContent = 'システム';
    if (line)    line.textContent    = '敗北… もう一度挑戦しますか？';

    const next = document.getElementById('cutscene-next');
    if (next) {
      const handler = () => {
        next.removeEventListener('click', handler);
        box.style.display = 'none';
        this._runBattle(battleIdx);
      };
      next.removeEventListener('click', this._cutsceneHandler);
      next.addEventListener('click', handler);
    }
  }

  _onChapterComplete() {
    const chapter = this._currentChapter;

    // クリア済みに追加
    if (!this.gs.save.completedChapters.includes(chapter.id)) {
      this.gs.save.completedChapters.push(chapter.id);
    }

    // 新チャプター解放
    if (chapter.rewards?.unlockChapters) {
      chapter.rewards.unlockChapters.forEach(cid => {
        if (!this.gs.save.unlockedChapters.includes(cid)) {
          this.gs.save.unlockedChapters.push(cid);
        }
      });
    }

    // モンスター解放
    if (chapter.rewards?.unlockMonsters) {
      chapter.rewards.unlockMonsters.forEach(mid => {
        if (!this.gs.save.collectedMonsterIds.includes(mid)) {
          this.gs.save.collectedMonsterIds.push(mid);
        }
      });
    }

    // XP付与
    if (chapter.rewards?.xp) {
      this._grantXP(chapter.rewards.xp);
    }

    this.gs.saveGame();

    // 完了カットシーン
    window.GameState.navigateTo('story');
    this._runCutscene(chapter.completionScenes, () => {
      if (chapter.rewards?.isEnding) {
        this._showEnding();
      } else {
        this._renderChapterList();
      }
    });
  }

  _grantXP(totalXp) {
    const teamIds = this._teamIds || [];
    const xpPer = Math.floor(totalXp / Math.max(1, teamIds.length));
    teamIds.forEach(id => {
      this.gs.save.monsterXP[id] = (this.gs.save.monsterXP[id] || 0) + xpPer;
      // レベルアップ判定: level * 100 XP で次のLvへ
      let level = this.gs.save.monsterLevels[id] || 1;
      while (level < 10) {
        const needed = level * 100;
        if (this.gs.save.monsterXP[id] >= needed) {
          this.gs.save.monsterXP[id] -= needed;
          level++;
          this.gs.save.monsterLevels[id] = level;
        } else break;
      }
    });
  }

  _showEnding() {
    const screen = document.getElementById('screen-story');
    if (!screen) return;
    screen.style.background = 'linear-gradient(135deg, #000 0%, #100020 50%, #000 100%)';
    const endingEl = document.createElement('div');
    endingEl.className = 'ending-screen';
    endingEl.innerHTML = `
      <div class="ending-title">幻海伝説</div>
      <div class="ending-subtitle">〜 絆は、虚無をも超える 〜</div>
      <div class="ending-text">全ての章をクリアしました！<br>ありがとうございました。</div>
      <button class="ending-btn" id="btn-ending-back">タイトルへ戻る</button>
    `;
    screen.appendChild(endingEl);
    document.getElementById('btn-ending-back')?.addEventListener('click', () => {
      endingEl.remove();
      window.GameState.navigateTo('title');
    });
  }

  unmount() {
    const next = document.getElementById('cutscene-next');
    if (next && this._cutsceneHandler) next.removeEventListener('click', this._cutsceneHandler);
  }
}

window.StoryUI = StoryUI;
