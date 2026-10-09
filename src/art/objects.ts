// Sprites de objetos do mundo: árvores, detritos, cultivos, decoração, prédios, animais e monstros.
import { makeCanvas, shade, hash2, rng } from '../core/util';
import { px, rect, ellipse, circle, outline, Sprite, sprite, flipH, Ctx } from './painter';
import { SEASON_PAL, BIOMES } from './palette';
import { CropDef, CROP_STAGES, FRUIT_TREES } from '../data/crops';
import { paintIcon } from './icons';
import { ITEMS } from '../data/items';

const cache = new Map<string, Sprite>();
function cached(k: string, f: () => Sprite) { let s = cache.get(k); if (!s) { s = f(); cache.set(k, s); } return s; }
export function clearSeasonalCache() { for (const k of [...cache.keys()]) if (k.includes('@s')) cache.delete(k); }

// ============ ÁRVORES ============
export type TreeKind = 'carvalho' | 'bordo' | 'pinheiro' | 'palmeira' | string; // fruteiras usam id da FRUIT_TREES

function canopyBlob(g: Ctx, cx: number, cy: number, r: number, base: string, dark: string, light: string, seed: number) {
  const R = rng(seed);
  const blobs: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) { const an = R() * Math.PI * 2, d = R() * r * 0.55; blobs.push([cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.8, r * (0.45 + R() * 0.25)]); }
  for (const [x, y, rr] of blobs) ellipse(g, x, y + 2, rr, rr * 0.9, dark);
  for (const [x, y, rr] of blobs) ellipse(g, x, y, rr * 0.92, rr * 0.82, base);
  for (const [x, y, rr] of blobs) ellipse(g, x - rr * 0.25, y - rr * 0.3, rr * 0.45, rr * 0.35, light);
  for (let i = 0; i < 26; i++) { const an = R() * Math.PI * 2, d = R() * r; px(g, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.8, R() < 0.5 ? dark : light); }
}

export function treeSprite(kind: TreeKind, season: number, stage: number, fruit = false): Sprite {
  return cached(`tree_${kind}_${stage}_${fruit ? 1 : 0}@s${season}`, () => {
    const P = SEASON_PAL[season];
    const ft = FRUIT_TREES.find(f => f.id === kind);
    const trunk = kind === 'palmeira' ? '#a88a5a' : kind === 'pinheiro' ? '#5a3a24' : '#7a5232';
    if (stage === 0) return sprite(16, 16, 8, 14, g => { ellipse(g, 8, 13, 3, 1, '#6a4a2a'); px(g, 8, 11, '#5a9a3a'); px(g, 7, 10, '#5a9a3a'); });
    if (stage === 1) return sprite(16, 18, 8, 16, g => { rect(g, 7, 9, 2, 7, '#7a5a3a'); ellipse(g, 6, 8, 2, 2, kind === 'pinheiro' ? '#2f6a3a' : P.leaf); ellipse(g, 10, 7, 2, 2, kind === 'pinheiro' ? '#2f6a3a' : P.leafLight); });
    if (stage === 2) return sprite(16, 26, 8, 24, g => {
      rect(g, 7, 12, 2, 12, trunk);
      if (kind === 'pinheiro') for (let i = 0; i < 3; i++) ellipse(g, 8, 6 + i * 4, 3 + i, 2, season === 3 ? '#e8f0f8' : '#2f6a3a');
      else if (season === 3 && kind !== 'palmeira') { rect(g, 4, 6, 1, 7, trunk); rect(g, 11, 5, 1, 8, trunk); rect(g, 4, 5, 8, 1, '#ffffff'); }
      else canopyBlob(g, 8, 9, 6, ft ? '#4a9a3a' : P.leaf, P.leafDark, P.leafLight, 7);
    });
    if (stage === 3) return sprite(32, 42, 16, 40, g => {
      rect(g, 14, 22, 4, 18, trunk); rect(g, 14, 22, 1, 18, shade(trunk, 0.2));
      if (kind === 'pinheiro') for (let i = 0; i < 4; i++) { ellipse(g, 16, 8 + i * 6, 5 + i * 2, 4, '#2f6a3a'); ellipse(g, 15, 7 + i * 6, 3 + i, 2, season === 3 ? '#f0f4fa' : '#4a8a4a'); }
      else if (kind === 'palmeira') { for (let i = 0; i < 5; i++) { const an = -Math.PI + (i / 4) * Math.PI; for (let k = 0; k < 9; k++) px(g, 16 + Math.cos(an) * k * 1.4, 18 + Math.sin(an) * k * 0.8 + k * k * 0.06, '#4a9a3a'); } }
      else if (season === 3) { for (let i = 0; i < 6; i++) { const x = 8 + i * 3; rect(g, x, 10 + (i % 2) * 3, 1, 14, trunk); px(g, x, 10 + (i % 2) * 3, '#ffffff'); } }
      else canopyBlob(g, 16, 16, 12, ft ? (season === ft.season || season === 0 ? '#4a9a3a' : P.leaf) : kind === 'bordo' && season === 2 ? '#c8402a' : P.leaf, P.leafDark, P.leafLight, 13);
    });
    // maduro
    const W = 48, H = 76;
    return sprite(W, H, 24, H - 2, g => {
      // tronco com raízes
      rect(g, 20, 44, 8, 30, trunk); rect(g, 20, 44, 2, 30, shade(trunk, 0.2)); rect(g, 26, 44, 2, 30, shade(trunk, -0.25));
      rect(g, 17, 70, 14, 4, trunk); px(g, 16, 73, trunk); px(g, 31, 73, trunk);
      for (let i = 0; i < 5; i++) px(g, 22 + (i % 3), 50 + i * 4, shade(trunk, -0.35));
      if (kind === 'pinheiro') {
        for (let i = 0; i < 6; i++) {
          const w = 7 + i * 3.4, y = 6 + i * 8;
          ellipse(g, 24, y + 3, w, 5, '#24552e'); ellipse(g, 24, y, w - 1, 4, '#2f6a3a'); ellipse(g, 21, y - 1, w * 0.5, 2, season === 3 ? '#f4f8ff' : '#4a8a4a');
        }
        return;
      }
      if (kind === 'palmeira') {
        rect(g, 20, 44, 8, 30, '#00000000');
        for (let k = 0; k < 40; k++) rect(g, 22 + Math.sin(k / 9) * 3, 34 + k, 5, 1, k % 4 ? trunk : shade(trunk, -0.3));
        for (let i = 0; i < 7; i++) { const an = -Math.PI - 0.2 + (i / 6) * (Math.PI + 0.4); for (let k = 0; k < 18; k++) { const x = 25 + Math.cos(an) * k * 1.3, y = 32 + Math.sin(an) * k * 0.7 + k * k * 0.05; rect(g, x, y, 2, 2, k % 3 ? '#3f8f32' : '#5ab04a'); } }
        circle(g, 24, 35, 2, '#6a4a2a'); circle(g, 27, 36, 2, '#5a3a1a');
        return;
      }
      if (season === 3 && !ft) {
        // galhos nus com neve
        const R = rng(31);
        for (let i = 0; i < 9; i++) {
          let x = 24, y = 46; const an = -Math.PI / 2 + (R() - 0.5) * 2.2;
          for (let k = 0; k < 16 + R() * 10; k++) { x += Math.cos(an) * 1.1; y += Math.sin(an) * 1.1; px(g, x, y, trunk); px(g, x + 1, y, trunk); if (k > 8 && R() < 0.3) px(g, x, y - 1, '#ffffff'); }
        }
        return;
      }
      let leafC = P.leaf;
      if (kind === 'bordo') leafC = season === 2 ? '#c8402a' : season === 0 ? '#6ab84a' : P.leaf;
      if (ft && season === 3) leafC = '#6a5a4a';
      canopyBlob(g, 24, 26, 22, leafC, shade(leafC, -0.3), shade(leafC, 0.25), kind.length * 7 + 3);
      if (fruit && ft) {
        const R = rng(99);
        for (let i = 0; i < 6; i++) { const x = 10 + R() * 28, y = 14 + R() * 22; circle(g, x, y, 2, ft.color); px(g, x - 1, y - 1, shade(ft.color, 0.4)); }
      }
      if (season === 0 && !ft && kind === 'carvalho') { const R = rng(5); for (let i = 0; i < 10; i++) px(g, 6 + R() * 36, 10 + R() * 30, '#f8c8e0'); }
      if (season === 0 && ft) { const R = rng(6); for (let i = 0; i < 18; i++) px(g, 6 + R() * 36, 8 + R() * 32, '#fff0f4'); }
    });
  });
}

