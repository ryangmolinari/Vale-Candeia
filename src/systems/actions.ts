// Ações do jogador: ferramentas, interação, plantio, colocação de objetos e comer.
import { TILE, key } from '../core/util';
import { G } from '../core/ctx';
import { Input } from '../core/input';
import { getState, ItemStack, WObj, mapState } from '../state/state';
import { ITEMS, itemName } from '../data/items';
import { CROP_BY_ID, FRUIT_TREES } from '../data/crops';
import { WEAPONS } from '../data/game';
import { SEASON_PAL } from '../art/palette';
import { sfx } from '../audio/audio';
import { addXP, toolEnergy, hasProf, level } from './skills';
import { addItem, removeAt, canFit, isGiftable } from './inventory';
import { till, plant, harvest, cropReady, forageQuality } from './farming';
import { spawnDrops, Facing } from './player';
import { insert, collect, isMachine, statusText, startBees, setTapper, machineReady } from './machines';
import { questEvent, tryDeliver } from './quests';
import { talk, giveGift, npcState, portrait, NPCManager } from './npcs';
import { NPCS } from '../data/npcs';
import { startFishing } from './fishing';
import { swingWeapon, mineRockBroken } from './combat';
import { petAnimal, animalAt } from './animals';
import { absMinutes } from '../state/state';

export const TOOL_NAMES = ['Básica', 'de Cobre', 'de Ferro', 'de Ouro', 'Astral'];
const POWER = [1, 1.6, 2.2, 3, 5];
export const CAN_CAP = [40, 55, 70, 85, 100];

export function held(): ItemStack | null { const s = getState(); return s.inventory[G.player.sel] || null; }

/** Tile-alvo: cursor se adjacente, senão o tile à frente. */
export function targetTile(): [number, number] {
  const p = G.player;
  const m = G.ui?.mouseTile?.();
  if (m && Input.mInside) {
    const [mx, my] = m;
    if (Math.abs(mx - p.tx) <= 1 && Math.abs(my - p.ty) <= 1 && !(mx === p.tx && my === p.ty)) return [mx, my];
  }
  return p.frontTile();
}
function faceToward(tx: number, ty: number) {
  const p = G.player;
  const dx = tx - p.tx, dy = ty - p.ty;
  if (dx === 0 && dy === 0) return;
  if (Math.abs(dx) >= Math.abs(dy) && dx !== 0) p.facing = dx > 0 ? 'right' : 'left'; else p.facing = dy > 0 ? 'down' : 'up';
}

function spendEnergy(n: number) {
  const s = getState();
  s.player.energy -= n;
  if (s.player.energy <= 0 && !s.player.exhausted) { s.player.exhausted = true; G.toast('Você está exausto. Vá dormir!', undefined, '#ff8a6a'); }
  if (s.player.energy <= -15) { G.sleep(true); }
}

// ---------------- AÇÃO PRIMÁRIA ----------------
export function primaryPress() {
  const p = G.player;
  if (p.action || G.fishing) return;
  const h = held();
  const s = getState();
  const [tx, ty] = targetTile();
  if (!h) { interact(); return; }
  const d = ITEMS[h.id];
  if (d.tool) {
    faceToward(tx, ty);
    if ((d.tool === 'hoe' || d.tool === 'can') && s.tools[d.tool] > 0) { p.charge = { active: true, t: 0, level: 0 }; return; }
    if (d.tool === 'rod') { startFishing(); return; }
    useTool(d.tool, 0, tx, ty);
    return;
  }
  if (d.weapon) { swingWeapon(d.weapon); return; }
  if (d.seedOf) { faceToward(tx, ty); doPlant(tx, ty, h); return; }
  if (d.sapling) { faceToward(tx, ty); plantTree(tx, ty, h); return; }
  if (d.cat === 'fertilizer') { faceToward(tx, ty); fertilize(tx, ty, h); return; }
  if (d.place) { faceToward(tx, ty); placeItem(tx, ty, h); return; }
  // tentar interação com o alvo; se nada, comer/usar
  if (!interact(true)) {
    if (d.energy !== undefined && (d.cat === 'food' || d.energy > 0)) askEat(h);
    else if (h.id === 'totem_chuva' || h.id === 'totem_casa') useTotem(h);
  }
}
export function primaryHold(dt: number) {
  const p = G.player;
  if (!p.charge.active) return;
  const h = held();
  const tool = h && ITEMS[h.id]?.tool;
  if (!tool) { p.charge.active = false; return; }
  p.charge.t += dt;
  const lv = getState().tools[tool];
  const nl = Math.min(lv, Math.floor(p.charge.t / 0.5));
  if (nl > p.charge.level) { p.charge.level = nl; sfx('menu'); }
}
export function primaryRelease() {
  const p = G.player;
  if (!p.charge.active) return;
  p.charge.active = false;
  const h = held();
  const tool = h && ITEMS[h.id]?.tool;
  if (!tool) return;
  const [tx, ty] = targetTile();
  useTool(tool, p.charge.level, tx, ty);
}

