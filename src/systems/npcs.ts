// Moradores: rotinas, deslocamento entre mapas (sem teleporte visível), conversa e presentes.
import { TILE, key } from '../core/util';
import { G } from '../core/ctx';
import { getState, weekday, NPCState, ItemStack } from '../state/state';
import { NPCS, NPCDef, Step } from '../data/npcs';
import { POIS } from '../world/builder';
import { MAPS } from '../world/maps';
import { getWorld } from '../world/world';
import { buildCharSheet, CharSheet, buildPortrait, Expr } from '../art/characters';
import { matches } from './inventory';
import { ITEMS } from '../data/items';
import { FESTIVALS } from '../data/game';

export interface NPCEnt {
  id: string; def: NPCDef; map: string; x: number; y: number; facing: 'up' | 'down' | 'left' | 'right';
  path: [number, number][]; route: { map: string; exitX: number; exitY: number; to: string; tx: number; ty: number }[];
  targetPoi: string; moving: boolean; animT: number; frame: number; sheet: CharSheet; emote?: string; emoteT: number; pause: number; waitT: number;
}

const portraitCache = new Map<string, HTMLCanvasElement>();
export function portrait(id: string, expr: Expr = 'neutral') {
  const k = id + expr;
  let p = portraitCache.get(k);
  if (!p) { const d = NPCS.find(n => n.id === id)!; p = buildPortrait(d.look, expr, d.portraitBg); portraitCache.set(k, p); }
  return p;
}

export function npcState(id: string): NPCState {
  const s = getState();
  if (!s.npcs[id]) s.npcs[id] = { friendship: 0, talkedToday: false, giftsWeek: 0, giftedToday: false, events: [] };
  return s.npcs[id];
}
export function hearts(id: string) { return Math.floor(npcState(id).friendship / 250); }

// ---------- pathfinding ----------
function astar(mapId: string, sx: number, sy: number, gx: number, gy: number): [number, number][] | null {
  const w = getWorld(mapId);
  const W = w.def.w, H = w.def.h;
  if (sx === gx && sy === gy) return [];
  const solid = (x: number, y: number) => x < 0 || y < 0 || x >= W || y >= H || (w.staticSolid[y * W + x] === 1 && !(x === gx && y === gy));
  const open: number[] = [sy * W + sx];
  const g = new Map<number, number>([[sy * W + sx, 0]]);
  const came = new Map<number, number>();
  const f = new Map<number, number>([[sy * W + sx, Math.abs(gx - sx) + Math.abs(gy - sy)]]);
  const goal = gy * W + gx;
  let iter = 0;
  while (open.length && iter++ < 6000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (f.get(open[i])! < f.get(open[bi])!) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === goal) {
      const path: [number, number][] = []; let c = cur;
      while (came.has(c)) { path.push([c % W, (c / W) | 0]); c = came.get(c)!; }
      return path.reverse();
    }
    const cx = cur % W, cy = (cur / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (solid(nx, ny)) continue;
      const ni = ny * W + nx;
      const ng = g.get(cur)! + 1 + (w.def.tiles[ni] === 1 || w.def.tiles[ni] === 15 ? 0.3 : 0);
      if (ng < (g.get(ni) ?? Infinity)) { came.set(ni, cur); g.set(ni, ng); f.set(ni, ng + Math.abs(gx - nx) + Math.abs(gy - ny)); if (!open.includes(ni)) open.push(ni); }
    }
  }
  return null;
}

function mapRoute(from: string, to: string) {
  if (from === to) return [];
  const prev = new Map<string, { from: string; warp: any }>();
  const q = [from]; const seen = new Set([from]);
  while (q.length) {
    const m = q.shift()!;
    if (m === to) break;
    const def = MAPS[m]; if (!def) continue;
    for (const w of def.warps) {
      if (!MAPS[w.to] || seen.has(w.to) || w.to === m) continue;
      if (w.to.startsWith('mina') || w.to.startsWith('bld_') || w.to === 'estufa' || w.to === 'enseada') continue;
      seen.add(w.to); prev.set(w.to, { from: m, warp: w }); q.push(w.to);
    }
  }
  if (!prev.has(to)) return null;
  const hops: NPCEnt['route'] = [];
  let c = to;
  while (c !== from) { const p = prev.get(c)!; const w = p.warp; hops.push({ map: p.from, exitX: w.x + Math.floor((w.w - 1) / 2), exitY: w.y + Math.floor((w.h - 1) / 2), to: w.to, tx: w.tx, ty: w.ty }); c = p.from; }
  return hops.reverse();
}