export function stumpSprite(kind: string): Sprite {
  return cached('stump_' + kind, () => sprite(16, 16, 8, 14, g => {
    const t = kind === 'pinheiro' ? '#5a3a24' : '#7a5232';
    rect(g, 3, 7, 10, 7, t); ellipse(g, 8, 7, 5, 2, shade(t, 0.35)); ellipse(g, 8, 7, 2, 1, shade(t, 0.1)); rect(g, 2, 12, 12, 2, t);
  }));
}

// ============ DETRITOS ============
export function debrisSprite(kind: string, season: number, variant = 0): Sprite {
  return cached(`deb_${kind}_${variant}@s${season}`, () => {
    const P = SEASON_PAL[season];
    switch (kind) {
      case 'weed': return sprite(16, 16, 8, 14, g => {
        const base = season === 3 ? '#8a9a8a' : variant % 2 ? P.grassDark : P.leafDark;
        for (let i = 0; i < 6; i++) { const x = 3 + i * 2; const h = 6 + ((i * 7 + variant) % 5); rect(g, x, 14 - h, 2, h, i % 2 ? base : shade(base, 0.2)); px(g, x, 14 - h - 1, shade(base, 0.35)); }
        if (variant % 3 === 0 && season < 3) circle(g, 6, 5, 1, P.flowers[variant % P.flowers.length]);
      });
      case 'stone': return sprite(16, 16, 8, 14, g => { ellipse(g, 8, 10, 6, 4, '#8a8a8a'); ellipse(g, 7, 8, 4, 2, '#aaaaaa'); px(g, 10, 11, '#6a6a6a'); if (season === 3) ellipse(g, 7, 6, 3, 1, '#ffffff'); });
      case 'twig': return sprite(16, 16, 8, 14, g => { for (let i = 0; i < 10; i++) rect(g, 3 + i, 10 - Math.floor(i / 3), 2, 2, '#7a5232'); rect(g, 7, 6, 1, 3, '#7a5232'); rect(g, 10, 11, 3, 1, '#5a3a24'); });
      case 'stump': return sprite(24, 22, 12, 20, g => {
        const t = '#6a4228';
        rect(g, 3, 7, 18, 12, t); ellipse(g, 12, 7, 9, 4, shade(t, 0.35)); ellipse(g, 12, 7, 5, 2, shade(t, 0.1)); ellipse(g, 12, 7, 2, 1, shade(t, 0.3));
        rect(g, 1, 16, 22, 4, t); for (let i = 0; i < 4; i++) rect(g, 5 + i * 4, 10, 1, 8, shade(t, -0.25));
        if (season === 3) ellipse(g, 12, 6, 8, 3, '#ffffff');
      });
      case 'boulder': return sprite(26, 22, 13, 20, g => { ellipse(g, 13, 13, 12, 8, '#7a7a82'); ellipse(g, 11, 10, 8, 5, '#9a9aa2'); ellipse(g, 9, 8, 4, 2, '#b8b8c0'); px(g, 18, 15, '#5a5a62'); if (season === 3) ellipse(g, 11, 6, 7, 2, '#ffffff'); });
      case 'grass': return sprite(16, 18, 8, 15, g => {
        const c1 = season === 3 ? '#a8b8a8' : P.grassDark, c2 = season === 3 ? '#c8d0c8' : P.grassLight;
        for (let i = 0; i < 7; i++) { const x = 2 + i * 2; const h = 8 + ((i * 5 + variant) % 6); for (let k = 0; k < h; k++) px(g, x + Math.round(Math.sin(k / 3 + i) * 0.8), 15 - k, k > h - 3 ? c2 : c1); }
      }, false);
    }
    return sprite(16, 16, 8, 14, g => rect(g, 4, 4, 8, 8, '#ff00ff'));
  });
}

// ============ CULTIVOS ============
export function cropSprite(c: CropDef, stage: number, dead = false, season = 0): Sprite {
  return cached(`crop_${c.id}_${stage}_${dead ? 1 : 0}`, () => sprite(16, 28, 8, 25, g => {
    const leaf = dead ? '#8a6a3a' : c.leaf || '#4a9a3a';
    const leafL = dead ? '#a8844a' : shade(leaf, 0.3);
    const base = 25;
    if (stage === 0) { px(g, 7, base - 1, '#6a4a2a'); px(g, 9, base - 2, '#6a4a2a'); px(g, 8, base - 2, leafL); return; }
    if (stage === 1) { rect(g, 8, base - 4, 1, 4, leaf); px(g, 7, base - 4, leafL); px(g, 9, base - 5, leafL); return; }
    const tall = ['corn', 'tallflower', 'stalk', 'grape', 'pod'].includes(c.shape);
    const H = tall ? (stage === 2 ? 10 : stage === 3 ? 16 : 22) : (stage === 2 ? 6 : stage === 3 ? 9 : 10);
    const ripe = stage >= CROP_STAGES && !dead;
    // estaca para trepadeiras
    if (c.shape === 'grape' || c.shape === 'pod') { rect(g, 3, base - H - 2, 1, H + 2, '#8a6a3a'); rect(g, 12, base - H - 2, 1, H + 2, '#8a6a3a'); rect(g, 3, base - H - 2, 10, 1, '#8a6a3a'); }
    // folhagem
    if (c.shape === 'grain') {
      for (let i = 0; i < 5; i++) { const x = 3 + i * 2.5; rect(g, x, base - H, 1, H, ripe ? '#c8a050' : leaf); if (stage >= 3) { rect(g, x - 1, base - H - 3, 3, 4, ripe ? c.color : leafL); } }
      return;
    }
    if (c.shape === 'corn' || c.shape === 'tallflower' || c.shape === 'stalk') {
      rect(g, 7, base - H, 2, H, c.shape === 'stalk' && ripe ? c.color : leaf);
      for (let k = 0; k < H - 2; k += 4) { rect(g, 3, base - k - 4, 4, 1, leafL); rect(g, 9, base - k - 6, 4, 1, leaf); }
      if (c.shape === 'stalk') { rect(g, 4, base - H + 4, 2, H - 4, ripe ? shade(c.color, -0.1) : leaf); rect(g, 10, base - H + 2, 2, H - 2, ripe ? shade(c.color, 0.1) : leaf); ellipse(g, 8, base - H, 5, 3, leafL); }
      if (ripe && c.shape === 'corn') { ellipse(g, 10, base - H + 8, 2, 4, c.color); px(g, 10, base - H + 4, '#e8e0a0'); ellipse(g, 5, base - H + 12, 2, 4, c.color); }
      if (c.shape === 'tallflower') { if (stage >= 3) { circle(g, 8, base - H, ripe ? 5 : 3, ripe ? c.color : leafL); if (ripe) circle(g, 8, base - H, 2, c.color2 || '#6a3a1a'); } }
      return;
    }
    // planta baixa
    const cx = 8, cy = base - 3;
    if (c.shape === 'leafy') {
      ellipse(g, cx, cy - H / 3, 4 + stage, 2 + stage * 0.8, ripe ? c.color : leaf);
      ellipse(g, cx - 2, cy - H / 3 - 1, 2 + stage * 0.5, 1 + stage * 0.4, ripe ? shade(c.color, 0.25) : leafL);
      if (ripe && c.color2) circle(g, cx + 1, cy - 4, 2, c.color2);
      return;
    }
    // haste e folhas genéricas
    for (let i = 0; i < 3; i++) { const lx = 4 + i * 4; rect(g, lx, cy - H + 3 + (i % 2) * 2, 2, H - 3 - (i % 2) * 2, i % 2 ? leaf : leafL); ellipse(g, lx + 1, cy - H + 3 + (i % 2) * 2, 2, 1, leafL); }
    if (!ripe) { if (c.shape === 'flower' && stage === 3) circle(g, 8, cy - H, 2, shade(leaf, 0.1)); return; }
    switch (c.shape) {
      case 'bulb': ellipse(g, 8, cy + 1, 4, 3, c.color); if (c.color2) rect(g, 5, cy - 1, 7, 1, c.color2); px(g, 6, cy, shade(c.color, 0.4)); break;
      case 'long': ellipse(g, 8, cy + 1, 3, 2, c.color); px(g, 7, cy, shade(c.color, 0.3)); break;
      case 'round': case 'pepper': case 'eggplant': for (const [x, y] of [[5, cy - 5], [11, cy - 3], [8, cy - 8]]) { if (c.shape === 'eggplant') ellipse(g, x, y, 2, 3, c.color); else circle(g, x, y, 2, c.color); px(g, x - 1, y - 1, shade(c.color, 0.4)); } break;
      case 'berry': for (const [x, y] of [[4, cy - 4], [11, cy - 6], [7, cy - 8], [9, cy - 2], [6, cy - 1]]) { circle(g, x, y, 1, c.color); px(g, x, y - 1, shade(c.color, 0.4)); } break;
      case 'grape': case 'pod': for (const [x, y] of [[5, cy - 10], [10, cy - 12], [7, cy - 6], [11, cy - 5]]) { if (c.shape === 'pod') rect(g, x, y, 1, 5, c.color); else { circle(g, x, y, 2, c.color); px(g, x - 1, y - 1, shade(c.color, 0.35)); } } break;
      case 'pumpkin': case 'melon': ellipse(g, 8, cy - 1, 6, 4, c.color); for (const x of [5, 8, 11]) rect(g, x, cy - 4, 1, 7, shade(c.color, -0.2)); px(g, 5, cy - 3, shade(c.color, 0.35)); break;
      case 'flower': circle(g, 8, cy - H, 3, c.color); circle(g, 8, cy - H, 1, '#f8e08a'); circle(g, 4, cy - H + 4, 2, c.color); break;
    }
  }));
}