function areaTiles(tx: number, ty: number, c: number, facing: Facing): [number, number][] {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[facing];
  const perp = [d[1], d[0]];
  const out: [number, number][] = [];
  if (c === 0) return [[tx, ty]];
  if (c <= 2) { const n = c === 1 ? 3 : 5; for (let i = 0; i < n; i++) out.push([tx + d[0] * i, ty + d[1] * i]); return out; }
  const len = c === 3 ? 3 : 6;
  for (let i = 0; i < len; i++) for (let j = -1; j <= 1; j++) out.push([tx + d[0] * i + perp[0] * j, ty + d[1] * i + perp[1] * j]);
  return out;
}

export function useTool(tool: string, charge: number, tx: number, ty: number) {
  const p = G.player;
  const s = getState();
  const lvl = s.tools[tool] || 0;
  if (s.toolUpgrade?.tool === tool) { G.toast('Essa ferramenta está na forja do Otávio.'); return; }
  const cost = tool === 'scythe' ? 0 : toolEnergy(tool) * (charge + 1);
  const tiles = tool === 'scythe' ? scytheTiles(tx, ty) : areaTiles(tx, ty, charge, p.facing);
  const dur = tool === 'can' ? 0.5 : tool === 'scythe' ? 0.26 : 0.38;
  p.action = {
    kind: 'tool', tool, t: 0, dur, hitAt: dur * 0.55, hit: false,
    onHit: () => { spendEnergy(cost); applyTool(tool, lvl, tiles); },
  };
  if (tool === 'scythe') sfx('scythe');
}

function scytheTiles(tx: number, ty: number): [number, number][] {
  const p = G.player;
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing];
  const perp = [d[1], d[0]];
  return [[tx, ty], [tx + perp[0], ty + perp[1]], [tx - perp[0], ty - perp[1]]];
}

function applyTool(tool: string, lvl: number, tiles: [number, number][]) {
  const w = G.world;
  const s = getState();
  if (tool === 'can') {
    const [fx, fy] = tiles[0];
    if (w.isWater(fx, fy) || w.interactAt.get(key(fx, fy)) === 'well') {
      s.water = CAN_CAP[lvl]; sfx('water'); G.fx.splash(fx * TILE + 8, fy * TILE + 8); G.fx.float(G.player.x, G.player.y - 28, 'Regador cheio', '#8ad0ff');
      return;
    }
    if (s.water <= 0) { G.toast('O regador está vazio. Encha em um lago, rio ou poço.'); sfx('error'); return; }
    let any = false;
    for (const [x, y] of tiles) {
      if (s.water <= 0) break;
      const so = w.st.soil[key(x, y)];
      G.fx.water(x * TILE + 8, y * TILE + 8);
      if (so) { if (!so.watered) any = true; so.watered = true; }
      s.water--;
    }
    sfx('water');
    if (any) questEvent('water');
    return;
  }
  let hitSomething = false;
  for (const [x, y] of tiles) {
    if (!w.inBounds(x, y)) continue;
    if (hitTile(tool, lvl, x, y)) hitSomething = true;
  }
  if (!hitSomething && tool !== 'scythe') {
    const [x, y] = tiles[0];
    if (tool === 'axe' || tool === 'pick') { G.fx.dust(x * TILE + 8, y * TILE + 12); sfx(tool === 'axe' ? 'chop' : 'pick'); }
  }
}

