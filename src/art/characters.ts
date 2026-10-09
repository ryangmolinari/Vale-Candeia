// Gerador paramétrico de personagens (jogador e NPCs) e retratos.
import { makeCanvas, shade } from '../core/util';
import { px, rect, outline, Sprite, flipH, ellipse, Ctx } from './painter';

export interface Look {
  skin: string; hair: number; hairColor: string; shirt: number; shirtColor: string; pants: string; shoes?: string;
  eyes?: string; glasses?: boolean; beard?: boolean; freckles?: boolean; hat?: string; earring?: boolean;
  old?: boolean; kid?: boolean; apron?: string; scarf?: string; lips?: boolean;
}

export const SKINS = ['#ffe0c4', '#f3c8a0', '#e0a878', '#c08458', '#9a6440', '#6e4428'];
export const HAIR_COLORS = ['#2a1a12', '#5a3418', '#8a5a2a', '#d8a84a', '#c8542a', '#e8e0d0', '#3a2a5a', '#2a6a5a', '#c86a9a', '#7a7a7a'];
export const HAIR_STYLES = ['Curto', 'Longo', 'Rabo de cavalo', 'Coque', 'Cacheado', 'Raspado', 'Franja', 'Tranças'];
export const SHIRT_STYLES = ['Camiseta', 'Macacão', 'Vestido', 'Colete'];

type DirKey = 'down' | 'up' | 'side';
export type Pose = 'walk' | 'swingUp' | 'swingDown' | 'cast' | 'carry' | 'sit';
export interface CharSheet { [k: string]: Sprite } // chave: dir_pose_frame

const W = 16, H = 26;

function drawHairBack(ctx: Ctx, L: Look, dir: DirKey, by: number) {
  const hc = L.hairColor, hd = shade(hc, -0.3);
  if (L.hair === 5) return;
  if (L.hair === 1 || L.hair === 7) { // longo / tranças caem atrás
    if (dir === 'up') { rect(ctx, 3, by + 4, 10, 11, hc); rect(ctx, 3, by + 13, 10, 2, hd); }
    else if (dir === 'down') { rect(ctx, 2, by + 5, 2, 10, hc); rect(ctx, 12, by + 5, 2, 10, hc); }
    else { rect(ctx, 3, by + 4, 5, 11, hc); rect(ctx, 3, by + 13, 5, 2, hd); }
  }
  if (L.hair === 2) { // rabo
    if (dir === 'up') { rect(ctx, 7, by + 9, 3, 6, hc); }
    else if (dir === 'side') { rect(ctx, 1, by + 5, 3, 7, hc); px(ctx, 1, by + 11, hd); }
  }
}

