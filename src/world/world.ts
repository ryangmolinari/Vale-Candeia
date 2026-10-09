// Instância de mapa em tempo de execução: colisão, objetos e consultas.
import { TILE, key } from '../core/util';
import { T, TILE_INFO, MapDef, Deco, Building } from './types';
import { MAPS, buildAnimalHouse, buildFarmhouse } from './maps';
import { getState, mapState, MapState, WObj, FarmBuilding } from '../state/state';
import { BUILDS } from '../data/game';
import { generateMine } from './mine';

export class World {
  def: MapDef;
  st: MapState;
  staticSolid: Uint8Array;
  decoAt = new Map<string, Deco>();
  interactAt = new Map<string, string>();
  counterAt = new Map<string, string>();
  farmBuildings: { b: FarmBuilding; bld: Building }[] = [];
  constructor(def: MapDef) {
    this.def = def;
    this.st = mapState(def.id);
    this.staticSolid = new Uint8Array(def.w * def.h);
    this.rebuildStatic();
  }
  rebuildStatic() {
    const d = this.def;
    this.decoAt.clear(); this.interactAt.clear(); this.counterAt.clear();
    for (let i = 0; i < d.w * d.h; i++) this.staticSolid[i] = TILE_INFO[d.tiles[i]]?.solid ? 1 : 0;
    for (const dc of d.decos) {
      if (dc.solid) {
        const w = dc.solidW || 1, h = dc.solidH || 1;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.setSolid(dc.x + i, dc.y - j);
      }
      this.decoAt.set(key(dc.x, dc.y), dc);
    }
    for (const b of d.buildings) this.markBuilding(b);
    for (const it of d.interacts || []) this.interactAt.set(key(it.x, it.y), it.id);
    for (const c of d.counters || []) this.counterAt.set(key(c.x, c.y), c.shop);
    // prédios da fazenda
    this.farmBuildings = [];
    if (d.id === 'fazenda') {
      for (const fb of getState().buildings) {
        const def = BUILDS.find(x => x.id === fb.type)!;
        const bld: Building = { id: fb.id, x: fb.x, y: fb.y, w: def.w, h: def.h, sprite: 'fb_' + fb.type + (fb.daysLeft > 0 ? '_obra' : '') };
        if (def.animalHouse && fb.daysLeft <= 0) {
          const doorX = fb.x + def.doorX, doorY = fb.y + def.h - 1;
          bld.door = { x: doorX, y: doorY, to: 'bld_' + fb.id, tx: 3, ty: (def.animalHouse === 'coop' ? 10 : 12) - 2 };
        }
        this.farmBuildings.push({ b: fb, bld });
        this.markBuilding(bld);
        if (fb.type === 'poco') this.interactAt.set(key(fb.x + 1, fb.y + 2), 'well');
        if (fb.type === 'silo') this.interactAt.set(key(fb.x + 1, fb.y + 2), 'silo');
        if (fb.type === 'estabulo') this.interactAt.set(key(fb.x + 1, fb.y + 2), 'stable');
      }
    }
  }
  private markBuilding(b: Building) {
    for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) this.setSolid(b.x + i, b.y + j);
    if (b.door) this.staticSolid[b.door.y * this.def.w + b.door.x] = 0;
  }
  private setSolid(x: number, y: number) { if (x >= 0 && y >= 0 && x < this.def.w && y < this.def.h) this.staticSolid[y * this.def.w + x] = 1; }
  inBounds(tx: number, ty: number) { return tx >= 0 && ty >= 0 && tx < this.def.w && ty < this.def.h; }
  tile(tx: number, ty: number) { return this.inBounds(tx, ty) ? this.def.tiles[ty * this.def.w + tx] : T.VOID; }
  isWater(tx: number, ty: number) { return !!TILE_INFO[this.tile(tx, ty)]?.water; }
  obj(tx: number, ty: number): WObj | undefined { return this.st.objects[key(tx, ty)]; }
  setObj(tx: number, ty: number, o: WObj | null) { const k = key(tx, ty); if (o) this.st.objects[k] = o; else delete this.st.objects[k]; }
  objSolid(o: WObj | undefined): boolean {
    if (!o) return false;
    switch (o.t) {
      case 'debris': return true;
      case 'tree': return o.stage >= 2;
      case 'fruittree': return o.age >= 7;
      case 'placed': return !['caminho_pedra', 'caminho_madeira', 'tapete', 'tapete_verde'].includes(o.id);
      case 'rock': return true;
      default: return false;
    }
  }
  solid(tx: number, ty: number, ignoreObjects = false) {
    if (!this.inBounds(tx, ty)) return true;
    if (this.staticSolid[ty * this.def.w + tx]) return true;
    if (!ignoreObjects && this.objSolid(this.obj(tx, ty))) return true;
    const soil = this.st.soil[key(tx, ty)];
    if (soil?.crop?.giant) return true;
    return false;
  }
  /** Colisão por retângulo em pixels. */
  rectSolid(x: number, y: number, w: number, h: number) {
    const x0 = Math.floor(x / TILE), y0 = Math.floor(y / TILE), x1 = Math.floor((x + w - 0.01) / TILE), y1 = Math.floor((y + h - 0.01) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solid(tx, ty)) return true;
    return false;
  }
  canTill(tx: number, ty: number) {
    if (!this.def.tillable) return false;
    if (!TILE_INFO[this.tile(tx, ty)]?.tillable) return false;
    if (this.staticSolid[ty * this.def.w + tx]) return false;
    if (this.obj(tx, ty)) return false;
    if (this.st.soil[key(tx, ty)]) return false;
    if (this.decoAt.has(key(tx, ty))) return false;
    if (this.def.id === 'fazenda' && this.st.floors?.[key(tx, ty)]) return false;
    return true;
  }
  /** Tile livre para colocar objeto. */
  canPlace(tx: number, ty: number, allowSoil = false) {
    if (!this.inBounds(tx, ty) || this.staticSolid[ty * this.def.w + tx]) return false;
    if (this.obj(tx, ty)) return false;
    if (!allowSoil && this.st.soil[key(tx, ty)]?.crop) return false;
    if (this.decoAt.has(key(tx, ty))) return false;
    for (const w of this.def.warps) if (tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) return false;
    return true;
  }
}

