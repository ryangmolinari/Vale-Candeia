// Animais da fazenda: compra, alimentação, carinho, produção e automação.
import { TILE, key } from '../core/util';
import { G } from '../core/ctx';
import { getState, AnimalState, mapState } from '../state/state';
import { ANIMALS, BUILDS } from '../data/game';
import { sfx } from '../audio/audio';
import { addXP, hasProf } from './skills';
import { addItem, countItem, removeItem } from './inventory';
import { questEvent } from './quests';
import { getWorld } from '../world/world';

export interface AnimalEnt { st: AnimalState; x: number; y: number; t: number; vx: number; vy: number; facing: 'left' | 'right'; frame: number; eating: boolean; emote?: string; emoteT: number }

export function buildingCapacity(type: string) { return type.endsWith('_g') ? 8 : 4; }
export function houseFor(kind: 'coop' | 'barn') { return getState().buildings.filter(b => b.daysLeft <= 0 && BUILDS.find(x => x.id === b.type)?.animalHouse === kind); }

export function loadAnimals(mapId: string) {
  const s = getState();
  G.animals = [];
  if (!mapId.startsWith('bld_')) return;
  const bid = mapId.slice(4);
  const w = G.world;
  for (const a of s.animals.filter(x => x.building === bid)) {
    let { x, y } = a;
    if (!x || w.solid(Math.floor(x / TILE), Math.floor(y / TILE))) { x = (4 + Math.random() * (w.def.w - 8)) * TILE; y = (5 + Math.random() * (w.def.h - 8)) * TILE; }
    G.animals.push({ st: a, x, y, t: Math.random() * 3, vx: 0, vy: 0, facing: Math.random() < 0.5 ? 'left' : 'right', frame: 0, eating: false, emoteT: 0 });
  }
}

export function updateAnimals(dt: number) {
  const w = G.world;
  for (const a of G.animals as AnimalEnt[]) {
    a.t -= dt;
    if (a.emoteT > 0) a.emoteT -= dt;
    if (a.t <= 0) {
      a.t = 1.5 + Math.random() * 3;
      const r = Math.random();
      if (r < 0.4) { a.vx = 0; a.vy = 0; a.eating = Math.random() < 0.4; }
      else { const ang = Math.random() * Math.PI * 2; a.vx = Math.cos(ang) * 10; a.vy = Math.sin(ang) * 7; a.eating = false; }
      if (Math.random() < 0.08) { const def = ANIMALS.find(d => d.id === a.st.kind)!; if (G.world.def.id.startsWith('bld_')) sfx(def.sound); }
    }
    if (a.vx || a.vy) {
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
      if (!w.rectSolid(nx - 5, ny - 4, 10, 4)) { a.x = nx; a.y = ny; } else { a.vx = -a.vx; a.vy = -a.vy; }
      a.facing = a.vx < 0 ? 'left' : 'right';
      a.frame = Math.floor(performance.now() / 220) % 2;
    }
    a.st.x = a.x; a.st.y = a.y;
  }
}

export function animalAt(map: string, px: number, py: number) {
  if (!map.startsWith('bld_')) return null;
  let best: AnimalEnt | null = null, bd = 16;
  for (const a of G.animals as AnimalEnt[]) { const d = Math.hypot(a.x - px, a.y - 6 - py); if (d < bd) { bd = d; best = a; } }
  return best;
}

export function petAnimal(a: AnimalEnt) {
  const s = getState();
  const def = ANIMALS.find(d => d.id === a.st.kind)!;
  let msg = '';
  if (!a.st.pettedToday) {
    a.st.pettedToday = true; a.st.friendship = Math.min(1000, a.st.friendship + 15); a.st.happiness = Math.min(255, a.st.happiness + 40);
    a.emote = '♥'; a.emoteT = 1.4; sfx(def.sound); addXP('farming', 5);
    msg = `${a.st.name} adorou o carinho!`;
  }
  if (a.st.produce) {
    const q = qualityFor(a.st);
    const prod = a.st.produce;
    if (addItem({ id: prod, qty: 1, q }) === 0) { a.st.produce = undefined; sfx('pickup'); msg = (msg ? msg + ' ' : '') + 'Produto coletado!'; G.player.lift = { item: prod, t: 0.6 }; }
    else msg = 'Inventário cheio.';
  }
  G.ui.animalInfo(a.st, msg);
}

export function qualityFor(a: AnimalState) {
  const r = Math.random();
  const f = a.friendship / 1000, h = a.happiness / 255;
  if (r < f * h * 0.33) return 2;
  if (r < f * h * 0.8) return 1;
  return 0;
}