function drawHairFront(ctx: Ctx, L: Look, dir: DirKey, by: number) {
  const hc = L.hairColor, hl = shade(hc, 0.2), hd = shade(hc, -0.25);
  const style = L.hair;
  if (L.hat) {
    const hat = L.hat;
    rect(ctx, 2, by + 2, 12, 2, shade(hat, -0.2)); rect(ctx, 4, by - 1, 8, 4, hat); rect(ctx, 4, by - 1, 8, 1, shade(hat, 0.2));
    if (dir !== 'up' && style !== 5) { rect(ctx, 3, by + 4, 1, 3, hc); rect(ctx, 12, by + 4, 1, 3, hc); }
    return;
  }
  if (style === 5) { // raspado
    rect(ctx, 4, by + 1, 8, 2, hd); if (dir === 'up') rect(ctx, 4, by + 1, 8, 6, hd);
    return;
  }
  // topo
  rect(ctx, 3, by + 1, 10, 4, hc); rect(ctx, 4, by, 8, 1, hc); rect(ctx, 5, by, 4, 1, hl);
  if (dir === 'up') { rect(ctx, 3, by + 1, 10, 9, hc); rect(ctx, 4, by + 2, 3, 1, hl); if (style === 3) { rect(ctx, 6, by - 2, 4, 3, hc); } if (style === 7) { rect(ctx, 3, by + 9, 2, 6, hc); rect(ctx, 11, by + 9, 2, 6, hc); } return; }
  if (dir === 'down') {
    if (style === 6) rect(ctx, 3, by + 4, 10, 2, hc); // franja
    else { rect(ctx, 3, by + 4, 3, 1, hc); rect(ctx, 10, by + 4, 3, 1, hc); }
    rect(ctx, 3, by + 4, 1, 4, hc); rect(ctx, 12, by + 4, 1, 4, hc);
    if (style === 4) { for (let i = 2; i < 14; i += 2) px(ctx, i, by + 1 + (i % 4 ? 0 : 1), hl); rect(ctx, 2, by + 3, 1, 5, hc); rect(ctx, 13, by + 3, 1, 5, hc); }
    if (style === 3) rect(ctx, 6, by - 2, 4, 3, hc);
    if (style === 7) { rect(ctx, 2, by + 6, 2, 8, hc); rect(ctx, 12, by + 6, 2, 8, hc); px(ctx, 2, by + 13, hd); px(ctx, 13, by + 13, hd); }
  } else {
    rect(ctx, 3, by + 1, 7, 7, hc); rect(ctx, 10, by + 2, 3, 3, hc);
    if (style === 6) rect(ctx, 10, by + 4, 3, 2, hc);
    if (style === 3) rect(ctx, 3, by - 1, 4, 3, hc);
    if (style === 4) { px(ctx, 2, by + 3, hc); px(ctx, 2, by + 6, hc); }
  }
}

