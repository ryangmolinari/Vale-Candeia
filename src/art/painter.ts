// Ferramentas de pintura em pixel art usadas por todo o gerador de arte.
import { makeCanvas, shade, hash2 } from '../core/util';

export type Ctx = CanvasRenderingContext2D;

export function px(ctx: Ctx, x: number, y: number, c: string) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); }
export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

/** Elipse preenchida pixelada. */
export function ellipse(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, c: string) {
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.01))));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
export function circle(ctx: Ctx, cx: number, cy: number, r: number, c: string) { ellipse(ctx, cx, cy, r, r, c); }

/** Desenha a partir de uma matriz ASCII com paleta. '.' é transparente. */
export function ascii(ctx: Ctx, ox: number, oy: number, rows: string[], pal: Record<string, string>) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const c = pal[ch];
      if (c) px(ctx, ox + x, oy + y, c);
    }
  }
}

/** Contorno automático: pinta de cor escura os pixels transparentes vizinhos a pixels opacos. */
export function outline(c: HTMLCanvasElement, darkness = -0.55, colorOverride?: string) {
  const ctx = c.getContext('2d')!;
  const { width: w, height: h } = c;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const out = new Uint8ClampedArray(d);
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (d[i + 3] > 0) continue;
    let src = -1;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      if (a(x + dx, y + dy) > 200) { src = ((y + dy) * w + (x + dx)) * 4; break; }
    }
    if (src < 0) continue;
    if (colorOverride) {
      const v = parseInt(colorOverride.slice(1), 16);
      out[i] = (v >> 16) & 255; out[i + 1] = (v >> 8) & 255; out[i + 2] = v & 255; out[i + 3] = 255;
    } else {
      const k = 1 + darkness;
      out[i] = d[src] * k * 0.8; out[i + 1] = d[src + 1] * k * 0.75; out[i + 2] = d[src + 2] * k * 0.9; out[i + 3] = 255;
    }
  }
  img.data.set(out);
  ctx.putImageData(img, 0, 0);
}

/** Preenche retângulo com ruído de duas a três cores (textura). */
export function noiseRect(ctx: Ctx, x: number, y: number, w: number, h: number, base: string, seed: number, amt = 0.08, density = 0.35) {
  rect(ctx, x, y, w, h, base);
  const lo = shade(base, -amt), hi = shade(base, amt);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const r = hash2(i + x * 7, j + y * 13, seed);
    if (r < density / 2) px(ctx, x + i, y + j, lo);
    else if (r > 1 - density / 2) px(ctx, x + i, y + j, hi);
  }
}

export interface Sprite { img: HTMLCanvasElement; ox: number; oy: number; w: number; h: number; }

/** Cria um sprite pintado por callback; origem (ox, oy) = ponto do "pé" do objeto. */
export function sprite(w: number, h: number, ox: number, oy: number, paint: (ctx: Ctx) => void, doOutline = true): Sprite {
  const { c, ctx } = makeCanvas(w, h);
  paint(ctx);
  if (doOutline) outline(c);
  return { img: c, ox, oy, w, h };
}

export function flipH(s: Sprite): Sprite {
  const { c, ctx } = makeCanvas(s.w, s.h);
  ctx.translate(s.w, 0); ctx.scale(-1, 1); ctx.drawImage(s.img, 0, 0);
  return { img: c, ox: s.w - s.ox, oy: s.oy, w: s.w, h: s.h };
}

export function toDataURL(s: HTMLCanvasElement) { return s.toDataURL(); }
