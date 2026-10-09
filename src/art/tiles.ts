// Gera a camada de chão pré-renderizada de um mapa (por estação) e desenha a água animada.
import { TILE, hash2, makeCanvas, shade, mix } from '../core/util';
import { T, MapDef } from '../world/types';
import { SEASON_PAL, BIOMES } from './palette';
import { px, rect, noiseRect, Ctx } from './painter';

const isWater = (t: number) => t === T.WATER || t === T.DEEP;
const isGrassy = (t: number) => t === T.GRASS || t === T.DARKGRASS;

export function paintGround(map: MapDef, season: number): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(map.w * TILE, map.h * TILE);
  const P = SEASON_PAL[season];
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= map.w || y >= map.h ? T.VOID : map.tiles[y * map.w + x]);
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    paintTile(ctx, map, at, x, y, season);
  }
  // Segunda passada: franjas de grama sobre caminhos e sombras de penhascos
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const t = at(x, y);
    const X = x * TILE, Y = y * TILE;
    if (!isGrassy(t) && t !== T.CLIFF && !isWater(t) && t !== T.VOID && t !== T.WALL && t !== T.CAVEWALL && t !== T.BRIDGE && map.outdoor) {
      // franja de grama invadindo
      const g = P.grass, gd = P.grassDark;
      if (isGrassy(at(x, y - 1))) for (let i = 0; i < 16; i++) { const d = 1 + Math.floor(hash2(x * 16 + i, y, 3) * 3); rect(ctx, X + i, Y, 1, d, g); px(ctx, X + i, Y + d, gd); }
      if (isGrassy(at(x, y + 1))) for (let i = 0; i < 16; i++) { const d = 1 + Math.floor(hash2(x * 16 + i, y, 5) * 2); rect(ctx, X + i, Y + 16 - d, 1, d, g); }
      if (isGrassy(at(x - 1, y))) for (let i = 0; i < 16; i++) { const d = 1 + Math.floor(hash2(x, y * 16 + i, 7) * 3); rect(ctx, X, Y + i, d, 1, g); px(ctx, X + d, Y + i, gd); }
      if (isGrassy(at(x + 1, y))) for (let i = 0; i < 16; i++) { const d = 1 + Math.floor(hash2(x, y * 16 + i, 9) * 3); rect(ctx, X + 16 - d, Y + i, d, 1, g); px(ctx, X + 15 - d, Y + i, gd); }
    }
    // sombra abaixo de penhascos
    if (t !== T.CLIFF && at(x, y - 1) === T.CLIFF && !isWater(t)) {
      ctx.fillStyle = 'rgba(20,10,30,0.28)'; ctx.fillRect(X, Y, 16, 4);
      ctx.fillStyle = 'rgba(20,10,30,0.14)'; ctx.fillRect(X, Y + 4, 16, 2);
    }
    // sombra de parede interna
    if ((t === T.WOOD || t === T.TILEFLOOR || t === T.STONEFLOOR) && at(x, y - 1) === T.WALL) {
      ctx.fillStyle = 'rgba(30,15,10,0.25)'; ctx.fillRect(X, Y, 16, 3);
    }
    if (t === T.CAVE && at(x, y - 1) === T.CAVEWALL) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(X, Y, 16, 4); }
  }
  return c;
}