function hitTile(tool: string, lvl: number, x: number, y: number): boolean {
  const w = G.world;
  const s = getState();
  const k = key(x, y);
  const o = w.obj(x, y);
  const cx = x * TILE + 8, cy = y * TILE + 10;
  const power = POWER[lvl];
  const shakeObj = () => { G.ui.shakeTile?.(w.def.id, k); };
  // mato pode ser removido por qualquer ferramenta
  if (o?.t === 'debris' && o.kind === 'weed') {
    w.setObj(x, y, null);
    G.fx.burst(cx, cy, [SEASON_PAL[s.time.season].leaf, SEASON_PAL[s.time.season].leafDark], 8, 0.7, 0.2);
    sfx('scythe');
    if (Math.random() < 0.5) spawnDrops(x, y, [{ id: 'fibra', qty: 1 }]);
    if (Math.random() < 0.03) spawnDrops(x, y, [{ id: 'sem_inverno', qty: 1 }]);
    return true;
  }
  if (tool === 'scythe') {
    if (o?.t === 'grass') {
      w.setObj(x, y, null);
      G.fx.burst(cx, cy, [SEASON_PAL[s.time.season].grass, SEASON_PAL[s.time.season].grassLight], 6, 0.6, 0.2);
      const silo = siloSpace();
      if (silo > 0 && Math.random() < 0.6) { s.flags.hay = (s.flags.hay || 0) + 1; G.fx.float(cx, cy - 10, '+1 feno', '#e8c86a'); }
      return true;
    }
    const so = w.st.soil[k];
    if (so?.crop?.dead) { delete so.crop; G.fx.dust(cx, cy, '#8a6a3a'); return true; }
    if (so?.crop && CROP_BY_ID[so.crop.id]?.scythe && cropReady(so)) { const out = harvest(w, x, y); spawnDrops(x, y, out); sfx('harvest'); return true; }
    if (o?.t === 'forage' && false) return true;
    return false;
  }
  if (tool === 'hoe') {
    if (w.canTill(x, y)) {
      till(w, x, y);
      G.fx.dust(cx, cy, '#8a5a36'); sfx('till');
      if (w.def.outdoor && Math.random() < 0.04) spawnDrops(x, y, [{ id: 'argila', qty: 1 }]);
      return true;
    }
    return false;
  }
  if (tool === 'axe') {
    if (!o) {
      const so = w.st.soil[k];
      if (so?.crop?.giant) { (so as any).ghp = ((so as any).ghp ?? 3) - power; shakeObj(); sfx('chop'); G.fx.burst(cx, cy, [CROP_BY_ID[so.crop.id].color], 8); if ((so as any).ghp <= 0) { const out = harvest(w, x, y); delete so.crop; delete (so as any).ghp; spawnDrops(x, y, out); sfx('treeFall'); G.fx.doShake(3, 15); } return true; }
      return false;
    }
    if (o.t === 'tree') {
      spendEnergy(0);
      if (o.stage <= 1) { w.setObj(x, y, null); spawnDrops(x, y, [{ id: treeSeed(o.kind), qty: 1 }]); sfx('chop'); return true; }
      o.hp -= power; shakeObj(); sfx('chop');
      G.fx.burst(cx, cy - 6, ['#a8743a', '#7a5232', '#c89a5a'], 6, 0.8, 0.22);
      if (o.stage >= 4 && Math.random() < 0.3) G.fx.leaves(cx, cy, [SEASON_PAL[s.time.season].leaf, SEASON_PAL[s.time.season].leafLight]);
      if (o.hp <= 0) {
        if (o.stage >= 4) {
          G.ui.fallTree?.(w.def.id, x, y, o.kind, G.player.facing);
          const wood = Math.round((10 + Math.floor(Math.random() * 5)) * (hasProf('lenhador') ? 1.25 : 1));
          setTimeout(() => {
            spawnDrops(x + (G.player.x < cx ? 2 : -2), y - 1, [{ id: 'madeira', qty: wood }, { id: 'seiva', qty: 1 + Math.floor(Math.random() * 3) }, ...(Math.random() < 0.6 ? [{ id: treeSeed(o.kind), qty: 1 + Math.floor(Math.random() * 2) }] : []), ...(o.tapper?.output ? [] : [])]);
            G.fx.doShake(3, 16); sfx('treeFall');
          }, 650);
          w.setObj(x, y, { t: 'debris', kind: 'treestump', hp: 4, v: 0 });
          addXP('foraging', 12);
          s.stats.trees = (s.stats.trees || 0) + 1;
        } else {
          w.setObj(x, y, null);
          spawnDrops(x, y, [{ id: 'madeira', qty: o.stage === 3 ? 4 : 2 }]);
          addXP('foraging', 2);
        }
      }
      return true;
    }
    if (o.t === 'fruittree') {
      o.hp -= power; shakeObj(); sfx('chop');
      if (o.hp <= 0) { w.setObj(x, y, null); spawnDrops(x, y, [{ id: 'madeira', qty: 8 }]); sfx('treeFall'); }
      return true;
    }
    if (o.t === 'debris') {
      if (o.kind === 'twig') { w.setObj(x, y, null); spawnDrops(x, y, [{ id: 'madeira', qty: 1 + Math.floor(Math.random() * 2) }]); sfx('chop'); G.fx.burst(cx, cy, ['#7a5232', '#a8743a'], 6); addXP('foraging', 1); return true; }
      if (o.kind === 'treestump') { o.hp -= power; shakeObj(); sfx('chop'); G.fx.burst(cx, cy, ['#7a5232'], 5); if (o.hp <= 0) { w.setObj(x, y, null); spawnDrops(x, y, [{ id: 'madeira', qty: 2 + Math.floor(Math.random() * 3) }]); addXP('foraging', 2); } return true; }
      if (o.kind === 'stump') {
        if (lvl < 1) { G.toast('Este toco é duro demais. Precisa de um machado de cobre.'); sfx('error'); shakeObj(); return true; }
        o.hp -= power; shakeObj(); sfx('chop'); G.fx.burst(cx, cy, ['#6a4228', '#8a5a32'], 8);
        if (o.hp <= 0) { w.setObj(x, y, null); spawnDrops(x, y, [{ id: 'madeira_dura', qty: 2 }]); addXP('foraging', 25); G.fx.doShake(2, 10); }
        return true;
      }
    }
    if (o.t === 'placed') return pickUpPlaced(x, y, o);
    return false;
  }
  if (tool === 'pick') {
    if (!o) {
      const so = w.st.soil[k];
      if (so && !so.crop) { delete w.st.soil[k]; G.fx.dust(cx, cy, '#8a5a36'); sfx('till'); return true; }
      if (w.def.id === 'fazenda' && w.st.floors?.[k]) { const id = w.st.floors[k]; delete w.st.floors[k]; spawnDrops(x, y, [{ id, qty: 1 }]); sfx('pick'); return true; }
      return false;
    }
    if (o.t === 'debris') {
      if (o.kind === 'stone') {
        w.setObj(x, y, null); sfx('stoneBreak'); G.fx.burst(cx, cy, ['#9a9a9a', '#7a7a7a', '#c8c8c8'], 8);
        spawnDrops(x, y, [{ id: 'pedra', qty: 1 }, ...(Math.random() < 0.05 ? [{ id: 'carvao', qty: 1 }] : []), ...(Math.random() < 0.03 ? [{ id: 'min_cobre', qty: 1 }] : [])]);
        addXP('mining', 1); return true;
      }
      if (o.kind === 'boulder') {
        if (lvl < 2) { G.toast('Esta rocha é dura demais. Precisa de uma picareta de ferro.'); sfx('error'); shakeObj(); return true; }
        o.hp -= power; shakeObj(); sfx('pick'); G.fx.burst(cx, cy, ['#9a9aa2'], 8);
        if (o.hp <= 0) { w.setObj(x, y, null); spawnDrops(x, y, [{ id: 'pedra', qty: 15 }]); sfx('stoneBreak'); addXP('mining', 15); G.fx.doShake(3, 12); }
        return true;
      }
    }
    if (o.t === 'rock') {
      o.hp -= power; shakeObj(); sfx('pick'); G.fx.burst(cx, cy, ['#9a9a9a', '#6a6a6a'], 5, 0.7);
      if (o.hp <= 0) { w.setObj(x, y, null); sfx('stoneBreak'); G.fx.burst(cx, cy, ['#9a9a9a', '#c8c8c8', '#6a6a6a'], 10); mineRockBroken(x, y, o.kind); }
      return true;
    }
    if (o.t === 'placed') return pickUpPlaced(x, y, o);
    return false;
  }
  return false;
}

