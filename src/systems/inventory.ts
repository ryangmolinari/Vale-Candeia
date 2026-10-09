// Inventário em slots, empilhamento e helpers de itens.
import { getState, ItemStack } from '../state/state';
import { ITEMS, itemDef, artisanPrice, QUALITY_MULT, Cat } from '../data/items';
import { bus } from '../core/util';

export function stackMax(id: string) { return ITEMS[id]?.stack ?? 999; }
export function sameKind(a: ItemStack, b: ItemStack) { return a.id === b.id && (a.q || 0) === (b.q || 0) && (a.ref || '') === (b.ref || ''); }

export function sellPrice(st: ItemStack): number {
  const d = ITEMS[st.id]; if (!d) return 0;
  let p = d.price;
  if (st.ref) p = artisanPrice(st.id, st.ref);
  p = Math.floor(p * QUALITY_MULT[st.q || 0]);
  const s = getState();
  // profissões
  const prof = (k: string) => Object.values(s.skills).some(sk => sk.profs.includes(k));
  if ((d.cat === 'crop' || d.cat === 'fruit' || d.cat === 'flower') && prof('lavrador')) p = Math.floor(p * 1.1);
  if (d.cat === 'artisan' && prof('artesao')) p = Math.floor(p * 1.4);
  if (d.cat === 'animal' && prof('criador')) p = Math.floor(p * 1.2);
  if (d.cat === 'fish' && prof('pescador')) p = Math.floor(p * 1.25);
  if (d.cat === 'fish' && prof('angler')) p = Math.floor(p * 1.5);
  if ((d.cat === 'gem') && prof('gemologo')) p = Math.floor(p * 1.3);
  if (d.cat === 'forage' && prof('coletor')) p = Math.floor(p * 1.2);
  return p;
}

export function inv() { return getState().inventory; }

/** Adiciona ao inventário. Retorna quantidade que NÃO coube. */
export function addItem(st: ItemStack, notify = true): number {
  const s = getState();
  let left = st.qty;
  const max = stackMax(st.id);
  for (let i = 0; i < s.invSize && left > 0; i++) {
    const it = s.inventory[i];
    if (it && sameKind(it, st) && it.qty < max) { const add = Math.min(max - it.qty, left); it.qty += add; left -= add; }
  }
  for (let i = 0; i < s.invSize && left > 0; i++) {
    if (!s.inventory[i]) { const add = Math.min(max, left); s.inventory[i] = { id: st.id, qty: add, q: st.q, ref: st.ref }; left -= add; }
  }
  const added = st.qty - left;
  if (added > 0) {
    if (notify) bus.emit('itemAdded', { ...st, qty: added });
    trackCollection(st, added);
  }
  bus.emit('invChanged');
  return left;
}

function trackCollection(st: ItemStack, n: number) {
  const s = getState();
  const d = ITEMS[st.id];
  if (!d) return;
  if (d.cat === 'gem' || d.cat === 'ore' || d.cat === 'bar') s.collection.minerals[st.id] = (s.collection.minerals[st.id] || 0) + n;
}

export function canFit(st: ItemStack) {
  const s = getState();
  let left = st.qty; const max = stackMax(st.id);
  for (let i = 0; i < s.invSize; i++) { const it = s.inventory[i]; if (!it) left -= max; else if (sameKind(it, st)) left -= max - it.qty; if (left <= 0) return true; }
  return left <= 0;
}

export function matches(st: ItemStack, want: string) {
  if (want.startsWith('cat:')) {
    const c = want.slice(4);
    const d = ITEMS[st.id];
    if (!d) return false;
    if (c === 'mushroom') return ['morel', 'cogumelo', 'cogvermelho'].includes(st.id);
    return d.cat === c;
  }
  return st.id === want;
}

export function countItem(want: string, minQ = 0) {
  const s = getState();
  let n = 0;
  for (let i = 0; i < s.invSize; i++) { const it = s.inventory[i]; if (it && matches(it, want) && (it.q || 0) >= minQ) n += it.qty; }
  return n;
}

/** Remove quantidade (prioriza menor qualidade). Retorna os stacks removidos. */
export function removeItem(want: string, qty: number, minQ = 0): ItemStack[] {
  const s = getState();
  const removed: ItemStack[] = [];
  const idx = [...Array(s.invSize).keys()].filter(i => s.inventory[i] && matches(s.inventory[i]!, want) && (s.inventory[i]!.q || 0) >= minQ)
    .sort((a, b) => (s.inventory[a]!.q || 0) - (s.inventory[b]!.q || 0));
  for (const i of idx) {
    if (qty <= 0) break;
    const it = s.inventory[i]!;
    const take = Math.min(it.qty, qty);
    removed.push({ id: it.id, qty: take, q: it.q, ref: it.ref });
    it.qty -= take; qty -= take;
    if (it.qty <= 0) s.inventory[i] = null;
  }
  bus.emit('invChanged');
  return removed;
}

export function removeAt(slot: number, qty = 1): ItemStack | null {
  const s = getState();
  const it = s.inventory[slot];
  if (!it) return null;
  const take = Math.min(qty, it.qty);
  it.qty -= take;
  const out = { id: it.id, qty: take, q: it.q, ref: it.ref };
  if (it.qty <= 0) s.inventory[slot] = null;
  bus.emit('invChanged');
  return out;
}

export function hasIngredients(ing: [string, number][]) { return ing.every(([id, n]) => countItem(id) >= n); }

export function isGiftable(id: string) {
  const c: Cat = ITEMS[id]?.cat;
  return !!c && !['tool', 'placeable', 'furniture', 'special'].includes(c) || id === 'buque' || id === 'pingente';
}

export function freeSlots() { const s = getState(); let n = 0; for (let i = 0; i < s.invSize; i++) if (!s.inventory[i]) n++; return n; }

export function sortInventory(from = 12) {
  const s = getState();
  const items = s.inventory.slice(from, s.invSize).filter(Boolean) as ItemStack[];
  const order: Cat[] = ['tool', 'weapon', 'seed', 'sapling', 'crop', 'fruit', 'flower', 'forage', 'fish', 'animal', 'artisan', 'food', 'resource', 'ore', 'bar', 'gem', 'monster', 'fertilizer', 'bait', 'placeable', 'furniture', 'special', 'trash'];
  // agrupar
  const merged: ItemStack[] = [];
  for (const it of items) { const m = merged.find(x => sameKind(x, it) && x.qty < stackMax(x.id)); if (m) { const add = Math.min(stackMax(m.id) - m.qty, it.qty); m.qty += add; if (it.qty - add > 0) merged.push({ ...it, qty: it.qty - add }); } else merged.push({ ...it }); }
  merged.sort((a, b) => order.indexOf(itemDef(a.id).cat) - order.indexOf(itemDef(b.id).cat) || a.id.localeCompare(b.id) || (b.q || 0) - (a.q || 0));
  for (let i = from; i < s.invSize; i++) s.inventory[i] = merged[i - from] || null;
  bus.emit('invChanged');
}