function drawBody(ctx: Ctx, L: Look, dir: DirKey, pose: Pose, frame: number) {
  const kid = !!L.kid;
  const skin = L.skin, sd = shade(skin, -0.18);
  const shirt = L.shirtColor, shd = shade(shirt, -0.22), shl = shade(shirt, 0.15);
  const pants = L.pants, pd = shade(pants, -0.25);
  const shoes = L.shoes || '#4a3020';
  const walk = pose === 'walk';
  const bob = walk && (frame === 1 || frame === 3) ? 1 : 0;
  const hy = (kid ? 4 : 0) + bob; // topo da cabeça
  const torsoY = hy + 11;
  const torsoH = kid ? 5 : 6;
  const legY = torsoY + torsoH;
  const legH = kid ? 3 : 4;
  // pernas
  let lOff = 0, rOff = 0;
  if (walk) { if (frame === 1) { lOff = -1; rOff = 1; } if (frame === 3) { lOff = 1; rOff = -1; } }
  if (pose === 'sit') { legY; }
  if (dir === 'side') {
    const s1 = walk ? (frame === 1 ? 2 : frame === 3 ? -2 : 0) : 0;
    rect(ctx, 6 + s1, legY, 3, legH - bob, pants); rect(ctx, 6 + s1, legY + legH - bob, 4, 2, shoes);
    rect(ctx, 7 - s1, legY, 3, legH - bob, pd); rect(ctx, 7 - s1, legY + legH - bob, 4, 2, shade(shoes, -0.2));
  } else {
    rect(ctx, 5, legY, 3, legH + lOff - bob, pants); rect(ctx, 5, legY + legH + lOff - bob, 3, 2, shoes);
    rect(ctx, 8, legY, 3, legH + rOff - bob, dir === 'up' ? pants : pd); rect(ctx, 8, legY + legH + rOff - bob, 3, 2, shoes);
  }
  // torso
  const style = L.shirt;
  rect(ctx, 4, torsoY, 8, torsoH, shirt);
  rect(ctx, 4, torsoY, 8, 1, shl);
  if (style === 1) { // macacão: alças + calça
    rect(ctx, 4, torsoY + 2, 8, torsoH - 2, pants); rect(ctx, 5, torsoY, 1, 2, pants); rect(ctx, 10, torsoY, 1, 2, pants);
    if (dir === 'down') { px(ctx, 5, torsoY + 2, '#e8c84a'); px(ctx, 10, torsoY + 2, '#e8c84a'); }
  } else if (style === 2) { // vestido
    rect(ctx, 3, legY - 1, 10, 3, shirt); rect(ctx, 3, legY + 1, 10, 1, shd);
  } else if (style === 3) { // colete
    if (dir === 'down') { rect(ctx, 4, torsoY, 2, torsoH, shd); rect(ctx, 10, torsoY, 2, torsoH, shd); }
  }
  if (L.apron && dir === 'down') { rect(ctx, 5, torsoY + 2, 6, torsoH + 1, L.apron); rect(ctx, 5, torsoY + 2, 6, 1, shade(L.apron, 0.2)); }
  if (L.scarf && dir !== 'up') { rect(ctx, 4, torsoY, 8, 2, L.scarf); if (dir === 'down') rect(ctx, 9, torsoY + 2, 2, 3, L.scarf); }
  rect(ctx, 4, torsoY + torsoH - 1, 8, 1, shd);
  // braços
  const armC = style === 2 || style === 3 ? shirt : shirt;
  if (dir === 'side') {
    if (pose === 'swingUp') { rect(ctx, 8, torsoY - 5, 3, 6, armC); rect(ctx, 8, torsoY - 7, 3, 2, skin); }
    else if (pose === 'swingDown') { rect(ctx, 9, torsoY + 1, 5, 3, armC); rect(ctx, 13, torsoY + 1, 2, 3, skin); }
    else if (pose === 'cast') { rect(ctx, 9, torsoY, 4, 3, armC); rect(ctx, 12, torsoY - 1, 2, 2, skin); }
    else if (pose === 'carry') { rect(ctx, 7, torsoY - 5, 3, 6, armC); rect(ctx, 7, torsoY - 7, 3, 2, skin); }
    else {
      const sw = walk ? (frame === 1 ? -1 : frame === 3 ? 1 : 0) : 0;
      rect(ctx, 7 + sw, torsoY + 1, 3, 4, shd); rect(ctx, 7 + sw, torsoY + 5, 3, 2, skin);
    }
  } else {
    if (pose === 'swingUp' || pose === 'carry') {
      rect(ctx, 2, torsoY - 5, 2, 6, armC); rect(ctx, 12, torsoY - 5, 2, 6, armC);
      rect(ctx, 2, torsoY - 7, 2, 2, skin); rect(ctx, 12, torsoY - 7, 2, 2, skin);
    } else if (pose === 'swingDown' || pose === 'cast') {
      rect(ctx, 3, torsoY + 1, 2, 4, armC); rect(ctx, 11, torsoY + 1, 2, 4, armC);
      if (dir === 'down') { rect(ctx, 5, torsoY + 5, 6, 2, skin); } else { rect(ctx, 3, torsoY + 5, 2, 1, skin); rect(ctx, 11, torsoY + 5, 2, 1, skin); }
    } else {
      const sw = walk ? (frame === 1 ? 1 : frame === 3 ? -1 : 0) : 0;
      rect(ctx, 2, torsoY + 1 + sw, 2, 4, shd); rect(ctx, 12, torsoY + 1 - sw, 2, 4, shd);
      rect(ctx, 2, torsoY + 5 + sw, 2, 2, skin); rect(ctx, 12, torsoY + 5 - sw, 2, 2, skin);
    }
  }
  // cabeça
  drawHairBack(ctx, L, dir, hy);
  if (dir === 'side') {
    rect(ctx, 4, hy + 2, 9, 9, skin); rect(ctx, 12, hy + 6, 1, 2, skin); rect(ctx, 4, hy + 10, 8, 1, sd);
    rect(ctx, 6, hy + 11, 4, 1, sd); // pescoço
    px(ctx, 10, hy + 6, '#2a1a1a'); px(ctx, 10, hy + 7, '#2a1a1a');
    if (L.glasses) { rect(ctx, 9, hy + 5, 3, 1, '#2a2a2a'); rect(ctx, 9, hy + 6, 3, 2, 'rgba(200,230,255,0.6)'); }
    px(ctx, 12, hy + 9, shade(skin, -0.25));
    if (L.beard) { rect(ctx, 8, hy + 8, 5, 3, L.hairColor); }
    if (L.freckles) { px(ctx, 9, hy + 8, shade(skin, -0.3)); }
  } else if (dir === 'down') {
    rect(ctx, 3, hy + 2, 10, 9, skin); rect(ctx, 4, hy + 10, 8, 1, sd);
    rect(ctx, 6, hy + 11, 4, 1, sd);
    const ec = L.eyes || '#2a1a1a';
    px(ctx, 5, hy + 6, ec); px(ctx, 5, hy + 7, ec); px(ctx, 10, hy + 6, ec); px(ctx, 10, hy + 7, ec);
    px(ctx, 4, hy + 8, shade(skin, -0.08)); px(ctx, 11, hy + 8, shade(skin, -0.08));
    if (L.glasses) { rect(ctx, 4, hy + 6, 3, 2, 'rgba(200,230,255,0.6)'); rect(ctx, 9, hy + 6, 3, 2, 'rgba(200,230,255,0.6)'); rect(ctx, 4, hy + 5, 8, 1, '#2a2a2a'); }
    if (L.beard) { rect(ctx, 4, hy + 8, 8, 3, L.hairColor); rect(ctx, 6, hy + 9, 4, 1, shade(skin, -0.2)); }
    else px(ctx, 7, hy + 9, shade(skin, -0.25)), px(ctx, 8, hy + 9, shade(skin, -0.25));
    if (L.freckles) { px(ctx, 4, hy + 8, shade(skin, -0.3)); px(ctx, 11, hy + 8, shade(skin, -0.3)); }
    if (L.old) { px(ctx, 4, hy + 5, shade(skin, -0.2)); px(ctx, 11, hy + 5, shade(skin, -0.2)); }
    if (L.earring) { px(ctx, 2, hy + 8, '#ffd84a'); px(ctx, 13, hy + 8, '#ffd84a'); }
  } else {
    rect(ctx, 3, hy + 2, 10, 9, skin); rect(ctx, 6, hy + 11, 4, 1, sd);
  }
  drawHairFront(ctx, L, dir, hy);
}

