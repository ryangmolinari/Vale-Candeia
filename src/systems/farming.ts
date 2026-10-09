// Agricultura: preparar, regar, plantar, colher e crescer.
import { key, unkey, rng } from '../core/util';
import { getState, Soil, mapState, ItemStack } from '../state/state';
import { CROP_BY_ID, cropStage, CROP_STAGES, FRUIT_TREES } from '../data/crops';
import { ITEMS, FORAGE_BY_SEASON } from '../data/items';
import { addXP, level, hasProf } from './skills';
import { MAPS } from '../world/maps';
import type { World } from '../world/world';

export function isSeasonOk(w: World, cropId: string) {
  if (cropId === 'misto_inverno') return w.def.outdoor ? getState().time.season === 3 : true;
  const c = CROP_BY_ID[cropId];
  if (!c) return false;
  if (!w.def.outdoor) return true; // estufa
  return c.seasons.includes(getState().time.season);
}

export function till(w: World, tx: number, ty: number) {
  const s = getState();
  const soil: Soil = { watered: false };
  if (w.def.outdoor && (s.weather.today === 'chuva' || s.weather.today === 'tempestade')) soil.watered = true;
  w.st.soil[key(tx, ty)] = soil;
}

export function cropReady(soil?: Soil) {
  if (!soil?.crop || soil.crop.dead) return false;
  if (soil.crop.id === 'misto_inverno') return soil.crop.grown >= 7;
  const c = CROP_BY_ID[soil.crop.id];
  return c && soil.crop.grown >= c.days && !(soil.crop.regrowLeft && soil.crop.regrowLeft > 0);
}

export function rollQuality(fert?: string): number {
  const L = level('farming');
  const f = fert === 'adubo_q' ? 2 : fert === 'adubo' ? 1 : 0;
  const s = getState();
  const gold = 0.2 * (L / 10) + 0.2 * f * ((L + 2) / 12) + 0.01 + s.luck * 0.05;
  const silver = Math.min(0.75, gold * 2);
  const r = Math.random();
  if (f === 2 && r < gold * 0.25) return 3;
  if (r < gold) return 2;
  if (r < silver) return 1;
  return 0;
}

/** Colhe um cultivo maduro. Retorna itens gerados. */
export function harvest(w: World, tx: number, ty: number): ItemStack[] {
  const soil = w.st.soil[key(tx, ty)];
  if (!soil || !cropReady(soil)) return [];
  const crop = soil.crop!;
  const out: ItemStack[] = [];
  if (crop.id === 'misto_inverno') {
    const pool = FORAGE_BY_SEASON[3];
    out.push({ id: pool[Math.floor(Math.random() * pool.length)], qty: 1, q: rollQuality(soil.fert) });
    delete soil.crop;
    addXP('foraging', 7);
    return out;
  }
  const c = CROP_BY_ID[crop.id];
  const q = c.cat === 'flower' && crop.id === 'liriolunar' ? rollQuality(soil.fert) : rollQuality(soil.fert);
  let n = 1 + (c.multi ? c.multi - 1 : 0);
  if (c.extra && Math.random() < c.extra) n++;
  if (crop.giant) n = 15 + Math.floor(Math.random() * 7);
  out.push({ id: c.id, qty: 1, q });
  if (n > 1) out.push({ id: c.id, qty: n - 1, q: 0 });
  addXP('farming', Math.max(1, Math.round(16 * Math.log(0.018 * c.sell + 1))));
  crop.harvests++;
  if (c.regrow && !crop.giant) crop.regrowLeft = c.regrow;
  else delete soil.crop;
  const s = getState();
  s.stats.harvested = (s.stats.harvested || 0) + n;
  return out;
}

export function plant(w: World, tx: number, ty: number, seedId: string): string | null {
  const soil = w.st.soil[key(tx, ty)];
  if (!soil) return 'Prepare a terra com a enxada primeiro.';
  if (soil.crop) return null;
  const cropId = ITEMS[seedId]?.seedOf;
  if (!cropId) return null;
  if (!isSeasonOk(w, cropId)) return 'Essa semente não cresce nesta estação.';
  soil.crop = { id: cropId, grown: 0, harvests: 0 };
  const s = getState();
  s.stats.planted = (s.stats.planted || 0) + 1;
  return '';
}

