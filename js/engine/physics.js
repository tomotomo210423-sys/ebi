/**
 * Physics - constants, AABB helpers, TileMap, and collision resolution
 */
(function () {
  'use strict';

  const GRAVITY  = 900;  // pixels/s²
  const MAX_FALL = 600;  // pixels/s  (terminal velocity)

  /**
   * AABB overlap test.
   * @returns {boolean} true if the two axis-aligned rectangles overlap
   */
  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw &&
           ax + aw > bx &&
           ay < by + bh &&
           ay + ah > by;
  }

  // ------------------------------------------------------------------ //
  // TileMap
  // ------------------------------------------------------------------ //

  /**
   * Tile type constants:
   *   0 = air / empty    ('.', ' ')
   *   1 = solid          ('#')
   *   2 = oil            ('O')
   *   3 = dirty water    ('~')
   *   4 = spike/damage   ('^')
   *   5 = goal           ('G')
   */
  const CHAR_TO_TILE = {
    '.': 0,
    ' ': 0,
    '#': 1,
    'O': 2,
    '~': 3,
    '^': 4,
    'G': 5,
  };

  class TileMap {
    /**
     * @param {string[]} mapData  - array of strings, one per row
     * @param {number}   tileSize - size of a tile in canvas pixels (e.g. 48)
     */
    constructor(mapData, tileSize) {
      this._data     = mapData;
      this._tileSize = tileSize;
      this._rows     = mapData.length;
      this._cols     = mapData.reduce((mx, row) => Math.max(mx, row.length), 0);
    }

    /** Width of the entire map in canvas pixels */
    get worldWidth()  { return this._cols * this._tileSize; }

    /** Height of the entire map in canvas pixels */
    get worldHeight() { return this._rows * this._tileSize; }

    /** Number of tile rows */
    get rows() { return this._rows; }

    /** Number of tile columns */
    get cols() { return this._cols; }

    /**
     * Get tile type at tile coordinates (tx, ty).
     * Returns 0 (air) for out-of-bounds queries.
     * @param {number} tx
     * @param {number} ty
     * @returns {number} tile type 0-5
     */
    get(tx, ty) {
      if (ty < 0 || ty >= this._rows) return 0;
      const row = this._data[ty];
      if (!row || tx < 0 || tx >= row.length) return 0;
      const ch = row[tx];
      return (ch in CHAR_TO_TILE) ? CHAR_TO_TILE[ch] : 0;
    }

    /** Tile size in canvas pixels */
    get tileSize() { return this._tileSize; }
  }

  // ------------------------------------------------------------------ //
  // Collision resolution
  // ------------------------------------------------------------------ //

  /**
   * Resolve AABB collision between an entity and all solid/special tiles.
   *
   * Entity must have: x, y, w, h, vx, vy  (all in canvas pixels / pixels-per-second)
   * After call entity will also have set: onGround, onOil, inWater, hitSpike
   *
   * Resolution strategy (industry standard sweep-lite):
   *   1. Move horizontally by vx*dt, resolve X overlaps
   *   2. Move vertically by vy*dt, resolve Y overlaps
   *
   * NOTE: dt must already be applied to vx/vy *outside* this function.
   *       This function moves entity.x and entity.y by vx*dt and vy*dt
   *       internally - callers should NOT also move the entity themselves.
   *       Actually to keep it flexible, we treat entity.x/y as already
   *       the NEW intended position and only do depenetration here.
   *
   * Actually: caller pre-moves (entity.x += entity.vx * dt; entity.y += entity.vy * dt)
   * then calls resolveEntityTileCollision which depenetrates and sets flags.
   *
   * @param {object} entity
   * @param {TileMap} tileMap
   */
  function resolveEntityTileCollision(entity, tileMap) {
    entity.onGround  = false;
    entity.onOil     = false;
    entity.inWater   = false;
    entity.hitSpike  = false;

    const ts = tileMap.tileSize;
    const hw = entity.w;
    const hh = entity.h;

    // ---- Helper: tiles touched by the entity AABB ------------------- //
    function tileRange(pos, size) {
      const t0 = Math.floor(pos / ts);
      const t1 = Math.floor((pos + size - 1) / ts);
      return [t0, t1];
    }

    // ---- Horizontal depenetration ------------------------------------ //
    {
      const [txL, txR] = tileRange(entity.x, hw);
      const [tyT, tyB] = tileRange(entity.y, hh);

      for (let ty = tyT; ty <= tyB; ty++) {
        for (let tx = txL; tx <= txR; tx++) {
          const tile = tileMap.get(tx, ty);
          if (tile === 1) { // solid
            const tileLeft  = tx * ts;
            const tileRight = tileLeft + ts;
            const overlapL  = (entity.x + hw) - tileLeft;
            const overlapR  = tileRight - entity.x;

            if (overlapL > 0 && overlapR > 0) {
              if (overlapL < overlapR) {
                // push left
                entity.x = tileLeft - hw;
                if (entity.vx > 0) entity.vx = 0;
              } else {
                // push right
                entity.x = tileRight;
                if (entity.vx < 0) entity.vx = 0;
              }
            }
          }
        }
      }
    }

    // ---- Vertical depenetration ------------------------------------- //
    {
      const [txL, txR] = tileRange(entity.x, hw);
      const [tyT, tyB] = tileRange(entity.y, hh);

      for (let ty = tyT; ty <= tyB; ty++) {
        for (let tx = txL; tx <= txR; tx++) {
          const tile = tileMap.get(tx, ty);

          // Spikes: flag only, no depenetration
          if (tile === 4) {
            entity.hitSpike = true;
            continue;
          }

          // Goal: flag only
          if (tile === 5) {
            entity.reachedGoal = true;
            continue;
          }

          // Oil: flag + act as floor so entities don't fall through
          if (tile === 2) {
            entity.onOil = true;
            const tileTop2   = ty * ts;
            const overlapT2  = (entity.y + hh) - tileTop2;
            const overlapB2  = (tileTop2 + ts) - entity.y;
            if (overlapT2 > 0 && overlapB2 > 0 && overlapT2 < overlapB2) {
              entity.y = tileTop2 - hh;
              if (entity.vy > 0) entity.vy = 0;
              entity.onGround = true;
            }
            continue;
          }

          // Dirty water: slow + flag + act as floor so entities don't sink through
          if (tile === 3) {
            entity.inWater = true;
            const tileTop3   = ty * ts;
            const overlapT3  = (entity.y + hh) - tileTop3;
            const overlapB3  = (tileTop3 + ts) - entity.y;
            if (overlapT3 > 0 && overlapB3 > 0 && overlapT3 < overlapB3) {
              entity.y = tileTop3 - hh;
              if (entity.vy > 0) entity.vy = 0;
              entity.onGround = true;
            }
            continue;
          }

          if (tile === 1) { // solid
            const tileTop    = ty * ts;
            const tileBottom = tileTop + ts;
            const overlapT   = (entity.y + hh) - tileTop;
            const overlapB   = tileBottom - entity.y;

            if (overlapT > 0 && overlapB > 0) {
              if (overlapT < overlapB) {
                // push up (landing on top of tile)
                entity.y = tileTop - hh;
                if (entity.vy > 0) entity.vy = 0;
                entity.onGround = true;
              } else {
                // push down (hitting ceiling)
                entity.y = tileBottom;
                if (entity.vy < 0) entity.vy = 0;
              }
            }
          }
        }
      }
    }

    // If standing on oil, also flag onOil by checking one pixel below feet
    if (entity.onGround) {
      const [txL, txR] = [
        Math.floor(entity.x / ts),
        Math.floor((entity.x + hw - 1) / ts),
      ];
      const tyFeet = Math.floor((entity.y + hh) / ts);
      for (let tx = txL; tx <= txR; tx++) {
        if (tileMap.get(tx, tyFeet) === 2) entity.onOil = true;
      }
    }

    // Clamp to world bottom (fall into void)
    if (entity.y > tileMap.worldHeight) {
      entity.hitSpike = true; // treat as death
    }

    // Clamp x to world edges
    if (entity.x < 0) {
      entity.x = 0;
      entity.vx = 0;
    }
    if (entity.x + hw > tileMap.worldWidth) {
      entity.x = tileMap.worldWidth - hw;
      entity.vx = 0;
    }
  }

  // ------------------------------------------------------------------ //
  // Export
  // ------------------------------------------------------------------ //

  window.Physics = {
    GRAVITY,
    MAX_FALL,
    rectOverlap,
    TileMap,
    resolveEntityTileCollision,
  };
}());