export class NPCManager {
  list: NPCEnt[] = [];
  init() {
    this.list = NPCS.map(d => {
      const home = POIS[d.home] || POIS['vila.praca'];
      return { id: d.id, def: d, map: home.map, x: home.x * TILE + 8, y: home.y * TILE + 12, facing: 'down', path: [], route: [], targetPoi: d.home, moving: false, animT: 0, frame: 0, sheet: buildCharSheet(d.look), emoteT: 0, pause: 0, waitT: 0 } as NPCEnt;
    });
  }
  get(id: string) { return this.list.find(n => n.id === id); }
  stepsFor(n: NPCEnt): Step[] {
    const s = getState();
    const st = npcState(n.id);
    if (st.married) return [[360, 'casa.cozinha'], [540, 'casa.sala'], [s.weather.today === 'sol' && s.time.season < 3 ? 840 : 9999, 'fazenda.porta'], [1080, 'casa.sala'], [1320, 'casa.cama']];
    const fest = FESTIVALS.find(f => f.season === s.time.season && f.day === s.time.day);
    if (fest) {
      const spots = ['vila.praca', 'vila.praca2', 'vila.praca3', 'vila.banco1', 'vila.banco2', 'vila.banco3', 'vila.fonte', 'vila.mural', 'vila.estatua', 'vila.horta', 'vila.poco'];
      const i = NPCS.findIndex(x => x.id === n.id);
      return [[360, n.def.home], [fest.from - 120, spots[i % spots.length]], [fest.to + 60, n.def.home]];
    }
    const sch = n.def.schedule;
    const rain = s.weather.today === 'chuva' || s.weather.today === 'tempestade';
    if (rain && sch.rain) return sch.rain;
    if (s.time.season === 3 && sch.winter) return sch.winter;
    const wd = String(weekday(s.time.day));
    return (sch[wd] as Step[]) || sch.default;
  }
  desiredPoi(n: NPCEnt) {
    const steps = this.stepsFor(n);
    const m = getState().time.minutes;
    let cur = steps[0][1];
    for (const [t, p] of steps) if (m >= t) cur = p;
    return POIS[cur] ? cur : n.def.home;
  }
  /** Coloca cada morador onde deveria estar (início do dia / carregamento). */
  placeAll() {
    for (const n of this.list) {
      const poi = POIS[this.desiredPoi(n)] || POIS[n.def.home];
      n.map = poi.map; n.x = poi.x * TILE + 8; n.y = poi.y * TILE + 12; n.path = []; n.route = []; n.targetPoi = this.desiredPoi(n); n.facing = poi.dir || 'down';
    }
  }
  tick10() {
    for (const n of this.list) {
      if (G.cutscene?.npcs?.includes(n.id)) continue;
      const want = this.desiredPoi(n);
      if (want !== n.targetPoi) this.planTo(n, want);
    }
  }
  planTo(n: NPCEnt, poiName: string) {
    const poi = POIS[poiName]; if (!poi) return;
    n.targetPoi = poiName;
    const route = mapRoute(n.map, poi.map);
    if (route === null) { return; }
    n.route = route;
    this.planLeg(n);
  }
  private planLeg(n: NPCEnt) {
    const poi = POIS[n.targetPoi];
    const tx = Math.floor(n.x / TILE), ty = Math.floor(n.y / TILE);
    let gx: number, gy: number;
    if (n.route.length) { gx = n.route[0].exitX; gy = n.route[0].exitY; } else { gx = poi.x; gy = poi.y; }
    const p = astar(n.map, tx, ty, gx, gy);
    n.path = p || [];
    if (!p) { // sem caminho: aparece direto (fora da visão do jogador)
      if (n.map !== G.world?.def.id) { if (n.route.length) { const h = n.route.shift()!; n.map = h.to; n.x = h.tx * TILE + 8; n.y = h.ty * TILE + 12; this.planLeg(n); } else { n.x = gx * TILE + 8; n.y = gy * TILE + 12; } }
    }
  }
  chatT = 0;
  update(dt: number) {
    this.chatT -= dt;
    if (this.chatT <= 0) {
      this.chatT = 2.5;
      for (const a of this.list) {
        if (a.moving || a.path.length || Math.random() > 0.25) continue;
        const b = this.list.find(o => o !== a && o.map === a.map && !o.moving && Math.hypot(o.x - a.x, o.y - a.y) < 40);
        if (b) { a.emote = ['...', '♪', '!', '?'][Math.floor(Math.random() * 4)]; a.emoteT = 1.6; a.facing = Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (b.x > a.x ? 'right' : 'left') : (b.y > a.y ? 'down' : 'up'); }
      }
    }
    for (const n of this.list) {
      if (n.emoteT > 0) n.emoteT -= dt;
      if (n.pause > 0) { n.pause -= dt; n.moving = false; continue; }
      if (!n.path.length) {
        n.moving = false;
        if (n.route.length) {
          const h = n.route.shift()!;
          n.map = h.to; n.x = h.tx * TILE + 8; n.y = h.ty * TILE + 12;
          this.planLeg(n);
        } else if (POIS[n.targetPoi]?.dir && !n.moving) n.facing = POIS[n.targetPoi].dir!;
        continue;
      }
      const [nx, ny] = n.path[0];
      const gx = nx * TILE + 8, gy = ny * TILE + 12;
      const dx = gx - n.x, dy = gy - n.y;
      const d = Math.hypot(dx, dy);
      // espera se o jogador está no caminho
      if (G.world && n.map === G.world.def.id && G.player && Math.hypot(G.player.x - gx, G.player.y - gy) < 10 && n.waitT < 1.2) { n.waitT += dt; n.moving = false; continue; }
      n.waitT = 0;
      const sp = 42 * dt;
      if (d <= sp) { n.x = gx; n.y = gy; n.path.shift(); }
      else { n.x += (dx / d) * sp; n.y += (dy / d) * sp; }
      n.moving = true;
      if (Math.abs(dx) > Math.abs(dy)) n.facing = dx > 0 ? 'right' : 'left'; else n.facing = dy > 0 ? 'down' : 'up';
      n.animT += dt;
      if (n.animT > 0.18) { n.animT = 0; n.frame = (n.frame + 1) % 4; }
    }
  }
  sprite(n: NPCEnt) {
    const f = n.moving ? n.frame : 0;
    return n.sheet[`${n.facing}_walk_${f}`];
  }
  at(map: string, px: number, py: number, r = 14) {
    let best: NPCEnt | undefined, bd = r;
    for (const n of this.list) { if (n.map !== map) continue; const d = Math.hypot(n.x - px, n.y - 6 - py); if (d < bd) { bd = d; best = n; } }
    return best;
  }
}

