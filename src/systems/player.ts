// Jogador: movimento, colisão, animação, ações e itens soltos no chão.
import { TILE, clamp } from '../core/util';
import { G } from '../core/ctx';
import { Input } from '../core/input';
import { getState, ItemStack } from '../state/state';
import { buildCharSheet, CharSheet } from '../art/characters';
import { addItem, canFit } from './inventory';
import { sfx } from '../audio/audio';
import { ITEMS } from '../data/items';

export type Facing = 'up' | 'down' | 'left' | 'right';
export interface Action { kind: 'tool' | 'weapon' | 'eat' | 'lift' | 'fish' | 'hurt'; t: number; dur: number; hitAt: number; hit: boolean; onHit?: () => void; onEnd?: () => void; tool?: string; item?: string; pose?: string }

export class Player {
  x = 0; y = 0; facing: Facing = 'down'; moving = false; animT = 0; frame = 0;
  sheet!: CharSheet;
  action: Action | null = null;
  invuln = 0; hurtFlash = 0;
  charge = { active: false, t: 0, level: 0 };
  stepT = 0;
  warpLock = '';
  lift: { item: string; t: number } | null = null;
  sel = 0;
  constructor() { this.rebuild(); }
  rebuild() { this.sheet = buildCharSheet(getState().player.look); }
  get tx() { return Math.floor(this.x / TILE); }
  get ty() { return Math.floor((this.y - 1) / TILE); }
  frontTile(): [number, number] {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.facing];
    return [this.tx + d[0], this.ty + d[1]];
  }
  speed() {
    const s = getState();
    let sp = 82;
    if (s.player.horse) sp *= 1.65;
    if (s.player.exhausted || s.player.energy <= 0) sp *= 0.7;
    if (G.world?.def.isMine && s.player.hp < s.player.maxHp * 0.2) sp *= 0.85;
    return sp;
  }
  update(dt: number) {
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.lift) { this.lift.t -= dt; if (this.lift.t <= 0) this.lift = null; }
    if (this.action) {
      const a = this.action;
      a.t += dt;
      if (!a.hit && a.t >= a.hitAt) { a.hit = true; a.onHit?.(); }
      if (a.t >= a.dur) { this.action = null; a.onEnd?.(); }
      this.moving = false;
      return;
    }
    if (G.paused() || G.fishing) { this.moving = false; return; }
    let dx = 0, dy = 0;
    if (Input.isDown('a', 'arrowleft')) dx -= 1;
    if (Input.isDown('d', 'arrowright')) dx += 1;
    if (Input.isDown('w', 'arrowup')) dy -= 1;
    if (Input.isDown('s', 'arrowdown')) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    if (this.charge.active) { this.moving = false; return; }
    if (this.moving) {
      if (dx && !dy) this.facing = dx > 0 ? 'right' : 'left';
      else if (dy && !dx) this.facing = dy > 0 ? 'down' : 'up';
      else if (dx && dy) { if (this.facing === 'up' || this.facing === 'down') this.facing = dy > 0 ? 'down' : 'up'; else this.facing = dx > 0 ? 'right' : 'left'; }
      const len = Math.hypot(dx, dy);
      const sp = this.speed() * dt;
      this.moveBy((dx / len) * sp, (dy / len) * sp);
      this.animT += dt * (getState().player.horse ? 1.6 : 1);
      if (this.animT > 0.14) { this.animT = 0; this.frame = (this.frame + 1) % 4; if (this.frame % 2 === 1) this.footstep(); }
      this.checkWarp();
    } else { this.frame = 0; this.animT = 0.13; }
  }
  footstep() {
    const t = G.world.tile(this.tx, Math.floor(this.y / TILE));
    if (t === 7 || t === 10 || t === 16) sfx('stepWood'); else sfx('step');
    if (G.world.def.outdoor && getState().time.season === 3 && (t === 1 || t === 15)) G.fx.dust(this.x, this.y, '#ffffff');
  }
  moveBy(dx: number, dy: number) {
    const w = G.world;
    const hw = 5, hh = 4;
    const tryMove = (nx: number, ny: number) => !w.rectSolid(nx - hw, ny - hh, hw * 2, hh);
    if (dx) {
      const nx = this.x + dx;
      if (tryMove(nx, this.y)) this.x = nx;
      else { // deslizar em cantos
        for (const off of [3, -3, 6, -6]) if (tryMove(nx, this.y + off) && tryMove(this.x, this.y + off)) { this.y += Math.sign(off) * Math.min(Math.abs(dx), 1); break; }
      }
    }
    if (dy) {
      const ny = this.y + dy;
      if (tryMove(this.x, ny)) this.y = ny;
      else { for (const off of [4, -4, 7, -7]) if (tryMove(this.x + off, ny) && tryMove(this.x + off, this.y)) { this.x += Math.sign(off) * Math.min(Math.abs(dy), 1); break; } }
    }
    this.x = clamp(this.x, 4, w.def.w * TILE - 4);
    this.y = clamp(this.y, 6, w.def.h * TILE - 1);
  }
  checkWarp() {
    const w = G.world;
    const tx = this.tx, ty = Math.floor((this.y - 2) / TILE);
    const k = tx + ',' + ty;
    if (this.warpLock && this.warpLock !== k) this.warpLock = '';
    if (this.warpLock) return;
    const farmDoor = w.farmBuildings.find(f => f.bld.door && f.bld.door.x === tx && f.bld.door.y === ty);
    if (farmDoor) { this.warpLock = k; G.warp(farmDoor.bld.door!.to, farmDoor.bld.door!.tx, farmDoor.bld.door!.ty, 'up'); return; }
    for (const wp of w.def.warps) {
      if (tx >= wp.x && tx < wp.x + wp.w && ty >= wp.y && ty < wp.y + wp.h) {
        this.warpLock = k;
        const msg = wp.gate?.();
        if (msg) { G.toast(msg); this.y -= { up: -6, down: 6, left: 0, right: 0 }[this.facing] || 0; this.x -= { left: -6, right: 6, up: 0, down: 0 }[this.facing] || 0; return; }
        // saltos entre colunas da borda mantêm a posição relativa
        let ttx = wp.tx, tty = wp.ty;
        if (wp.w > 1 && wp.h === 1 && !wp.to.startsWith('bld')) ttx = wp.tx + Math.min(tx - wp.x, wp.w - 1) * 0;
        G.warp(wp.to, ttx, tty, wp.dir);
        return;
      }
    }
  }
  sprite() {
    const a = this.action;
    let pose = 'walk', f = this.moving ? this.frame : 0;
    if (a) {
      f = 0;
      if (a.kind === 'tool') {
        if (a.tool === 'can') pose = 'cast';
        else pose = a.t < a.hitAt * 0.75 ? 'swingUp' : 'swingDown';
      } else if (a.kind === 'weapon') pose = a.t < a.dur * 0.25 ? 'swingUp' : 'swingDown';
      else if (a.kind === 'eat' || a.kind === 'lift') pose = 'carry';
      else if (a.kind === 'fish') pose = a.pose || 'cast';
    } else if (this.charge.active) pose = 'swingUp';
    else if (G.fishing) pose = G.fishing.pose || 'cast';
    else if (this.lift) pose = 'carry';
    return this.sheet[`${this.facing}_${pose}_${f}`] || this.sheet[`${this.facing}_walk_0`];
  }
  hurt(dmg: number, fromX: number, fromY: number) {
    if (this.invuln > 0) return;
    const s = getState();
    s.player.hp -= dmg;
    this.invuln = 1.1; this.hurtFlash = 0.3;
    const d = Math.hypot(this.x - fromX, this.y - fromY) || 1;
    for (let i = 0; i < 6; i++) this.moveBy(((this.x - fromX) / d) * 2.5, ((this.y - fromY) / d) * 2.5);
    G.fx.float(this.x, this.y - 26, '-' + dmg, '#ff5a5a', true);
    G.fx.doShake(2, 8);
    sfx('hurt');
    if (s.player.hp <= 0) { s.player.hp = 0; G.ui.knockout(); }
  }
}