/** Gera a folha completa de animações de um personagem. */
export function buildCharSheet(L: Look): CharSheet {
  const sheet: CharSheet = {};
  const dirs: DirKey[] = ['down', 'up', 'side'];
  const poses: [Pose, number][] = [['walk', 4], ['swingUp', 1], ['swingDown', 1], ['cast', 1], ['carry', 1]];
  for (const d of dirs) for (const [p, n] of poses) for (let f = 0; f < n; f++) {
    const { c, ctx } = makeCanvas(W, H);
    drawBody(ctx, L, d, p, f);
    outline(c, -0.6);
    const s: Sprite = { img: c, ox: 8, oy: H - 1, w: W, h: H };
    if (d === 'side') { sheet[`right_${p}_${f}`] = s; sheet[`left_${p}_${f}`] = flipH(s); }
    else sheet[`${d}_${p}_${f}`] = s;
  }
  return sheet;
}

export type Expr = 'neutral' | 'happy' | 'sad' | 'angry' | 'blush';

/** Retrato detalhado 48x48. */
export function buildPortrait(L: Look, expr: Expr, bg = '#c9a36a'): HTMLCanvasElement {
  const S = 48;
  const { c, ctx } = makeCanvas(S, S);
  rect(ctx, 0, 0, S, S, bg);
  for (let i = 0; i < S; i += 4) rect(ctx, 0, i, S, 2, shade(bg, 0.04));
  const { c: f, ctx: g } = makeCanvas(S, S);
  const skin = L.skin, sd = shade(skin, -0.15), sdd = shade(skin, -0.3);
  const hc = L.hairColor, hd = shade(hc, -0.3), hl = shade(hc, 0.2);
  const kidOff = L.kid ? 4 : 0;
  // cabelo de trás
  if (L.hair === 1 || L.hair === 7) { rect(g, 9, 12 + kidOff, 30, 30, hc); rect(g, 9, 38, 30, 4, hd); }
  if (L.hair === 2) { rect(g, 34, 14 + kidOff, 6, 18, hc); }
  // ombros
  rect(g, 6, 40, 36, 8, L.shirtColor); rect(g, 6, 40, 36, 2, shade(L.shirtColor, 0.15));
  if (L.apron) rect(g, 14, 42, 20, 6, L.apron);
  if (L.scarf) rect(g, 12, 38, 24, 4, L.scarf);
  if (L.shirt === 1) { rect(g, 14, 42, 4, 6, L.pants); rect(g, 30, 42, 4, 6, L.pants); }
  // pescoço
  rect(g, 19, 34, 10, 7, sd);
  // rosto
  ellipse(g, 24, 24 + kidOff / 2, 11, 13 - kidOff / 2, skin);
  rect(g, 13, 28, 2, 4, sd);
  // orelhas
  rect(g, 11, 22, 3, 6, skin); rect(g, 34, 22, 3, 6, skin); px(g, 12, 24, sd); px(g, 35, 24, sd);
  if (L.earring) { rect(g, 11, 28, 2, 2, '#ffd84a'); rect(g, 35, 28, 2, 2, '#ffd84a'); }
  // olhos
  const ey = 24;
  const ec = L.eyes || '#3a2414';
  const eye = (x: number) => {
    if (expr === 'happy') { rect(g, x, ey + 1, 5, 1, '#2a1a12'); px(g, x - 1, ey + 2, '#2a1a12'); px(g, x + 5, ey + 2, '#2a1a12'); return; }
    rect(g, x, ey, 5, 4, '#ffffff'); rect(g, x + 1, ey, 3, 4, ec); rect(g, x + 2, ey + 1, 1, 2, '#120a06'); px(g, x + 1, ey, '#ffffff');
    rect(g, x, ey - 1, 5, 1, '#2a1a12');
    if (expr === 'sad') { px(g, x, ey - 2, hd); }
  };
  eye(16); eye(27);
  // sobrancelhas
  const bc = L.old ? '#d8d0c8' : hd;
  if (expr === 'angry') { rect(g, 16, ey - 4, 2, 1, bc); rect(g, 18, ey - 3, 3, 1, bc); rect(g, 27, ey - 3, 3, 1, bc); rect(g, 30, ey - 4, 2, 1, bc); }
  else if (expr === 'sad') { rect(g, 16, ey - 3, 3, 1, bc); rect(g, 19, ey - 4, 2, 1, bc); rect(g, 27, ey - 4, 2, 1, bc); rect(g, 29, ey - 3, 3, 1, bc); }
  else { rect(g, 16, ey - 4, 5, 1, bc); rect(g, 27, ey - 4, 5, 1, bc); }
  // nariz
  rect(g, 23, 27, 2, 4, sd); px(g, 22, 30, sdd); px(g, 25, 30, sdd);
  // boca
  const mc = L.lips ? '#b8404a' : shade(skin, -0.4);
  if (expr === 'happy' || expr === 'blush') { rect(g, 20, 33, 8, 1, mc); px(g, 19, 32, mc); px(g, 28, 32, mc); rect(g, 21, 34, 6, 1, '#ffffff'); }
  else if (expr === 'sad') { rect(g, 21, 34, 6, 1, mc); px(g, 20, 35, mc); px(g, 27, 35, mc); }
  else if (expr === 'angry') { rect(g, 20, 34, 8, 1, mc); }
  else { rect(g, 21, 33, 6, 1, mc); }
  if (expr === 'blush' || expr === 'happy') { rect(g, 14, 29, 4, 2, 'rgba(240,110,110,0.45)'); rect(g, 30, 29, 4, 2, 'rgba(240,110,110,0.45)'); }
  if (L.freckles) for (const [x, y] of [[16, 29], [18, 30], [30, 29], [32, 30], [17, 31]]) px(g, x, y, sdd);
  if (L.old) { rect(g, 15, 31, 2, 1, sd); rect(g, 31, 31, 2, 1, sd); rect(g, 19, 19, 10, 1, sd); }
  if (L.glasses) {
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 1;
    rect(g, 14, ey - 2, 9, 7, 'rgba(210,235,255,0.35)'); rect(g, 25, ey - 2, 9, 7, 'rgba(210,235,255,0.35)');
    for (const x0 of [14, 25]) { rect(g, x0, ey - 2, 9, 1, '#2a2a2a'); rect(g, x0, ey + 4, 9, 1, '#2a2a2a'); rect(g, x0, ey - 2, 1, 7, '#2a2a2a'); rect(g, x0 + 8, ey - 2, 1, 7, '#2a2a2a'); }
    rect(g, 23, ey, 2, 1, '#2a2a2a');
  }
  if (L.beard) { ellipse(g, 24, 34, 10, 5, hc); rect(g, 20, 32, 8, 2, hc); rect(g, 21, 33, 6, 1, mc); }
  // cabelo da frente
  const top = 10 + kidOff;
  if (L.hat) {
    rect(g, 8, top + 4, 32, 4, shade(L.hat, -0.2)); rect(g, 13, top - 4, 22, 9, L.hat); rect(g, 13, top - 4, 22, 2, shade(L.hat, 0.2)); rect(g, 13, top + 2, 22, 2, shade(L.hat, -0.35));
    if (L.hair !== 5) { rect(g, 12, top + 8, 3, 8, hc); rect(g, 33, top + 8, 3, 8, hc); }
  } else if (L.hair === 5) {
    ellipse(g, 24, top + 6, 11, 5, hd);
  } else {
    ellipse(g, 24, top + 6, 13, 8, hc);
    rect(g, 11, top + 6, 4, 14, hc); rect(g, 33, top + 6, 4, 14, hc);
    for (let i = 0; i < 6; i++) rect(g, 15 + i * 3, top + 2, 2, 1, hl);
    if (L.hair === 6) rect(g, 13, top + 8, 22, 5, hc);
    else { rect(g, 13, top + 8, 9, 3, hc); rect(g, 27, top + 8, 8, 3, hc); rect(g, 20, top + 8, 3, 5, hc); }
    if (L.hair === 3) ellipse(g, 24, top - 3, 6, 4, hc);
    if (L.hair === 4) for (let i = 0; i < 8; i++) ellipse(g, 12 + i * 3.4, top + 2 + (i % 2) * 2, 3, 3, i % 2 ? hc : hl);
    if (L.hair === 7) { rect(g, 9, top + 14, 4, 22, hc); rect(g, 35, top + 14, 4, 22, hc); for (let j = 0; j < 22; j += 4) { rect(g, 9, top + 14 + j, 4, 1, hd); rect(g, 35, top + 14 + j, 4, 1, hd); } }
    if (L.old && L.hairColor === '#e8e0d0') { rect(g, 15, top + 3, 3, 1, '#ffffff'); }
  }
  outline(f, -0.6);
  ctx.drawImage(f, 0, 0);
  // moldura
  rect(ctx, 0, 0, S, 1, '#5c3a1e'); rect(ctx, 0, S - 1, S, 1, '#5c3a1e'); rect(ctx, 0, 0, 1, S, '#5c3a1e'); rect(ctx, S - 1, 0, 1, S, '#5c3a1e');
  return c;
}
