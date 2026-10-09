// Combate e mineração: monstros, golpes, espólios e escadas.
import { TILE, key } from '../core/util';
import { G } from '../core/ctx';
import { getState } from '../state/state';
import { MONSTERS, MonsterDef, WEAPONS } from '../data/game';
import { sfx } from '../audio/audio';
import { addXP, hasProf, level } from './skills';
import { spawnDrops } from './player';
import { questEvent } from './quests';
import { biomeOf } from '../world/mine';

export interface Monster { def: MonsterDef; x: number; y: number; hp: number; vx: number; vy: number; t: number; hurt: number; frame: number; state: string; z: number; vz: number; dead?: boolean; facing: 'left' | 'right' }

export function spawnMonsters(spawns: { x: number; y: number; id: string }[]) {
  G.monsters = spawns.map(sp => {
    const def = MONSTERS.find(m => m.id === sp.id)!;
    return { def, x: sp.x * TILE + 8, y: sp.y * TILE + 12, hp: def.hp, vx: 0, vy: 0, t: Math.random() * 2, hurt: 0, frame: 0, state: def.ai === 'ambush' ? 'hidden' : 'idle', z: 0, vz: 0, facing: 'left' } as Monster;
  });
}

function moveMonster(m: Monster, dx: number, dy: number, flying = false) {
  const w = G.world;
  const hw = 5, hh = 4;
  if (flying) { m.x += dx; m.y += dy; m.x = Math.max(8, Math.min(w.def.w * TILE - 8, m.x)); m.y = Math.max(16, Math.min(w.def.h * TILE - 4, m.y)); return; }
  if (!w.rectSolid(m.x + dx - hw, m.y - hh, hw * 2, hh)) m.x += dx; else m.vx *= -0.5;
  if (!w.rectSolid(m.x - hw, m.y + dy - hh, hw * 2, hh)) m.y += dy; else m.vy *= -0.5;
}

export function updateMonsters(dt: number) {
  const p = G.player;
  for (const m of G.monsters as Monster[]) {
    if (m.dead) continue;
    m.t += dt;
    if (m.hurt > 0) m.hurt -= dt;
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
    const sp = m.def.speed * 38 * dt;
    // empurrão
    if (Math.abs(m.vx) > 0.05 || Math.abs(m.vy) > 0.05) { moveMonster(m, m.vx, m.vy, m.def.ai === 'fly' || m.def.ai === 'float'); m.vx *= 0.82; m.vy *= 0.82; }
    const aware = d < 110;
    switch (m.def.ai) {
      case 'hop':
        if (m.z > 0 || m.vz > 0) { m.z += m.vz; m.vz -= 0.25; if (m.z <= 0) { m.z = 0; m.vz = 0; } moveMonster(m, (dx / d) * sp * 2.2, (dy / d) * sp * 2.2); }
        else if (aware && m.t > 0.9) { m.t = 0; m.vz = 2.4; }
        break;
      case 'crawl': if (aware) moveMonster(m, (dx / d) * sp, (dy / d) * sp); else moveMonster(m, Math.cos(m.t) * sp * 0.4, Math.sin(m.t * 0.7) * sp * 0.4); break;
      case 'fly': { const wob = Math.sin(m.t * 6) * 0.8; if (aware) moveMonster(m, (dx / d) * sp + wob, (dy / d) * sp - wob, true); else moveMonster(m, Math.cos(m.t * 2) * sp, Math.sin(m.t * 1.5) * sp, true); m.z = 10 + Math.sin(m.t * 4) * 3; break; }
      case 'float': if (aware) moveMonster(m, (dx / d) * sp * 0.9, (dy / d) * sp * 0.9, true); m.z = 4 + Math.sin(m.t * 2) * 2; break;
      case 'ambush':
        if (m.state === 'hidden') { if (d < 26) { m.state = 'awake'; G.fx.dust(m.x, m.y); } }
        else moveMonster(m, (dx / d) * sp, (dy / d) * sp);
        break;
      case 'golem': if (aware) moveMonster(m, (dx / d) * sp, (dy / d) * sp); break;
    }
    m.facing = dx < 0 ? 'left' : 'right';
    m.frame = Math.floor(m.t * 4) % 2;
    if (m.state !== 'hidden' && d < 11 && m.z < 8) p.hurt(Math.max(1, m.def.dmg - Math.floor(level('combat') / 2)), m.x, m.y);
  }
  G.monsters = (G.monsters as Monster[]).filter(m => !m.dead);
}