function paintTile(ctx: Ctx, map: MapDef, at: (x: number, y: number) => number, x: number, y: number, season: number) {
  const P = SEASON_PAL[season];
  const t = at(x, y);
  const X = x * TILE, Y = y * TILE;
  const h = (s: number) => hash2(x, y, s);
  switch (t) {
    case T.VOID: rect(ctx, X, Y, 16, 16, '#1a1210'); break;
    case T.GRASS: case T.DARKGRASS: {
      const base = t === T.DARKGRASS ? P.grassDark : P.grass;
      noiseRect(ctx, X, Y, 16, 16, base, 11 + season, 0.06, 0.3);
      // tufos
      const n = Math.floor(h(1) * 4);
      for (let i = 0; i < n; i++) {
        const tx = X + 2 + Math.floor(h(10 + i) * 12), ty = Y + 3 + Math.floor(h(20 + i) * 11);
        if (season === 3) { px(ctx, tx, ty, P.tuft); px(ctx, tx + 1, ty, P.grassLight); }
        else { px(ctx, tx, ty, P.tuft); px(ctx, tx + 2, ty, P.tuft); px(ctx, tx + 1, ty - 1, P.tuft); px(ctx, tx + 1, ty, P.grassLight); }
      }
      if (h(4) < (season === 0 ? 0.14 : season === 1 ? 0.07 : season === 2 ? 0.1 : 0.03)) {
        const fx = X + 3 + Math.floor(h(5) * 10), fy = Y + 3 + Math.floor(h(6) * 10);
        const col = P.flowers[Math.floor(h(7) * P.flowers.length)];
        if (season === 2) { px(ctx, fx, fy, col); px(ctx, fx + 1, fy, shade(col, -0.3)); }
        else { px(ctx, fx, fy - 1, col); px(ctx, fx - 1, fy, col); px(ctx, fx + 1, fy, col); px(ctx, fx, fy + 1, col); px(ctx, fx, fy, '#fff6a0'); }
      }
      break;
    }
    case T.DIRT: case T.FARMDIRT: {
      const base = t === T.FARMDIRT ? shade(P.dirt, -0.05) : P.dirt;
      noiseRect(ctx, X, Y, 16, 16, season === 3 ? mix(base, '#dfe6ee', 0.35) : base, 31, 0.07, 0.4);
      if (h(2) < 0.5) { const sx = X + Math.floor(h(3) * 13), sy = Y + Math.floor(h(4) * 13); px(ctx, sx, sy, shade(base, 0.25)); px(ctx, sx + 1, sy, shade(base, -0.2)); }
      break;
    }
    case T.SAND: {
      noiseRect(ctx, X, Y, 16, 16, '#e8d49a', 41, 0.06, 0.35);
      if (h(2) < 0.2) { px(ctx, X + Math.floor(h(3) * 15), Y + Math.floor(h(4) * 15), '#fff3d0'); }
      if (h(5) < 0.05) { const sx = X + 6, sy = Y + 7; px(ctx, sx, sy, '#f5b0a0'); px(ctx, sx + 1, sy, '#f5b0a0'); px(ctx, sx, sy + 1, '#d98a7a'); }
      break;
    }
    case T.COBBLE: {
      const base = season === 3 ? '#b4b8c2' : '#a49a8e';
      rect(ctx, X, Y, 16, 16, shade(base, -0.25));
      for (let r = 0; r < 4; r++) {
        const off = (r + y) % 2 ? 4 : 0;
        for (let k = -1; k < 3; k++) {
          const sx = X + k * 8 + off, sy = Y + r * 4;
          const cx = Math.max(sx, X), cw = Math.min(sx + 7, X + 16) - cx;
          if (cw <= 0) continue;
          const v = hash2(x * 4 + k, y * 4 + r, 51);
          rect(ctx, cx, sy, cw, 3, shade(base, (v - 0.5) * 0.15));
          rect(ctx, cx, sy, cw, 1, shade(base, 0.12));
        }
      }
      break;
    }
    case T.WOOD: case T.PLANKS: {
      const base = t === T.WOOD ? (map.floor || '#b07a4a') : '#8a6440';
      for (let r = 0; r < 4; r++) {
        const v = hash2(x, y * 4 + r, 61);
        rect(ctx, X, Y + r * 4, 16, 4, shade(base, (v - 0.5) * 0.12));
        rect(ctx, X, Y + r * 4 + 3, 16, 1, shade(base, -0.3));
        const seam = Math.floor(hash2(x, y * 4 + r, 62) * 16);
        px(ctx, X + seam, Y + r * 4, shade(base, -0.3)); px(ctx, X + seam, Y + r * 4 + 1, shade(base, -0.3)); px(ctx, X + seam, Y + r * 4 + 2, shade(base, -0.3));
      }
      break;
    }
    case T.BRIDGE: {
      const base = '#9a6a3c';
      const vertical = isWater(at(x - 1, y)) || isWater(at(x + 1, y));
      for (let r = 0; r < 4; r++) {
        if (vertical) { rect(ctx, X, Y + r * 4, 16, 4, shade(base, (hash2(x, y * 4 + r, 71) - 0.5) * 0.15)); rect(ctx, X, Y + r * 4 + 3, 16, 1, shade(base, -0.35)); }
        else { rect(ctx, X + r * 4, Y, 4, 16, shade(base, (hash2(x * 4 + r, y, 71) - 0.5) * 0.15)); rect(ctx, X + r * 4 + 3, Y, 1, 16, shade(base, -0.35)); }
      }
      if (vertical) {
        if (isWater(at(x - 1, y))) { rect(ctx, X, Y, 2, 16, '#6a4424'); px(ctx, X, Y + 2, '#4a2e18'); }
        if (isWater(at(x + 1, y))) { rect(ctx, X + 14, Y, 2, 16, '#6a4424'); }
      } else {
        if (isWater(at(x, y - 1))) { rect(ctx, X, Y, 16, 2, '#6a4424'); }
        if (isWater(at(x, y + 1))) { rect(ctx, X, Y + 13, 16, 3, '#5a3a1e'); }
      }
      break;
    }
    case T.STONEFLOOR: {
      const base = '#9a948a';
      rect(ctx, X, Y, 16, 16, shade(base, -0.2));
      rect(ctx, X + 1, Y + 1, 7, 7, shade(base, (h(1) - 0.5) * 0.1)); rect(ctx, X + 9, Y + 1, 6, 7, shade(base, (h(2) - 0.5) * 0.1));
      rect(ctx, X + 1, Y + 9, 6, 6, shade(base, (h(3) - 0.5) * 0.1)); rect(ctx, X + 8, Y + 9, 7, 6, shade(base, (h(4) - 0.5) * 0.1));
      break;
    }
    case T.TILEFLOOR: {
      const a = map.floor || '#e8dcc0', b = shade(a, -0.12);
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) rect(ctx, X + i * 8, Y + j * 8, 8, 8, (i + j + x + y) % 2 ? a : b);
      break;
    }
    case T.WALL: {
      const base = map.wall || '#c99a6a';
      const below = at(x, y + 1);
      const above = at(x, y - 1);
      rect(ctx, X, Y, 16, 16, base);
      for (let i = 0; i < 16; i += 4) rect(ctx, X + i, Y, 1, 16, shade(base, -0.08));
      if (h(1) < 0.15) { rect(ctx, X + 5, Y + 4, 6, 5, shade(base, -0.15)); rect(ctx, X + 6, Y + 5, 4, 3, '#e8d8a8'); }
      if (below !== T.WALL && below !== T.VOID) { rect(ctx, X, Y + 12, 16, 4, '#6a4428'); rect(ctx, X, Y + 12, 16, 1, '#8a5c38'); }
      if (above === T.VOID || above === undefined) { rect(ctx, X, Y, 16, 3, shade(base, -0.45)); }
      break;
    }
    case T.CAVE: {
      const B = BIOMES[map.biome || 0];
      noiseRect(ctx, X, Y, 16, 16, B.floor, 81, 0.08, 0.45);
      if (h(3) < 0.12) { const sx = X + Math.floor(h(4) * 13), sy = Y + Math.floor(h(5) * 13); px(ctx, sx, sy, B.accent); }
      if (map.biome === 1 && h(6) < 0.07) { rect(ctx, X + 4, Y + 6, 7, 3, '#3a5a72'); rect(ctx, X + 5, Y + 6, 3, 1, '#7fa8c8'); }
      if (map.biome === 3 && h(6) < 0.06) { rect(ctx, X + 5, Y + 7, 5, 2, '#ff6a2a'); px(ctx, X + 6, Y + 7, '#ffd04a'); }
      break;
    }
    case T.CAVEWALL: {
      const B = BIOMES[map.biome || 0];
      const below = at(x, y + 1);
      noiseRect(ctx, X, Y, 16, 16, B.wall, 91, 0.1, 0.5);
      if (below === T.CAVE) {
        rect(ctx, X, Y + 8, 16, 8, shade(B.wallTop, -0.1));
        for (let i = 0; i < 16; i += 3) rect(ctx, X + i, Y + 9, 1, 7, shade(B.wallTop, -0.3));
        rect(ctx, X, Y + 8, 16, 1, shade(B.wallTop, 0.2));
        if (map.biome === 2 && h(2) < 0.3) { rect(ctx, X + 6, Y + 10, 2, 4, '#9fd8ff'); px(ctx, X + 6, Y + 10, '#e8f8ff'); }
      }
      break;
    }
    case T.CLIFF: {
      const above = at(x, y - 1), below = at(x, y + 1);
      const rock = season === 3 ? '#8a8a96' : '#8a7462';
      noiseRect(ctx, X, Y, 16, 16, rock, 101, 0.1, 0.5);
      for (let i = 0; i < 16; i += 5) { const o = Math.floor(h(i) * 3); rect(ctx, X + i + o, Y, 1, 16, shade(rock, -0.25)); }
      if (above !== T.CLIFF) {
        rect(ctx, X, Y, 16, 4, P.grass);
        for (let i = 0; i < 16; i++) { const d = Math.floor(hash2(x * 16 + i, y, 105) * 3); rect(ctx, X + i, Y + 4, 1, d, P.grass); px(ctx, X + i, Y + 4 + d, P.grassDark); }
      }
      if (below !== T.CLIFF) rect(ctx, X, Y + 14, 16, 2, shade(rock, -0.35));
      break;
    }
    case T.WATER: case T.DEEP: {
      paintWaterBase(ctx, at, x, y, season, t === T.DEEP);
      break;
    }
    default: rect(ctx, X, Y, 16, 16, '#ff00ff');
  }
}

