// Pesca: medir força, lançar, esperar a mordida e minigame da barra.
import { TILE } from '../core/util';
import { G } from '../core/ctx';
import { Input } from '../core/input';
import { getState } from '../state/state';
import { FISH, FishDef } from '../data/fish';
import { sfx } from '../audio/audio';
import { addXP, level, hasProf, toolEnergy } from './skills';
import { addItem, countItem, removeItem } from './inventory';
import { questEvent } from './quests';
import { spawnDrop } from './player';

export interface FishingState {
  phase: 'charge' | 'cast' | 'wait' | 'bite' | 'game' | 'show' | 'reel';
  t: number; power: number; dir: number;
  bx: number; by: number; // boia
  sx: number; sy: number; tx: number; ty: number; // trajetória
  biteAt: number; fish?: FishDef | null; trash?: string;
  // minigame
  bar: number; barV: number; barSize: number; fishY: number; fishV: number; fishTarget: number; progress: number; perfect: boolean; holding: boolean;
  pose: string; zone?: string;
  contest?: boolean;
}

export function startFishing() {
  const s = getState();
  if (G.fishing) return;
  G.fishing = { phase: 'charge', t: 0, power: 0, dir: 1, bx: 0, by: 0, sx: 0, sy: 0, tx: 0, ty: 0, biteAt: 0, bar: 0, barV: 0, barSize: 0.3, fishY: 0.5, fishV: 0, fishTarget: 0.5, progress: 0.3, perfect: true, holding: false, pose: 'swingUp' } as FishingState;
}

function pickFish(zone: string): FishDef | null {
  const s = getState();
  const w = G.world;
  const m = s.time.minutes;
  const rain = s.weather.today === 'chuva' || s.weather.today === 'tempestade';
  const fl = level('fishing');
  const pool = FISH.filter(f => f.zones.includes(zone as any) && f.seasons.includes(s.time.season) && m >= f.from && m <= f.to &&
    (f.weather === 'any' || (f.weather === 'chuva') === rain) && (f.minLevel || 0) <= fl && (!f.mineLevel || w.def.mineLevel === f.mineLevel) &&
    !(f.legendary && s.collection.fish[f.id]));
  if (!pool.length) return null;
  const tot = pool.reduce((a, f) => a + f.rarity, 0);
  let r = Math.random() * tot;
  for (const f of pool) { r -= f.rarity; if (r <= 0) return f; }
  return pool[pool.length - 1];
}

const ROD_BONUS = [0, 0.06, 0.12];