function treeSeed(kind: string) { return kind === 'bordo' ? 'semente_bordo' : kind === 'pinheiro' ? 'semente_pinheiro' : 'semente_carvalho'; }
function siloSpace() { const s = getState(); const silos = s.buildings.filter(b => b.type === 'silo' && b.daysLeft <= 0).length; return silos * 240 - (s.flags.hay || 0); }

function pickUpPlaced(x: number, y: number, o: Extract<WObj, { t: 'placed' }>) {
  const w = G.world;
  if (o.id === 'bau' && o.chest?.some(Boolean)) { G.toast('Esvazie o baú antes de removê-lo.'); return true; }
  const items: ItemStack[] = [{ id: o.id, qty: 1 }];
  if (o.machine?.input && !machineReady(o)) items.push({ ...o.machine.input });
  if (o.machine?.output && machineReady(o)) items.push({ ...o.machine.output });
  w.setObj(x, y, null);
  spawnDrops(x, y, items);
  sfx('pick');
  return true;
}

// ---------------- PLANTIO / COLOCAÇÃO ----------------
function doPlant(tx: number, ty: number, h: ItemStack) {
  const w = G.world;
  const so = w.st.soil[key(tx, ty)];
  if (!so) { if (w.def.tillable) G.toast('Prepare a terra com a enxada primeiro.'); else G.toast('Não dá para plantar aqui.'); return; }
  if (so.crop) return;
  const r = plant(w, tx, ty, h.id);
  if (r) { G.toast(r); sfx('error'); return; }
  if (r === '') { removeAt(G.player.sel, 1); sfx('till'); G.fx.dust(tx * TILE + 8, ty * TILE + 10, '#6a4a2a'); questEvent('plant'); G.player.action = { kind: 'lift', t: 0, dur: 0.18, hitAt: 1, hit: false }; }
}