const cache: Record<string, World> = {};
/** Obtém (ou cria) o mapa pelo id. Mapas dinâmicos: casa, prédios de animais, minas. */
export function getWorld(id: string, fresh = false): World {
  if (id === 'casa') {
    const lvl = getState().houseLevel;
    if (!MAPS.casa || (MAPS.casa as any)._lvl !== lvl) { const m = buildFarmhouse(lvl); (m as any)._lvl = lvl; delete cache.casa; }
  }
  if (id.startsWith('bld_')) {
    const fb = getState().buildings.find(b => 'bld_' + b.id === id);
    if (fb) {
      const def = BUILDS.find(x => x.id === fb.type)!;
      const lvl = fb.type.endsWith('_g') ? 1 : 0;
      const sig = fb.type + lvl;
      if (!MAPS[id] || (MAPS[id] as any)._sig !== sig) { const m = buildAnimalHouse(id, def.animalHouse === 'coop' ? 'galinheiro' : 'celeiro', lvl, fb.x + def.doorX, fb.y + def.h - 1); (m as any)._sig = sig; delete cache[id]; }
    }
  }
  if (id.startsWith('mina_')) {
    if (fresh || !MAPS[id]) { MAPS[id] = generateMine(+id.slice(5)); delete cache[id]; }
  }
  if (!cache[id] || fresh) {
    const def = MAPS[id];
    if (!def) throw new Error('Mapa inexistente: ' + id);
    cache[id] = new World(def);
  }
  return cache[id];
}
export function invalidateWorld(id: string) { delete cache[id]; }
export function dropMineCache() { for (const k of Object.keys(cache)) if (k.startsWith('mina_')) { delete cache[k]; delete MAPS[k]; delete getState().maps[k]; } }