// ---------- falas ----------
export function dialogueFor(id: string): string {
  const s = getState();
  const d = NPCS.find(n => n.id === id)!;
  const st = npcState(id);
  const day = s.time.day + s.time.season * 28;
  const pick = <T>(arr: T[], salt = 0) => arr[(day * 7 + salt + id.length * 3) % arr.length];
  if (!st.met) { st.met = true; return d.intro; }
  if (st.married) return pick(['Bom dia, amor! O café está pronto.', 'Reguei algumas plantas pra você hoje.', 'Não trabalhe demais, tá? Volta cedo.', 'Você já viu como a fazenda está linda? Tenho orgulho de nós.', 'Senti sua falta hoje.', `${s.player.name}, você é a melhor coisa que me aconteceu.`]);
  if (d.birthday[0] === s.time.season && d.birthday[1] === s.time.day) return 'Hoje é meu aniversário! ' + (st.birthdayGift === day ? 'Obrigado pelo presente!' : 'Quem sabe alguém lembra...');
  if (st.engaged) return 'Mal posso esperar pelo casamento! Faltam só alguns dias!';
  if (st.dating && Math.random() < 0.5) return pick(['Pensei em você o dia inteiro.', 'Que bom te ver! Meu dia melhorou.', 'A gente devia passear na praia um dia desses.', 'Você é especial pra mim, sabia?']);
  const rain = s.weather.today === 'chuva' || s.weather.today === 'tempestade';
  if (rain && Math.random() < 0.5) return pick(d.rain);
  if (hearts(id) >= 6 && Math.random() < 0.4) return pick(d.close, 1);
  if (Math.random() < 0.35) return pick(d.season[s.time.season], 2);
  return pick(d.talk, 3);
}

export function talk(id: string): { text: string; expr: Expr } {
  const st = npcState(id);
  const firstToday = !st.talkedToday;
  const text = dialogueFor(id);
  if (firstToday) { st.talkedToday = true; addFriendship(id, 20); }
  return { text, expr: hearts(id) >= 4 ? 'happy' : 'neutral' };
}

export function maxFriendship(id: string) {
  const d = NPCS.find(n => n.id === id)!;
  const st = npcState(id);
  if (d.romance && !st.dating && !st.married) return 2000;
  return 2500;
}
export function addFriendship(id: string, amt: number) {
  const st = npcState(id);
  const before = hearts(id);
  st.friendship = Math.max(0, Math.min(maxFriendship(id), st.friendship + amt));
  if (hearts(id) > before) G.toast?.(`${NPCS.find(n => n.id === id)!.name}: ${hearts(id)} ♥`, undefined, '#e85a7a');
}

