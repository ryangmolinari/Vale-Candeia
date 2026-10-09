// Partículas, textos flutuantes, tremor de tela e efeitos visuais.
import { iconFor } from '../art/icons';

export interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; color: string; size: number; grav: number; screen?: boolean; fade?: boolean }
export interface Floater { x: number; y: number; text: string; color: string; life: number; max: number; big?: boolean; icon?: string }

export class FX {
  parts: Particle[] = [];
  floaters: Floater[] = [];
  shake = 0; shakeMag = 0;
  flash = 0; flashColor = '#ffffff';
  fade = 0; fadeTarget = 0; fadeSpeed = 3;
  burst(x: number, y: number, colors: string[], n = 8, power = 1, grav = 0.25, size = 1, up = 1.4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (0.3 + Math.random() * 0.9) * power;
      this.parts.push({ x, y, z: 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, vz: (0.6 + Math.random()) * up * power, life: 0, max: 30 + Math.random() * 25, color: colors[Math.floor(Math.random() * colors.length)], size, grav });
    }
  }
  splash(x: number, y: number) { this.burst(x, y, ['#a8d8ff', '#e8f4ff', '#6ab0e8'], 12, 0.9, 0.18, 1, 1.6); }
  water(x: number, y: number) {
    for (let i = 0; i < 10; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 6, z: 10 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.3, vy: 0, vz: -0.3 - Math.random() * 0.4, life: 0, max: 22, color: Math.random() < 0.5 ? '#8ac8f8' : '#d0ecff', size: 1, grav: 0.05 });
  }
  dust(x: number, y: number, c = '#c8a878') { this.burst(x, y, [c, '#e8d8b8'], 5, 0.4, 0.05, 1, 0.5); }
  leaves(x: number, y: number, colors: string[]) {
    for (let i = 0; i < 12; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 30, y: y - 30 - Math.random() * 30, z: 0, vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.4, vz: 0, life: 0, max: 60 + Math.random() * 40, color: colors[Math.floor(Math.random() * colors.length)], size: 2, grav: 0, fade: true });
  }
  float(x: number, y: number, text: string, color = '#ffffff', big = false, icon?: string) { this.floaters.push({ x, y, text, color, life: 0, max: big ? 90 : 60, big, icon }); }
  doShake(mag = 2, frames = 12) { this.shake = Math.max(this.shake, frames); this.shakeMag = Math.max(this.shakeMag, mag); }
  doFlash(color = '#ffffff', amt = 0.8) { this.flash = amt; this.flashColor = color; }
  update() {
    for (const p of this.parts) { p.life++; p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vz -= p.grav; if (p.z < 0 && p.grav > 0) { p.z = 0; p.vz *= -0.35; p.vx *= 0.6; p.vy *= 0.6; } }
    this.parts = this.parts.filter(p => p.life < p.max);
    for (const f of this.floaters) f.life++;
    this.floaters = this.floaters.filter(f => f.life < f.max);
    if (this.shake > 0) { this.shake--; if (this.shake <= 0) this.shakeMag = 0; }
    if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.04);
  }
  drawParticles(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    for (const p of this.parts) {
      const a = p.fade ? 1 - p.life / p.max : p.life > p.max - 10 ? (p.max - p.life) / 10 : 1;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - p.z - camY), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
  drawFloaters(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    for (const f of this.floaters) {
      const t = f.life / f.max;
      const y = f.y - camY - t * (f.big ? 26 : 18);
      const x = f.x - camX;
      ctx.globalAlpha = t > 0.75 ? (1 - t) * 4 : 1;
      ctx.font = (f.big ? '10px' : '8px') + ' "Pixelify Sans", monospace';
      ctx.textAlign = 'center';
      let tx = x;
      if (f.icon) { const ic = iconFor(f.icon); const w = ctx.measureText(f.text).width; ctx.drawImage(ic, Math.round(x - w / 2 - 10), Math.round(y - 11), 10, 10); tx = x + 2; }
      ctx.fillStyle = '#2a1a10';
      ctx.fillText(f.text, Math.round(tx) + 1, Math.round(y) + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, Math.round(tx), Math.round(y));
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
}