// ---------- itens soltos ----------
export interface Drop { x: number; y: number; z: number; vx: number; vy: number; vz: number; item: ItemStack; t: number; }
export function spawnDrop(x: number, y: number, item: ItemStack, spread = 1) {
  const a = Math.random() * Math.PI * 2;
  G.drops.push({ x, y, z: 6, vx: Math.cos(a) * 0.6 * spread, vy: Math.sin(a) * 0.4 * spread, vz: 1.6 + Math.random() * 0.8, item: { ...item }, t: 0 });
}
export function spawnDrops(tx: number, ty: number, items: ItemStack[]) {
  for (const it of items) {
    const stack = ITEMS[it.id]?.stack === 1;
    if (stack) for (let i = 0; i < it.qty; i++) spawnDrop(tx * TILE + 8, ty * TILE + 10, { ...it, qty: 1 });
    else { const n = Math.min(it.qty, 4); let left = it.qty; for (let i = 0; i < n; i++) { const q = i === n - 1 ? left : Math.floor(it.qty / n); left -= q; spawnDrop(tx * TILE + 8, ty * TILE + 10, { ...it, qty: q }); } }
  }
}
export function updateDrops(dt: number) {
  const p = G.player;
  for (const d of G.drops) {
    d.t += dt;
    if (d.z > 0 || d.vz > 0) { d.x += d.vx; d.y += d.vy; d.z += d.vz; d.vz -= 0.18; if (d.z <= 0) { d.z = 0; d.vz = Math.abs(d.vz) > 0.8 ? -d.vz * 0.4 : 0; d.vx *= 0.5; d.vy *= 0.5; } }
    if (d.t > 0.45) {
      const dist = Math.hypot(p.x - d.x, p.y - 4 - d.y);
      if (dist < 66 && canFit(d.item)) {
        const sp = Math.min(dist, 2.6 + d.t);
        d.x += ((p.x - d.x) / dist) * sp; d.y += ((p.y - 4 - d.y) / dist) * sp;
        if (dist < 6) { const left = addItem(d.item); sfx('pickup'); if (left > 0) d.item.qty = left; else (d as any).dead = true; }
      }
    }
  }
  G.drops = G.drops.filter(d => !(d as any).dead);
}