export function updateFishing(dt: number) {
  const f: FishingState = G.fishing;
  if (!f) return;
  const p = G.player;
  const s = getState();
  const press = Input.mDown[0] || Input.isDown('space') || Input.isDown('c');
  const pressed = Input.mPressed[0] || Input.isPressed('space') || Input.isPressed('c');
  f.t += dt;
  const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing as string]!;
  switch (f.phase) {
    case 'charge': {
      f.pose = 'swingUp';
      f.power += f.dir * dt * 1.2;
      if (f.power >= 1) { f.power = 1; f.dir = -1; } if (f.power <= 0) { f.power = 0; f.dir = 1; }
      if (!press) {
        const dist = 1 + Math.round(f.power * 4);
        const tx = p.tx + dir[0] * dist, ty = p.ty + dir[1] * dist;
        f.sx = p.x + dir[0] * 6; f.sy = p.y - 20; f.tx = tx * TILE + 8; f.ty = ty * TILE + 8;
        f.phase = 'cast'; f.t = 0; f.pose = 'swingDown';
        s.player.energy -= toolEnergy('rod', 4);
        sfx('cast');
      }
      break;
    }
    case 'cast': {
      const k = Math.min(1, f.t / 0.55);
      f.bx = f.sx + (f.tx - f.sx) * k; f.by = f.sy + (f.ty - f.sy) * k - Math.sin(k * Math.PI) * 26;
      if (k >= 1) {
        const tx = Math.floor(f.tx / TILE), ty = Math.floor(f.ty / TILE);
        if (!G.world.isWater(tx, ty)) { G.toast('A linha caiu fora da água.'); G.fishing = null; return; }
        sfx('splash'); G.fx.splash(f.tx, f.ty);
        f.zone = G.world.def.fishZone?.(tx, ty) || 'rio';
        // distância da margem melhora chance
        const bait = countItem('isca') > 0;
        f.biteAt = (1.5 + Math.random() * (bait ? 4 : 9)) * (1 - level('fishing') * 0.03) * (s.flags.rod2 ? 0.8 : 1);
        f.phase = 'wait'; f.t = 0; f.pose = 'cast';
        if (bait) removeItem('isca', 1);
      }
      break;
    }
    case 'wait': {
      f.bx = f.tx; f.by = f.ty + Math.sin(f.t * 3) * 0.8;
      if (pressed) { G.fishing = null; sfx('cast'); return; }
      if (f.t >= f.biteAt) { f.phase = 'bite'; f.t = 0; sfx('bite'); G.fx.float(p.x, p.y - 32, '!', '#ffe04a', true); G.fx.splash(f.tx, f.ty); }
      break;
    }
    case 'bite': {
      f.by = f.ty + Math.sin(f.t * 30) * 2;
      if (pressed) {
        const trashChance = f.zone === 'mina' ? 0.05 : 0.12 - level('fishing') * 0.008;
        if (Math.random() < trashChance) { f.fish = null; f.trash = ['bota', 'lata', 'jornal', 'alga', 'alga'][Math.floor(Math.random() * 5)]; finishCatch(); return; }
        f.fish = pickFish(f.zone!);
        if (!f.fish) { f.trash = 'alga'; finishCatch(); return; }
        f.phase = 'game'; f.t = 0;
        const rod = s.flags.rod2 ? 2 : s.flags.rod1 ? 1 : 0;
        f.barSize = 0.22 + level('fishing') * 0.012 + ROD_BONUS[rod] + (hasProf('paciente') ? 0.05 : 0);
        f.bar = 0; f.barV = 0; f.fishY = 0.3; f.fishV = 0; f.fishTarget = 0.5; f.progress = 0.3; f.perfect = true;
        G.fx.splash(f.tx, f.ty);
      }
      if (f.t > 1.1) { G.toast('O peixe fugiu...'); sfx('fail'); G.fishing = null; }
      break;
    }
    case 'game': {
      const fish = f.fish!;
      const diff = fish.difficulty / 100;
      // peixe
      f.t += 0;
      const beh = fish.behavior;
      if (Math.random() < diff * (beh === 'dardo' ? 0.08 : 0.035)) {
        const jump = beh === 'afunda' ? -Math.random() * 0.4 : beh === 'flutua' ? Math.random() * 0.4 : (Math.random() - 0.5) * (beh === 'dardo' ? 1.2 : 0.8);
        f.fishTarget = Math.max(0.02, Math.min(0.98, f.fishY + jump));
      }
      if (beh === 'afunda') f.fishTarget = Math.max(0.02, f.fishTarget - dt * 0.05);
      if (beh === 'flutua') f.fishTarget = Math.min(0.98, f.fishTarget + dt * 0.05);
      const accel = (f.fishTarget - f.fishY) * (beh === 'suave' ? 2.2 : 4) * (0.6 + diff);
      f.fishV += accel * dt; f.fishV *= beh === 'suave' ? 0.92 : 0.9;
      f.fishY = Math.max(0, Math.min(1, f.fishY + f.fishV * dt * 4));
      // barra
      f.holding = press;
      f.barV += (press ? 2.4 : -2.2) * dt;
      f.barV = Math.max(-1.6, Math.min(1.6, f.barV));
      f.bar += f.barV * dt;
      if (f.bar < 0) { f.bar = 0; f.barV = Math.abs(f.barV) * 0.35 * (f.barV < -0.6 ? 1 : 0); }
      if (f.bar > 1 - f.barSize) { f.bar = 1 - f.barSize; f.barV = 0; }
      const inside = f.fishY >= f.bar && f.fishY <= f.bar + f.barSize;
      if (inside) { f.progress += dt * 0.32; if (Math.random() < 0.3) sfx('reel'); }
      else { f.progress -= dt * (hasProf('mestre') ? 0.12 : 0.22) * (0.7 + diff * 0.6); f.perfect = false; }
      if (f.progress >= 1) { finishCatch(); return; }
      if (f.progress <= 0) { sfx('fail'); G.toast(`${fish.name} escapou!`); G.fishing = null; if (G.festival?.onFish) G.festival.onFish(null); return; }
      break;
    }
    case 'show': {
      f.pose = 'carry';
      if (f.t > 1.4 || (f.t > 0.4 && pressed)) { G.fishing = null; }
      break;
    }
  }
}

