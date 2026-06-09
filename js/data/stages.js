/**
 * stages.js  -  Stage definitions for クラゲライダー・カニィとプカプカの大冒険
 *
 * Tile chars:
 *   '.' = air
 *   '#' = solid ground
 *   'O' = oil (slippery)
 *   '~' = dirty water (damage)
 *   '^' = spike (damage)
 *   'G' = goal flag
 *
 * Each map: 60 chars wide × 12 rows tall
 * TILE_SIZE = 48 → world = 2880 × 576 px
 * Player starts at tile (2, 9).
 * Boss spawns near column 52-55 in stage 1.
 * Goal flag at column 58, row 9.
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 1 : 汚れた港  (Dirty Harbor)
  // ─────────────────────────────────────────────────────────────────────────
  //  Row index guide (0 = top sky, 11 = deep ground)
  //  Player starts tile (2, 9).  Boss near tile (52, 7).
  //  Goal flag at column 58, row 9.
  //
  //  Layout:
  //    rows 0-7  : open sky with floating platforms
  //    row  8    : low platform walkway with gaps
  //    rows 9-11 : solid ground with water pools
  //
  //  Column ruler (0-based):
  //  0         1         2         3         4         5
  //  0123456789012345678901234567890123456789012345678901234567890
  // ─────────────────────────────────────────────────────────────────────────
  const stage1 = {
    id: 1,
    name: 'ステージ1: 汚れた港',
    bgType: 'harbor',
    bgColor: ['#0a0a1f', '#1a2a4a'],
    map: [
      // row 0  — sky
      '............................................................',
      // row 1  — sky
      '............................................................',
      // row 2  — high platforms
      '............###.............###..........###.................',
      // row 3  — sky
      '............................................................',
      // row 4  — mid platforms with oil patches
      '....######......####OO#......########.......#####.....####..',
      // row 5  — sky
      '............................................................',
      // row 6  — lower mid platforms
      '..........####.........####......OO##......######...........',
      // row 7  — sky
      '............................................................',
      // row 8  — low platforms / walkway with gaps
      '..####...####....####.....####OO##....##....####.....#####..',
      // row 9  — main ground level  (player starts col 2, goal at col 58)
      '##~~##############O################~~########~~####O######G#',
      // row 10 — solid ground
      '############################################################',
      // row 11 — solid ground base
      '############################################################',
    ],
    playerStart: { tx: 2, ty: 9 },
    enemySpawns: [
      { type: 'Oily',   tx: 10, ty: 9 },
      { type: 'Gomira', tx: 18, ty: 9 },
      { type: 'Oily',   tx: 25, ty: 8 },
      { type: 'Gomira', tx: 30, ty: 9 },
      { type: 'Oily',   tx: 35, ty: 8 },
      { type: 'Gomira', tx: 40, ty: 9 },
      { type: 'Oily',   tx: 44, ty: 9 },
      { type: 'Gomira', tx: 48, ty: 8 },
    ],
    bossSpawn: { type: 'OctopusBoss', tx: 52, ty: 7 },
    music: 'harbor',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 2 : マングローブの迷宮  (Mangrove Maze)
  // ─────────────────────────────────────────────────────────────────────────
  //  Denser, more vertical.  Spike '^' on wall edges and overhangs.
  //  Muddy water pools in the lower channels.
  //  Root-maze feel: lots of overhead structure, narrow corridors.
  // ─────────────────────────────────────────────────────────────────────────
  const stage2 = {
    id: 2,
    name: 'ステージ2: マングローブの迷宮',
    bgType: 'mangrove',
    bgColor: ['#0a1a0a', '#1a3a1a'],
    map: [
      // row 0  — dense canopy pillars
      '...........#####.........#####..........#####..........#####',
      // row 1  — vertical root shafts
      '...........#...#.........#...#..........#...#..........#...#',
      // row 2  — upper root platforms
      '.###.......#...#####.....#...####.......#...#####......#....',
      // row 3  — spike overhangs
      '.#^#.......#............#...........#...#...........#.......',
      // row 4  — root midlevel platforms
      '.###..####.....######.....####......###.....######....####..',
      // row 5  — spike traps on ground below overhangs
      '...........^...........^...........^...........^............',
      // row 6  — mid level walkways with oil
      '..####.....####....####....####OO##.....####....####...####.',
      // row 7  — muddy water pools at mid height
      '......~~~~~.........~~~~.......~~........~~~........~~~......',
      // row 8  — low walkways with oil patches
      '.###.......###.......###OO###.......###.......###.......###.',
      // row 9  — main floor with water and goal
      '#~~~#############~~##############OO##########~~#######O###G#',
      // row 10 — solid ground
      '############################################################',
      // row 11 — solid ground base
      '############################################################',
    ],
    playerStart: { tx: 2, ty: 9 },
    enemySpawns: [
      { type: 'Gomira', tx:  8, ty: 9 },
      { type: 'Oily',   tx: 13, ty: 8 },
      { type: 'Gomira', tx: 19, ty: 6 },
      { type: 'Oily',   tx: 24, ty: 9 },
      { type: 'Gomira', tx: 29, ty: 6 },
      { type: 'Oily',   tx: 34, ty: 8 },
      { type: 'Gomira', tx: 39, ty: 9 },
      { type: 'Oily',   tx: 44, ty: 6 },
      { type: 'Gomira', tx: 49, ty: 8 },
    ],
    bossSpawn: { type: 'OctopusBoss', tx: 52, ty: 8 },
    music: 'mangrove',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 3 : 工場廃墟  (Ruined Factory)
  // ─────────────────────────────────────────────────────────────────────────
  //  Industrial ruins: conveyor-style platforms, spike pits, oil slicks.
  //  Spike hazards more frequent, tighter corridors.
  // ─────────────────────────────────────────────────────────────────────────
  const stage3 = {
    id: 3,
    name: 'ステージ3: 工場廃墟',
    bgType: 'factory',
    bgColor: ['#1a0a0a', '#3a1a0a'],
    map: [
      // row 0  — sky
      '............................................................',
      // row 1  — high catwalks
      '....#########.................#########..................###.',
      // row 2  — sky
      '............................................................',
      // row 3  — mid gantry platforms
      '.......######.........#########..........########...........',
      // row 4  — spike pits below gantries
      '............^......................^...................^......',
      // row 5  — conveyor-style platforms with oil
      '..####.....####....####OO####.....####....####OO####...####.',
      // row 6  — spike traps on floor
      '...^.............^..............^..............^.............',
      // row 7  — low rusted walkways
      '.####......####.....####.......####OO##.....####.......####.',
      // row 8  — water pools / rust pits
      '......~~~~.......~~~~.......~~~~.......~~~~.......~~~~.......',
      // row 9  — main factory floor with spikes and goal
      '###O#############^^###########~~##########O#########O#####G#',
      // row 10 — solid ground
      '############################################################',
      // row 11 — solid ground base
      '############################################################',
    ],
    playerStart: { tx: 2, ty: 9 },
    enemySpawns: [
      { type: 'Oily',   tx:  8, ty: 9 },
      { type: 'Gomira', tx: 15, ty: 7 },
      { type: 'Oily',   tx: 21, ty: 5 },
      { type: 'Gomira', tx: 27, ty: 9 },
      { type: 'Oily',   tx: 33, ty: 7 },
      { type: 'Gomira', tx: 38, ty: 5 },
      { type: 'Oily',   tx: 43, ty: 9 },
      { type: 'Gomira', tx: 48, ty: 7 },
    ],
    bossSpawn: { type: 'OctopusBoss', tx: 53, ty: 7 },
    music: 'factory',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STAGE 4 : 深海神殿  (Deep-Sea Temple)
  // ─────────────────────────────────────────────────────────────────────────
  //  Ancient temple layout: ceremonial arches, dense spike traps,
  //  tidal water channels, treacherous oil offerings on altars.
  // ─────────────────────────────────────────────────────────────────────────
  const stage4 = {
    id: 4,
    name: 'ステージ4: 深海神殿',
    bgType: 'temple',
    bgColor: ['#000020', '#000840'],
    map: [
      // row 0  — temple arch
      '.#########...................................................',
      // row 1  — high temple pillars
      '.#.......#..............###.......###.......###.......###...',
      // row 2  — temple ceiling / high platforms
      '.#.......####.............................................###.',
      // row 3  — altar platforms with oil
      '.#...........#..###.......###OO###.......###.......###......',
      // row 4  — temple floor with spike traps
      '.############...^..............^...............^.............',
      // row 5  — stepped temple platforms
      '...........#####....######.....######.....######.....######.',
      // row 6  — spike pits
      '...............^..............................^..............',
      // row 7  — lower temple walkways with oil
      '.####......####OO##....####.....####OO##.....####......####.',
      // row 8  — tidal water channels
      '......~~~~.......~~~~.......~~~~.......~~~~.......~~~~.......',
      // row 9  — temple base floor with spikes, water, goal
      '##~~########^^^#########~~############O########~~#######O#G#',
      // row 10 — solid ground
      '############################################################',
      // row 11 — solid ground base
      '############################################################',
    ],
    playerStart: { tx: 2, ty: 9 },
    enemySpawns: [
      { type: 'Gomira', tx:  7, ty: 9 },
      { type: 'Oily',   tx: 12, ty: 7 },
      { type: 'Gomira', tx: 17, ty: 5 },
      { type: 'Oily',   tx: 22, ty: 9 },
      { type: 'Gomira', tx: 28, ty: 7 },
      { type: 'Oily',   tx: 33, ty: 5 },
      { type: 'Gomira', tx: 38, ty: 9 },
      { type: 'Oily',   tx: 44, ty: 7 },
      { type: 'Gomira', tx: 49, ty: 5 },
    ],
    bossSpawn: { type: 'OctopusBoss', tx: 53, ty: 7 },
    music: 'temple',
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────────────────────────────────
  window.STAGES = [stage1, stage2, stage3, stage4];

}());
