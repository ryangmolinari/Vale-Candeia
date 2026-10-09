// Renderização: chão pré-renderizado, objetos ordenados por profundidade, clima, iluminação e efeitos.
import { TILE, makeCanvas, key, unkey, hash2, clamp, lerp } from '../core/util';
import { G } from '../core/ctx';
import { getState, absMinutes, WObj } from '../state/state';
import { paintGround, drawWaterSparkles } from '../art/tiles';
import { treeSprite, stumpSprite, debrisSprite, cropSprite, giantCropSprite, soilTile, placedSprite, fenceSprite, pathTile, decoSprite, buildingSprite, animalSprite, horseSprite, monsterSprite, mineRockSprite, BuildingStyle } from '../art/objects';
import { Sprite } from '../art/painter';
import { iconFor } from '../art/icons';
import { BUILDING_STYLES } from '../world/builder';
import { CROP_BY_ID, cropStage, FRUIT_TREES } from '../data/crops';
import { ITEMS } from '../data/items';
import { cropReady } from '../systems/farming';
import { machineReady, machineWorking, isMachine } from '../systems/machines';
import { drawFishingUI } from '../systems/fishing';
import { T } from '../world/types';
import { HALL } from '../data/game';
import { SEASON_PAL } from '../art/palette';
import { targetTile, held, CAN_CAP } from '../systems/actions';
import type { NPCEnt } from '../systems/npcs';
import type { Monster } from '../systems/combat';
import type { AnimalEnt } from '../systems/animals';
import { thunderClap } from '../audio/audio';

interface Drawable { y: number; draw: (ctx: CanvasRenderingContext2D) => void }