function fertilize(tx: number, ty: number, h: ItemStack) {
  const so = G.world.st.soil[key(tx, ty)];
  if (!so) { G.toast('Use o fertilizante em terra preparada.'); return; }
  if (so.fert) { G.toast('Essa terra já tem fertilizante.'); return; }
  if (so.crop && so.crop.grown > 0 && h.id !== 'acelerador') { G.toast('Aplique antes de a planta brotar.'); return; }
  so.fert = h.id; removeAt(G.player.sel, 1); sfx('till'); G.fx.dust(tx * TILE + 8, ty * TILE + 10, '#5a3a1a');
}

function plantTree(tx: number, ty: number, h: ItemStack) {
  const w = G.world;
  const d = ITEMS[h.id];
  if (!w.def.tillable) { G.toast('Plante árvores na sua fazenda.'); return; }
  if (!w.canPlace(tx, ty) || w.st.soil[key(tx, ty)]) { G.toast('Não há espaço aqui.'); return; }
  const ft = FRUIT_TREES.find(f => f.id === d.sapling);
  if (ft) {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if ((i || j) && (w.solid(tx + i, ty + j) || w.obj(tx + i, ty + j)?.t === 'tree')) { G.toast('Árvores frutíferas precisam de espaço livre 3x3.'); return; }
    w.setObj(tx, ty, { t: 'fruittree', kind: ft.id, age: 0, fruit: 0, hp: 10 });
  } else {
    w.setObj(tx, ty, { t: 'tree', kind: d.sapling!, stage: 0, growth: 0, hp: 1 });
  }
  removeAt(G.player.sel, 1); sfx('till');
}