export function giantCropSprite(c: CropDef): Sprite {
  return cached('giant_' + c.id, () => sprite(48, 44, 24, 42, g => {
    ellipse(g, 24, 26, 22, 16, c.color);
    for (const x of [10, 18, 24, 30, 38]) rect(g, x, 12, 2, 28, shade(c.color, -0.2));
    ellipse(g, 16, 20, 8, 5, shade(c.color, 0.25));
    rect(g, 22, 4, 4, 8, '#5a3a1a'); ellipse(g, 30, 8, 6, 3, '#4a9a3a');
  }));
}

export function soilTile(watered: boolean, season: number): HTMLCanvasElement {
  const k = `soil_${watered ? 1 : 0}@s${season}`;
  return cached(k, () => {
    const { c, ctx } = makeCanvas(16, 16);
    const base = watered ? '#5a3a22' : '#8a5a36';
    ellipse(ctx, 8, 8, 7, 7, base);
    rect(ctx, 1, 1, 14, 14, base);
    for (let j = 2; j < 15; j += 4) { rect(ctx, 2, j, 12, 1, shade(base, -0.25)); rect(ctx, 2, j + 1, 12, 1, shade(base, 0.12)); }
    for (let i = 0; i < 6; i++) px(ctx, 2 + Math.floor(hash2(i, 1, watered ? 3 : 4) * 12), 2 + Math.floor(hash2(i, 2, 5) * 12), shade(base, 0.3));
    return { img: c, ox: 0, oy: 0, w: 16, h: 16 };
  }).img;
}

// ============ ITENS COLOCADOS ============
export function placedSprite(id: string, state?: { working?: boolean; ready?: boolean; open?: boolean; color?: number }): Sprite {
  const ready = state?.ready ? 1 : 0, working = state?.working ? 1 : 0;
  return cached(`placed_${id}_${ready}_${working}_${state?.color || 0}`, () => {
    const d = ITEMS[id];
    if (id === 'bau') {
      const cols = ['#a8743a', '#c84a3a', '#4a8ad8', '#4ab84a', '#e8c83a', '#8a4ad8'];
      const a = cols[state?.color || 0];
      return sprite(16, 18, 8, 16, g => { rect(g, 1, 4, 14, 12, a); rect(g, 1, 4, 14, 4, shade(a, 0.15)); rect(g, 1, 8, 14, 1, shade(a, -0.35)); rect(g, 7, 7, 2, 3, '#f8d03a'); rect(g, 1, 15, 14, 1, shade(a, -0.35)); rect(g, 2, 4, 1, 12, shade(a, 0.3)); });
    }
    const icon = paintIcon(d ? d.icon : { s: 'unknown', c1: '#f0f' });
    const { c, ctx } = makeCanvas(16, 20);
    ctx.drawImage(icon, 0, 3);
    if (working && ['fornalha', 'carvoeira'].includes(id)) { rect(ctx, 6, 11, 4, 2, '#ffd04a'); }
    return { img: c, ox: 8, oy: 18, w: 16, h: 20 };
  });
}

export function fenceSprite(id: string, n: boolean, s: boolean, e: boolean, w: boolean): Sprite {
  return cached(`fence_${id}_${+n}${+s}${+e}${+w}`, () => {
    const a = id === 'cerca_pedra' ? '#9a9aa0' : '#a8743a';
    return sprite(16, 22, 8, 19, g => {
      rect(g, 6, 6, 4, 13, a); rect(g, 6, 6, 4, 1, shade(a, 0.3)); rect(g, 9, 7, 1, 12, shade(a, -0.25));
      if (e) { rect(g, 10, 9, 6, 2, a); rect(g, 10, 14, 6, 2, a); }
      if (w) { rect(g, 0, 9, 6, 2, a); rect(g, 0, 14, 6, 2, a); }
      if (n) { rect(g, 7, 0, 2, 6, a); }
    });
  });
}

export function pathTile(id: string): HTMLCanvasElement {
  return cached('path_' + id, () => {
    const { c, ctx } = makeCanvas(16, 16);
    if (id === 'caminho_madeira') { for (let r = 0; r < 4; r++) { rect(ctx, 0, r * 4, 16, 4, shade('#a8743a', (r % 2) * 0.08)); rect(ctx, 0, r * 4 + 3, 16, 1, '#6a4428'); } }
    else { rect(ctx, 0, 0, 16, 16, '#6a6a6a'); for (const [x, y, w, h] of [[1, 1, 7, 6], [9, 1, 6, 5], [1, 8, 5, 7], [7, 7, 8, 8]]) { rect(ctx, x, y, w, h, '#a8a8a8'); rect(ctx, x, y, w, 1, '#c8c8c8'); } }
    return { img: c, ox: 0, oy: 0, w: 16, h: 16 };
  }).img;
}

