// Utilidades gerais compartilhadas por todos os sistemas.

export const TILE = 16;

export function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v; }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
export function key(x: number, y: number) { return x + ',' + y; }
export function unkey(k: string): [number, number] { const i = k.indexOf(','); return [+k.slice(0, i), +k.slice(i + 1)]; }
export function dist(ax: number, ay: number, bx: number, by: number) { return Math.hypot(ax - bx, ay - by); }

/** PRNG determinístico (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash 2D estável para variação de tiles. */
export function hash2(x: number, y: number, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function pick<T>(arr: T[], r: () => number): T { return arr[Math.floor(r() * arr.length)]; }
export function shuffle<T>(arr: T[], r: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function rgbToHex(r: number, g: number, b: number) {
  const c = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
/** Clareia (amt>0) ou escurece (amt<0) uma cor. */
export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

export function fmtMoney(n: number) { return Math.floor(n).toLocaleString('pt-BR'); }

export const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] } as const;
export type Dir = keyof typeof DIRS;

/** Emissor de eventos simples para desacoplar sistemas. */
type Handler = (...a: any[]) => void;
class Bus {
  private h: Record<string, Handler[]> = {};
  on(ev: string, fn: Handler) { (this.h[ev] ||= []).push(fn); return () => this.off(ev, fn); }
  off(ev: string, fn: Handler) { this.h[ev] = (this.h[ev] || []).filter(f => f !== fn); }
  emit(ev: string, ...a: any[]) { for (const f of this.h[ev] || []) f(...a); }
}
export const bus = new Bus();