function finishCatch() {
  const f: FishingState = G.fishing;
  const s = getState();
  const p = G.player;
  if (f.trash || !f.fish) {
    const id = f.trash || 'alga';
    if (addItem({ id, qty: 1 }) > 0) spawnDrop(p.x, p.y, { id, qty: 1 });
    f.phase = 'show'; f.t = 0; (f as any).showItem = id;
    addXP('fishing', 3); sfx('splash');
    G.festival?.onFish?.(null);
    return;
  }
  const fish = f.fish;
  let q = 0;
  const L = level('fishing');
  if (f.perfect) q = 2; else if (Math.random() < L * 0.06) q = 1;
  if (f.perfect && fish.legendary) q = 3;
  if (addItem({ id: fish.id, qty: 1, q }) > 0) spawnDrop(p.x, p.y, { id: fish.id, qty: 1, q });
  s.collection.fish[fish.id] = (s.collection.fish[fish.id] || 0) + 1;
  const first = s.collection.fish[fish.id] === 1;
  addXP('fishing', Math.round((3 + fish.difficulty / 5) * (f.perfect ? 2.2 : 1) * (first ? 1.5 : 1)));
  s.stats.fish = (s.stats.fish || 0) + 1;
  sfx('catch');
  G.fx.float(p.x, p.y - 40, (f.perfect ? 'Perfeito! ' : '') + fish.name + (first ? ' (novo!)' : ''), f.perfect ? '#ffe04a' : '#ffffff', true, fish.id);
  questEvent('catch');
  f.phase = 'show'; f.t = 0; (f as any).showItem = fish.id;
  G.festival?.onFish?.(fish);
}

/** Desenha o minigame na tela (coordenadas de tela já escaladas). */
export function drawFishingUI(ctx: CanvasRenderingContext2D, W: number, H: number, px: number, py: number) {
  const f: FishingState = G.fishing;
  if (!f) return;
  if (f.phase === 'charge') {
    const bx = Math.round(px + 14), by = Math.round(py - 42);
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(bx - 1, by - 1, 8, 34);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(bx, by, 6, 32);
    const h = Math.round(f.power * 32);
    const col = f.power < 0.33 ? '#e85a3a' : f.power < 0.66 ? '#f8c83a' : '#6ad84a';
    ctx.fillStyle = col; ctx.fillRect(bx, by + 32 - h, 6, h);
    return;
  }
  if (f.phase !== 'game') return;
  const panelH = 120, panelW = 40;
  const x0 = Math.round(Math.min(W - panelW - 30, px + 24)), y0 = Math.round(Math.max(8, Math.min(H - panelH - 8, py - panelH + 10)));
  // moldura de madeira
  ctx.fillStyle = '#5c3a1e'; ctx.fillRect(x0 - 3, y0 - 3, panelW + 22, panelH + 6);
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(x0 - 1, y0 - 1, panelW + 18, panelH + 2);
  ctx.fillStyle = '#2a5a8a'; ctx.fillRect(x0 + 4, y0 + 4, 20, panelH - 8);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x0 + 4, y0 + 4 + ((i * 14 + G.frame * 0.3) % (panelH - 8)), 20, 2); }
  const inner = panelH - 8;
  // barra verde
  const bh = Math.round(f.barSize * inner), by = Math.round(y0 + 4 + inner - (f.bar + f.barSize) * inner);
  const inside = f.fishY >= f.bar && f.fishY <= f.bar + f.barSize;
  ctx.fillStyle = inside ? 'rgba(120,230,100,0.85)' : 'rgba(120,230,100,0.55)'; ctx.fillRect(x0 + 5, by, 18, bh);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x0 + 5, by, 18, 2);
  // peixe
  const fy = Math.round(y0 + 4 + inner - f.fishY * inner) - 5;
  const c1 = f.fish!.color, c2 = f.fish!.color2;
  ctx.fillStyle = c1; ctx.fillRect(x0 + 8, fy + 2, 10, 6); ctx.fillStyle = c2; ctx.fillRect(x0 + 18, fy + 1, 3, 8); ctx.fillStyle = '#111'; ctx.fillRect(x0 + 10, fy + 3, 1, 1);
  // progresso
  ctx.fillStyle = '#2a1a10'; ctx.fillRect(x0 + 28, y0 + 4, 8, inner);
  const ph = Math.round(f.progress * inner);
  ctx.fillStyle = f.progress < 0.3 ? '#e85a3a' : f.progress < 0.7 ? '#f8c83a' : '#6ad84a';
  ctx.fillRect(x0 + 29, y0 + 4 + inner - ph, 6, ph);
}
