// DSL para construir mapas de forma orgânica.
import { T, MapDef, Deco, Building, Warp, FishZone } from './types';
import { rng } from '../core/util';
import type { BuildingStyle } from '../art/objects';

export interface POI { map: string; x: number; y: number; dir?: 'up' | 'down' | 'left' | 'right' }
export const POIS: Record<string, POI> = {};
export const BUILDING_STYLES: Record<string, BuildingStyle> = {};

export class MB {
  tiles: Uint8Array;
  decos: Deco[] = [];
  buildings: Building[] = [];
  warps: Warp[] = [];
  counters: { x: number; y: number; shop: string }[] = [];
  interacts: { x: number; y: number; id: string }[] = [];
  constructor(public id: string, public name: string, public w: number, public h: number, fillT: T = T.GRASS) {
    this.tiles = new Uint8Array(w * h).fill(fillT);
  }
  in(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x: number, y: number) { return this.in(x, y) ? this.tiles[y * this.w + x] : T.VOID; }
  set(x: number, y: number, t: T) { if (this.in(x, y)) this.tiles[y * this.w + x] = t; return this; }
  fill(x: number, y: number, w: number, h: number, t: T) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, t); return this; }
  /** Caminho ondulado entre dois pontos. */
  path(x0: number, y0: number, x1: number, y1: number, width: number, t: T, wobble = 0, seed = 1) {
    const R = rng(seed);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1;
    let off = 0;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      if (wobble) off = Math.max(-wobble, Math.min(wobble, off + (R() - 0.5) * 0.6));
      const horiz = Math.abs(x1 - x0) > Math.abs(y1 - y0);
      const x = x0 + (x1 - x0) * k + (horiz ? 0 : off), y = y0 + (y1 - y0) * k + (horiz ? off : 0);
      for (let a = 0; a < width; a++) for (let b = 0; b < width; b++) this.set(Math.round(x) + a, Math.round(y) + b, t);
    }
    return this;
  }
  /** Rio/margem orgânica seguindo pontos. */
  river(pts: [number, number][], width: number, deepCenter = false, seed = 3) {
    const R = rng(seed);
    for (let p = 0; p < pts.length - 1; p++) {
      const [x0, y0] = pts[p], [x1, y1] = pts[p + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 3 + 1;
      for (let i = 0; i <= n; i++) {
        const k = i / n; const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        const ww = width + (R() < 0.3 ? 1 : 0);
        for (let a = -Math.floor(ww / 2); a < Math.ceil(ww / 2); a++) for (let b = -Math.floor(ww / 2); b < Math.ceil(ww / 2); b++) {
          const tx = Math.round(x + a), ty = Math.round(y + b);
          if (this.get(tx, ty) === T.BRIDGE) continue;
          this.set(tx, ty, deepCenter && Math.abs(a) < ww / 2 - 1 && Math.abs(b) < ww / 2 - 1 ? T.DEEP : T.WATER);
        }
      }
    }
    return this;
  }
  lake(cx: number, cy: number, rx: number, ry: number, seed = 5) {
    const R = rng(seed);
    for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
      const n = 1 + (R() - 0.5) * 0.25;
      if (d < n) this.set(cx + x, cy + y, d < 0.45 ? T.DEEP : T.WATER);
    }
    return this;
  }
  cliffRow(x0: number, x1: number, y: number, h = 2) { for (let x = x0; x <= x1; x++) for (let j = 0; j < h; j++) this.set(x, y + j, T.CLIFF); return this; }
  deco(d: Deco) { this.decos.push(d); return this; }
  tree(x: number, y: number, kind = 'carvalho') { return this.deco({ x, y, sprite: 'tree:' + kind, solid: true, sway: true, shadow: true }); }
  /** Linha de árvores de borda. */
  treeLine(x0: number, y0: number, x1: number, y1: number, step = 2, seed = 7, kinds = ['carvalho', 'pinheiro', 'bordo']) {
    const R = rng(seed);
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i += step) {
      const k = n ? i / n : 0;
      const x = Math.round(x0 + (x1 - x0) * k + (R() - 0.5)), y = Math.round(y0 + (y1 - y0) * k + (R() - 0.5));
      if (!this.decos.some(d => d.x === x && d.y === y)) this.tree(x, y, kinds[Math.floor(R() * kinds.length)]);
    }
    return this;
  }
  bush(x: number, y: number, v = 1) { return this.deco({ x, y, sprite: 'bush:' + v, solid: true, solidW: 2, sway: true }); }
  flowers(x: number, y: number, v = 1) { return this.deco({ x, y, sprite: 'flowers:' + v, flat: true }); }
  building(b: Building, style: BuildingStyle) {
    BUILDING_STYLES[b.sprite] = style;
    this.buildings.push(b);
    if (b.door) {
      const d = b.door;
      this.warps.push({ x: d.x, y: d.y, w: 1, h: 1, to: d.to, tx: d.tx, ty: d.ty, dir: 'up', door: false, gate: d.gate });
    }
    return this;
  }
  warp(w: Warp) { this.warps.push(w); return this; }
  poi(name: string, x: number, y: number, dir?: POI['dir']) { POIS[name] = { map: this.id, x, y, dir }; return this; }
  counter(x: number, y: number, shop: string) { this.counters.push({ x, y, shop }); return this; }
  interact(x: number, y: number, id: string) { this.interacts.push({ x, y, id }); return this; }
  build(o: Partial<MapDef> & { music: string; outdoor: boolean; tillable?: boolean; fishZone?: (x: number, y: number) => FishZone | null }): MapDef {
    return {
      id: this.id, name: this.name, w: this.w, h: this.h, tiles: this.tiles, warps: this.warps, decos: this.decos, buildings: this.buildings,
      counters: this.counters, interacts: this.interacts, tillable: false, ...o,
    } as MapDef;
  }
}

export interface InteriorOpts {
  floor?: T; floorColor?: string; wall?: string; exitTo: string; exitX: number; exitY: number; doorX?: number;
  music?: string; furniture?: (b: MB, w: number, h: number) => void;
}

/** Sala retangular padrão com parede ao norte e porta ao sul. */
export function interior(id: string, name: string, w: number, h: number, o: InteriorOpts): MB {
  const b = new MB(id, name, w, h, T.VOID);
  b.fill(1, 1, w - 2, 2, T.WALL);
  b.fill(1, 3, w - 2, h - 4, o.floor ?? T.WOOD);
  const dx = o.doorX ?? Math.floor(w / 2);
  b.set(dx, h - 1, o.floor ?? T.WOOD);
  b.warp({ x: dx, y: h - 1, w: 1, h: 1, to: o.exitTo, tx: o.exitX, ty: o.exitY, dir: 'down' });
  b.deco({ x: dx, y: h - 2, sprite: 'mat', flat: true });
  if (o.furniture) o.furniture(b, w, h);
  return b;
}