export function swingWeapon(id: string) {
  const p = G.player;
  if (p.action) return;
  const wd = WEAPONS[id];
  const cd = wd.cooldown / 1000 * (hasProf('acrobata') ? 0.75 : 1);
  sfx('swing');
  p.action = {
    kind: 'weapon', t: 0, dur: cd, hitAt: cd * 0.35, hit: false, item: id,
    onHit: () => {
      const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing];
      const cx = p.x + dir[0] * wd.range * 0.6, cy = p.y - 6 + dir[1] * wd.range * 0.6;
      let hitAny = false;
      for (const m of G.monsters as Monster[]) {
        if (m.dead) continue;
        if (Math.hypot(m.x - cx, m.y - m.z * 0.5 - 4 - cy) > wd.range * 0.75 + 6) continue;
        hitAny = true;
        let dmg = wd.dmg[0] + Math.floor(Math.random() * (wd.dmg[1] - wd.dmg[0] + 1));
        if (hasProf('guerreiro')) dmg = Math.round(dmg * 1.15);
        const crit = Math.random() < wd.crit * (hasProf('berserker') ? 2 : 1) + getState().luck * 0.02;
        if (crit) dmg = Math.round(dmg * 2.5);
        if (m.state === 'hidden') m.state = 'awake';
        m.hp -= dmg; m.hurt = 0.18;
        const d = Math.hypot(m.x - p.x, m.y - p.y) || 1;
        m.vx = ((m.x - p.x) / d) * 3.5 * wd.knock; m.vy = ((m.y - p.y) / d) * 3.5 * wd.knock;
        G.fx.float(m.x, m.y - 18, String(dmg), crit ? '#ffe04a' : '#ffffff', crit);
        G.fx.burst(m.x, m.y - 6, ['#ffffff', '#ffd0a0'], 4, 0.6);
        sfx('hit');
        if (m.hp <= 0) killMonster(m);
      }
      if (hitAny) G.fx.doShake(1, 4);
      // armas também cortam mato
      const tx = Math.floor(cx / TILE), ty = Math.floor((cy + 6) / TILE);
      const o = G.world.obj(tx, ty);
      if (o?.t === 'debris' && o.kind === 'weed') { G.world.setObj(tx, ty, null); G.fx.burst(tx * TILE + 8, ty * TILE + 8, ['#4a8a3a', '#6ab04a'], 6); if (Math.random() < 0.5) spawnDrops(tx, ty, [{ id: 'fibra', qty: 1 }]); }
      if (o?.t === 'grass') { G.world.setObj(tx, ty, null); }
    },
  };
}

function killMonster(m: Monster) {
  m.dead = true;
  const s = getState();
  sfx('kill');
  G.fx.burst(m.x, m.y - 6, m.def.id.includes('slime') ? ['#6ad84a', '#9af87a'] : ['#8a7a9a', '#c8b8d8'], 14, 1.1);
  addXP('combat', m.def.xp);
  const drops = m.def.drops.filter(([, ch]) => Math.random() < ch + s.luck * 0.05).map(([id, , q]) => ({ id, qty: q }));
  if (drops.length) spawnDrops(Math.floor(m.x / TILE), Math.floor(m.y / TILE), drops);
  s.stats.kills = (s.stats.kills || 0) + 1;
  s.stats['kill_' + m.def.id] = (s.stats['kill_' + m.def.id] || 0) + 1;
  questEvent('kill:' + m.def.id);
  const alive = (G.monsters as Monster[]).filter(x => !x.dead).length;
  if (alive === 0 && !hasLadder() && Math.random() < 0.5) placeLadder(Math.floor(m.x / TILE), Math.floor(m.y / TILE));
}

function hasLadder() { return Object.values(G.world.st.objects).some(o => o.t === 'ladder'); }
function placeLadder(x: number, y: number) {
  const w = G.world;
  if (w.solid(x, y)) return;
  w.setObj(x, y, { t: 'ladder' });
  sfx('ladder');
  G.fx.dust(x * TILE + 8, y * TILE + 8, '#a8743a');
}

const GEMS = [['quartzo', 'ametista', 'topazio'], ['quartzo', 'aguamarinha', 'jade', 'ametista'], ['esmeralda', 'rubi', 'pedralua', 'aguamarinha', 'jade'], ['rubi', 'diamante', 'quartzofogo', 'esmeralda']];

export function mineRockBroken(x: number, y: number, kind: string) {
  const s = getState();
  const lvl = G.world.def.mineLevel || 0;
  const biome = biomeOf(lvl);
  const extra = hasProf('minerador') ? 1 : 0;
  const items: { id: string; qty: number }[] = [];
  switch (kind) {
    case 'pedra': items.push({ id: 'pedra', qty: 1 }); if (Math.random() < 0.06) items.push({ id: 'carvao', qty: 1 }); break;
    case 'cobre': items.push({ id: 'min_cobre', qty: 1 + Math.floor(Math.random() * 3) + extra }); break;
    case 'ferro': items.push({ id: 'min_ferro', qty: 1 + Math.floor(Math.random() * 3) + extra }); break;
    case 'ouro': items.push({ id: 'min_ouro', qty: 1 + Math.floor(Math.random() * 2) + extra }); break;
    case 'astral': items.push({ id: 'min_astral', qty: 1 + Math.floor(Math.random() * 2) + extra }); break;
    case 'carvao': items.push({ id: 'carvao', qty: 1 + Math.floor(Math.random() * 2) }); break;
    case 'gema': { const pool = GEMS[biome]; const n = hasProf('geologo') && Math.random() < 0.5 ? 2 : 1; for (let i = 0; i < n; i++) items.push({ id: pool[Math.floor(Math.random() * pool.length)], qty: 1 }); break; }
    case 'cristalq': items.push({ id: 'quartzo', qty: 1 }); break;
  }
  if (['cobre', 'ferro', 'ouro', 'astral'].includes(kind)) s.stats.ore = (s.stats.ore || 0) + 1;
  spawnDrops(x, y, items);
  addXP('mining', kind === 'pedra' ? 1 : kind === 'astral' ? 20 : kind === 'ouro' ? 12 : kind === 'gema' ? 10 : 5);
  // escada
  if (!G.world.def.isMine || lvl === 0 || hasLadder()) return;
  const rocks = Object.values(G.world.st.objects).filter(o => o.t === 'rock').length;
  const alive = (G.monsters as Monster[]).filter(m => !m.dead).length;
  const chance = 0.025 + (alive === 0 ? 0.04 : 0) + (hasProf('prospector') ? 0.03 : 0) + s.luck * 0.02 + (rocks < 15 ? 0.1 : 0);
  if (rocks === 0 || Math.random() < chance) placeLadder(x, y);
}

export { key };