function placeItem(tx: number, ty: number, h: ItemStack) {
  const w = G.world;
  const s = getState();
  const id = h.id;
  if (id === 'extrator') {
    const o = w.obj(tx, ty);
    if (o?.t === 'tree' && o.stage >= 4 && !o.tapper) { setTapper(o); o.tapper!.output = o.tapper!.output; removeAt(G.player.sel, 1); sfx('place'); G.toast('Extrator instalado.'); return; }
    G.toast('Coloque o extrator em uma árvore adulta.'); return;
  }
  if (id.startsWith('caminho_')) {
    if (!w.def.outdoor && !w.def.id.startsWith('bld')) { G.toast('Não aqui.'); return; }
    if (!w.canPlace(tx, ty) || w.st.soil[key(tx, ty)]) return;
    w.st.floors ||= {};
    if (w.st.floors[key(tx, ty)]) return;
    w.st.floors[key(tx, ty)] = id; removeAt(G.player.sel, 1); sfx('place');
    return;
  }
  if (!w.canPlace(tx, ty)) { G.toast('Não há espaço aqui.'); sfx('error'); return; }
  const px = G.player;
  if (Math.abs(px.x - (tx * TILE + 8)) < 10 && Math.abs(px.y - (ty * TILE + 12)) < 10) return;
  const o: WObj = { t: 'placed', id };
  if (id === 'bau') (o as any).chest = Array(36).fill(null);
  w.setObj(tx, ty, o);
  if (id === 'abelheira') startBees(o as any);
  removeAt(G.player.sel, 1);
  sfx('place');
  G.fx.dust(tx * TILE + 8, ty * TILE + 12);
  s.stats.placed = (s.stats.placed || 0) + 1;
}

