// Gerador procedural dos andares das minas.
import { T, MapDef } from './types';
import { rng, key } from '../core/util';
import { getState, mapState } from '../state/state';
import { MONSTERS } from '../data/game';

export function biomeOf(level: number) { return level <= 20 ? 0 : level <= 40 ? 1 : level <= 60 ? 2 : 3; }

export function generateMine(level: number): MapDef & { mineSpawns: { x: number; y: number; id: string }[]; start: { x: number; y: number } } {
  const s = getState();
  const R = rng(level * 7919 + s.time.day * 31 + s.time.season * 977 + s.time.year * 13 + s.seed);
  const W = 44, H = 32;
  const biome = biomeOf(level);
  let g = new Uint8Array(W * H);
  const at = (x: number, y: number) => (x < 1 || y < 1 || x >= W - 1 || y >= H - 1 ? 1 : g[y * W + x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) g[y * W + x] = (x < 1 || y < 2 || x >= W - 1 || y >= H - 1 || R() < 0.44) ? 1 : 0;
  for (let it = 0; it < 5; it++) {
    const n = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (i || j) c += at(x + i, y + j);
      n[y * W + x] = c >= 5 || (it < 2 && c <= 1) ? 1 : 0;
      if (x < 1 || y < 2 || x >= W - 1 || y >= H - 1) n[y * W + x] = 1;
    }
    g = n;
  }
  // maior região conectada
  const reg = new Int32Array(W * H).fill(-1);
  let best = -1, bestSize = 0, rid = 0;
  for (let i = 0; i < W * H; i++) {
    if (g[i] || reg[i] >= 0) continue;
    const q = [i]; reg[i] = rid; let size = 0;
    while (q.length) { const c = q.pop()!; size++; const x = c % W, y = (c / W) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; const ni = ny * W + nx; if (nx >= 0 && ny >= 0 && nx < W && ny < H && !g[ni] && reg[ni] < 0) { reg[ni] = rid; q.push(ni); } } }
    if (size > bestSize) { bestSize = size; best = rid; }
    rid++;
  }
  for (let i = 0; i < W * H; i++) if (!g[i] && reg[i] !== best) g[i] = 1;
  const tiles = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) tiles[i] = g[i] ? T.CAVEWALL : T.CAVE;
  const floors: [number, number][] = [];
  for (let y = 2; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (!g[y * W + x]) floors.push([x, y]);
  // ponto inicial: chão com parede acima (para a escada)
  const candidates = floors.filter(([x, y]) => g[(y - 1) * W + x] && !g[(y + 1) * W + x] && !g[y * W + x + 1] && !g[y * W + x - 1]);
  const start = candidates.length ? candidates[Math.floor(R() * candidates.length)] : floors[0];
  const [sx, sy] = start;
  // lago em andares de pesca
  if (level % 20 === 0 && level < 80) {
    const far = floors.filter(([x, y]) => Math.abs(x - sx) + Math.abs(y - sy) > 12);
    const [lx, ly] = far[Math.floor(R() * far.length)] || floors[floors.length - 1];
    for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (x * x / 9 + y * y / 4 < 1 && tiles[(ly + y) * W + lx + x] === T.CAVE) tiles[(ly + y) * W + lx + x] = T.WATER;
  }
  const decos: MapDef['decos'] = [];
  const interacts: MapDef['interacts'] = [];
  decos.push({ x: sx, y: sy, sprite: 'ladder', interact: 'mine_up' }); interacts.push({ x: sx, y: sy, id: 'mine_up' });
  if (level % 5 === 0) { decos.push({ x: sx + 1, y: sy, sprite: 'lantern', light: { r: 50, color: '#ffc070', always: true }, offY: -8 }); }
  // tochas nas paredes
  for (let i = 0; i < 6; i++) {
    const [x, y] = floors[Math.floor(R() * floors.length)];
    if (g[(y - 1) * W + x]) decos.push({ x, y: y - 1, sprite: 'lantern', light: { r: 44, color: biome === 2 ? '#a0d8ff' : biome === 3 ? '#ff9050' : '#ffc070', always: true }, offY: 6 });
  }
  if (biome === 2) for (let i = 0; i < 8; i++) { const [x, y] = floors[Math.floor(R() * floors.length)]; if (Math.abs(x - sx) + Math.abs(y - sy) > 3) decos.push({ x, y, sprite: 'crystal', solid: true, light: { r: 22, color: '#9fd8ff', always: true } }); }
  if (biome === 3) for (let i = 0; i < 6; i++) { const [x, y] = floors[Math.floor(R() * floors.length)]; if (Math.abs(x - sx) + Math.abs(y - sy) > 3) { tiles[y * W + x] = T.CAVEWALL; decos.push({ x, y, sprite: 'lava', light: { r: 30, color: '#ff6a2a', always: true }, flat: true }); } }
  if (biome === 1) for (let i = 0; i < 6; i++) { const [x, y] = floors[Math.floor(R() * floors.length)]; if (Math.abs(x - sx) + Math.abs(y - sy) > 3) decos.push({ x, y, sprite: 'mushroomglow', light: { r: 24, color: '#60e8d8', always: true } }); }
  // rochas
  const ms = mapState('mina_' + level);
  ms.objects = {}; ms.soil = {};
  const isFloor = (x: number, y: number) => tiles[y * W + x] === T.CAVE && !decos.some(d => d.x === x && d.y === y && d.solid);
  const density = level % 5 === 0 ? 0.08 : 0.2 + Math.min(0.12, level / 400);
  for (const [x, y] of floors) {
    if (!isFloor(x, y) || Math.abs(x - sx) + Math.abs(y - sy) < 3) continue;
    if (R() > density) continue;
    const r = R();
    let kind = 'pedra';
    if (biome === 0) kind = r < 0.12 ? 'cobre' : r < 0.17 ? 'carvao' : r < 0.2 ? 'gema' : r < 0.23 ? 'cristalq' : r < 0.25 ? 'ferro' : 'pedra';
    else if (biome === 1) kind = r < 0.08 ? 'cobre' : r < 0.17 ? 'ferro' : r < 0.22 ? 'carvao' : r < 0.26 ? 'gema' : r < 0.29 ? 'cristalq' : 'pedra';
    else if (biome === 2) kind = r < 0.12 ? 'ferro' : r < 0.18 ? 'ouro' : r < 0.23 ? 'carvao' : r < 0.29 ? 'gema' : r < 0.34 ? 'cristalq' : 'pedra';
    else kind = r < 0.1 ? 'ouro' : r < 0.15 ? 'astral' : r < 0.2 ? 'carvao' : r < 0.26 ? 'gema' : r < 0.28 ? 'ferro' : 'pedra';
    const hp = { pedra: 1, cobre: 2, ferro: 3, ouro: 5, astral: 8, carvao: 2, gema: 3, cristalq: 2 }[kind] + Math.floor(level / 30);
    ms.objects[key(x, y)] = { t: 'rock', kind, hp, v: Math.floor(R() * 3) };
  }
  // baú de tesouro a cada 10 andares
  if (level % 10 === 0) {
    const far = floors.filter(([x, y]) => isFloor(x, y) && !ms.objects[key(x, y)] && Math.abs(x - sx) + Math.abs(y - sy) > 6);
    const [cx, cy] = far[Math.floor(R() * far.length)] || [sx + 2, sy + 1];
    const loot = level === 80 ? [{ id: 'bar_astral', qty: 5 }, { id: 'diamante', qty: 2 }, { id: 'martelo_lava', qty: 1 }, { id: 'pedralua', qty: 3 }]
      : level >= 60 ? [{ id: 'bar_ouro', qty: 5 }, { id: 'rubi', qty: 1 }, { id: 'pocao', qty: 3 }]
        : level >= 40 ? [{ id: 'espada_cristal', qty: 1 }, { id: 'bar_ferro', qty: 5 }, { id: 'esmeralda', qty: 1 }]
          : level >= 20 ? [{ id: 'bar_ferro', qty: 3 }, { id: 'aguamarinha', qty: 1 }, { id: 'pocao', qty: 2 }]
            : [{ id: 'espada_aco', qty: 1 }, { id: 'bar_cobre', qty: 5 }, { id: 'tonico', qty: 2 }];
    if (!s.flags['minechest_' + level]) ms.objects[key(cx, cy)] = { t: 'placed', id: 'bau', chest: [...loot, ...Array(36 - loot.length).fill(null)], color: 4 };
  }
  // monstros
  const pool = MONSTERS.filter(m => level >= m.levels[0] && level <= m.levels[1]);
  const mineSpawns: { x: number; y: number; id: string }[] = [];
  if (level % 5 !== 0 && pool.length) {
    const n = 3 + Math.floor(R() * 4) + Math.floor(level / 15);
    for (let i = 0; i < n; i++) {
      const f = floors[Math.floor(R() * floors.length)];
      if (!isFloor(f[0], f[1]) || ms.objects[key(f[0], f[1])] || Math.abs(f[0] - sx) + Math.abs(f[1] - sy) < 7) continue;
      mineSpawns.push({ x: f[0], y: f[1], id: pool[Math.floor(R() * pool.length)].id });
    }
  }
  return {
    id: 'mina_' + level, name: `Minas — Andar ${level}`, w: W, h: H, tiles, outdoor: false, tillable: false, music: 'mina', warps: [], decos, buildings: [],
    counters: [], interacts, biome, isMine: true, mineLevel: level, fishZone: () => 'mina', mineSpawns, start: { x: sx, y: sy + 1 },
  } as any;
}