export function buyAnimal(kind: string, buildingId: string, name: string) {
  const s = getState();
  const def = ANIMALS.find(d => d.id === kind)!;
  if (s.player.money < def.price) return 'Dinheiro insuficiente.';
  const b = s.buildings.find(x => x.id === buildingId);
  if (!b) return 'Construção inválida.';
  if (s.animals.filter(a => a.building === buildingId).length >= buildingCapacity(b.type)) return 'Essa construção está cheia.';
  s.player.money -= def.price;
  const color = def.colors[Math.floor(Math.random() * def.colors.length)];
  s.animals.push({ id: 'a' + Date.now() + Math.floor(Math.random() * 999), kind, name: name || def.name, building: buildingId, age: 0, friendship: 0, happiness: 150, fedToday: false, pettedToday: false, x: 0, y: 0, color });
  questEvent('animal');
  return null;
}

/** Comedouros e funil: o jogador enche a manjedoura com feno do silo. */
export function troughInteract(i: number) {
  const s = getState();
  const bid = G.world.def.id.slice(4);
  const b = s.buildings.find(x => x.id === bid); if (!b) return;
  b.troughs ||= [];
  if (b.troughs[i]) { G.toast('O comedouro já está cheio.'); return; }
  if (countItem('feno') > 0) { removeItem('feno', 1); b.troughs[i] = true; sfx('place'); return; }
  if ((s.flags.hay || 0) > 0) { s.flags.hay--; b.troughs[i] = true; sfx('place'); return; }
  G.toast('Sem feno! Construa um silo e corte grama com a foice, ou compre no Rancho Campos.');
}
export function hopperInteract() {
  const s = getState();
  if ((s.flags.hay || 0) <= 0) { G.toast('O silo está vazio. Corte grama com a foice (com um silo construído) ou compre feno.'); return; }
  const take = Math.min(s.flags.hay, 10);
  s.flags.hay -= take; addItem({ id: 'feno', qty: take }); sfx('pickup');
}

/** Processamento noturno dos animais. */
export function animalsOvernight() {
  const s = getState();
  for (const b of s.buildings) {
    const def = BUILDS.find(x => x.id === b.type)!;
    if (!def.animalHouse || b.daysLeft > 0) continue;
    const animals = s.animals.filter(a => a.building === b.id);
    b.troughs ||= [];
    const ms = mapState('bld_' + b.id);
    const hasHopper = Object.values(ms.objects).some(o => o.t === 'placed' && o.id === 'funil');
    const grabber = Object.entries(ms.objects).find(([, o]) => o.t === 'placed' && o.id === 'coletor');
    let food = b.troughs.filter(Boolean).length;
    for (const a of animals) {
      const adef = ANIMALS.find(d => d.id === a.kind)!;
      a.age++;
      const fed = food > 0; if (fed) food--;
      if (!a.pettedToday) a.friendship = Math.max(0, a.friendship - 10);
      a.happiness = Math.max(0, Math.min(255, a.happiness + (fed ? 20 : -60) + (a.pettedToday ? 10 : -20)));
      if (!fed) a.friendship = Math.max(0, a.friendship - 20);
      a.pettedToday = false;
      if (a.age >= adef.babyDays && fed && (a.age % adef.every === 0)) {
        let prod = adef.produce;
        if (adef.deluxe && Math.random() < (a.friendship / 1000) * (a.happiness / 255) * 0.5) prod = adef.deluxe;
        if (adef.house === 'coop') {
          // ovo aparece no chão do galinheiro
          for (let tries = 0; tries < 20; tries++) {
            const x = 3 + Math.floor(Math.random() * 8), y = 5 + Math.floor(Math.random() * 3);
            if (!ms.objects[key(x, y)]) { ms.objects[key(x, y)] = { t: 'forage', id: prod }; break; }
          }
        } else a.produce = prod;
      }
    }
    b.troughs = [];
    // funil enche os comedouros para o dia seguinte
    if (hasHopper) {
      const n = buildingCapacity(b.type);
      for (let i = 0; i < Math.min(n, animals.length); i++) { if ((s.flags.hay || 0) > 0) { s.flags.hay--; b.troughs[i] = true; } }
    }
    // coletor recolhe produtos
    if (grabber) {
      const g = grabber[1] as any;
      g.chest ||= Array(36).fill(null);
      const put = (id: string, q: number) => { const slot = g.chest.findIndex((c: any) => c && c.id === id && (c.q || 0) === q); if (slot >= 0) g.chest[slot].qty++; else { const e = g.chest.indexOf(null); if (e >= 0) g.chest[e] = { id, qty: 1, q }; } };
      for (const [k, o] of Object.entries(ms.objects)) if (o.t === 'forage') { put(o.id, 0); delete ms.objects[k]; }
      for (const a of animals) if (a.produce) { put(a.produce, qualityFor(a)); a.produce = undefined; }
    }
  }
}

export function stableHorse() { return getState().buildings.some(b => b.type === 'estabulo' && b.daysLeft <= 0); }
export { getWorld };