// ---------------- INTERAÇÃO ----------------
export function interact(fromPrimary = false): boolean {
  const p = G.player;
  if (p.action) return true;
  const w = G.world;
  const s = getState();
  const [tx, ty] = targetTile();
  const cx = tx * TILE + 8, cy = ty * TILE + 8;
  const h = held();
  // balcão de loja tem prioridade (o lojista fica atrás dele)
  const shopAt = w.counterAt.get(key(tx, ty));
  if (shopAt) { G.ui.openShopAtCounter(shopAt); return true; }
  // NPC
  const npc = (G.npcs as NPCManager).at(w.def.id, cx, cy, 16) || (G.npcs as NPCManager).at(w.def.id, p.x + { up: 0, down: 0, left: -12, right: 12 }[p.facing], p.y - 6 + { up: -12, down: 12, left: 0, right: 0 }[p.facing], 14);
  if (npc && !G.festival?.blockNpc) {
    faceToward(Math.floor(npc.x / TILE), Math.floor(npc.y / TILE));
    npc.facing = ({ up: 'down', down: 'up', left: 'right', right: 'left' } as const)[p.facing];
    npc.pause = 3;
    if (G.festival?.onNpc?.(npc.id)) return true;
    const st = npcState(npc.id);
    // pedido
    const deliver = tryDeliver(npc.id);
    if (deliver) { G.ui.dialogue(npc.id, deliver, 'happy'); return true; }
    if (h && isGiftable(h.id) && st.met && (ITEMS[h.id].cat !== 'tool')) {
      const r = giveGift(npc.id, h);
      if (r.ok) { removeAt(p.sel, 1); if (r.taste === 'love' || r.taste === 'like') { sfx('heart'); npc.emote = '♥'; npc.emoteT = 1.6; } else if (r.taste === 'hate' || r.taste === 'dislike') { npc.emote = '!'; npc.emoteT = 1.2; } }
      G.ui.dialogue(npc.id, r.text, r.expr);
      if (!st.talkedToday) { st.talkedToday = true; }
      return true;
    }
    if ((npc.id === 'joao' && !s.flags.rodGiven) || (npc.id === 'gil' && !s.flags.swordGiven && s.flags.minesOpen)) {
      const first = talk(npc.id);
      const lines: { who: string; text: string; expr?: any }[] = [{ who: npc.id, text: first.text, expr: first.expr }];
      if (npc.id === 'joao') {
        s.flags.rodGiven = true; addItem({ id: 'vara', qty: 1 }); addItem({ id: 'isca', qty: 10 }); questEvent('rod');
        lines.push({ who: 'joao', text: 'Toma aqui a vara e umas iscas! Segura o botão pra medir a força e solta pra lançar. Quando aparecer o "!", aperta de novo e mantém o peixe dentro da barrinha verde!', expr: 'happy' });
      } else {
        s.flags.swordGiven = true; addItem({ id: 'espada_velha', qty: 1 });
        lines.push({ who: 'gil', text: 'Toma, a espada velha que eu prometi. Selecione-a e use o botão de usar para golpear. Mantenha distância das gosmas e leve comida!', expr: 'neutral' });
      }
      G.ui.showLines(lines);
      return true;
    }
    const t = talk(npc.id);
    G.ui.dialogue(npc.id, t.text, t.expr);
    return true;
  }
  // animal
  const an = animalAt(w.def.id, cx, cy);
  if (an) { petAnimal(an); return true; }
  // cavalo
  if (G.ui.horseAt?.(cx, cy)) { s.player.horse = true; sfx('pet'); G.toast('Montou no cavalo! (pressione E longe de objetos para desmontar)'); return true; }
  const o = w.obj(tx, ty);
  const soil = w.st.soil[key(tx, ty)];
  if (soil && cropReady(soil) && !soil.crop!.giant) {
    const c = CROP_BY_ID[soil.crop!.id];
    if (c?.scythe) { G.toast('Use a foice para colher.'); return true; }
    const out = harvest(w, tx, ty);
    if (!out.length) return false;
    faceToward(tx, ty);
    let lifted = false;
    for (const it of out) { const left = addItem(it); if (left) spawnDrops(tx, ty, [{ ...it, qty: left }]); else if (!lifted) { lifted = true; p.lift = { item: it.id, t: 0.55 }; } }
    sfx('harvest');
    G.fx.burst(cx, cy + 2, ['#6ab84a', '#8ad86a'], 6, 0.6);
    p.action = { kind: 'lift', t: 0, dur: 0.3, hitAt: 1, hit: false };
    questEvent('harvest');
    return true;
  }
  if (o) {
    if (o.t === 'forage') {
      const q = forageQuality();
      const st: ItemStack = { id: o.id, qty: 1, q: ITEMS[o.id]?.quality ? q : 0 };
      if (!canFit(st)) { G.toast('Inventário cheio.'); return true; }
      w.setObj(tx, ty, null); addItem(st); sfx('pickup'); addXP('foraging', 7);
      p.lift = { item: o.id, t: 0.55 }; p.action = { kind: 'lift', t: 0, dur: 0.3, hitAt: 1, hit: false };
      s.stats.forage = (s.stats.forage || 0) + 1;
      return true;
    }
    if (o.t === 'placed') {
      if (o.id === 'bau') { G.ui.openChest(o); return true; }
      if (isMachine(o.id)) {
        if (machineReady(o)) { collect(o); return true; }
        const msg = insert(o, h && !ITEMS[h.id].tool ? h : null);
        if (msg) G.toast(msg); else if (o.machine) G.toast(statusText(o));
        return true;
      }
      if (o.id === 'funil') { G.toast(`Funil de feno: ${s.flags.hay || 0} feno no silo.`); return true; }
      if (o.id === 'coletor') { const items = (o as any).chest?.filter(Boolean) || []; if (!items.length) { G.toast('O coletor está vazio.'); return true; } (o as any).chest = (o as any).chest || []; G.ui.openChest(o); return true; }
      if (o.id.startsWith('aspersor')) { G.toast(ITEMS[o.id].desc); return true; }
    }
    if (o.t === 'fruittree' && o.fruit > 0) {
      const ft = FRUIT_TREES.find(f => f.id === o.kind)!;
      const q = o.age > 112 ? 2 : o.age > 56 ? 1 : 0;
      spawnDrops(tx, ty + 1, [{ id: ft.fruit, qty: o.fruit, q }]); o.fruit = 0; G.ui.shakeTile?.(w.def.id, key(tx, ty)); sfx('chop');
      return true;
    }
    if (o.t === 'tree' && o.tapper?.output && (o.tapper.readyAt || 0) <= absMinutes(s)) {
      addItem({ ...o.tapper.output }); sfx('pickup'); setTapper(o); return true;
    }
    if (o.t === 'tree' && o.stage >= 4) { G.ui.shakeTile?.(w.def.id, key(tx, ty)); sfx('chop'); if (Math.random() < 0.1 && !(o as any).shook) { (o as any).shook = true; spawnDrops(tx, ty + 1, [{ id: treeSeed(o.kind), qty: 1 }]); } return true; }
    if (o.t === 'ladder') { G.ui.mineDescend?.(); return true; }
  }
  const id = w.interactAt.get(key(tx, ty));
  if (id) { G.ui.interactId(id, tx, ty); return true; }
  const shop = w.counterAt.get(key(tx, ty));
  if (shop) { G.ui.openShopAtCounter(shop); return true; }
  // desmontar do cavalo
  if (s.player.horse && !fromPrimary) { G.ui.dismount?.(); return true; }
  if (!fromPrimary && h) {
    const d = ITEMS[h.id];
    if (d.energy !== undefined && (d.cat === 'food' || d.energy > 0) && !d.seedOf) { askEat(h); return true; }
    if (h.id === 'totem_chuva' || h.id === 'totem_casa') { useTotem(h); return true; }
  }
  return false;
}