// ============ DECORAÇÃO ESTÁTICA ============
export function decoSprite(key: string, season: number): Sprite {
  return cached(`deco_${key}@s${season}`, () => {
    const P = SEASON_PAL[season];
    const [k, v] = key.split(':');
    switch (k) {
      case 'bush': return sprite(32, 24, 16, 22, g => {
        const c = season === 3 ? '#7a8a7a' : P.leafDark;
        canopyBlob(g, 16, 13, 13, season === 2 ? '#b87a3a' : season === 3 ? '#8a9a8a' : shade(P.leaf, -0.1), shade(c, -0.15), season === 3 ? '#ffffff' : P.leafLight, +(v || 3));
        if (season === 0) { const R = rng(+(v || 1)); for (let i = 0; i < 5; i++) circle(g, 6 + R() * 20, 6 + R() * 12, 1, '#f8a8c8'); }
        if (season === 1 && +(v || 0) % 2) { const R = rng(9); for (let i = 0; i < 5; i++) circle(g, 6 + R() * 20, 6 + R() * 12, 1, '#e83a4a'); }
      });
      case 'smallbush': return sprite(16, 16, 8, 14, g => canopyBlob(g, 8, 9, 6, season === 3 ? '#8a9a8a' : P.leaf, P.leafDark, season === 3 ? '#fff' : P.leafLight, 4));
      case 'flowers': return sprite(16, 12, 8, 10, g => { if (season === 3) return; const R = rng(+(v || 2)); for (let i = 0; i < 7; i++) { const x = 2 + R() * 12, y = 2 + R() * 7; rect(g, x, y + 1, 1, 2, P.leafDark); px(g, x, y, P.flowers[Math.floor(R() * P.flowers.length)]); } }, false);
      case 'tree': return treeSprite(v || 'carvalho', season, 4);
      case 'lamp': return sprite(12, 40, 6, 38, g => { rect(g, 5, 8, 2, 30, '#3a3a42'); rect(g, 3, 36, 6, 2, '#3a3a42'); rect(g, 2, 2, 8, 7, '#3a3a42'); rect(g, 3, 3, 6, 5, '#f8e8a0'); rect(g, 1, 1, 10, 1, '#2a2a32'); px(g, 5, 0, '#2a2a32'); });
      case 'bench': return sprite(32, 20, 16, 18, g => { rect(g, 2, 2, 28, 3, '#9a6a3a'); rect(g, 2, 8, 28, 4, '#a8743a'); rect(g, 2, 8, 28, 1, '#c8945a'); rect(g, 4, 12, 2, 6, '#3a3a3a'); rect(g, 26, 12, 2, 6, '#3a3a3a'); rect(g, 4, 5, 2, 3, '#3a3a3a'); rect(g, 26, 5, 2, 3, '#3a3a3a'); });
      case 'well': return sprite(32, 40, 16, 38, g => { ellipse(g, 16, 30, 14, 7, '#8a8a8a'); ellipse(g, 16, 28, 11, 5, '#2a3a5a'); for (let i = 0; i < 6; i++) rect(g, 3 + i * 5, 28, 4, 8, i % 2 ? '#9a9a9a' : '#7a7a7a'); rect(g, 4, 6, 2, 24, '#7a5232'); rect(g, 26, 6, 2, 24, '#7a5232'); rect(g, 1, 2, 30, 6, '#a8443a'); rect(g, 1, 2, 30, 1, '#c8644a'); rect(g, 6, 12, 20, 1, '#5a3a24'); });
      case 'sign': return sprite(16, 20, 8, 18, g => { rect(g, 7, 10, 2, 8, '#7a5232'); rect(g, 1, 3, 14, 8, '#a8743a'); rect(g, 1, 3, 14, 1, '#c8945a'); rect(g, 3, 6, 10, 1, '#5a3a24'); rect(g, 3, 8, 7, 1, '#5a3a24'); });
      case 'board': return sprite(32, 34, 16, 32, g => { rect(g, 3, 14, 3, 18, '#6a4228'); rect(g, 26, 14, 3, 18, '#6a4228'); rect(g, 1, 2, 30, 18, '#8a5a32'); rect(g, 3, 4, 26, 14, '#c8a06a'); for (const [x, y, c] of [[5, 5, '#f8f0d8'], [14, 6, '#f8e8f0'], [22, 5, '#e8f0f8'], [8, 11, '#f8f8e0'], [19, 11, '#f0f8e8']] as [number, number, string][]) { rect(g, x, y, 6, 6, c); px(g, x + 2, y, '#d83a3a'); } rect(g, 0, 1, 32, 2, '#5a3a20'); });
      case 'mailbox': return sprite(16, 22, 8, 20, g => { rect(g, 7, 10, 2, 10, '#6a4228'); rect(g, 3, 4, 10, 7, '#4a6ab8'); ellipse(g, 8, 4, 5, 2, '#4a6ab8'); rect(g, 12, 3, 1, 4, '#d83a3a'); });
      case 'bin': return sprite(32, 24, 16, 22, g => { rect(g, 2, 8, 28, 14, '#8a5a2a'); rect(g, 2, 8, 28, 2, '#a8743a'); for (let i = 0; i < 4; i++) rect(g, 4 + i * 7, 10, 1, 12, '#6a4220'); rect(g, 1, 4, 30, 5, '#6a7a8a'); rect(g, 1, 4, 30, 1, '#8a9aa8'); rect(g, 13, 13, 6, 4, '#e8d8a8'); });
      case 'crate': return sprite(16, 18, 8, 16, g => { rect(g, 1, 3, 14, 13, '#a8743a'); rect(g, 1, 3, 14, 1, '#c8945a'); rect(g, 1, 3, 1, 13, '#6a4428'); rect(g, 14, 3, 1, 13, '#6a4428'); for (let i = 0; i < 12; i++) px(g, 2 + i, 4 + i, '#6a4428'); });
      case 'barrel': return sprite(16, 20, 8, 18, g => { ellipse(g, 8, 10, 6, 8, '#8a5a2a'); rect(g, 2, 6, 12, 1, '#4a4a4a'); rect(g, 2, 13, 12, 1, '#4a4a4a'); ellipse(g, 8, 3, 5, 2, '#a8743a'); });
      case 'rock': return sprite(24, 18, 12, 16, g => { ellipse(g, 12, 10, 11, 6, '#8a8a8a'); ellipse(g, 10, 8, 7, 3, '#a8a8a8'); if (season === 3) ellipse(g, 10, 5, 6, 2, '#ffffff'); });
      case 'fountain': return sprite(48, 44, 24, 40, g => { ellipse(g, 24, 32, 22, 9, '#9a9aa2'); ellipse(g, 24, 31, 19, 7, '#4a8ad0'); ellipse(g, 24, 30, 6, 3, '#9a9aa2'); rect(g, 22, 12, 4, 18, '#a8a8b0'); ellipse(g, 24, 12, 8, 3, '#9a9aa2'); ellipse(g, 24, 11, 6, 2, '#6aaae0'); for (let i = 0; i < 5; i++) px(g, 19 + i * 2.5, 8 - (i % 2) * 2, '#d0ecff'); });
      case 'statue': return sprite(20, 40, 10, 38, g => { rect(g, 2, 30, 16, 8, '#8a8a8a'); rect(g, 4, 28, 12, 2, '#a8a8a8'); rect(g, 6, 8, 8, 20, '#b8b8b0'); circle(g, 10, 6, 4, '#b8b8b0'); rect(g, 4, 12, 2, 10, '#a8a8a0'); rect(g, 14, 10, 2, 6, '#a8a8a0'); rect(g, 15, 4, 1, 7, '#a8a8a0'); circle(g, 15, 3, 2, '#e8c86a'); });
      case 'grave': return sprite(16, 20, 8, 18, g => { rect(g, 3, 6, 10, 12, '#8a8a92'); ellipse(g, 8, 6, 5, 4, '#8a8a92'); rect(g, 6, 8, 4, 1, '#5a5a62'); rect(g, 7, 7, 2, 6, '#5a5a62'); rect(g, 2, 17, 12, 2, '#6a5a3a'); });
      case 'stall': return sprite(48, 40, 24, 38, g => { const c = ['#e85a4a', '#4a8ad8', '#e8c83a'][+(v || 0) % 3]; rect(g, 2, 20, 44, 14, '#a8743a'); rect(g, 2, 20, 44, 2, '#c8945a'); rect(g, 3, 4, 2, 30, '#6a4228'); rect(g, 43, 4, 2, 30, '#6a4228'); for (let i = 0; i < 8; i++) rect(g, i * 6, 2, 6, 7, i % 2 ? c : '#f8f0e0'); for (let i = 0; i < 4; i++) circle(g, 10 + i * 9, 18, 3, ['#e83a3a', '#f8a83a', '#7ac83a', '#a85ad8'][i]); });
      case 'lantern': return sprite(10, 16, 5, 14, g => { rect(g, 4, 0, 2, 3, '#3a3a3a'); rect(g, 1, 3, 8, 9, '#e8603a'); rect(g, 2, 4, 6, 7, '#f8c86a'); rect(g, 1, 12, 8, 1, '#3a3a3a'); }, false);
      case 'bunting': return sprite(64, 12, 32, 12, g => { for (let i = 0; i < 64; i++) px(g, i, 2 + Math.round(Math.sin((i / 64) * Math.PI) * 4), '#5a3a24'); for (let i = 0; i < 8; i++) { const x = 4 + i * 8, y = 3 + Math.round(Math.sin(((x + 2) / 64) * Math.PI) * 4); const c = ['#e85a4a', '#f8d03a', '#4ab84a', '#4a8ad8'][i % 4]; for (let k = 0; k < 4; k++) rect(g, x + k / 2, y + k, 4 - k, 1, c); } }, false);
      case 'table': return sprite(32, 22, 16, 20, g => { rect(g, 1, 4, 30, 8, '#f0e8d8'); rect(g, 1, 10, 30, 2, '#d8c8a8'); rect(g, 3, 12, 2, 8, '#6a4228'); rect(g, 27, 12, 2, 8, '#6a4228'); circle(g, 10, 6, 2, '#e8843a'); circle(g, 20, 7, 3, '#c84a3a'); rect(g, 15, 4, 3, 3, '#8a4a2a'); });
      case 'counter': return sprite(16, 22, 8, 20, g => { rect(g, 0, 4, 16, 16, '#8a5a32'); rect(g, 0, 4, 16, 3, '#c8945a'); rect(g, 0, 7, 16, 1, '#5a3a20'); for (let i = 2; i < 16; i += 5) rect(g, i, 9, 3, 9, '#6a4228'); });
      case 'shelf': return sprite(32, 34, 16, 32, g => { rect(g, 1, 2, 30, 30, '#6a4228'); for (const y of [10, 20]) rect(g, 1, y, 30, 2, '#4a2c18'); const R = rng(+(v || 1) + 11); for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) { const col = ['#c84a3a', '#4a8ad8', '#e8c83a', '#4ab84a', '#a85ad8', '#f8f0e0'][Math.floor(R() * 6)]; rect(g, 3 + i * 4.5, 4 + row * 10, 3, 6, col); } });
      case 'bed': return sprite(18, 32, 9, 30, g => { rect(g, 1, 2, 16, 28, '#6a4228'); rect(g, 2, 3, 14, 6, '#f8f0e0'); rect(g, 2, 9, 14, 20, v ? '#4a8ad8' : '#c84a5a'); rect(g, 2, 9, 14, 2, shade(v ? '#4a8ad8' : '#c84a5a', 0.25)); for (let i = 3; i < 16; i += 4) rect(g, i, 13, 2, 14, shade(v ? '#4a8ad8' : '#c84a5a', -0.1)); });
      case 'stove': return sprite(16, 26, 8, 24, g => { rect(g, 1, 8, 14, 16, '#4a4a52'); rect(g, 1, 8, 14, 3, '#6a6a72'); circle(g, 5, 9, 2, '#2a2a2a'); circle(g, 11, 9, 2, '#2a2a2a'); rect(g, 3, 14, 10, 8, '#2a2a32'); rect(g, 5, 18, 6, 2, '#f87a2a'); rect(g, 10, 0, 3, 8, '#5a5a62'); });
      case 'fireplace': return sprite(32, 34, 16, 32, g => { rect(g, 1, 4, 30, 28, '#8a7a72'); for (let j = 4; j < 32; j += 4) for (let i = (j % 8 ? 1 : 3); i < 31; i += 6) rect(g, i, j, 5, 3, '#9a8a82'); rect(g, 8, 16, 16, 16, '#2a1a1a'); ellipse(g, 16, 28, 6, 3, '#f8803a'); ellipse(g, 16, 26, 3, 3, '#f8d04a'); rect(g, 0, 2, 32, 3, '#6a4228'); });
      case 'tv': return sprite(16, 20, 8, 18, g => { rect(g, 2, 3, 12, 10, '#3a2a22'); rect(g, 3, 4, 10, 7, '#5a9ad8'); rect(g, 4, 13, 8, 5, '#6a4228'); });
      case 'plant': return sprite(16, 22, 8, 20, g => { rect(g, 4, 14, 8, 6, '#b8643a'); canopyBlob(g, 8, 9, 6, '#4a9a3a', '#2f6a3a', '#7ac85a', 3); });
      case 'rug': return sprite(+(v || 3) * 16, 32, (+(v || 3) * 16) / 2, 32, g => { const w = +(v || 3) * 16; rect(g, 0, 0, w, 32, '#a83a3a'); rect(g, 3, 3, w - 6, 26, '#c8584a'); rect(g, 6, 6, w - 12, 20, '#a83a3a'); rect(g, 9, 9, w - 18, 14, '#e8b86a'); }, false);
      case 'anvil': return sprite(24, 18, 12, 16, g => { rect(g, 2, 2, 20, 5, '#4a4a52'); rect(g, 2, 2, 20, 1, '#7a7a82'); rect(g, 8, 7, 8, 5, '#3a3a42'); rect(g, 5, 12, 14, 4, '#3a3a42'); });
      case 'ladder': return sprite(16, 16, 8, 16, g => { rect(g, 3, 0, 2, 16, '#8a5a2a'); rect(g, 11, 0, 2, 16, '#8a5a2a'); for (let i = 2; i < 16; i += 4) rect(g, 3, i, 10, 2, '#a8743a'); }, false);
      case 'hole': return sprite(16, 16, 8, 16, g => { ellipse(g, 8, 8, 7, 6, '#0a0606'); ellipse(g, 8, 6, 6, 3, '#1a1010'); }, false);
      case 'elevator': return sprite(32, 40, 16, 38, g => { rect(g, 2, 2, 28, 36, '#5a4a3a'); rect(g, 6, 8, 20, 26, '#2a2420'); rect(g, 2, 2, 28, 4, '#8a6a4a'); for (let i = 6; i < 34; i += 4) rect(g, 6, i, 20, 1, '#4a4038'); rect(g, 26, 16, 3, 6, '#e8c83a'); });
      case 'minecart': return sprite(32, 24, 16, 22, g => { rect(g, 3, 6, 26, 12, '#6a6a72'); rect(g, 3, 6, 26, 2, '#8a8a92'); circle(g, 9, 19, 3, '#3a3a3a'); circle(g, 23, 19, 3, '#3a3a3a'); ellipse(g, 16, 6, 10, 3, '#3a2a1a'); });
      case 'altar': return sprite(32, 30, 16, 28, g => { rect(g, 2, 14, 28, 14, '#8a7a9a'); rect(g, 2, 14, 28, 2, '#aa9aba'); circle(g, 16, 8, 5, v === 'on' ? '#f8e08a' : '#5a4a6a'); rect(g, 12, 12, 8, 3, '#6a5a7a'); });
      case 'boat': return sprite(48, 22, 24, 20, g => { for (let i = 0; i < 8; i++) rect(g, 2 + i, 8 + i, 44 - i * 2, 1, '#8a5a32'); rect(g, 4, 7, 40, 2, '#c8945a'); rect(g, 22, 0, 2, 8, '#6a4228'); });
      case 'dock': return sprite(16, 16, 8, 16, g => { rect(g, 0, 0, 16, 16, '#8a6440'); for (let r = 0; r < 4; r++) rect(g, 0, r * 4 + 3, 16, 1, '#5a3a24'); }, false);
      case 'cattail': return sprite(12, 20, 6, 18, g => { for (const x of [3, 6, 9]) { rect(g, x, 6 + (x % 3), 1, 12, season === 3 ? '#a89a7a' : '#5a8a3a'); rect(g, x, 3 + (x % 3), 1, 4, '#6a3a1a'); } }, false);
      case 'lilypad': return sprite(16, 10, 8, 8, g => { ellipse(g, 8, 5, 6, 3, '#4a9a4a'); rect(g, 8, 3, 3, 2, '#2a6a8a'); if (season < 2) circle(g, 6, 4, 1, '#f8c8e0'); }, false);
      case 'cliffstairs': return sprite(16, 16, 8, 16, g => { for (let i = 0; i < 4; i++) { rect(g, 0, i * 4, 16, 4, shade('#9a8a7a', -i * 0.05)); rect(g, 0, i * 4, 16, 1, '#b8a898'); } }, false);
      case 'crystal': return sprite(16, 22, 8, 20, g => { const c = BIOMES[2].accent; rect(g, 6, 4, 4, 16, c); rect(g, 2, 10, 3, 10, shade(c, -0.15)); rect(g, 11, 8, 3, 12, shade(c, -0.1)); px(g, 7, 5, '#ffffff'); });
      case 'mushroomglow': return sprite(16, 16, 8, 14, g => { ellipse(g, 6, 8, 4, 3, '#4ad8c8'); rect(g, 5, 10, 2, 4, '#e8e8f0'); ellipse(g, 11, 10, 3, 2, '#4ab8d8'); rect(g, 10, 11, 2, 3, '#e8e8f0'); });
      case 'lava': return sprite(16, 16, 8, 16, g => { ellipse(g, 8, 8, 7, 6, '#e8501a'); ellipse(g, 7, 7, 4, 3, '#f8a03a'); }, false);
      case 'hay': return sprite(16, 16, 8, 14, g => { rect(g, 1, 4, 14, 10, '#e8c86a'); for (let i = 2; i < 14; i += 3) rect(g, i, 4, 1, 10, '#c8a04a'); rect(g, 1, 8, 14, 1, '#a8743a'); });
      case 'trough': return sprite(16, 12, 8, 10, g => { rect(g, 0, 2, 16, 8, '#8a5a32'); rect(g, 2, 3, 12, 4, v === 'full' ? '#e8c86a' : '#4a2c18'); }, false);
      case 'cave': return sprite(48, 40, 24, 38, g => { ellipse(g, 24, 26, 20, 16, '#5a4a3a'); ellipse(g, 24, 28, 15, 13, '#1a1210'); rect(g, 9, 28, 30, 12, '#1a1210'); for (const [x, y] of [[8, 14], [38, 16], [14, 6], [32, 8], [24, 4]] as [number, number][]) ellipse(g, x, y, 5, 4, '#7a6a5a'); rect(g, 12, 18, 2, 20, '#6a4a2a'); rect(g, 34, 18, 2, 20, '#6a4a2a'); rect(g, 10, 16, 28, 3, '#7a5232'); });
      case 'silo': return sprite(48, 64, 24, 62, g => { rect(g, 6, 14, 36, 46, '#b8b0a0'); for (let j = 16; j < 60; j += 6) rect(g, 6, j, 36, 1, '#98907e'); rect(g, 6, 14, 3, 46, '#d8d0c0'); ellipse(g, 24, 14, 18, 10, '#6a6a7a'); ellipse(g, 24, 11, 14, 6, '#8a8a9a'); rect(g, 19, 40, 10, 20, '#6a4a2a'); rect(g, 4, 58, 40, 4, '#8a8070'); });
      case 'mat': return sprite(16, 16, 8, 16, g => { rect(g, 2, 4, 12, 9, '#8a3a2a'); rect(g, 3, 5, 10, 7, '#b85a3a'); for (let i = 3; i < 13; i += 2) px(g, i, 12, '#e8c86a'); }, false);
      case 'heater': return sprite(16, 20, 8, 18, g => { rect(g, 2, 4, 12, 14, '#8a3a2a'); for (let i = 5; i < 17; i += 3) rect(g, 3, i, 10, 1, '#5a2a1a'); rect(g, 5, 0, 6, 4, '#4a4a4a'); });
    }
    return sprite(16, 16, 8, 16, g => rect(g, 2, 2, 12, 12, '#ff00ff'));
  });
}