export class Renderer {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
  buf: HTMLCanvasElement; b: CanvasRenderingContext2D;
  light: HTMLCanvasElement; l: CanvasRenderingContext2D;
  zoom = 4; bw = 480; bh = 270;
  camX = 0; camY = 0;
  ground: HTMLCanvasElement | null = null; groundKey = '';
  shakes = new Map<string, number>();
  falling: { map: string; x: number; y: number; kind: string; t: number; dir: number }[] = [];
  rain: { x: number; y: number; s: number }[] = [];
  weatherT = 0;
  birds: { x: number; y: number; vx: number; vy: number; z: number; fly: boolean; t: number; c: string }[] = [];
  birdMap = '';
  smokeT = 0;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d')!;
    ({ c: this.buf, ctx: this.b } = makeCanvas(480, 270));
    ({ c: this.light, ctx: this.l } = makeCanvas(480, 270));
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const dpr = 1;
    const W = window.innerWidth, H = window.innerHeight;
    this.canvas.width = W * dpr; this.canvas.height = H * dpr;
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    const pref = getState()?.settings?.zoom || 0;
    this.zoom = pref || Math.max(2, Math.round(Math.min(W / 480, H / 270)));
    this.bw = Math.ceil(W / this.zoom); this.bh = Math.ceil(H / this.zoom);
    this.buf.width = this.bw; this.buf.height = this.bh; this.light.width = this.bw; this.light.height = this.bh;
    this.b.imageSmoothingEnabled = false; this.ctx.imageSmoothingEnabled = false;
  }
  invalidateGround() { this.groundKey = ''; }
  shakeTile(map: string, k: string) { this.shakes.set(map + '|' + k, 0.3); }
  fallTree(map: string, x: number, y: number, kind: string, facing: string) { this.falling.push({ map, x, y, kind, t: 0, dir: facing === 'left' ? -1 : 1 }); }
  screenToTile(sx: number, sy: number): [number, number] { return [Math.floor((sx / this.zoom + this.camX) / TILE), Math.floor((sy / this.zoom + this.camY) / TILE)]; }

  render(dt: number) {
    const s = getState();
    const w = G.world;
    const b = this.b;
    const p = G.player;
    const season = s.time.season;
    // câmera travada no jogador (sem tremor)
    const mw = w.def.w * TILE, mh = w.def.h * TILE;
    let cx = Math.round(p.x) - Math.floor(this.bw / 2), cy = Math.round(p.y - 12) - Math.floor(this.bh / 2);
    cx = mw <= this.bw ? -Math.floor((this.bw - mw) / 2) : clamp(cx, 0, mw - this.bw);
    cy = mh <= this.bh ? -Math.floor((this.bh - mh) / 2) : clamp(cy, 0, mh - this.bh);
    if (G.fx.shake > 0) { cx += Math.round((Math.random() - 0.5) * G.fx.shakeMag * 2); cy += Math.round((Math.random() - 0.5) * G.fx.shakeMag * 2); }
    this.camX = cx; this.camY = cy;
    b.fillStyle = '#120c0a'; b.fillRect(0, 0, this.bw, this.bh);
    // chão
    const gk = w.def.id + '|' + season + '|' + (w.def as any)._lvl + '|' + (w.def as any)._sig;
    if (this.groundKey !== gk) { this.ground = paintGround(w.def, season); this.groundKey = gk; }
    b.drawImage(this.ground!, -cx, -cy);
    const x0 = Math.max(0, Math.floor(cx / TILE) - 1), y0 = Math.max(0, Math.floor(cy / TILE) - 1);
    const x1 = Math.min(w.def.w - 1, Math.ceil((cx + this.bw) / TILE) + 1), y1 = Math.min(w.def.h - 1, Math.ceil((cy + this.bh) / TILE) + 1);
    drawWaterSparkles(b, w.def, x0, y0, x1, y1, performance.now(), season, cx, cy);
    // pisos colocados e solo
    const floors = w.st.floors || {};
    for (const k in floors) { const [x, y] = unkey(k); if (x >= x0 && x <= x1 && y >= y0 && y <= y1) b.drawImage(pathTile(floors[k]), x * TILE - cx, y * TILE - cy); }
    for (const k in w.st.soil) {
      const [x, y] = unkey(k); if (x < x0 || x > x1 || y < y0 || y > y1) continue;
      const so = w.st.soil[k];
      b.drawImage(soilTile(so.watered, season), x * TILE - cx, y * TILE - cy);
      if (so.fert) { b.fillStyle = so.fert === 'adubo_q' ? '#f8d03a' : so.fert === 'acelerador' ? '#4a8ad8' : so.fert === 'solo_umido' ? '#3a5a8a' : '#c8a86a'; for (let i = 0; i < 3; i++) b.fillRect(x * TILE - cx + 3 + i * 5, y * TILE - cy + 3 + (i % 2) * 8, 1, 1); }
    }
    // decorações rasteiras
    for (const d of w.def.decos) if (d.flat) { const sp = this.decoKey(d.sprite, season); if (sp) this.drawSprite(sp, d.x * TILE + 8, d.y * TILE + 16 + (d.offY || 0)); }
    if (G.festival) this.drawFestivalFloor(b);
    // destaque do alvo
    this.drawCursor(b);
    // ---- drawables ordenados ----
    const list: Drawable[] = [];
    const push = (y: number, draw: (c: CanvasRenderingContext2D) => void) => list.push({ y, draw });
    for (const d of w.def.decos) {
      if (d.flat) continue;
      if (d.x < x0 - 3 || d.x > x1 + 3 || d.y < y0 - 1 || d.y > y1 + 6) continue;
      push(d.y * TILE + 15, () => {
        const sp = this.decoKey(d.sprite, season, d);
        if (!sp) return;
        const sh = d.sway ? Math.sin(performance.now() / 900 + d.x * 0.7) * 0.6 : 0;
        if (d.sprite.startsWith('tree:') || d.shadow) this.shadow(d.x * TILE + 8, d.y * TILE + 14, d.sprite.startsWith('tree') ? 12 : 8);
        const alpha = d.sprite.startsWith('tree:') && this.behind(d.x * TILE + 8, d.y * TILE + 14, 22, 64) ? 0.45 : 1;
        this.drawSprite(sp, d.x * TILE + 8 + sh, d.y * TILE + 16 + (d.offY || 0), alpha);
      });
    }
    for (const bd of w.def.buildings) {
      if ((bd.x + bd.w) * TILE < cx - 32 || bd.x * TILE > cx + this.bw + 32) continue;
      push((bd.y + bd.h) * TILE - 1, () => this.drawBuilding(bd.sprite, bd.x, bd.y, bd.h, season));
    }
    for (const fb of w.farmBuildings) {
      push((fb.bld.y + fb.bld.h) * TILE - 1, () => this.drawFarmBuilding(fb.b.type, fb.bld.x, fb.bld.y, fb.bld.w, fb.bld.h, fb.b.daysLeft > 0, season));
    }
    for (const k in w.st.objects) {
      const [x, y] = unkey(k);
      if (x < x0 - 2 || x > x1 + 2 || y < y0 - 1 || y > y1 + 5) continue;
      const o = w.st.objects[k];
      push(y * TILE + (o.t === 'tree' && o.stage >= 2 ? 14 : 12), () => this.drawObject(o, x, y, k, season));
    }
    for (const k in w.st.soil) {
      const so = w.st.soil[k]; if (!so.crop) continue;
      const [x, y] = unkey(k); if (x < x0 || x > x1 || y < y0 || y > y1 + 1) continue;
      push(y * TILE + 11, () => this.drawCrop(so, x, y, k, season));
    }
    for (const f of this.falling) if (f.map === w.def.id) push(f.y * TILE + 14, () => this.drawFalling(f, season));
    // jogador
    push(p.y, () => this.drawPlayer());
    // NPCs
    for (const n of (G.npcs?.list || []) as NPCEnt[]) if (n.map === w.def.id) push(n.y, () => this.drawNPC(n));
    if (G.cutscene?.actors) for (const a of G.cutscene.actors) push(a.y, () => this.drawNPC(a));
    // animais e monstros
    for (const a of G.animals as AnimalEnt[]) push(a.y, () => {
      this.shadow(a.x, a.y, a.st.kind === 'galinha' || a.st.kind === 'pato' ? 5 : 9);
      const baby = a.st.age < 3;
      const sp = animalSprite(a.st.kind, a.st.color, (a.vx || a.vy) ? a.frame : 0, a.facing, baby, a.eating);
      this.drawSprite(sp, a.x, a.y);
      if (a.emoteT > 0) this.emote(a.emote || '♥', a.x, a.y - (sp.h + 4));
      if (a.st.produce) { this.bubble(a.x, a.y - sp.h - 2, a.st.produce); }
    });
    for (const m of G.monsters as Monster[]) push(m.y, () => {
      if (m.state !== 'hidden') this.shadow(m.x, m.y, 6);
      const sp = m.state === 'hidden' ? mineRockSprite('pedra', w.def.biome || 0, 1) : monsterSprite(m.def.id, m.frame, m.hurt > 0);
      this.drawSprite(sp, m.x, m.y - m.z);
      if (m.hp < m.def.hp && m.state !== 'hidden') { b.fillStyle = '#2a1a1a'; b.fillRect(Math.round(m.x - cx - 7), Math.round(m.y - cy - sp.h - m.z - 4), 14, 2); b.fillStyle = '#e84a4a'; b.fillRect(Math.round(m.x - cx - 7), Math.round(m.y - cy - sp.h - m.z - 4), Math.round(14 * m.hp / m.def.hp), 2); }
    });
    // cavalo parado
    const hp = s.flags.horsePos;
    if (!s.player.horse && hp && hp.map === w.def.id) push(hp.y, () => { this.shadow(hp.x, hp.y, 12); this.drawSprite(horseSprite(0, 'right'), hp.x, hp.y); });
    // itens no chão
    for (const d of G.drops) push(d.y, () => { this.shadow(d.x, d.y, 4); b.drawImage(iconFor(d.item.id, d.item.ref), Math.round(d.x - 8 - cx), Math.round(d.y - 14 - d.z - cy + Math.sin(d.t * 5) * (d.z === 0 ? 1 : 0))); });
    // fichas do festival
    if (G.festival?.tokens) for (const t of G.festival.tokens) if (!t.got) push(t.y, () => { const bob = Math.sin(performance.now() / 200 + t.x) * 2; b.fillStyle = ['#f8d03a', '#e85a8a', '#4ab8e8', '#8ae86a'][Math.floor(t.x) % 4]; b.fillRect(Math.round(t.x - cx - 2), Math.round(t.y - cy - 6 + bob), 5, 6); b.fillStyle = '#ffffff'; b.fillRect(Math.round(t.x - cx - 1), Math.round(t.y - cy - 5 + bob), 1, 2); });
    list.sort((a, c) => a.y - c.y);
    for (const d of list) d.draw(b);
    this.updateAmbientLife(b, dt);
    // linha de pesca
    this.drawFishingLine(b);
    G.fx.drawParticles(b, cx, cy);
    // clima e luz
    this.drawWeather(b, dt);
    this.drawLighting(b);
    G.fx.drawFloaters(b, cx, cy);
    if (G.fishing) drawFishingUI(b, this.bw, this.bh, p.x - cx, p.y - cy);
    // flash e fade
    if (G.fx.flash > 0) { b.globalAlpha = G.fx.flash; b.fillStyle = G.fx.flashColor; b.fillRect(0, 0, this.bw, this.bh); b.globalAlpha = 1; }
    if (G.fx.fade > 0) { b.globalAlpha = Math.min(1, G.fx.fade); b.fillStyle = '#000'; b.fillRect(0, 0, this.bw, this.bh); b.globalAlpha = 1; }
    // atualizações de animação
    for (const [k, v] of this.shakes) { if (v - dt <= 0) this.shakes.delete(k); else this.shakes.set(k, v - dt); }
    for (const f of this.falling) f.t += dt;
    this.falling = this.falling.filter(f => f.t < 1.0);
    // blit
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.buf, 0, 0, this.bw * this.zoom, this.bh * this.zoom);
  }

  decoKey(spriteKey: string, season: number, d?: any): Sprite | null {
    if (spriteKey.startsWith('altar:')) {
      const sec = spriteKey.slice(6); const on = getState().hallDone.includes(sec);
      return decoSprite('altar:' + (on ? 'on' : 'off'), season);
    }
    if (spriteKey.startsWith('fence:')) {
      const w = G.world; const has = (x: number, y: number) => w.def.decos.some(o => o.x === x && o.y === y && o.sprite.startsWith('fence'));
      return fenceSprite('cerca', has(d.x, d.y - 1), has(d.x, d.y + 1), has(d.x + 1, d.y), has(d.x - 1, d.y));
    }
    if (spriteKey === 'bed:') return decoSprite('bed', season);
    if (spriteKey === 'trough' && d?.interact?.startsWith('trough:')) {
      const b = getState().buildings.find(x => 'bld_' + x.id === G.world.def.id);
      return decoSprite(b?.troughs?.[+d.interact.slice(7)] ? 'trough:full' : 'trough', season);
    }
    return decoSprite(spriteKey, season);
  }
  drawSprite(sp: Sprite, x: number, y: number, alpha = 1) {
    if (alpha < 1) this.b.globalAlpha = alpha;
    this.b.drawImage(sp.img, Math.round(x - sp.ox - this.camX), Math.round(y - sp.oy - this.camY));
    if (alpha < 1) this.b.globalAlpha = 1;
  }
  shadow(x: number, y: number, r: number) {
    const b = this.b; b.fillStyle = 'rgba(20,10,20,0.22)';
    const X = Math.round(x - this.camX), Y = Math.round(y - this.camY);
    b.fillRect(X - r, Y - 1, r * 2, 2); b.fillRect(X - r + 2, Y - 2, r * 2 - 4, 4);
  }
  behind(x: number, baseY: number, halfW: number, h: number) {
    const p = G.player;
    return p.x > x - halfW && p.x < x + halfW && p.y < baseY && p.y > baseY - h;
  }
  emote(txt: string, x: number, y: number) {
    const b = this.b; const X = Math.round(x - this.camX), Y = Math.round(y - this.camY);
    b.fillStyle = '#4a2e1a'; b.fillRect(X - 6, Y - 9, 12, 10); b.fillStyle = '#fff8e8'; b.fillRect(X - 5, Y - 8, 10, 8); b.fillRect(X - 1, Y + 1, 2, 2);
    b.font = '8px "Pixelify Sans", monospace'; b.textAlign = 'center'; b.fillStyle = txt === '♥' ? '#e83a5a' : '#2a1a10'; b.fillText(txt, X, Y - 1); b.textAlign = 'left';
  }
  bubble(x: number, y: number, item: string) {
    const b = this.b; const bob = Math.round(Math.sin(performance.now() / 300) * 1.5);
    const X = Math.round(x - this.camX), Y = Math.round(y - this.camY) + bob;
    b.fillStyle = '#4a2e1a'; b.fillRect(X - 9, Y - 18, 18, 17); b.fillStyle = '#fff8e8'; b.fillRect(X - 8, Y - 17, 16, 15); b.fillRect(X - 2, Y - 2, 4, 2);
    b.drawImage(iconFor(item), X - 8, Y - 17);
  }

  drawCursor(b: CanvasRenderingContext2D) {
    if (G.paused() || !G.player || G.fishing) return;
    const h = held();
    const [tx, ty] = targetTile();
    const X = tx * TILE - this.camX, Y = ty * TILE - this.camY;
    const pulse = 0.5 + Math.sin(performance.now() / 180) * 0.2;
    b.globalAlpha = pulse;
    b.strokeStyle = '#fff8d0'; b.lineWidth = 1;
    b.strokeRect(X + 0.5, Y + 0.5, 15, 15);
    // pré-visualização da área carregada
    const ch = G.player.charge;
    if (ch.active && ch.level > 0) {
      b.fillStyle = 'rgba(255,248,200,0.25)';
      const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[G.player.facing as string]!;
      const perp = [d[1], d[0]];
      const tiles: [number, number][] = [];
      if (ch.level <= 2) for (let i = 0; i < (ch.level === 1 ? 3 : 5); i++) tiles.push([tx + d[0] * i, ty + d[1] * i]);
      else for (let i = 0; i < (ch.level === 3 ? 3 : 6); i++) for (let j = -1; j <= 1; j++) tiles.push([tx + d[0] * i + perp[0] * j, ty + d[1] * i + perp[1] * j]);
      for (const [x, y] of tiles) b.fillRect(x * TILE - this.camX, y * TILE - this.camY, 16, 16);
    }
    // fantasma do item a colocar
    if (h && ITEMS[h.id]?.place && !h.id.startsWith('caminho')) { b.globalAlpha = 0.5; b.drawImage(iconFor(h.id), X, Y); }
    b.globalAlpha = 1;
  }

  drawBuilding(spriteKey: string, x: number, y: number, h: number, season: number) {
    const s = getState();
    let st: BuildingStyle = BUILDING_STYLES[spriteKey];
    let k = spriteKey;
    if (spriteKey === 'b_hall' && s.hallDone.length >= 3) { st = { ...st, ruined: false }; k = 'b_hall_ok'; }
    if (spriteKey === 'estufa_ruina' && s.hallDone.includes('lavoura')) { st = { ...st, ruined: false, wall: 'plaster', wallColor: '#c8e8e0', roofColor: '#a8d8e8' }; k = 'estufa_ok'; }
    if (!st) return;
    const sp = buildingSprite(k, st, season);
    this.drawSprite(sp, x * TILE, (y + h) * TILE);
  }
  drawFarmBuilding(type: string, x: number, y: number, w: number, h: number, building: boolean, season: number) {
    const styles: Record<string, BuildingStyle> = {
      galinheiro: { w: 6, wallH: 3, roofH: 2, wall: 'wood', wallColor: '#e8d8b0', roofColor: '#a84a3a', doorX: 1, windows: [3, 4] },
      galinheiro_g: { w: 6, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#f0e0c0', roofColor: '#b85a3a', doorX: 1, windows: [3, 4], chimney: 4 },
      celeiro: { w: 7, wallH: 4, roofH: 3, wall: 'wood', wallColor: '#b83a2a', roofColor: '#5a3a2a', doorX: 2, windows: [5], barn: true },
      celeiro_g: { w: 7, wallH: 4, roofH: 4, wall: 'wood', wallColor: '#c84a3a', roofColor: '#4a3a3a', doorX: 2, windows: [0, 5], barn: true },
      estabulo: { w: 4, wallH: 3, roofH: 2, wall: 'log', wallColor: '#8a5a3a', roofColor: '#5a4a3a', doorX: -1, windows: [0, 3] },
    };
    if (type === 'silo') { this.drawSprite(decoSprite('silo', season), (x + 1.5) * TILE, (y + h) * TILE); }
    else if (type === 'poco') { this.drawSprite(decoSprite('well', season), (x + 1.5) * TILE, (y + h) * TILE); }
    else { const st = styles[type]; if (st) this.drawSprite(buildingSprite('fb_' + type, st, season), x * TILE, (y + h) * TILE, building ? 0.55 : 1); }
    if (building) {
      const b = this.b; const X = x * TILE - this.camX, Y = (y + h) * TILE - this.camY;
      b.fillStyle = '#8a5a32';
      for (let i = 0; i <= w; i += 2) b.fillRect(X + i * TILE, Y - h * TILE - 20, 2, h * TILE + 20);
      for (let j = 0; j < h + 1; j++) b.fillRect(X, Y - j * TILE - 4, w * TILE, 2);
      b.fillStyle = '#e8d8a8'; b.fillRect(X + 4, Y - 12, 30, 9); b.fillStyle = '#4a2e1a'; b.font = '7px monospace'; b.fillText('OBRA', X + 7, Y - 5);
    }
  }

  drawObject(o: WObj, x: number, y: number, k: string, season: number) {
    const w = G.world;
    const shk = this.shakes.get(w.def.id + '|' + k) || 0;
    const sx = shk > 0 ? Math.sin(shk * 60) * 1.5 : 0;
    const px = x * TILE + 8 + sx, py = y * TILE + 16;
    switch (o.t) {
      case 'tree': {
        if (o.stage >= 4) this.shadow(px, py - 2, 14);
        const sp = treeSprite(o.kind, w.def.outdoor ? season : 0, o.stage);
        const sway = o.stage >= 2 ? Math.sin(performance.now() / 1100 + x * 1.3) * 0.5 : 0;
        const alpha = o.stage >= 4 && this.behind(px, py - 2, 22, 70) ? 0.45 : 1;
        this.drawSprite(sp, px + sway, py, alpha);
        if (o.tapper) { this.drawSprite(placedSprite('extrator'), px, py - 6); if (o.tapper.output && (o.tapper.readyAt || 0) <= absMinutes(getState())) this.bubble(px, py - 24, o.tapper.output.id); }
        break;
      }
      case 'fruittree': {
        const ft = FRUIT_TREES.find(f => f.id === o.kind)!;
        const stage = o.age < 7 ? 1 : o.age < 14 ? 2 : o.age < 28 ? 3 : 4;
        if (stage >= 4) this.shadow(px, py - 2, 14);
        const sp = treeSprite(o.kind, w.def.outdoor ? season : (ft?.season ?? 0), stage, o.fruit > 0);
        this.drawSprite(sp, px, py, stage >= 4 && this.behind(px, py - 2, 22, 70) ? 0.45 : 1);
        break;
      }
      case 'debris': {
        if (o.kind === 'treestump') { this.drawSprite(stumpSprite('carvalho'), px, py); break; }
        if (o.kind === 'stump' || o.kind === 'boulder') this.shadow(px, py - 2, 10);
        this.drawSprite(debrisSprite(o.kind, w.def.outdoor ? season : 0, o.v), px + (o.kind === 'weed' ? Math.sin(performance.now() / 700 + x) * 0.5 : 0), py);
        break;
      }
      case 'grass': {
        const p = G.player; const near = Math.abs(p.x - px) < 10 && Math.abs(p.y - py + 4) < 10;
        this.drawSprite(debrisSprite('grass', season, o.v), px + Math.sin(performance.now() / 600 + x * 0.9 + y) * 0.8 + (near ? (p.x < px ? 1 : -1) : 0), py);
        break;
      }
      case 'forage': {
        const ic = iconFor(o.id);
        this.shadow(px, py - 3, 5);
        this.b.drawImage(ic, Math.round(px - 8 - this.camX), Math.round(py - 16 - this.camY));
        break;
      }
      case 'placed': {
        if (o.id === 'cerca' || o.id === 'cerca_pedra') {
          const has = (dx: number, dy: number) => { const n = w.obj(x + dx, y + dy); return n?.t === 'placed' && (n.id === 'cerca' || n.id === 'cerca_pedra'); };
          this.drawSprite(fenceSprite(o.id, has(0, -1), has(0, 1), has(1, 0), has(-1, 0)), px, py - 1);
          break;
        }
        const ready = isMachine(o.id) && machineReady(o);
        const working = isMachine(o.id) && machineWorking(o);
        this.shadow(px, py - 2, 6);
        const bounce = working && Math.floor(performance.now() / 400 + x) % 2 ? -1 : 0;
        this.drawSprite(placedSprite(o.id, { ready, working, color: o.color }), px, py - 1 + bounce);
        if (ready) this.bubble(px, py - 20, o.machine!.output!.id);
        if (working && Math.random() < 0.03) G.fx.parts.push({ x: px, y: py - 6, z: 14, vx: (Math.random() - 0.5) * 0.2, vy: 0, vz: 0.3, life: 0, max: 40, color: o.id === 'fornalha' || o.id === 'carvoeira' ? '#ffb050' : '#e8e8f0', size: 1, grav: 0, fade: true });
        break;
      }
      case 'rock': this.drawSprite(mineRockSprite(o.kind, w.def.biome || 0, o.v), px, py); break;
      case 'ladder': this.drawSprite(decoSprite('hole', season), px, py); this.drawSprite(decoSprite('ladder', season), px, py - 2); break;
    }
  }

  drawCrop(so: any, x: number, y: number, k: string, season: number) {
    const c = CROP_BY_ID[so.crop.id];
    const px = x * TILE + 8, py = y * TILE + 16;
    if (so.crop.giant) { this.drawSprite(giantCropSprite(c), px + 16, py + 32); return; }
    if (so.crop.id === 'misto_inverno') { const st = Math.min(4, Math.floor(so.crop.grown / 7 * 4)); this.drawSprite(cropSprite({ ...CROP_BY_ID.cebolaneve, id: 'misto', shape: 'leafy', color: '#a8c8a0' } as any, st), px, py); return; }
    if (!c) return;
    let st = cropStage(c, so.crop.grown);
    if (so.crop.regrowLeft) st = 3;
    const sway = Math.sin(performance.now() / 800 + x * 0.8 + y * 0.5) * 0.4;
    this.drawSprite(cropSprite(c, st, so.crop.dead), px + sway, py - 2);
    if (cropReady(so) && Math.floor(performance.now() / 600 + x) % 6 === 0) { this.b.fillStyle = 'rgba(255,255,220,0.8)'; this.b.fillRect(Math.round(px - this.camX + 4), Math.round(py - this.camY - 14), 1, 1); }
  }

  drawFalling(f: { x: number; y: number; kind: string; t: number; dir: number }, season: number) {
    const sp = treeSprite(f.kind, season, 4);
    const b = this.b;
    const X = Math.round(f.x * TILE + 8 - this.camX), Y = Math.round(f.y * TILE + 14 - this.camY);
    const ang = Math.min(1, (f.t / 0.7) ** 2) * (Math.PI / 2) * f.dir * 0.95;
    b.save(); b.translate(X, Y); b.rotate(ang); b.globalAlpha = f.t > 0.8 ? (1 - f.t) * 5 : 1;
    b.drawImage(sp.img, -sp.ox, -sp.oy); b.restore();
    if (f.t > 0.65 && f.t < 0.7) G.fx.leaves(f.x * TILE + 8 + f.dir * 40, f.y * TILE + 30, [SEASON_PAL[season].leaf, SEASON_PAL[season].leafDark, SEASON_PAL[season].leafLight]);
  }

  drawPlayer() {
    const p = G.player;
    const s = getState();
    const b = this.b;
    this.shadow(p.x, p.y, 6);
    if (s.player.horse) {
      const fr = p.moving ? Math.floor(performance.now() / 120) % 2 : 0;
      const hs = horseSprite(fr, p.facing === 'left' ? 'left' : 'right');
      this.drawSprite(hs, p.x, p.y + 2);
    }
    const sp = p.sprite();
    const flash = p.invuln > 0 && Math.floor(p.invuln * 15) % 2 === 0;
    const yoff = s.player.horse ? -10 : 0;
    if (!flash) this.drawSprite(sp, p.x, p.y + yoff);
    // ferramenta / arma em uso
    const a = p.action;
    const X = Math.round(p.x - this.camX), Y = Math.round(p.y - this.camY) + yoff;
    if (a && (a.kind === 'tool' || a.kind === 'weapon')) {
      const id = a.kind === 'tool' ? ({ hoe: 'enxada', axe: 'machado', pick: 'picareta', can: 'regador', scythe: 'foice' } as any)[a.tool!] : a.item;
      if (id) {
        const ic = iconFor(id);
        const k = a.t / a.dur;
        const up = a.kind === 'tool' ? a.t < a.hitAt * 0.75 : k < 0.25;
        b.save();
        const dir = p.facing;
        let ox = 0, oy = -20, ang = 0;
        if (a.tool === 'can') { ox = dir === 'left' ? -12 : dir === 'right' ? 12 : 0; oy = -14; ang = dir === 'left' ? -0.7 : 0.7; if (k > 0.3) G.fx.parts.length < 400 && Math.random() < 0.5 && G.fx.parts.push({ x: p.x + ox + (dir === 'left' ? -4 : 4), y: p.y - 4, z: 8, vx: (dir === 'left' ? -0.3 : dir === 'right' ? 0.3 : 0), vy: dir === 'down' ? 0.4 : dir === 'up' ? -0.4 : 0, vz: -0.2, life: 0, max: 18, color: '#8ac8f8', size: 1, grav: 0.1 }); }
        else if (a.kind === 'weapon' || a.tool === 'scythe') {
          const sweep = (k - 0.1) * Math.PI * 1.1;
          const base = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[dir];
          const an = base - Math.PI / 2 + sweep;
          ox = Math.cos(an) * 12; oy = Math.sin(an) * 10 - 10; ang = an + Math.PI / 4;
          if (k > 0.2 && k < 0.7) { b.globalAlpha = 0.35; b.strokeStyle = '#ffffff'; b.beginPath(); b.arc(X, Y - 10, 16, base - Math.PI / 2, an); b.stroke(); b.globalAlpha = 1; }
        } else if (up) { ox = dir === 'left' ? -4 : dir === 'right' ? 4 : 0; oy = -30; ang = dir === 'left' ? -0.5 : 0.5; }
        else { ox = dir === 'left' ? -12 : dir === 'right' ? 12 : 0; oy = dir === 'up' ? -16 : dir === 'down' ? -4 : -8; ang = dir === 'left' ? -2.2 : 2.2; if (dir === 'down') ang = 3.1; if (dir === 'up') ang = 0; }
        b.translate(X + ox, Y + oy); b.rotate(ang); b.drawImage(ic, -8, -8); b.restore();
      }
    }
    // item erguido sobre a cabeça
    const h = held();
    const liftItem = p.lift?.item || (G.fishing?.phase === 'show' ? G.fishing.showItem : null);
    if (liftItem) b.drawImage(iconFor(liftItem), X - 8, Y - sp.h - 14);
    else if (h && !a && !G.fishing && ITEMS[h.id] && !ITEMS[h.id].tool && !ITEMS[h.id].weapon && !p.charge.active) { b.globalAlpha = 0.95; b.drawImage(iconFor(h.id, h.ref), X - 8, Y - sp.h - 12); b.globalAlpha = 1; }
    // carga da ferramenta
    if (p.charge.active) { const lv = getState().tools[ITEMS[h?.id || '']?.tool || ''] || 0; for (let i = 0; i < lv; i++) { b.fillStyle = i < p.charge.level ? '#f8e04a' : '#4a2e1a'; b.fillRect(X - lv * 3 + i * 6, Y - sp.h - 8, 4, 3); } }
  }

  drawNPC(n: NPCEnt | any) {
    this.shadow(n.x, n.y, 6);
    const sp = n.sheet[`${n.facing}_walk_${n.moving ? n.frame : 0}`] || n.sheet['down_walk_0'];
    this.drawSprite(sp, n.x, n.y);
    if (n.emoteT > 0) this.emote(n.emote || '!', n.x, n.y - sp.h - 2);
    // indicador de pedido / evento
    const s = getState();
    if (s.quests.some(q => q.kind === 'request' && q.npc === n.id)) this.emote('!', n.x, n.y - sp.h - 2);
  }

  drawFishingLine(b: CanvasRenderingContext2D) {
    const f = G.fishing; if (!f || !['cast', 'wait', 'bite', 'game'].includes(f.phase)) return;
    const p = G.player;
    const d = { up: [2, -30], down: [6, -20], left: [-14, -24], right: [14, -24] }[p.facing as string]!;
    const rx = Math.round(p.x + d[0] - this.camX), ry = Math.round(p.y + d[1] - this.camY);
    const bx = Math.round(f.bx - this.camX), by = Math.round(f.by - this.camY);
    b.strokeStyle = 'rgba(240,240,240,0.8)'; b.lineWidth = 1;
    b.beginPath(); b.moveTo(rx + 0.5, ry + 0.5); b.quadraticCurveTo((rx + bx) / 2, Math.max(ry, by) + 8, bx + 0.5, by + 0.5); b.stroke();
    b.fillStyle = '#e83a3a'; b.fillRect(bx - 1, by - 2, 3, 2); b.fillStyle = '#ffffff'; b.fillRect(bx - 1, by, 3, 1);
    if (f.phase === 'wait' && Math.floor(f.t * 2) % 3 === 0) { b.strokeStyle = 'rgba(220,240,255,0.5)'; b.strokeRect(bx - 4, by - 1, 8, 3); }
  }

  drawFestivalFloor(b: CanvasRenderingContext2D) {
    const f = G.festival.def;
    // bandeirinhas e barracas
    for (let i = 0; i < 4; i++) this.drawSprite(decoSprite('bunting', 0), (22 + i * 4.5) * TILE, 19.4 * TILE);
    if (['sementes', 'colheita', 'flores'].includes(f.id)) { this.drawSprite(decoSprite('stall:0', 0), 23 * TILE, 33.5 * TILE); this.drawSprite(decoSprite('stall:1', 0), 36 * TILE, 33.5 * TILE); }
    if (f.id === 'caldeirao') { const X = 29.5 * TILE - this.camX, Y = 24 * TILE - this.camY; b.fillStyle = '#2a2a2a'; b.beginPath(); b.ellipse(X, Y, 14, 8, 0, 0, Math.PI * 2); b.fill(); b.fillStyle = '#c8843a'; b.beginPath(); b.ellipse(X, Y - 3, 11, 4, 0, 0, Math.PI * 2); b.fill(); if (Math.random() < 0.3) G.fx.parts.push({ x: 29.5 * TILE + (Math.random() - 0.5) * 16, y: 24 * TILE, z: 6, vx: 0, vy: 0, vz: 0.4, life: 0, max: 40, color: '#e8e8e8', size: 2, grav: 0, fade: true }); }
    if (f.id === 'ceia') this.drawSprite(decoSprite('table', 0), 29.5 * TILE, 23 * TILE);
  }

  /** Pássaros que fogem e fumaça das chaminés. */
  updateAmbientLife(b: CanvasRenderingContext2D, dt: number) {
    const s = getState(); const w = G.world;
    if (this.birdMap !== w.def.id) {
      this.birdMap = w.def.id; this.birds = [];
      const ok = w.def.outdoor && s.time.minutes < 1140 && !['chuva', 'tempestade'].includes(s.weather.today);
      if (ok) {
        const n = s.time.season === 3 ? 2 : 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n * 3 && this.birds.length < n; i++) {
          const x = Math.floor(Math.random() * w.def.w), y = Math.floor(Math.random() * w.def.h);
          const t = w.tile(x, y);
          if ((t === T.GRASS || t === T.DIRT || t === T.SAND || t === T.COBBLE) && !w.solid(x, y) && Math.hypot(x * 16 - G.player.x, y * 16 - G.player.y) > 90)
            this.birds.push({ x: x * 16 + 8, y: y * 16 + 10, vx: 0, vy: 0, z: 0, fly: false, t: Math.random() * 2, c: w.def.id === 'praia' ? '#f0f0f0' : ['#8a6a4a', '#5a4a3a', '#c86a3a', '#4a6ab8'][Math.floor(Math.random() * 4)] });
        }
      }
    }
    for (const bd of this.birds) {
      bd.t += dt;
      if (!bd.fly) {
        if (Math.hypot(G.player.x - bd.x, G.player.y - bd.y) < 44) { bd.fly = true; bd.vx = (bd.x > G.player.x ? 1 : -1) * (60 + Math.random() * 40); bd.vy = -30 - Math.random() * 20; }
        else if (bd.t > 1.2 && Math.random() < 0.02) { bd.t = 0; bd.x += (Math.random() - 0.5) * 6; }
      } else { bd.x += bd.vx * dt; bd.y += bd.vy * dt * 0.3; bd.z += 50 * dt; }
      const X = Math.round(bd.x - this.camX), Y = Math.round(bd.y - bd.z - this.camY);
      if (!bd.fly) { b.fillStyle = 'rgba(0,0,0,0.2)'; b.fillRect(X - 2, Math.round(bd.y - this.camY) + 1, 4, 1); }
      b.fillStyle = bd.c;
      const flap = bd.fly && Math.floor(bd.t * 12) % 2 === 0;
      const peck = !bd.fly && Math.floor(bd.t * 3) % 4 === 0;
      b.fillRect(X - 2, Y - 3, 4, 3); b.fillRect(X + (bd.vx < 0 ? -3 : 2), Y - (peck ? 2 : 4), 2, 2);
      if (bd.fly) { b.fillRect(X - 3, Y - (flap ? 6 : 3), 2, 2); b.fillRect(X + 1, Y - (flap ? 6 : 3), 2, 2); }
      b.fillStyle = '#e8a83a'; b.fillRect(X + (bd.vx < 0 ? -4 : 4), Y - (peck ? 1 : 3), 1, 1);
    }
    this.birds = this.birds.filter(bd => bd.z < 220);
    // fumaça
    this.smokeT -= dt;
    if (this.smokeT <= 0 && w.def.outdoor) {
      this.smokeT = s.time.season === 3 ? 0.25 : 0.5;
      for (const bd of w.def.buildings) {
        const st = BUILDING_STYLES[bd.sprite];
        if (!st || st.chimney === undefined || st.ruined) continue;
        const x = bd.x * TILE + st.chimney * 16 + 8, y = (bd.y + bd.h) * TILE - (st.wallH + st.roofH) * 16 + 2;
        if (x < this.camX - 20 || x > this.camX + this.bw + 20) continue;
        G.fx.parts.push({ x: x + (Math.random() - 0.5) * 3, y, z: 0, vx: 0.15 + Math.random() * 0.1, vy: -0.25, vz: 0, life: 0, max: 90, color: Math.random() < 0.5 ? '#d8d8dc' : '#b8b8c0', size: 2, grav: 0, fade: true });
      }
    }
  }

  // ---------- clima ----------
  drawWeather(b: CanvasRenderingContext2D, dt: number) {
    const s = getState(); const w = G.world;
    if (!w.def.outdoor) return;
    const wt = s.weather.today;
    this.weatherT += dt;
    if (wt === 'chuva' || wt === 'tempestade') {
      const n = wt === 'tempestade' ? 220 : 140;
      while (this.rain.length < n) this.rain.push({ x: Math.random() * (this.bw + 40), y: Math.random() * this.bh, s: 0.7 + Math.random() * 0.6 });
      b.strokeStyle = 'rgba(190,210,255,0.55)'; b.lineWidth = 1; b.beginPath();
      for (const r of this.rain) {
        r.y += 300 * dt * r.s; r.x -= 80 * dt * r.s;
        if (r.y > this.bh) { r.y = -6; r.x = Math.random() * (this.bw + 40); if (Math.random() < 0.3) G.fx.parts.push({ x: r.x + this.camX, y: this.camY + Math.random() * this.bh, z: 0, vx: 0, vy: 0, vz: 0.5, life: 0, max: 8, color: '#c8d8f0', size: 1, grav: 0.1 }); }
        b.moveTo(Math.round(r.x), Math.round(r.y)); b.lineTo(Math.round(r.x - 2), Math.round(r.y + 5));
      }
      b.stroke();
      if (wt === 'tempestade') { G.lightningT -= dt; if (G.lightningT <= 0) { G.lightningT = 6 + Math.random() * 14; G.fx.doFlash('#f0f4ff', 0.75); setTimeout(() => thunderClap(), 300 + Math.random() * 900); } }
    } else if (wt === 'neve') {
      while (this.rain.length < 120) this.rain.push({ x: Math.random() * this.bw, y: Math.random() * this.bh, s: 0.4 + Math.random() * 0.8 });
      b.fillStyle = 'rgba(255,255,255,0.9)';
      for (const r of this.rain) { r.y += 22 * dt * r.s; r.x += Math.sin(this.weatherT * 1.5 + r.s * 10) * 12 * dt; if (r.y > this.bh) { r.y = -2; r.x = Math.random() * this.bw; } b.fillRect(Math.round(r.x), Math.round(r.y), r.s > 1 ? 2 : 1, r.s > 1 ? 2 : 1); }
    } else {
      this.rain.length = 0;
      // folhas/pétalas ao vento
      const night = s.time.minutes > 1200 || s.time.minutes < 380;
      if ((wt === 'vento' || s.time.season === 0) && Math.random() < (wt === 'vento' ? 0.25 : 0.04)) {
        const cols = s.time.season === 0 ? ['#f8c8e0', '#ffffff'] : ['#d9822e', '#a85424', '#f2b04a'];
        G.fx.parts.push({ x: this.camX + this.bw + 4, y: this.camY + Math.random() * this.bh, z: 0, vx: -0.8 - Math.random(), vy: 0.2 + Math.random() * 0.3, vz: 0, life: 0, max: 400, color: cols[Math.floor(Math.random() * cols.length)], size: 2, grav: 0 });
      }
      // vaga-lumes no verão à noite
      if (night && s.time.season === 1 && Math.random() < 0.06) G.fx.parts.push({ x: this.camX + Math.random() * this.bw, y: this.camY + Math.random() * this.bh, z: 4, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, vz: 0, life: 0, max: 160, color: '#e8ff7a', size: 1, grav: 0, fade: true });
      // borboletas de dia
      if (!night && (s.time.season === 0 || s.time.season === 1) && Math.random() < 0.01) G.fx.parts.push({ x: this.camX + Math.random() * this.bw, y: this.camY + Math.random() * this.bh, z: 10, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.3, vz: 0, life: 0, max: 220, color: ['#f8e04a', '#f8a8d8', '#a8d8ff'][Math.floor(Math.random() * 3)], size: 2, grav: 0, fade: true });
    }
    // lanternas do festival subindo
    if (G.festival?.lanterns && Math.random() < 0.15) G.fx.parts.push({ x: this.camX + Math.random() * this.bw, y: this.camY + this.bh, z: 0, vx: (Math.random() - 0.5) * 0.1, vy: -0.25, vz: 0, life: 0, max: 900, color: '#ffb050', size: 2, grav: 0, fade: true });
    if (G.festival?.def?.id === 'vagalumes' && Math.random() < 0.3) G.fx.parts.push({ x: this.camX + Math.random() * this.bw, y: this.camY + Math.random() * this.bh, z: 4, vx: (Math.random() - 0.5) * 0.3, vy: -0.1, vz: 0, life: 0, max: 200, color: '#e8ff7a', size: 1, grav: 0, fade: true });
  }

  ambient(): [number, number, number] {
    const s = getState(); const w = G.world;
    const m = s.time.minutes;
    if (w.def.isMine) { const bi = w.def.biome || 0; return ([[150, 130, 120], [110, 140, 150], [110, 120, 170], [150, 100, 90]] as [number, number, number][])[bi]; }
    if (!w.def.outdoor) return m >= 1200 ? [235, 215, 195] : [255, 250, 244];
    const wt = s.weather.today;
    let day: [number, number, number] = wt === 'chuva' ? [180, 185, 205] : wt === 'tempestade' ? [150, 155, 180] : wt === 'neve' ? [225, 232, 245] : [255, 255, 255];
    if (m < 420) day = mixC([255, 225, 200], day, (m - 360) / 60);
    const dusk: [number, number, number] = [255, 175, 125], night: [number, number, number] = wt === 'tempestade' ? [40, 45, 90] : [62, 70, 130], late: [number, number, number] = [45, 52, 105];
    if (m < 1080) return day;
    if (m < 1170) return mixC(day, dusk, (m - 1080) / 90);
    if (m < 1260) return mixC(dusk, night, (m - 1170) / 90);
    if (m < 1440) return night;
    return mixC(night, late, Math.min(1, (m - 1440) / 120));
  }

  drawLighting(b: CanvasRenderingContext2D) {
    const amb = this.ambient();
    if (amb[0] >= 254 && amb[1] >= 254 && amb[2] >= 254) return;
    const l = this.l; const s = getState(); const w = G.world;
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = `rgb(${amb[0]},${amb[1]},${amb[2]})`; l.fillRect(0, 0, this.bw, this.bh);
    l.globalCompositeOperation = 'lighter';
    const night = s.time.minutes >= 1110 || !w.def.outdoor;
    const glow = (x: number, y: number, r: number, color: string, k = 1) => {
      const X = x - this.camX, Y = y - this.camY;
      if (X < -r || Y < -r || X > this.bw + r || Y > this.bh + r) return;
      const flick = 1 + Math.sin(performance.now() / 120 + x) * 0.03;
      const g = l.createRadialGradient(X, Y, 0, X, Y, r * flick);
      g.addColorStop(0, hexA(color, 0.9 * k)); g.addColorStop(0.5, hexA(color, 0.35 * k)); g.addColorStop(1, hexA(color, 0));
      l.fillStyle = g; l.fillRect(X - r, Y - r, r * 2, r * 2);
    };
    for (const d of w.def.decos) if (d.light && (night || d.light.always || w.def.isMine)) glow(d.x * TILE + 8 + (d.light.dx || 0), d.y * TILE + 8 + (d.light.dy || 0), d.light.r, d.light.color);
    if (night && w.def.outdoor) for (const bd of w.def.buildings) for (const li of bd.lights || []) glow((bd.x + li.dx) * TILE + 8, (bd.y + li.dy) * TILE + 4, 30, '#ffc070', 0.8);
    for (const k in w.st.objects) {
      const o = w.st.objects[k];
      if (o.t !== 'placed') continue;
      const [x, y] = unkey(k);
      if (o.id === 'tocha') glow(x * TILE + 8, y * TILE, 52, '#ffb050');
      else if (o.id === 'poste') glow(x * TILE + 8, y * TILE - 4, 64, '#ffe0a0');
      else if (o.id === 'luminaria') glow(x * TILE + 8, y * TILE, 44, '#ffe0a0');
      else if ((o.id === 'fornalha' || o.id === 'carvoeira') && machineWorking(o)) glow(x * TILE + 8, y * TILE + 8, 28, '#ff8030');
    }
    if (w.def.isMine) glow(G.player.x, G.player.y - 10, 70, '#ffe8c0', 0.9);
    else if (night && w.def.outdoor) glow(G.player.x, G.player.y - 10, 26, '#a0a8c0', 0.35);
    if (G.festival?.def && night) for (let i = 0; i < 8; i++) glow((22 + i * 2.2) * TILE, 20 * TILE, 30, '#ffb060', 0.8);
    for (const p of G.fx.parts) if (p.color === '#e8ff7a' || p.color === '#ffb050') glow(p.x, p.y - p.z, 8, p.color, 0.8);
    l.globalCompositeOperation = 'source-over';
    b.globalCompositeOperation = 'multiply';
    b.drawImage(this.light, 0, 0);
    b.globalCompositeOperation = 'source-over';
  }
}

function mixC(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] { t = clamp(t, 0, 1); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)].map(Math.round) as any; }
function hexA(hex: string, a: number) { const v = parseInt(hex.slice(1), 16); return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`; }
export { hash2, T, CAN_CAP, HALL };