function growthStep(soil: Soil) {
  const c = soil.crop!;
  if (c.id === 'misto_inverno') { c.grown++; return; }
  if (c.regrowLeft && c.regrowLeft > 0) { c.regrowLeft--; if (c.regrowLeft <= 0) delete c.regrowLeft; return; }
  let g = 1;
  if (soil.fert === 'acelerador' && Math.random() < 0.25) g++;
  if (hasProf('agronomo') && Math.random() < 0.15) g++;
  c.grown += g;
}

/** Processa o crescimento noturno de todos os mapas com solo. */
export function growAll(seasonChanged: boolean) {
  const s = getState();
  for (const [mid, ms] of Object.entries(s.maps)) {
    const def = MAPS[mid];
    const outdoor = def ? def.outdoor : mid === 'fazenda';
    for (const [k, soil] of Object.entries(ms.soil)) {
      if (soil.crop && !soil.crop.dead) {
        if (soil.watered) growthStep(soil);
        if (seasonChanged && outdoor) {
          const c = CROP_BY_ID[soil.crop.id];
          if (soil.crop.id === 'misto_inverno' ? s.time.season !== 3 : (c && !c.seasons.includes(s.time.season))) soil.crop.dead = true;
        }
      }
      const keepWet = soil.fert === 'solo_umido' && Math.random() < 0.33;
      if (!keepWet) soil.watered = false;
      // solo vazio pode sumir com o tempo
      if (!soil.crop && outdoor && !soil.fert && Math.random() < 0.1) delete ms.soil[k];
    }
    // gigantes
    if (outdoor) {
      for (const [k, soil] of Object.entries(ms.soil)) {
        if (!soil.crop || soil.crop.giant || !['melao', 'abobora'].includes(soil.crop.id) || !cropReady(soil)) continue;
        const [x, y] = unkey(k);
        let ok = true;
        for (let j = 0; j < 3 && ok; j++) for (let i = 0; i < 3 && ok; i++) { const o = ms.soil[key(x + i, y + j)]; if (!o || o.crop?.id !== soil.crop.id || !cropReady(o) || o.crop.giant) ok = false; }
        if (ok && Math.random() < 0.03) {
          for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) if (i || j) delete ms.soil[key(x + i, y + j)].crop;
          soil.crop.giant = true;
        }
      }
    }
  }
}

/** Corvos comem plantações sem espantalho (somente na fazenda). */
export function crows(): number {
  const ms = mapState('fazenda');
  const crops = Object.entries(ms.soil).filter(([, s]) => s.crop && !s.crop.dead && !s.crop.giant);
  if (crops.length < 16) return 0;
  const scare = Object.entries(ms.objects).filter(([, o]) => o.t === 'placed' && o.id === 'espantalho').map(([k]) => unkey(k));
  let eaten = 0;
  const tries = Math.floor(crops.length / 16);
  for (let i = 0; i < tries; i++) {
    if (Math.random() > 0.3) continue;
    const [k, soil] = crops[Math.floor(Math.random() * crops.length)];
    const [x, y] = unkey(k);
    if (scare.some(([sx, sy]) => (sx - x) ** 2 + (sy - y) ** 2 <= 64)) continue;
    delete soil.crop; eaten++;
  }
  return eaten;
}

/** Aspersores regam pela manhã. */
export function sprinklers() {
  const s = getState();
  for (const ms of Object.values(s.maps)) {
    for (const [k, o] of Object.entries(ms.objects)) {
      if (o.t !== 'placed' || !o.id.startsWith('aspersor')) continue;
      const [x, y] = unkey(k);
      const tiles: [number, number][] = [];
      if (o.id === 'aspersor') tiles.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      else { const r = o.id === 'aspersor_q' ? 1 : 2; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i || j) tiles.push([i, j]); }
      for (const [dx, dy] of tiles) { const so = ms.soil[key(x + dx, y + dy)]; if (so) so.watered = true; }
    }
  }
}

export function rainWater() {
  const s = getState();
  for (const [mid, ms] of Object.entries(s.maps)) { if (MAPS[mid]?.outdoor || mid === 'fazenda') for (const soil of Object.values(ms.soil)) soil.watered = true; }
}