// ============ PRÉDIOS ============
export interface BuildingStyle {
  w: number; wallH: number; roofH: number; wall: 'plaster' | 'wood' | 'brick' | 'stone' | 'log'; wallColor: string; roofColor: string;
  doorX: number; windows: number[]; chimney?: number; awning?: string; sign?: string; porch?: boolean; ruined?: boolean; barn?: boolean; tower?: boolean;
}

export function buildingSprite(key: string, st: BuildingStyle, season: number): Sprite {
  return cached(`bld_${key}@s${season}`, () => {
    const W = st.w * 16, wallPx = st.wallH * 16, roofPx = st.roofH * 16, H = wallPx + roofPx;
    const { c, ctx: g } = makeCanvas(W, H + 2);
    const wy = roofPx; // topo da parede
    const wc = st.wallColor;
    // parede
    rect(g, 0, wy, W, wallPx, wc);
    if (st.wall === 'wood' || st.wall === 'log') for (let j = wy; j < wy + wallPx; j += st.wall === 'log' ? 5 : 4) { rect(g, 0, j + (st.wall === 'log' ? 4 : 3), W, 1, shade(wc, -0.25)); if (st.wall === 'log') { rect(g, 0, j, W, 1, shade(wc, 0.15)); circle(g, 1, j + 2, 2, shade(wc, 0.2)); circle(g, W - 2, j + 2, 2, shade(wc, 0.2)); } }
    if (st.wall === 'brick') for (let j = wy; j < wy + wallPx; j += 4) for (let i = ((j / 4) % 2) * 4; i < W; i += 8) { rect(g, i, j, 7, 3, shade(wc, (hash2(i, j, 3) - 0.5) * 0.15)); }
    if (st.wall === 'stone') for (let j = wy; j < wy + wallPx; j += 6) for (let i = ((j / 6) % 2) * 5; i < W; i += 10) { rect(g, i, j, 9, 5, shade(wc, (hash2(i, j, 4) - 0.5) * 0.18)); rect(g, i, j, 9, 1, shade(wc, 0.15)); }
    if (st.wall === 'plaster') { for (let i = 0; i < 40; i++) px(g, hash2(i, 1, 7) * W, wy + hash2(i, 2, 7) * wallPx, shade(wc, -0.06)); rect(g, 0, wy + wallPx - 5, W, 5, shade(wc, -0.2)); }
    // vigas laterais
    rect(g, 0, wy, 3, wallPx, shade(wc, -0.3)); rect(g, W - 3, wy, 3, wallPx, shade(wc, -0.3));
    // janelas
    for (const wx of st.windows) {
      const x = wx * 16 + 2, y = wy + Math.max(4, wallPx - 26);
      rect(g, x - 1, y - 1, 14, 12, '#5a3a22'); rect(g, x, y, 12, 10, '#7ab0d8'); rect(g, x, y, 12, 3, '#a8d0f0'); rect(g, x + 5, y, 2, 10, '#5a3a22'); rect(g, x, y + 4, 12, 1, '#5a3a22');
      rect(g, x - 2, y + 10, 16, 2, '#8a5a32');
      if (season < 3 && !st.ruined) { for (let i = 0; i < 5; i++) circle(g, x + 1 + i * 2.5, y + 12, 1, ['#e85a6a', '#f8d03a', '#e85a6a', '#a85ad8', '#f8d03a'][i]); }
      if (st.ruined) { for (let i = 0; i < 4; i++) rect(g, x + i * 3, y + (i % 2) * 3, 2, 4, '#3a2a1a'); }
    }
    // porta
    const dx = st.doorX * 16 + 2;
    if (st.doorX < 0) { /* sem porta */ }
    else if (st.barn) { rect(g, dx - 2, wy + wallPx - 26, 32, 26, '#6a2a1a'); for (let i = 0; i < 28; i += 4) rect(g, dx + i, wy + wallPx - 24, 1, 24, '#4a1a10'); rect(g, dx - 2, wy + wallPx - 26, 32, 2, '#f0e8d8'); for (let i = 0; i < 24; i++) { px(g, dx + i, wy + wallPx - 24 + i, '#f0e8d8'); px(g, dx + 27 - i, wy + wallPx - 24 + i, '#f0e8d8'); } }
    else {
      rect(g, dx - 1, wy + wallPx - 21, 14, 21, '#4a2a18'); rect(g, dx, wy + wallPx - 20, 12, 20, st.ruined ? '#3a2a20' : '#8a5030');
      for (let i = 0; i < 12; i += 4) rect(g, dx + i, wy + wallPx - 20, 1, 20, '#6a3a20'); px(g, dx + 9, wy + wallPx - 10, '#f8d03a');
      rect(g, dx - 3, wy + wallPx - 1, 18, 1, '#9a9a9a');
    }
    // toldo
    if (st.awning) for (let i = 0; i < W; i += 6) { rect(g, i, wy + 2, 6, 6, (i / 6) % 2 ? st.awning : '#f8f0e0'); rect(g, i + 1, wy + 8, 4, 1, (i / 6) % 2 ? st.awning : '#f8f0e0'); }
    // placa
    if (st.sign) { const sx = Math.max(4, dx + 16), sy = wy + 6; if (sx + 22 < W) { rect(g, sx, sy, 22, 8, '#5a3a22'); rect(g, sx + 1, sy + 1, 20, 6, st.sign); for (let i = 0; i < 3; i++) rect(g, sx + 4 + i * 5, sy + 3, 3, 2, '#3a2416'); } }
    // telhado
    const rc = st.roofColor, rd = shade(rc, -0.25), rl = shade(rc, 0.2);
    for (let j = 0; j < roofPx + 2; j++) {
      const inset = st.tower ? Math.max(0, Math.round((roofPx - j) * 0.4)) : Math.max(0, Math.round((roofPx - j) * 0.12));
      rect(g, inset - 2, j, W - inset * 2 + 4, 1, j % 4 === 3 ? rd : rc);
      if (j % 4 === 1) for (let i = (j % 8 === 1 ? 0 : 4); i < W; i += 8) px(g, i + inset, j, rl);
    }
    rect(g, -2, roofPx, W + 4, 2, shade(rc, -0.45));
    rect(g, 0, 0, W, 2, rl);
    if (season === 3) { for (let j = 0; j < 5; j++) rect(g, Math.round((roofPx - j) * 0.12) - 1, j, W - Math.round((roofPx - j) * 0.12) * 2 + 2, 1, j < 4 ? '#f4f8ff' : '#d0dcec'); for (let i = 0; i < W; i += 3) if (hash2(i, 0, 9) < 0.5) rect(g, i, roofPx - 1, 1, 2 + Math.floor(hash2(i, 1, 9) * 3), '#f4f8ff'); }
    if (st.ruined) { for (let i = 0; i < 6; i++) { const x = hash2(i, 2, 11) * (W - 14), y = hash2(i, 3, 11) * (roofPx - 8); rect(g, x, y, 10, 6, '#3a2a1a'); rect(g, x + 2, y + 2, 2, 2, rd); } }
    if (st.chimney !== undefined) { const cx = st.chimney * 16 + 4; rect(g, cx, 2, 8, roofPx * 0.5, '#8a5a4a'); rect(g, cx - 1, 0, 10, 3, '#6a3a2a'); }
    // sombra no chão
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(2, H, W - 2, 2);
    return { img: c, ox: 0, oy: H, w: W, h: H + 2 };
  });
}