function paintWaterBase(ctx: Ctx, at: (x: number, y: number) => number, x: number, y: number, season: number, deep: boolean) {
  const P = SEASON_PAL[season];
  const X = x * TILE, Y = y * TILE;
  const base = deep ? P.waterDeep : P.water;
  rect(ctx, X, Y, 16, 16, base);
  const up = at(x, y - 1), dn = at(x, y + 1), lf = at(x - 1, y), rt = at(x + 1, y);
  const land = (t: number) => !isWater(t) && t !== T.BRIDGE && t !== T.VOID;
  // gradiente de profundidade
  if (!deep) for (let j = 0; j < 16; j += 4) rect(ctx, X, Y + j, 16, 1, shade(base, 0.03));
  if (land(up)) {
    rect(ctx, X, Y, 16, 4, '#6a4a30'); rect(ctx, X, Y + 4, 16, 2, shade(base, -0.3));
    for (let i = 0; i < 16; i++) if (hash2(x * 16 + i, y, 7) < 0.4) px(ctx, X + i, Y + 4, '#5a3c26');
  }
  if (land(dn)) { rect(ctx, X, Y + 14, 16, 2, shade(base, 0.3)); }
  if (land(lf)) { rect(ctx, X, Y, 2, 16, '#7a5a3a'); px(ctx, X + 2, Y + 5, shade(base, 0.3)); }
  if (land(rt)) { rect(ctx, X + 14, Y, 2, 16, '#7a5a3a'); }
  if (season === 3) {
    // gelo parcial próximo às margens
    const nearShore = land(up) || land(dn) || land(lf) || land(rt);
    if (nearShore || hash2(x, y, 9) < 0.18) {
      ctx.fillStyle = 'rgba(225,240,255,0.78)';
      const ix = X + (land(lf) ? 2 : Math.floor(hash2(x, y, 10) * 5));
      const iy = Y + (land(up) ? 6 : Math.floor(hash2(x, y, 11) * 5));
      ctx.fillRect(ix, iy, 16 - (ix - X) - (land(rt) ? 2 : Math.floor(hash2(x, y, 12) * 4)), 16 - (iy - Y) - Math.floor(hash2(x, y, 13) * 5));
      px(ctx, ix + 2, iy + 1, '#ffffff'); px(ctx, ix + 3, iy + 1, '#ffffff');
    }
  }
}

/** Brilhos animados sobre a água (desenhados por frame só nos tiles visíveis). */
export function drawWaterSparkles(ctx: Ctx, map: MapDef, x0: number, y0: number, x1: number, y1: number, t: number, season: number, camX: number, camY: number) {
  const hi = season === 3 ? 'rgba(235,245,255,0.55)' : 'rgba(220,240,255,0.6)';
  ctx.fillStyle = hi;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const tt = map.tiles[y * map.w + x];
    if (tt !== T.WATER && tt !== T.DEEP) continue;
    if (season === 3 && hash2(x, y, 9) < 0.18) continue;
    for (let k = 0; k < 2; k++) {
      const ph = hash2(x, y, 40 + k);
      const cyc = (t * 0.0007 + ph * 6) % 6;
      if (cyc > 1.4) continue;
      const len = cyc < 0.7 ? Math.ceil(cyc * 5) : Math.ceil((1.4 - cyc) * 5);
      const sx = x * 16 + 2 + Math.floor(hash2(x, y, 50 + k) * 10) - camX;
      const sy = y * 16 + 5 + Math.floor(hash2(x, y, 60 + k) * 8) - camY;
      ctx.fillRect(sx, sy, len, 1);
    }
  }
}