/** Crescimento de árvores e frutíferas. */
export function growTrees() {
  const s = getState();
  for (const [mid, ms] of Object.entries(s.maps)) {
    for (const [k, o] of Object.entries(ms.objects)) {
      if (o.t === 'tree' && o.stage < 4) { o.growth++; if (o.growth >= 4 && Math.random() < 0.6) { o.stage++; o.growth = 0; o.hp = [1, 1, 3, 5, 8][o.stage]; } }
      if (o.t === 'tree' && o.tapper && o.stage >= 4) { /* tapper tratado em machines */ }
      if (o.t === 'fruittree') {
        o.age++;
        const ft = FRUIT_TREES.find(f => f.id === o.kind);
        if (ft && o.age >= 28 && (ft.season === s.time.season || mid === 'estufa') && o.fruit < 3) o.fruit++;
        if (ft && ft.season !== s.time.season && mid !== 'estufa') o.fruit = 0;
      }
    }
  }
}

/** Mato, pedras e galhos reaparecem aos poucos na fazenda; árvores espalham sementes. */
export function regrowDebris() {
  const ms = mapState('fazenda');
  const def = MAPS.fazenda;
  const R = rng(Date.now() & 0xffff);
  const n = 6 + Math.floor(R() * 6);
  for (let i = 0; i < n; i++) {
    const x = 3 + Math.floor(R() * (def.w - 6)), y = 6 + Math.floor(R() * (def.h - 10));
    const k = key(x, y);
    const t = def.tiles[y * def.w + x];
    if (ms.objects[k] || ms.soil[k] || ms.floors?.[k] || (t !== 1 && t !== 15)) continue;
    if (def.decos.some(d => d.x === x && d.y === y)) continue;
    if (Math.abs(x - 34) < 4 && y < 13) continue;
    if (getState().buildings.some(b => x >= b.x - 1 && x <= b.x + 8 && y >= b.y - 1 && y <= b.y + 5)) continue;
    const r = R();
    ms.objects[k] = r < 0.55 ? { t: 'debris', kind: 'weed', hp: 1, v: Math.floor(R() * 6) } : r < 0.75 ? { t: 'debris', kind: 'stone', hp: 1, v: 0 } : r < 0.9 ? { t: 'debris', kind: 'twig', hp: 1, v: 0 } : { t: 'grass', v: Math.floor(R() * 4) };
  }
}

/** Itens de coleta aparecem nos mapas externos. */
export function spawnForage() {
  const s = getState();
  const spots: Record<string, { n: number; pool: () => string[] }> = {
    floresta: { n: 6, pool: () => FORAGE_BY_SEASON[s.time.season] },
    montanha: { n: 4, pool: () => FORAGE_BY_SEASON[s.time.season] },
    vila: { n: 2, pool: () => FORAGE_BY_SEASON[s.time.season] },
    fazenda: { n: 2, pool: () => FORAGE_BY_SEASON[s.time.season] },
    praia: { n: 5, pool: () => ['concha', 'concha', 'mexilhao', 'coral', 'alga'] },
    enseada: { n: 5, pool: () => ['coral', 'ourico', 'concha', 'ourico', 'aguamarinha'] },
  };
  const extra = hasProf('rastreador') ? 2 : 0;
  for (const [mid, sp] of Object.entries(spots)) {
    const def = MAPS[mid]; if (!def) continue;
    const ms = mapState(mid);
    const existing = Object.values(ms.objects).filter(o => o.t === 'forage').length;
    const pool = sp.pool();
    for (let i = 0; i < sp.n + extra - Math.floor(existing / 2) && pool.length; i++) {
      for (let tries = 0; tries < 20; tries++) {
        const x = 1 + Math.floor(Math.random() * (def.w - 2)), y = 1 + Math.floor(Math.random() * (def.h - 2));
        const t = def.tiles[y * def.w + x];
        const okTile = mid === 'praia' || mid === 'enseada' ? t === 3 : (t === 1 || t === 15);
        const k = key(x, y);
        if (!okTile || ms.objects[k] || ms.soil[k] || def.decos.some(d => Math.abs(d.x - x) <= 1 && Math.abs(d.y - y) <= 1)) continue;
        if (def.buildings.some(b => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h)) continue;
        if (def.warps.some(w => x >= w.x - 1 && x <= w.x + w.w && y >= w.y - 1 && y <= w.y + w.h)) continue;
        ms.objects[k] = { t: 'forage', id: pool[Math.floor(Math.random() * pool.length)] };
        break;
      }
    }
  }
}

export function forageQuality(): number {
  if (hasProf('botanico')) return 2;
  const L = level('foraging');
  const r = Math.random();
  if (r < L / 30) return 2;
  if (r < L / 15) return 1;
  return 0;
}

export { CROP_STAGES, cropStage };
