// Persistência: IndexedDB com backup do save anterior e fallback em localStorage.
import { GameState } from './state';

const DB = 'vale-candeia', STORE = 'saves';
let dbp: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise(res => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  });
  return dbp;
}
async function put(k: string, v: string) {
  const d = await db();
  if (d) {
    try { await new Promise<void>((res, rej) => { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); return true; } catch { /* cai para localStorage */ }
  }
  try { localStorage.setItem(DB + ':' + k, v); return true; } catch { return false; }
}
async function get(k: string): Promise<string | null> {
  const d = await db();
  if (d) {
    try { const v = await new Promise<string | null>((res) => { const tx = d.transaction(STORE, 'readonly'); const rq = tx.objectStore(STORE).get(k); rq.onsuccess = () => res(rq.result ?? null); rq.onerror = () => res(null); }); if (v) return v; } catch { /* nada */ }
  }
  try { return localStorage.getItem(DB + ':' + k); } catch { return null; }
}
async function del(k: string) {
  const d = await db();
  if (d) try { const tx = d.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(k); } catch { }
  try { localStorage.removeItem(DB + ':' + k); } catch { }
}

export interface SlotInfo { slot: number; name: string; farm: string; day: number; season: number; year: number; money: number; saved: number }

export async function saveGame(s: GameState, slot: number) {
  const prev = await get('slot' + slot);
  if (prev) await put('slot' + slot + '_backup', prev);
  const data = JSON.stringify({ savedAt: Date.now(), state: s });
  const ok = await put('slot' + slot, data);
  await put('meta' + slot, JSON.stringify({ slot, name: s.player.name, farm: s.player.farmName, day: s.time.day, season: s.time.season, year: s.time.year, money: s.player.money, saved: Date.now() } as SlotInfo));
  await put('lastSlot', String(slot));
  return ok;
}
export async function loadGame(slot: number, backup = false): Promise<GameState | null> {
  const raw = await get('slot' + slot + (backup ? '_backup' : ''));
  if (!raw) return null;
  try { return migrate(JSON.parse(raw).state); } catch { return backup ? null : loadGame(slot, true); }
}
export async function listSlots(): Promise<(SlotInfo | null)[]> {
  const out: (SlotInfo | null)[] = [];
  for (let i = 0; i < 3; i++) { const m = await get('meta' + i); out.push(m ? JSON.parse(m) : null); }
  return out;
}
export async function lastSlot() { const v = await get('lastSlot'); return v ? +v : -1; }
export async function deleteSlot(slot: number) { await del('slot' + slot); await del('slot' + slot + '_backup'); await del('meta' + slot); }

function migrate(s: GameState): GameState {
  s.flags ||= {}; s.stats ||= {}; s.festivalsDone ||= []; s.collection ||= { fish: {}, shipped: {}, minerals: {}, cooked: {} };
  s.collection.cooked ||= {}; s.pendingLevelUps ||= []; s.mailSeen ||= []; s.luck ||= 0;
  if (s.inventory.length < 48) s.inventory = [...s.inventory, ...Array(48 - s.inventory.length).fill(null)];
  return s;
}