// ============ ANIMAIS ============
export interface AnimalLook { kind: string; color: string; color2: string }
export function animalSprite(kind: string, color: string, frame: number, facing: 'left' | 'right', baby = false, eating = false): Sprite {
  return cached(`anim_${kind}_${color}_${frame}_${facing}_${baby ? 1 : 0}_${eating ? 1 : 0}`, () => {
    let s: Sprite;
    const leg = frame % 2;
    if (kind === 'galinha' || kind === 'pato') {
      s = sprite(16, 16, 8, 15, g => {
        const c = color, d = shade(c, -0.2);
        ellipse(g, 7, 9, 5, 4, c); ellipse(g, 5, 10, 3, 2, d);
        const hy = eating ? 9 : 4;
        circle(g, 11, hy + 1, 3, c); px(g, 12, hy, '#1a1a1a');
        if (kind === 'galinha') { rect(g, 14, hy + 1, 2, 1, '#f8a83a'); rect(g, 10, hy - 2, 3, 2, '#e83a2a'); }
        else { rect(g, 13, hy + 1, 3, 2, '#f8a83a'); }
        rect(g, 1, 6, 2, 3, d);
        rect(g, 6 + leg, 13, 1, 2, '#f8a83a'); rect(g, 9 - leg, 13, 1, 2, '#f8a83a');
      });
    } else {
      const big = kind === 'vaca';
      s = sprite(28, 22, 14, 21, g => {
        const c = color, d = shade(c, -0.22), l = shade(c, 0.2);
        const bx = 4, by = 6, bw = big ? 18 : 15, bh = big ? 9 : 8;
        if (kind === 'ovelha') { for (let i = 0; i < 6; i++) circle(g, bx + 2 + i * 2.6, by + 3 + (i % 2), 4, i % 2 ? c : l); }
        else { rect(g, bx, by, bw, bh, c); rect(g, bx, by, bw, 2, l); }
        if (kind === 'vaca') { circle(g, bx + 5, by + 4, 2, color2Of(color)); circle(g, bx + 12, by + 3, 3, color2Of(color)); }
        const hx = bx + bw - 1, hy = eating ? by + 6 : by - 3;
        rect(g, hx, hy, 6, 6, kind === 'ovelha' ? '#3a3a3a' : c); rect(g, hx + 4, hy + 3, 3, 3, kind === 'vaca' ? '#f0b0a0' : shade(c, -0.1));
        px(g, hx + 3, hy + 1, '#1a1a1a');
        if (kind === 'cabra') { rect(g, hx + 1, hy - 3, 1, 3, '#d8c8a8'); rect(g, hx + 3, hy - 3, 1, 3, '#d8c8a8'); rect(g, hx + 4, hy + 6, 2, 2, d); }
        if (kind === 'vaca') { rect(g, hx, hy - 1, 2, 2, '#e8e0d0'); rect(g, hx + 4, hy - 1, 2, 2, '#e8e0d0'); }
        rect(g, bx - 1, by + 1, 2, 4, d);
        const lc = kind === 'ovelha' ? '#3a3a3a' : d;
        rect(g, bx + 1 + leg, by + bh, 2, 5, lc); rect(g, bx + 5 - leg, by + bh, 2, 5, lc); rect(g, bx + bw - 6 + leg, by + bh, 2, 5, lc); rect(g, bx + bw - 3 - leg, by + bh, 2, 5, lc);
      });
    }
    if (baby) { const { c, ctx } = makeCanvas(s.w, s.h); ctx.drawImage(s.img, s.w * 0.2, s.h * 0.3, s.w * 0.7, s.h * 0.7); s = { ...s, img: c }; }
    return facing === 'left' ? flipH(s) : s;
  });
}
function color2Of(c: string) { return c === '#f0ece0' || c === '#f8f4f0' ? '#3a2a22' : '#f8f0e8'; }