function askEat(h: ItemStack) {
  const d = ITEMS[h.id];
  G.ui.confirm(`Comer ${itemName(h.id, h.ref)}? (+${Math.round((d.energy || 0) * (1 + (h.q || 0) * 0.4))} energia)`, () => eat(G.player.sel));
}
export function eat(slot: number) {
  const s = getState();
  const it = s.inventory[slot]; if (!it) return;
  const d = ITEMS[it.id];
  const mult = 1 + (it.q || 0) * 0.4;
  removeAt(slot, 1);
  G.player.lift = { item: it.id, t: 1.0 };
  G.player.action = { kind: 'eat', t: 0, dur: 1.0, hitAt: 0.5, hit: false, onHit: () => {
    const e = Math.round((d.energy || 0) * mult), hp = Math.round((d.hp ?? (d.energy || 0) * 0.45) * mult);
    s.player.energy = Math.min(s.player.maxEnergy, s.player.energy + e);
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + hp);
    if (s.player.energy > 0) s.player.exhausted = false;
    G.fx.float(G.player.x, G.player.y - 30, `+${e} energia`, '#f8d86a');
    sfx('eat');
  } };
}

function useTotem(h: ItemStack) {
  const s = getState();
  if (h.id === 'totem_chuva') {
    s.weather.tomorrow = s.time.season === 3 ? 'neve' : 'chuva';
    removeAt(G.player.sel, 1); G.fx.doFlash('#a0c0ff', 0.5); sfx('thunder');
    G.toast('Nuvens se juntam no horizonte. Amanhã vai ' + (s.time.season === 3 ? 'nevar.' : 'chover.'));
  } else {
    removeAt(G.player.sel, 1); G.fx.doFlash('#a0ffa0', 0.6); sfx('warp');
    G.warp('fazenda', 34, 11, 'down');
  }
}

export { swingWeapon, WEAPONS, level, NPCS, portrait, mapState };
