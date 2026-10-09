// Ícones de itens 16x16 gerados proceduralmente a partir de um IconSpec.
import { makeCanvas, shade } from '../core/util';
import { px, rect, ellipse, circle, outline, Ctx } from './painter';
import { ITEMS, IconSpec } from '../data/items';

const cache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

export function iconFor(id: string, ref?: string): HTMLCanvasElement {
  const k = id + '|' + (ref || '');
  let c = cache.get(k);
  if (c) return c;
  const d = ITEMS[id];
  let spec: IconSpec = d ? d.icon : { s: 'unknown', c1: '#ff00ff' };
  if (ref && ITEMS[ref]) spec = { ...spec, c1: tintFor(id, ITEMS[ref].icon.c1, spec.c1) };
  c = paintIcon(spec);
  cache.set(k, c);
  return c;
}
export function iconURL(id: string, ref?: string) {
  const k = id + '|' + (ref || '');
  let u = urlCache.get(k);
  if (!u) { u = iconFor(id, ref).toDataURL(); urlCache.set(k, u); }
  return u;
}
function tintFor(id: string, refColor: string, base: string) {
  if (id === 'vinho') return shade(refColor, -0.35);
  return refColor || base;
}

export function paintIcon(sp: IconSpec): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(16, 16);
  const a = sp.c1, b = sp.c2 || shade(a, -0.25), hi = shade(a, 0.35), lo = shade(a, -0.3);
  const g = ctx;
  const leaf = '#4a9a3a', leafL = '#6ac04a';
  switch (sp.s) {
    case 'hoe': rect(g, 7, 4, 2, 11, '#8a5a2a'); rect(g, 4, 2, 7, 3, a); rect(g, 4, 2, 7, 1, hi); break;
    case 'axe': rect(g, 7, 3, 2, 12, '#8a5a2a'); ellipse(g, 5, 5, 3, 3, a); rect(g, 5, 2, 3, 6, a); px(g, 3, 4, hi); break;
    case 'pick': rect(g, 7, 4, 2, 11, '#8a5a2a'); rect(g, 2, 3, 12, 2, a); px(g, 1, 4, a); px(g, 14, 4, a); rect(g, 2, 3, 12, 1, hi); break;
    case 'can': rect(g, 3, 6, 8, 7, a); rect(g, 3, 6, 8, 1, hi); rect(g, 11, 7, 3, 2, a); px(g, 14, 6, a); rect(g, 5, 3, 4, 3, lo); rect(g, 6, 4, 2, 1, '#00000000'); break;
    case 'scythe': rect(g, 8, 3, 2, 12, '#8a5a2a'); rect(g, 2, 2, 8, 2, a); rect(g, 1, 3, 2, 3, a); rect(g, 2, 2, 8, 1, hi); break;
    case 'rod': for (let i = 0; i < 12; i++) px(g, 3 + i, 14 - i, i < 4 ? '#5a3a1a' : a); px(g, 15, 2, '#e8e8e8'); rect(g, 4, 11, 3, 3, '#3a3a3a'); for (let i = 0; i < 9; i++) px(g, 15, 3 + i, 'rgba(255,255,255,0.6)'); break;
    case 'sword': for (let i = 0; i < 9; i++) { px(g, 5 + i, 10 - i, a); px(g, 6 + i, 10 - i, hi); } rect(g, 3, 10, 5, 2, '#8a6a3a'); rect(g, 2, 12, 3, 3, '#5a3a1a'); px(g, 5, 9, '#c8a03a'); px(g, 6, 12, '#c8a03a'); break;
    case 'dagger': for (let i = 0; i < 6; i++) { px(g, 7 + i, 8 - i, a); px(g, 8 + i, 8 - i, hi); } rect(g, 5, 8, 4, 2, '#8a6a3a'); rect(g, 3, 10, 3, 3, '#5a3a1a'); break;
    case 'hammer': rect(g, 7, 6, 2, 9, '#6a4a2a'); rect(g, 3, 2, 10, 5, a); rect(g, 3, 2, 10, 1, hi); rect(g, 3, 6, 10, 1, lo); break;
    case 'wood': rect(g, 2, 5, 12, 6, a); rect(g, 2, 5, 12, 1, hi); ellipse(g, 13, 8, 2, 3, shade(a, 0.25)); px(g, 13, 8, lo); rect(g, 3, 10, 10, 1, lo); break;
    case 'stone': ellipse(g, 8, 9, 6, 4, a); ellipse(g, 7, 8, 4, 2, hi); px(g, 10, 11, lo); break;
    case 'fiber': for (let i = 0; i < 5; i++) { rect(g, 4 + i * 2, 3 + (i % 2), 1, 11, i % 2 ? a : lo); } rect(g, 3, 8, 10, 2, '#c8a05a'); break;
    case 'hay': ellipse(g, 8, 9, 6, 5, a); for (let i = 0; i < 6; i++) rect(g, 3 + i * 2, 5, 1, 8, shade(a, -0.15)); rect(g, 2, 9, 12, 1, '#a8743a'); break;
    case 'clay': ellipse(g, 8, 9, 5, 4, a); ellipse(g, 7, 8, 3, 2, hi); break;
    case 'drop': ellipse(g, 8, 10, 4, 4, a); rect(g, 7, 4, 2, 4, a); px(g, 8, 3, a); px(g, 6, 9, hi); break;
    case 'coal': ellipse(g, 8, 9, 5, 4, '#2a2a2a'); px(g, 6, 7, '#5a5a6a'); px(g, 9, 9, '#4a4a5a'); break;
    case 'ore': ellipse(g, 8, 9, 6, 5, '#7a7a7a'); ellipse(g, 7, 8, 4, 3, '#9a9a9a'); circle(g, 6, 9, 1, a); circle(g, 10, 8, 1, a); px(g, 9, 11, a); px(g, 6, 9, hi); break;
    case 'bar': for (let i = 0; i < 5; i++) rect(g, 3 + i, 6 - i + 4, 10, 1, i === 0 ? lo : a); rect(g, 4, 6, 9, 4, a); rect(g, 4, 6, 9, 1, hi); rect(g, 3, 10, 10, 2, lo); break;
    case 'gem': rect(g, 5, 4, 6, 2, hi); rect(g, 3, 6, 10, 2, a); rect(g, 4, 8, 8, 2, lo); rect(g, 6, 10, 4, 2, lo); px(g, 7, 12, lo); px(g, 6, 5, '#ffffff'); break;
    case 'crystal': rect(g, 7, 2, 3, 11, a); rect(g, 4, 6, 3, 7, shade(a, -0.1)); rect(g, 10, 7, 2, 6, shade(a, -0.15)); px(g, 8, 3, '#ffffff'); rect(g, 3, 13, 10, 1, '#7a7a8a'); break;
    case 'gel': ellipse(g, 8, 10, 5, 3, a); ellipse(g, 8, 8, 3, 3, a); px(g, 7, 7, '#ffffff'); break;
    case 'wing': for (let i = 0; i < 6; i++) rect(g, 2 + i * 2, 4 + i, 2, 8 - i, i % 2 ? a : lo); break;
    case 'shell': ellipse(g, 8, 9, 6, 5, a); for (let i = 0; i < 5; i++) rect(g, 4 + i * 2, 5, 1, 8, lo); ellipse(g, 8, 13, 2, 1, lo); break;
    case 'dust': for (let i = 0; i < 9; i++) px(g, 4 + ((i * 5) % 8), 4 + ((i * 3) % 9), i % 2 ? '#ffffff' : a); circle(g, 8, 8, 2, a); break;
    case 'orb': circle(g, 8, 8, 5, a); circle(g, 7, 7, 2, hi); px(g, 6, 6, '#ffffff'); break;
    case 'coral': rect(g, 7, 6, 2, 8, a); rect(g, 4, 4, 2, 6, a); rect(g, 10, 3, 2, 7, a); rect(g, 5, 9, 6, 2, a); px(g, 4, 4, hi); px(g, 10, 3, hi); break;
    case 'urchin': circle(g, 8, 9, 4, a); for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; px(g, 8 + Math.round(Math.cos(an) * 6), 9 + Math.round(Math.sin(an) * 6), lo); } break;
    case 'boot': rect(g, 5, 3, 5, 9, a); rect(g, 5, 10, 9, 4, a); rect(g, 5, 13, 9, 1, lo); break;
    case 'can2': rect(g, 4, 4, 8, 9, a); rect(g, 4, 4, 8, 1, hi); rect(g, 5, 7, 6, 3, '#c84a3a'); break;
    case 'paper': rect(g, 3, 4, 10, 9, a); for (let i = 0; i < 4; i++) rect(g, 4, 6 + i * 2, 8, 1, '#8a8a7a'); break;
    case 'egg': ellipse(g, 8, 9, sp.c2 === 'big' ? 5 : 4, sp.c2 === 'big' ? 6 : 5, a); px(g, 6, 6, '#ffffff'); ellipse(g, 9, 12, 2, 1, shade(a, -0.1)); break;
    case 'feather': for (let i = 0; i < 10; i++) { rect(g, 3 + i, 12 - i, 3, 2, a); } rect(g, 2, 13, 2, 2, '#c8c8c8'); break;
    case 'milk': rect(g, 5, 5, 6, 9, a); rect(g, 6, 2, 4, 3, a); rect(g, 6, 2, 4, 1, '#4a8ad8'); rect(g, 5, 8, 6, 3, '#4a8ad8'); if (sp.c2 === 'big') rect(g, 5, 8, 6, 3, '#d8a83a'); break;
    case 'wool': circle(g, 6, 8, 3, a); circle(g, 10, 8, 3, a); circle(g, 8, 6, 3, a); circle(g, 8, 10, 3, a); px(g, 7, 5, '#ffffff'); break;
    case 'jar': rect(g, 4, 5, 8, 9, a); rect(g, 4, 5, 8, 2, hi); rect(g, 5, 3, 6, 2, '#a8743a'); rect(g, 5, 9, 6, 3, '#f4e2b8'); rect(g, 4, 13, 8, 1, lo); break;
    case 'bottle': rect(g, 5, 6, 6, 8, a); rect(g, 6, 2, 4, 4, a); rect(g, 6, 2, 4, 1, '#c8a05a'); rect(g, 6, 9, 4, 3, '#f4e2b8'); px(g, 6, 7, hi); break;
    case 'mug': rect(g, 4, 5, 7, 9, '#d8c8a8'); rect(g, 5, 5, 5, 2, '#ffffff'); rect(g, 5, 7, 5, 6, a); rect(g, 11, 7, 2, 4, '#d8c8a8'); break;
    case 'cheese': rect(g, 3, 7, 10, 6, a); for (let i = 0; i < 5; i++) rect(g, 3 + i * 2, 7 - Math.min(i, 3), 2, 1, a); circle(g, 6, 10, 1, shade(a, -0.2)); circle(g, 10, 9, 1, shade(a, -0.2)); break;
    case 'cloth': rect(g, 3, 4, 10, 9, a); for (let i = 0; i < 9; i += 2) rect(g, 3, 4 + i, 10, 1, shade(a, -0.1)); rect(g, 3, 12, 10, 1, lo); break;
    case 'sack': rect(g, 4, 6, 8, 8, a); rect(g, 5, 4, 6, 2, a); rect(g, 6, 3, 4, 1, lo); rect(g, 5, 9, 6, 3, sp.c2 || shade(a, 0.4)); break;
    case 'bowl': ellipse(g, 8, 10, 6, 3, '#e8e0d0'); ellipse(g, 8, 8, 5, 2, a); px(g, 6, 8, hi); rect(g, 4, 11, 8, 2, '#c8b8a0'); break;
    case 'plate': ellipse(g, 8, 10, 7, 3, '#f0ece0'); ellipse(g, 8, 9, 4, 2, a); px(g, 7, 8, hi); break;
    case 'bread': ellipse(g, 8, 9, 6, 4, a); for (let i = 0; i < 3; i++) rect(g, 5 + i * 3, 7, 1, 2, hi); break;
    case 'pie': ellipse(g, 8, 10, 6, 3, '#d8a85a'); ellipse(g, 8, 9, 5, 2, a); for (let i = 0; i < 4; i++) rect(g, 4 + i * 2, 9, 1, 1, '#f0d08a'); break;
    case 'pizza': for (let i = 0; i < 9; i++) rect(g, 4 + i / 2, 3 + i, 9 - i, 1, '#f0c870'); circle(g, 7, 6, 1, a); circle(g, 9, 8, 1, a); rect(g, 4, 3, 9, 2, '#c88a3a'); break;
    case 'cake': rect(g, 3, 7, 10, 6, a); rect(g, 3, 6, 10, 2, '#fff0e0'); rect(g, 3, 12, 10, 1, lo); px(g, 8, 4, '#e83a3a'); break;
    case 'potion': rect(g, 6, 3, 4, 3, '#e8e8f0'); ellipse(g, 8, 10, 5, 4, a); px(g, 6, 9, hi); rect(g, 6, 2, 4, 1, '#8a5a2a'); break;
    case 'seed': rect(g, 3, 3, 10, 11, '#e8d8a8'); rect(g, 3, 3, 10, 2, '#c8a86a'); circle(g, 8, 9, 3, a); if (sp.c2) px(g, 8, 7, sp.c2); px(g, 7, 8, shade(a, 0.4)); rect(g, 3, 13, 10, 1, '#a8843a'); break;
    case 'sapling': rect(g, 7, 7, 2, 7, '#8a5a2a'); ellipse(g, 8, 6, 4, 3, leaf); px(g, 6, 5, leafL); circle(g, 10, 7, 1, a); rect(g, 4, 13, 8, 2, '#8a6a4a'); break;
    case 'acorn': ellipse(g, 8, 10, 4, 4, a); rect(g, 4, 6, 8, 3, lo); px(g, 8, 4, lo); break;
    case 'bait': for (let i = 0; i < 8; i++) px(g, 4 + i, 8 + Math.round(Math.sin(i) * 2), a); for (let i = 0; i < 8; i++) px(g, 4 + i, 9 + Math.round(Math.sin(i) * 2), lo); break;
    case 'chest': rect(g, 2, 5, 12, 9, a); rect(g, 2, 5, 12, 3, shade(a, 0.15)); rect(g, 2, 8, 12, 1, lo); rect(g, 7, 7, 2, 3, '#f8d03a'); rect(g, 2, 13, 12, 1, lo); break;
    case 'scarecrow': rect(g, 7, 6, 2, 9, '#8a5a2a'); rect(g, 3, 7, 10, 2, '#8a5a2a'); circle(g, 8, 4, 3, '#e8c87a'); rect(g, 5, 0, 6, 2, '#6a4a2a'); rect(g, 5, 8, 6, 4, '#c84a3a'); break;
    case 'sprinkler': rect(g, 5, 8, 6, 5, a); rect(g, 7, 4, 2, 4, a); rect(g, 4, 12, 8, 2, lo); px(g, 7, 3, '#4ab8f8'); px(g, 5, 4, '#4ab8f8'); px(g, 10, 4, '#4ab8f8'); break;
    case 'torch': rect(g, 7, 6, 2, 9, '#8a5a2a'); ellipse(g, 8, 4, 2, 3, '#f8a83a'); px(g, 8, 3, '#fff0a0'); break;
    case 'lamp': rect(g, 7, 5, 2, 10, a); rect(g, 5, 2, 6, 4, '#f8e08a'); rect(g, 5, 1, 6, 1, a); rect(g, 5, 14, 6, 1, a); break;
    case 'fence': rect(g, 3, 4, 2, 10, a); rect(g, 11, 4, 2, 10, a); rect(g, 2, 6, 12, 2, shade(a, -0.1)); rect(g, 2, 10, 12, 2, shade(a, -0.1)); break;
    case 'path': rect(g, 2, 4, 12, 9, shade(a, -0.2)); rect(g, 3, 5, 5, 3, a); rect(g, 9, 5, 4, 3, a); rect(g, 3, 9, 4, 3, a); rect(g, 8, 9, 5, 3, a); break;
    case 'furnace': rect(g, 3, 4, 10, 10, a); rect(g, 3, 4, 10, 2, hi); rect(g, 5, 8, 6, 4, '#2a1a1a'); rect(g, 6, 9, 4, 2, '#f87a2a'); rect(g, 6, 1, 3, 3, lo); break;
    case 'jar_m': rect(g, 4, 3, 8, 11, '#c8d8e0'); rect(g, 5, 2, 6, 2, '#8a6a3a'); rect(g, 5, 7, 6, 6, '#d84a4a'); px(g, 5, 5, '#ffffff'); break;
    case 'keg': rect(g, 4, 3, 8, 11, a); for (const y of [4, 8, 12]) rect(g, 4, y, 8, 1, '#4a4a4a'); rect(g, 5, 3, 1, 11, hi); rect(g, 7, 10, 2, 2, '#c8a03a'); break;
    case 'press': rect(g, 3, 8, 10, 6, a); rect(g, 7, 2, 2, 6, '#6a6a6a'); rect(g, 4, 2, 8, 2, '#6a6a6a'); rect(g, 4, 9, 8, 2, '#f8e8a0'); break;
    case 'mayo': rect(g, 3, 5, 10, 9, a); rect(g, 5, 2, 6, 3, '#c8c8c8'); rect(g, 5, 8, 6, 3, '#f8f0c0'); px(g, 12, 6, '#e83a3a'); break;
    case 'loom': rect(g, 3, 3, 2, 11, a); rect(g, 11, 3, 2, 11, a); rect(g, 3, 3, 10, 2, a); for (let i = 5; i < 11; i += 2) rect(g, i, 5, 1, 7, '#e8e0d0'); rect(g, 3, 12, 10, 2, lo); break;
    case 'mill': rect(g, 4, 6, 8, 8, a); rect(g, 7, 2, 2, 4, '#6a4a2a'); for (let i = 0; i < 4; i++) rect(g, 4 + i * 2, 6, 1, 8, lo); circle(g, 8, 10, 2, '#5a5a5a'); break;
    case 'bee': rect(g, 3, 4, 10, 10, a); for (let i = 5; i < 14; i += 3) rect(g, 3, i, 10, 1, lo); rect(g, 7, 11, 2, 2, '#2a1a1a'); rect(g, 2, 3, 12, 2, '#8a5a2a'); px(g, 12, 2, '#f8d03a'); break;
    case 'kiln': rect(g, 3, 5, 10, 9, a); ellipse(g, 8, 5, 5, 2, a); rect(g, 6, 9, 4, 4, '#2a1a1a'); rect(g, 7, 1, 2, 3, '#4a4a4a'); break;
    case 'seedmaker': rect(g, 3, 5, 10, 9, a); rect(g, 5, 2, 6, 3, '#c8a05a'); circle(g, 8, 10, 2, '#e8d8a8'); px(g, 8, 10, '#4a8a3a'); break;
    case 'tapper': rect(g, 5, 4, 6, 9, a); rect(g, 6, 2, 4, 2, '#8a8a8a'); rect(g, 6, 8, 4, 4, '#d8a83a'); break;
    case 'hopper': rect(g, 3, 4, 10, 4, a); for (let i = 0; i < 4; i++) rect(g, 4 + i, 8 + i, 8 - i * 2, 1, a); rect(g, 4, 5, 8, 2, '#e8c86a'); break;
    case 'grabber': rect(g, 3, 5, 10, 9, a); rect(g, 6, 2, 4, 3, '#5a5a5a'); circle(g, 8, 9, 2, '#e8e8f0'); px(g, 8, 9, '#4a8ad8'); break;
    case 'chair': rect(g, 4, 2, 8, 6, a); rect(g, 4, 8, 8, 2, shade(a, 0.1)); rect(g, 4, 10, 2, 4, lo); rect(g, 10, 10, 2, 4, lo); break;
    case 'table': rect(g, 2, 5, 12, 3, a); rect(g, 2, 5, 12, 1, hi); rect(g, 3, 8, 2, 6, lo); rect(g, 11, 8, 2, 6, lo); break;
    case 'rug': rect(g, 1, 4, 14, 9, a); rect(g, 3, 6, 10, 5, shade(a, 0.2)); rect(g, 5, 8, 6, 1, shade(a, -0.2)); break;
    case 'plantpot': rect(g, 5, 10, 6, 4, '#b8643a'); ellipse(g, 8, 7, 5, 4, a); px(g, 5, 4, shade(a, 0.3)); px(g, 11, 6, shade(a, 0.3)); break;
    case 'painting': rect(g, 2, 3, 12, 10, '#8a5a2a'); rect(g, 3, 4, 10, 8, a); rect(g, 3, 9, 10, 3, '#5aa84a'); circle(g, 10, 6, 1, '#f8e08a'); break;
    case 'lampf': rect(g, 7, 6, 2, 8, '#5a5a5a'); rect(g, 4, 2, 8, 5, a); rect(g, 5, 14, 6, 1, '#5a5a5a'); break;
    case 'shelf': rect(g, 3, 2, 10, 12, a); for (const y of [5, 9]) rect(g, 3, y, 10, 1, lo); for (let i = 0; i < 4; i++) { rect(g, 4 + i * 2, 3, 1, 2, ['#c84a3a', '#4a8ad8', '#e8c83a', '#4ab84a'][i]); rect(g, 4 + i * 2, 6, 1, 3, ['#4ab84a', '#c84a3a', '#8a4ad8', '#e8c83a'][i]); } break;
    case 'bench': rect(g, 2, 6, 12, 3, a); rect(g, 2, 3, 12, 2, a); rect(g, 3, 9, 2, 4, lo); rect(g, 11, 9, 2, 4, lo); break;
    case 'clock': circle(g, 8, 8, 6, a); circle(g, 8, 8, 4, '#f8f0e0'); rect(g, 8, 5, 1, 3, '#2a2a2a'); rect(g, 8, 8, 3, 1, '#2a2a2a'); break;
    case 'sofa': rect(g, 1, 6, 14, 7, a); rect(g, 1, 4, 14, 3, shade(a, -0.1)); rect(g, 1, 6, 2, 7, lo); rect(g, 13, 6, 2, 7, lo); break;
    case 'bouquet': rect(g, 6, 9, 4, 6, '#4a9a3a'); circle(g, 6, 6, 2, a); circle(g, 10, 6, 2, '#f8e08a'); circle(g, 8, 4, 2, '#f8f8f8'); rect(g, 5, 10, 6, 2, '#e8e8f0'); break;
    case 'pendant': for (let i = 0; i < 6; i++) { px(g, 3 + i, 2 + i, '#c8a03a'); px(g, 12 - i, 2 + i, '#c8a03a'); } rect(g, 6, 8, 4, 5, a); px(g, 7, 9, '#ffffff'); break;
    case 'totem': rect(g, 5, 2, 6, 12, '#8a5a2a'); rect(g, 6, 4, 4, 3, a); rect(g, 6, 9, 4, 3, a); px(g, 7, 5, '#ffffff'); break;
    case 'scroll': rect(g, 3, 4, 10, 9, a); rect(g, 2, 3, 12, 2, '#c8a86a'); rect(g, 2, 12, 12, 2, '#c8a86a'); for (let i = 0; i < 3; i++) rect(g, 4, 6 + i * 2, 8, 1, '#8a6a4a'); break;
    // ----- produção vegetal -----
    case 'bulb': ellipse(g, 8, 10, 4, 4, a); px(g, 6, 9, hi); rect(g, 7, 2, 1, 5, leaf); rect(g, 9, 3, 1, 4, leafL); rect(g, 5, 3, 1, 3, leaf); if (sp.c2) ellipse(g, 8, 8, 4, 1, sp.c2); px(g, 8, 14, lo); break;
    case 'long': for (let i = 0; i < 9; i++) rect(g, 7 - Math.max(0, 2 - Math.floor(i / 3)), 5 + i, 2 + Math.max(0, 2 - Math.floor(i / 3)) * 2, 1, a); px(g, 6, 7, hi); rect(g, 6, 1, 1, 4, leaf); rect(g, 8, 2, 1, 3, leafL); rect(g, 10, 1, 1, 4, leaf); break;
    case 'leafy': ellipse(g, 8, 9, 6, 5, a); ellipse(g, 6, 8, 3, 3, shade(a, 0.2)); ellipse(g, 10, 10, 3, 2, shade(a, -0.15)); rect(g, 8, 5, 1, 8, shade(a, 0.35)); if (sp.c2) circle(g, 8, 6, 2, sp.c2); break;
    case 'round': circle(g, 8, 9, 5, a); circle(g, 6, 7, 1, hi); rect(g, 8, 2, 1, 3, '#5a3a1a'); rect(g, 9, 3, 3, 1, leaf); break;
    case 'berry': circle(g, 5, 10, 2, a); circle(g, 10, 10, 2, a); circle(g, 8, 7, 2, a); circle(g, 8, 12, 2, lo); px(g, 4, 9, hi); px(g, 9, 9, hi); rect(g, 7, 2, 3, 2, leaf); break;
    case 'corn': ellipse(g, 8, 8, 3, 6, a); for (let j = 3; j < 14; j += 2) rect(g, 6, j, 5, 1, shade(a, -0.15)); rect(g, 3, 6, 2, 8, leaf); rect(g, 11, 6, 2, 8, leafL); break;
    case 'grain': for (let i = 0; i < 3; i++) { rect(g, 4 + i * 3, 6, 1, 9, '#c8a050'); for (let j = 0; j < 4; j++) { px(g, 3 + i * 3, 2 + j * 1.5, a); px(g, 5 + i * 3, 2 + j * 1.5, a); } } break;
    case 'flower': rect(g, 7, 8, 2, 7, leaf); rect(g, 9, 11, 3, 1, leafL); for (let i = 0; i < 5; i++) { const an = (i / 5) * Math.PI * 2; circle(g, 8 + Math.cos(an) * 3, 6 + Math.sin(an) * 3, 2, a); } circle(g, 8, 6, 1, sp.c2 || '#f8e08a'); break;
    case 'pumpkin': ellipse(g, 8, 10, 7, 5, a); for (const x of [5, 8, 11]) rect(g, x, 6, 1, 9, lo); px(g, 4, 8, hi); rect(g, 7, 3, 2, 3, '#5a3a1a'); break;
    case 'melon': ellipse(g, 8, 9, 6, 6, a); for (let i = 0; i < 6; i++) rect(g, 3 + i * 2, 4, 1, 10, b); px(g, 5, 6, hi); break;
    case 'grape': for (const [x, y] of [[6, 5], [10, 5], [8, 7], [5, 8], [11, 8], [8, 10], [6, 11], [10, 11], [8, 13]]) circle(g, x, y, 2, a); px(g, 5, 4, hi); rect(g, 8, 1, 1, 3, '#5a3a1a'); rect(g, 9, 2, 3, 2, leaf); break;
    case 'pepper': ellipse(g, 8, 9, 3, 5, a); px(g, 7, 6, hi); rect(g, 7, 2, 2, 3, leaf); px(g, 8, 14, lo); break;
    case 'pod': for (let i = 0; i < 10; i++) rect(g, 3 + i, 12 - i, 3, 2, a); for (let i = 0; i < 3; i++) circle(g, 6 + i * 2.5, 10 - i * 2.5, 1, hi); break;
    case 'eggplant': ellipse(g, 8, 10, 4, 5, a); ellipse(g, 7, 9, 2, 3, hi); rect(g, 6, 3, 4, 2, leaf); rect(g, 7, 1, 2, 2, leaf); break;
    case 'mushroom': ellipse(g, 8, 7, 6, 4, a); rect(g, 6, 9, 4, 5, '#f0e8d8'); px(g, 5, 6, hi); px(g, 10, 5, hi); break;
    case 'herb': for (let i = 0; i < 4; i++) { rect(g, 4 + i * 3, 4 + (i % 2) * 2, 2, 10 - (i % 2) * 2, i % 2 ? a : shade(a, 0.15)); } rect(g, 4, 12, 10, 2, shade(a, -0.3)); break;
    // ----- peixes -----
    case 'fish_fish': case 'fish_puffer': {
      if (sp.s === 'fish_puffer') { circle(g, 8, 8, 5, a); for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; px(g, 8 + Math.round(Math.cos(an) * 6), 8 + Math.round(Math.sin(an) * 6), b); } px(g, 10, 7, '#1a1a1a'); break; }
      ellipse(g, 7, 8, 5, 3, a); rect(g, 3, 9, 8, 2, b); for (let i = 0; i < 4; i++) rect(g, 12 + (i > 1 ? 1 : 0), 5 + i * 2 - (i > 1 ? 1 : 0), 2, 2, b);
      rect(g, 11, 7, 2, 3, a); px(g, 4, 7, '#1a1a1a'); px(g, 3, 7, '#ffffff'); rect(g, 6, 5, 3, 1, b); break;
    }
    case 'fish_long': for (let i = 0; i < 12; i++) rect(g, 2 + i, 8 + Math.round(Math.sin(i * 0.8) * 2), 2, 3, i < 2 ? b : a); px(g, 3, 8 + Math.round(Math.sin(0) * 2), '#1a1a1a'); break;
    case 'fish_flat': ellipse(g, 8, 8, 6, 5, a); for (let i = 0; i < 6; i++) px(g, 5 + i, 6 + (i % 3), b); rect(g, 13, 7, 2, 2, b); px(g, 6, 6, '#1a1a1a'); px(g, 8, 6, '#1a1a1a'); break;
    case 'fish_octo': circle(g, 8, 6, 4, a); for (let i = 0; i < 5; i++) rect(g, 4 + i * 2, 9, 1, 5 - (i % 2), b); px(g, 7, 6, '#1a1a1a'); px(g, 9, 6, '#1a1a1a'); break;
    case 'fish_squid': ellipse(g, 8, 6, 3, 5, a); for (let i = 0; i < 4; i++) rect(g, 5 + i * 2, 10, 1, 5, b); px(g, 7, 8, '#1a1a1a'); px(g, 9, 8, '#1a1a1a'); break;
    default: circle(g, 8, 8, 5, a);
  }
  outline(c, -0.6);
  return c;
}

export function drawIcon(ctx: Ctx, id: string, x: number, y: number, ref?: string) {
  ctx.drawImage(iconFor(id, ref), x | 0, y | 0);
}