export function horseSprite(frame: number, facing: 'left' | 'right'): Sprite {
  return cached(`horse_${frame}_${facing}`, () => {
    const s = sprite(36, 28, 18, 27, g => {
      const c = '#8a5a32', d = '#5a3a20';
      rect(g, 6, 9, 20, 9, c); rect(g, 6, 9, 20, 2, shade(c, 0.2));
      rect(g, 24, 2, 5, 11, c); rect(g, 26, 0, 7, 6, c); px(g, 30, 2, '#1a1a1a'); rect(g, 22, 2, 3, 9, d);
      rect(g, 2, 10, 4, 8, d);
      const l = frame % 2;
      for (const [x, o] of [[8, l], [12, -l], [20, -l], [24, l]]) rect(g, x + o, 18, 2, 8, d);
      rect(g, 12, 8, 8, 4, '#8a2a2a');
    });
    return facing === 'left' ? flipH(s) : s;
  });
}

// ============ MONSTROS ============
export function monsterSprite(kind: string, frame: number, hurt = false): Sprite {
  return cached(`mon_${kind}_${frame}_${hurt ? 1 : 0}`, () => {
    const f = frame % 2;
    let s: Sprite;
    switch (kind) {
      case 'slime': case 'slime_azul': case 'slime_magma': {
        const c = kind === 'slime' ? '#5ad84a' : kind === 'slime_azul' ? '#4a9ae8' : '#f86a2a';
        s = sprite(16, 16, 8, 15, g => { ellipse(g, 8, 10 + f, 6 + f, 5 - f, c); ellipse(g, 6, 8 + f, 2, 1, shade(c, 0.45)); px(g, 6, 10 + f, '#1a1a1a'); px(g, 10, 10 + f, '#1a1a1a'); });
        break;
      }
      case 'morcego': case 'morcego_cristal': {
        const c = kind === 'morcego' ? '#5a4a6a' : '#7ab8e8';
        s = sprite(20, 14, 10, 13, g => { circle(g, 10, 7, 3, c); px(g, 9, 6, '#f8e04a'); px(g, 11, 6, '#f8e04a'); for (let i = 0; i < 6; i++) { rect(g, 3 - i * 0 + i, f ? 3 + i / 2 : 7 - i / 2, 1, 3, c); rect(g, 16 - i, f ? 3 + i / 2 : 7 - i / 2, 1, 3, c); } rect(g, 9, 2, 1, 2, c); rect(g, 11, 2, 1, 2, c); });
        break;
      }
      case 'besouro': s = sprite(16, 14, 8, 13, g => { ellipse(g, 8, 7, 6, 4, '#3a6a5a'); rect(g, 8, 3, 1, 8, '#2a4a3a'); ellipse(g, 6, 5, 2, 1, '#6aa890'); circle(g, 14, 7, 2, '#2a3a2a'); for (let i = 0; i < 3; i++) { rect(g, 4 + i * 3, 11, 1, 2 + ((i + f) % 2), '#1a2a1a'); } }); break;
      case 'caranguejo': s = sprite(18, 16, 9, 15, g => { ellipse(g, 9, 9, 7, 5, '#8a8a8a'); ellipse(g, 8, 7, 4, 2, '#a8a8a8'); if (f || hurt) { rect(g, 2, 12, 2, 3, '#c84a3a'); rect(g, 14, 12, 2, 3, '#c84a3a'); px(g, 6, 5, '#1a1a1a'); px(g, 11, 5, '#1a1a1a'); circle(g, 2, 7, 2, '#c84a3a'); circle(g, 16, 7, 2, '#c84a3a'); } }); break;
      case 'espirito': s = sprite(16, 20, 8, 19, g => { ellipse(g, 8, 8, 6, 7, 'rgba(180,140,230,0.85)'); for (let i = 0; i < 4; i++) rect(g, 3 + i * 3, 13 + ((i + f) % 2) * 2, 2, 3, 'rgba(180,140,230,0.85)'); rect(g, 5, 7, 2, 3, '#1a1030'); rect(g, 9, 7, 2, 3, '#1a1030'); }, false); break;
      case 'golem': s = sprite(24, 26, 12, 25, g => { rect(g, 5, 6, 14, 14, '#5a4a4a'); rect(g, 7, 2, 10, 6, '#6a5a5a'); rect(g, 9, 4, 2, 2, '#f8803a'); rect(g, 13, 4, 2, 2, '#f8803a'); rect(g, 1, 8 + f, 4, 10, '#4a3a3a'); rect(g, 19, 8 - f, 4, 10, '#4a3a3a'); rect(g, 7, 20, 4, 5, '#4a3a3a'); rect(g, 13, 20, 4, 5, '#4a3a3a'); for (let i = 0; i < 4; i++) px(g, 8 + i * 3, 10 + (i % 2) * 4, '#f86a2a'); }); break;
      case 'sombra': s = sprite(16, 24, 8, 23, g => { ellipse(g, 8, 12, 5, 10, '#2a1a3a'); circle(g, 8, 5, 4, '#2a1a3a'); px(g, 6, 5, '#e84a4a'); px(g, 10, 5, '#e84a4a'); rect(g, 2, 10 + f, 3, 2, '#2a1a3a'); rect(g, 11, 10 - f, 3, 2, '#2a1a3a'); }); break;
      default: s = sprite(16, 16, 8, 15, g => circle(g, 8, 8, 6, '#f0f'));
    }
    if (hurt) { const { c, ctx } = makeCanvas(s.w, s.h); ctx.drawImage(s.img, 0, 0); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, 0, s.w, s.h); s = { ...s, img: c }; }
    return s;
  });
}

// ============ ROCHAS DA MINA ============
export function mineRockSprite(kind: string, biome: number, v: number): Sprite {
  return cached(`mrock_${kind}_${biome}_${v}`, () => sprite(16, 16, 8, 14, g => {
    const B = BIOMES[biome];
    const base = shade(B.wall, 0.35 + (v % 3) * 0.05);
    ellipse(g, 8, 9, 6 + (v % 2), 5, base); ellipse(g, 7, 7, 4, 2, shade(base, 0.2)); px(g, 11, 11, shade(base, -0.3));
    const ore: Record<string, string> = { cobre: '#e08a4a', ferro: '#d8d8e0', ouro: '#f8d03a', astral: '#c87af8', carvao: '#1a1a1a', gema: '#4ad8e8', cristalq: '#ffffff' };
    if (ore[kind]) { const c = ore[kind]; for (const [x, y] of [[5, 8], [10, 7], [8, 11], [7, 6]]) { rect(g, x, y, 2, 2, c); px(g, x, y, shade(c, 0.4)); } }
  }));
}