export type Taste = 'love' | 'like' | 'neutral' | 'dislike' | 'hate';
export function tasteOf(id: string, item: ItemStack): Taste {
  const d = NPCS.find(n => n.id === id)!;
  const test = (arr: string[]) => arr.some(w => matches(item, w));
  if (test(d.loves)) return 'love';
  if (test(d.hates)) return 'hate';
  if (test(d.dislikes)) return 'dislike';
  if (test(d.likes)) return 'like';
  const c = ITEMS[item.id]?.cat;
  if (c === 'trash') return 'hate';
  if (c === 'monster' || c === 'resource' || c === 'bait' || c === 'fertilizer') return 'dislike';
  if (c === 'artisan' || c === 'food' || c === 'gem') return 'like';
  return 'neutral';
}

export function giveGift(id: string, item: ItemStack): { text: string; expr: Expr; ok: boolean; taste?: Taste } {
  const s = getState();
  const d = NPCS.find(n => n.id === id)!;
  const st = npcState(id);
  const bday = d.birthday[0] === s.time.season && d.birthday[1] === s.time.day;
  if (item.id === 'buque') {
    if (!d.romance) return { text: 'Que flores lindas... mas acho que não é bem assim entre nós.', expr: 'neutral', ok: false };
    if (st.dating) return { text: 'A gente já está namorando, bobinha!', expr: 'blush', ok: false };
    if (hearts(id) < 8) return { text: 'Ah... é muito gentil, mas ainda não te conheço tão bem assim.', expr: 'neutral', ok: false };
    st.dating = true; addFriendship(id, 100);
    return { text: 'Um buquê? Pra mim? ...Sim. Sim! Eu também sinto o mesmo.', expr: 'blush', ok: true, taste: 'love' };
  }
  if (item.id === 'pingente') {
    if (!d.romance) return { text: 'Isso é... um pedido? Acho que você entendeu errado.', expr: 'neutral', ok: false };
    if (s.spouse) return { text: 'Você já tem alguém!', expr: 'angry', ok: false };
    if (!st.dating || hearts(id) < 10) return { text: 'Isso é sério demais pra gente agora...', expr: 'sad', ok: false };
    st.engaged = 3;
    return { text: 'É o Pingente das Marés! Sim! Mil vezes sim! Vamos nos casar daqui a três dias!', expr: 'blush', ok: true, taste: 'love' };
  }
  if (st.giftedToday) return { text: 'Você já me deu um presente hoje. Obrigado!', expr: 'neutral', ok: false };
  if (st.giftsWeek >= 2 && !bday) return { text: 'Você já me deu dois presentes esta semana. Não precisa exagerar!', expr: 'neutral', ok: false };
  const t = tasteOf(id, item);
  let pts = { love: 80, like: 45, neutral: 20, dislike: -20, hate: -40 }[t];
  if (pts > 0) pts = Math.round(pts * (1 + (item.q || 0) * 0.1));
  if (bday) { pts *= 8; st.birthdayGift = s.time.day + s.time.season * 28; }
  st.giftedToday = true; st.giftsWeek++;
  addFriendship(id, pts);
  s.stats.gifts = (s.stats.gifts || 0) + 1;
  const expr: Expr = t === 'love' ? 'happy' : t === 'like' ? 'happy' : t === 'neutral' ? 'neutral' : t === 'dislike' ? 'sad' : 'angry';
  let text = d.gift[t];
  if (bday && pts > 0) text = d.birthdayLine + ' ' + text;
  return { text, expr, ok: true, taste: t };
}

export function dailyReset() {
  const s = getState();
  const monday = weekday(s.time.day) === 0;
  for (const d of NPCS) {
    const st = npcState(d.id);
    if (!st.talkedToday && st.met && !st.married && st.friendship > 0 && Math.random() < 0.5) st.friendship = Math.max(0, st.friendship - (st.dating ? 10 : 2));
    st.talkedToday = false; st.giftedToday = false;
    if (monday) st.giftsWeek = 0;
  }
}

export function eventFor(mapId: string) {
  const s = getState();
  for (const d of NPCS) {
    const st = npcState(d.id);
    for (const ev of d.events) {
      if (st.events.includes(ev.id)) continue;
      if (ev.map !== mapId) continue;
      if (hearts(d.id) < ev.hearts) continue;
      if (s.time.minutes < ev.from || s.time.minutes > ev.to) continue;
      if (ev.weather === 'sol' && s.weather.today !== 'sol') continue;
      if (ev.weather === 'chuva' && s.weather.today !== 'chuva') continue;
      return { npc: d, ev };
    }
  }
  return null;
}

export function isShopkeeperPresent(shopNpc: string, mapId: string) {
  if (!shopNpc) return true;
  const n = (G.npcs as NPCManager).get(shopNpc);
  return !!n && n.map === mapId && !n.route.length;
}
export { key };
