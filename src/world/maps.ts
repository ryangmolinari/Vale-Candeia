// Todos os mapas fixos do Vale da Candeia.
import { T, MapDef, FishZone } from './types';
import { MB, interior, POIS } from './builder';
import { getState } from '../state/state';
import { rng } from '../core/util';

export const MAPS: Record<string, MapDef> = {};
const reg = (m: MapDef) => { MAPS[m.id] = m; return m; };
const hallDone = (s: string) => getState()?.hallDone.includes(s);
const locked = (msg = 'Está trancado.') => () => msg;
const shopHours = (open: number, close: number, closedDay = -1, label = '') => () => {
  const s = getState(); const m = s.time.minutes; const wd = (s.time.day - 1) % 7;
  if (wd === closedDay) return `${label} fecha às ${['segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados', 'domingos'][wd]}.`;
  if (m < open || m >= close) return `${label}: aberto das ${fmtH(open)} às ${fmtH(close)}.`;
  return null;
};
const homeHours = (open = 480, close = 1200, who = 'Ninguém atende') => () => { const m = getState().time.minutes; return m < open || m >= close ? `${who} a esta hora. (${fmtH(open)}–${fmtH(close)})` : null; };
export function fmtH(m: number) { const h = Math.floor(m / 60) % 24; return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }

// ======================= FAZENDA =======================
function buildFarm() {
  const b = new MB('fazenda', 'Fazenda', 74, 60);
  b.fill(0, 0, 74, 3, T.DARKGRASS);
  b.cliffRow(0, 73, 3, 2);
  // saída norte (montanha)
  b.path(6, 0, 6, 14, 3, T.DIRT, 0);
  b.fill(6, 3, 3, 2, T.DIRT);
  // caminho casa -> leste (vila)
  b.path(34, 10, 34, 23, 2, T.DIRT, 0.6, 4);
  b.path(34, 23, 73, 23, 2, T.DIRT, 1, 5);
  b.path(35, 23, 35, 59, 2, T.DIRT, 1, 8);
  b.fill(30, 10, 12, 2, T.DIRT);
  b.path(8, 13, 34, 13, 2, T.DIRT, 0.8, 9);
  // lagoas
  b.lake(60, 45, 5, 4, 11); b.lake(9, 49, 3, 2, 12);
  // desnível com escada
  b.cliffRow(3, 18, 33, 2); b.fill(12, 33, 2, 2, T.DIRT);
  b.deco({ x: 12, y: 34, sprite: 'cliffstairs', flat: true }); b.deco({ x: 13, y: 34, sprite: 'cliffstairs', flat: true });
  b.fill(20, 9, 8, 2, T.DIRT);
  // bordas de árvores
  b.treeLine(0, 6, 0, 58, 2, 21); b.treeLine(1, 7, 1, 57, 3, 22);
  b.treeLine(73, 6, 73, 20, 2, 23); b.treeLine(73, 27, 73, 58, 2, 24); b.treeLine(72, 7, 72, 19, 3, 25); b.treeLine(72, 28, 72, 57, 3, 26);
  b.treeLine(2, 59, 32, 59, 2, 27); b.treeLine(39, 59, 72, 59, 2, 28); b.treeLine(3, 58, 31, 58, 3, 29); b.treeLine(40, 58, 71, 58, 3, 30);
  for (let x = 2; x < 72; x += 3) if (x < 5 || x > 10) b.tree(x, 1, ['pinheiro', 'carvalho'][x % 2]);
  b.bush(28, 9, 1); b.bush(42, 7, 2); b.flowers(29, 11, 3); b.flowers(38, 11, 4);
  b.deco({ x: 59, y: 41, sprite: 'cattail' }); b.deco({ x: 64, y: 47, sprite: 'cattail' }); b.deco({ x: 58, y: 46, sprite: 'lilypad', flat: true });
  // casa
  b.building({ id: 'casa_fazenda', x: 32, y: 7, w: 6, h: 3, sprite: 'farmhouse', door: { x: 34, y: 9, to: 'casa', tx: 7, ty: 9 }, chimney: { dx: 4, dy: 1 }, lights: [{ dx: 1, dy: 1 }, { dx: 4, dy: 1 }] },
    { w: 6, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#c89a6a', roofColor: '#a8443a', doorX: 2, windows: [0, 4], chimney: 4 });
  b.building({ id: 'estufa', x: 19, y: 6, w: 8, h: 3, sprite: 'estufa_ruina', door: { x: 22, y: 8, to: 'estufa', tx: 8, ty: 13, gate: () => hallDone('lavoura') ? null : 'A estufa está em ruínas. Talvez a Casa dos Ofícios possa ajudar a restaurá-la.' } },
    { w: 8, wallH: 3, roofH: 3, wall: 'stone', wallColor: '#a8a8a0', roofColor: '#8ab0b8', doorX: 3, windows: [0, 1, 5, 6], ruined: true });
  b.deco({ x: 39, y: 9, sprite: 'bin', solid: true, solidW: 2, interact: 'bin' });
  b.interact(39, 9, 'bin'); b.interact(40, 9, 'bin');
  b.deco({ x: 31, y: 9, sprite: 'mailbox', solid: true, interact: 'mail' }); b.interact(31, 9, 'mail');
  b.warp({ x: 6, y: 0, w: 3, h: 1, to: 'montanha', tx: 2, ty: 21, dir: 'right', label: 'Montanha' });
  b.warp({ x: 73, y: 22, w: 1, h: 4, to: 'vila', tx: 1, ty: 24, dir: 'right', label: 'Vila' });
  b.warp({ x: 35, y: 59, w: 2, h: 1, to: 'floresta', tx: 35, ty: 1, dir: 'down', label: 'Floresta' });
  b.poi('fazenda.porta', 34, 10, 'down'); b.poi('fazenda.bin', 38, 11, 'up');
  return reg(b.build({ outdoor: true, tillable: true, music: 'fazenda', fishZone: () => 'lagoa', spawn: { x: 34, y: 10 } }));
}

/** Casa do jogador: muda de tamanho com as reformas. */
export function buildFarmhouse(level: number) {
  const w = level === 0 ? 14 : level === 1 ? 20 : 26, h = level === 0 ? 11 : level === 1 ? 12 : 14;
  const b = interior('casa', 'Casa', w, h, {
    exitTo: 'fazenda', exitX: 34, exitY: 10, doorX: 7, floorColor: '#b07a4a', wall: '#d8b88a',
    furniture: (b) => {
      b.deco({ x: 2, y: 6, sprite: 'bed:' + (level > 0 ? '1' : ''), solid: true, solidH: 2, interact: 'bed' });
      b.interact(2, 5, 'bed'); b.interact(2, 6, 'bed');
      b.deco({ x: 11, y: 3, sprite: 'tv', solid: true, interact: 'tv' }); b.interact(11, 3, 'tv');
      b.deco({ x: 6, y: 3, sprite: 'fireplace', solid: true, solidW: 2, light: { r: 40, color: '#ffb060', always: true } });
      b.deco({ x: 9, y: 6, sprite: 'rug:2', flat: true });
      if (level >= 1) {
        b.deco({ x: 16, y: 3, sprite: 'stove', solid: true, interact: 'stove' }); b.interact(16, 3, 'stove');
        b.deco({ x: 17, y: 3, sprite: 'counter', solid: true }); b.deco({ x: 18, y: 3, sprite: 'counter', solid: true });
        b.deco({ x: 16, y: 7, sprite: 'table', solid: true, solidW: 2 });
      }
      if (level >= 2) {
        b.fill(19, 3, 1, 4, T.WALL); b.fill(19, 9, 1, 3, T.WALL);
        b.deco({ x: 22, y: 5, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 24, y: 4, sprite: 'shelf:3', solid: true, solidW: 2 });
        b.deco({ x: 21, y: 10, sprite: 'plant', solid: true });
      }
    },
  });
  b.poi('casa.cama', 3, 6, 'left');
  b.poi('casa.cozinha', level >= 1 ? 15 : 9, level >= 1 ? 5 : 7, 'up');
  b.poi('casa.sala', 9, 8, 'down');
  return reg(b.build({ outdoor: false, music: 'casa', wall: '#d8b88a', floor: '#b07a4a', indoorLight: true }));
}

// ======================= VILA =======================
function buildTown() {
  const b = new MB('vila', 'Vila Candeia', 72, 56);
  // estradas
  b.fill(0, 23, 72, 3, T.DIRT);
  b.fill(19, 0, 2, 23, T.DIRT);
  b.fill(29, 31, 2, 25, T.DIRT);
  b.path(19, 25, 0, 44, 2, T.DIRT, 1, 31);
  b.fill(0, 44, 3, 3, T.DIRT);
  b.fill(21, 19, 18, 13, T.COBBLE);
  // rio e pontes
  b.river([[51, -1], [51, 12], [50, 22], [51, 30], [52, 40], [51, 56]], 3, false, 33);
  b.fill(48, 23, 7, 3, T.BRIDGE); b.fill(48, 43, 7, 2, T.BRIDGE);
  b.path(52, 44, 66, 44, 2, T.DIRT, 0.5, 34);
  // caminhos até portas
  b.fill(26, 18, 1, 1, T.DIRT); b.fill(34, 18, 1, 1, T.DIRT);
  b.fill(15, 21, 1, 2, T.DIRT);
  b.fill(10, 26, 1, 6, T.DIRT); b.fill(10, 31, 4, 1, T.DIRT);
  b.fill(43, 21, 1, 2, T.DIRT);
  b.fill(39, 26, 1, 6, T.DIRT); b.fill(39, 31, 4, 1, T.DIRT);
  b.fill(43, 12, 1, 3, T.DIRT); b.fill(43, 14, 6, 1, T.DIRT); b.fill(48, 14, 1, 9, T.COBBLE);
  b.fill(14, 11, 1, 2, T.DIRT); b.fill(14, 12, 5, 1, T.DIRT);
  b.fill(58, 20, 1, 3, T.DIRT);
  b.fill(57, 32, 1, 3, T.DIRT); b.fill(54, 34, 4, 1, T.DIRT); b.fill(54, 26, 1, 9, T.DIRT);
  b.fill(4, 32, 1, 3, T.DIRT); b.path(4, 34, 9, 36, 1, T.DIRT, 0, 35);
  b.fill(4, 16, 1, 7, T.DIRT);
  b.fill(60, 9, 1, 14, T.DIRT);
  b.fill(25, 41, 4, 1, T.DIRT); b.fill(64, 41, 1, 3, T.DIRT);
  // prédios
  b.building({ id: 'venda', x: 23, y: 15, w: 7, h: 3, sprite: 'b_venda', name: 'Venda Arruda', door: { x: 26, y: 17, to: 'venda', tx: 7, ty: 11, gate: shopHours(480, 1260, -1, 'A Venda') }, chimney: { dx: 5, dy: 0 }, lights: [{ dx: 1, dy: 1 }, { dx: 5, dy: 1 }] },
    { w: 7, wallH: 3, roofH: 3, wall: 'plaster', wallColor: '#ecdcb4', roofColor: '#c8543a', doorX: 3, windows: [1, 5], awning: '#4a9a5a', sign: '#e8c86a', chimney: 5 });
  b.building({ id: 'taverna', x: 31, y: 15, w: 7, h: 3, sprite: 'b_taverna', name: 'Taverna Lamparina', door: { x: 34, y: 17, to: 'taverna', tx: 8, ty: 13, gate: shopHours(720, 1440, -1, 'A Taverna') }, chimney: { dx: 1, dy: 0 }, lights: [{ dx: 1, dy: 1 }, { dx: 5, dy: 1 }] },
    { w: 7, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#9a6a3a', roofColor: '#5a3a5a', doorX: 3, windows: [1, 5], sign: '#f8a83a', chimney: 1 });
  b.building({ id: 'prefeitura', x: 11, y: 18, w: 8, h: 3, sprite: 'b_prefeitura', name: 'Prefeitura', door: { x: 15, y: 20, to: 'prefeitura', tx: 8, ty: 11, gate: homeHours(480, 1260, 'A prefeitura está fechada') }, lights: [{ dx: 1, dy: 1 }, { dx: 6, dy: 1 }] },
    { w: 8, wallH: 3, roofH: 3, wall: 'stone', wallColor: '#c8c0b0', roofColor: '#3a5a8a', doorX: 4, windows: [1, 2, 6] });
  b.building({ id: 'clinica', x: 11, y: 28, w: 6, h: 3, sprite: 'b_clinica', name: 'Clínica', door: { x: 13, y: 30, to: 'clinica', tx: 7, ty: 10, gate: shopHours(540, 1080, 2, 'A Clínica') }, lights: [{ dx: 0, dy: 1 }, { dx: 4, dy: 1 }] },
    { w: 6, wallH: 3, roofH: 3, wall: 'plaster', wallColor: '#f0f0ec', roofColor: '#d84a4a', doorX: 2, windows: [0, 4], sign: '#e84a4a' });
  b.building({ id: 'biblioteca', x: 40, y: 18, w: 8, h: 3, sprite: 'b_biblioteca', name: 'Biblioteca e Arquivo', door: { x: 43, y: 20, to: 'biblioteca', tx: 8, ty: 11, gate: shopHours(540, 1080, 0, 'A Biblioteca') }, lights: [{ dx: 1, dy: 1 }, { dx: 6, dy: 1 }] },
    { w: 8, wallH: 3, roofH: 3, wall: 'brick', wallColor: '#a8543a', roofColor: '#4a4a5a', doorX: 3, windows: [1, 5, 6] });
  b.building({ id: 'correio', x: 40, y: 28, w: 6, h: 3, sprite: 'b_correio', name: 'Correio', door: { x: 42, y: 30, to: 'correio', tx: 6, ty: 9, gate: shopHours(540, 1020, 6, 'O Correio') } },
    { w: 6, wallH: 3, roofH: 3, wall: 'plaster', wallColor: '#e8e0f0', roofColor: '#4a6ab8', doorX: 2, windows: [0, 4], sign: '#4a6ab8' });
  b.building({ id: 'hall', x: 39, y: 8, w: 9, h: 4, sprite: 'b_hall', name: 'Casa dos Ofícios', door: { x: 43, y: 11, to: 'hall', tx: 11, ty: 13 } },
    { w: 9, wallH: 4, roofH: 3, wall: 'stone', wallColor: '#b8b0a0', roofColor: '#6a3a2a', doorX: 4, windows: [1, 2, 6, 7], ruined: true, tower: true });
  b.building({ id: 'carpintaria', x: 11, y: 8, w: 7, h: 3, sprite: 'b_carpintaria', name: 'Carpintaria Cerne', door: { x: 14, y: 10, to: 'carpintaria', tx: 8, ty: 11, gate: shopHours(540, 1020, 1, 'A Carpintaria') }, chimney: { dx: 5, dy: 0 } },
    { w: 7, wallH: 3, roofH: 3, wall: 'log', wallColor: '#a8743a', roofColor: '#3a7a4a', doorX: 3, windows: [1, 5], sign: '#c8a05a', chimney: 5 });
  b.building({ id: 'forja', x: 55, y: 17, w: 7, h: 3, sprite: 'b_forja', name: 'Forja Ferraz', door: { x: 58, y: 19, to: 'forja', tx: 8, ty: 11, gate: shopHours(540, 1020, -1, 'A Forja') }, chimney: { dx: 6, dy: 0 } },
    { w: 7, wallH: 3, roofH: 3, wall: 'stone', wallColor: '#8a8a8a', roofColor: '#3a3a42', doorX: 3, windows: [1, 5], chimney: 6, sign: '#f86a2a' });
  b.building({ id: 'casa_lins', x: 55, y: 29, w: 6, h: 3, sprite: 'b_lins', name: 'Casa dos Lins', door: { x: 57, y: 31, to: 'casa_lins', tx: 7, ty: 10, gate: homeHours(540, 1260, 'Ninguém atende na casa dos Lins') }, chimney: { dx: 4, dy: 0 }, lights: [{ dx: 0, dy: 1 }, { dx: 4, dy: 1 }] },
    { w: 6, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#c8a87a', roofColor: '#c86a3a', doorX: 2, windows: [0, 4], chimney: 4 });
  b.building({ id: 'casa_saraiva', x: 2, y: 29, w: 6, h: 3, sprite: 'b_saraiva', name: 'Casa da Vó Marta', door: { x: 4, y: 31, to: 'casa_saraiva', tx: 7, ty: 10, gate: homeHours(480, 1200, 'Vó Marta já se recolheu') }, chimney: { dx: 1, dy: 0 }, lights: [{ dx: 0, dy: 1 }, { dx: 4, dy: 1 }] },
    { w: 6, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#b8885a', roofColor: '#8a4a6a', doorX: 2, windows: [0, 4], chimney: 1 });
  b.building({ id: 'casa_mota', x: 2, y: 13, w: 6, h: 3, sprite: 'b_mota', name: 'Casa dos Mota', door: { x: 4, y: 15, to: 'casa_mota', tx: 7, ty: 10, gate: homeHours(540, 1260, 'Ninguém atende na casa dos Mota') }, lights: [{ dx: 0, dy: 1 }, { dx: 4, dy: 1 }] },
    { w: 6, wallH: 3, roofH: 3, wall: 'plaster', wallColor: '#f0e0c0', roofColor: '#4a8a8a', doorX: 2, windows: [0, 4] });
  b.building({ id: 'capela', x: 58, y: 4, w: 6, h: 4, sprite: 'b_capela', name: 'Capela', door: { x: 60, y: 7, to: 'vila', tx: 60, ty: 9, gate: locked('A capela só abre em dias de festa.') } },
    { w: 6, wallH: 4, roofH: 4, wall: 'stone', wallColor: '#d8d0c0', roofColor: '#5a3a3a', doorX: 2, windows: [0, 4], tower: true });
  b.building({ id: 'casa_velha', x: 62, y: 38, w: 5, h: 3, sprite: 'b_casavelha', door: { x: 64, y: 40, to: 'vila', tx: 64, ty: 41, gate: locked('A casa está vazia há anos. Uma placa diz: "Aluga-se".') } },
    { w: 5, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#8a7a6a', roofColor: '#6a5a4a', doorX: 2, windows: [0, 3] });
  b.building({ id: 'casa_azul', x: 23, y: 38, w: 5, h: 3, sprite: 'b_casaazul', door: { x: 25, y: 40, to: 'vila', tx: 25, ty: 41, gate: locked('Ninguém em casa. Os donos estão viajando.') } },
    { w: 5, wallH: 3, roofH: 3, wall: 'plaster', wallColor: '#a8c8e8', roofColor: '#3a4a7a', doorX: 2, windows: [0, 3] });
  b.building({ id: 'celeiro_velho', x: 64, y: 47, w: 6, h: 3, sprite: 'b_celeiro', door: { x: 65, y: 49, to: 'vila', tx: 65, ty: 50, gate: locked('O celeiro comunitário está fechado.') } },
    { w: 6, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#a83a2a', roofColor: '#5a3a2a', doorX: 1, windows: [4], barn: true });
  // praça
  b.deco({ x: 29, y: 28, sprite: 'fountain', solid: true, solidW: 3, solidH: 2, offY: 0 });
  b.fill(28, 27, 3, 2, T.COBBLE);
  b.deco({ x: 24, y: 21, sprite: 'board', solid: true, solidW: 2, interact: 'board' }); b.interact(24, 21, 'board'); b.interact(25, 21, 'board');
  b.deco({ x: 33, y: 21, sprite: 'bench', solid: true, solidW: 2 }); b.deco({ x: 24, y: 30, sprite: 'bench', solid: true, solidW: 2 }); b.deco({ x: 34, y: 30, sprite: 'bench', solid: true, solidW: 2 });
  for (const [x, y] of [[21, 19], [38, 19], [21, 31], [38, 31], [19, 12], [48, 20], [10, 25], [56, 25], [29, 40], [4, 25], [64, 25]] as [number, number][]) b.deco({ x, y, sprite: 'lamp', solid: true, light: { r: 46, color: '#ffd890', dy: -34 } });
  // cemitério
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) b.deco({ x: 62 + i * 2, y: 12 + j * 3, sprite: 'grave', solid: true });
  b.deco({ x: 59, y: 15, sprite: 'tree:pinheiro', solid: true, sway: true });
  // horta comunitária e poço
  for (let x = 21; x <= 27; x++) { b.deco({ x, y: 33, sprite: 'flowers:' + x, flat: true }); b.deco({ x, y: 35, sprite: 'flowers:' + (x + 3), flat: true }); }
  b.deco({ x: 35, y: 36, sprite: 'well', solid: true, solidW: 2 });
  b.deco({ x: 44, y: 15, sprite: 'statue', solid: true });
  // árvores e arbustos
  b.treeLine(0, 1, 0, 21, 2, 41); b.treeLine(0, 27, 0, 42, 2, 42); b.treeLine(71, 0, 71, 22, 2, 43); b.treeLine(71, 27, 71, 55, 2, 44);
  b.treeLine(1, 0, 17, 0, 2, 45); b.treeLine(22, 0, 48, 0, 2, 46); b.treeLine(54, 0, 70, 0, 3, 47);
  b.treeLine(1, 55, 27, 55, 2, 48); b.treeLine(32, 55, 49, 55, 2, 49); b.treeLine(54, 55, 70, 55, 2, 50);
  for (const [x, y] of [[8, 5], [24, 6], [33, 5], [6, 21], [9, 40], [15, 47], [36, 46], [44, 50], [60, 52], [66, 33], [46, 37], [17, 38]] as [number, number][]) b.tree(x, y, ['carvalho', 'bordo', 'carvalho', 'pinheiro'][(x + y) % 4]);
  for (const [x, y, v] of [[22, 13, 1], [36, 13, 2], [9, 17, 3], [46, 25, 4], [57, 36, 5], [12, 34, 6], [42, 34, 7], [67, 20, 8], [3, 37, 9]] as [number, number, number][]) b.bush(x, y, v);
  for (const [x, y] of [[20, 27], [37, 33], [47, 31], [16, 25], [32, 13], [61, 27]] as [number, number][]) b.flowers(x, y, x);
  b.deco({ x: 47, y: 29, sprite: 'barrel', solid: true }); b.deco({ x: 61, y: 21, sprite: 'anvil', solid: true }); b.deco({ x: 30, y: 18, sprite: 'crate', solid: true }); b.deco({ x: 22, y: 17, sprite: 'barrel', solid: true });
  // saídas
  b.warp({ x: 0, y: 23, w: 1, h: 3, to: 'fazenda', tx: 72, ty: 23, dir: 'left', label: 'Fazenda' });
  b.warp({ x: 19, y: 0, w: 2, h: 1, to: 'montanha', tx: 30, ty: 43, dir: 'up', label: 'Montanha' });
  b.warp({ x: 29, y: 55, w: 2, h: 1, to: 'praia', tx: 35, ty: 1, dir: 'down', label: 'Praia' });
  b.warp({ x: 0, y: 44, w: 1, h: 3, to: 'floresta', tx: 64, ty: 10, dir: 'left', label: 'Floresta' });
  // pontos de interesse
  b.poi('vila.praca', 29, 25); b.poi('vila.praca2', 25, 26); b.poi('vila.praca3', 33, 27); b.poi('vila.banco1', 33, 22, 'down'); b.poi('vila.banco2', 25, 29, 'up'); b.poi('vila.banco3', 34, 29, 'up');
  b.poi('vila.fonte', 29, 30, 'up'); b.poi('vila.mural', 25, 22, 'up'); b.poi('vila.rio', 49, 30, 'right'); b.poi('vila.ponte', 51, 24, 'down'); b.poi('vila.ponte2', 51, 43, 'down');
  b.poi('vila.cemiterio', 63, 17, 'up'); b.poi('vila.horta', 24, 34, 'down'); b.poi('vila.poco', 34, 37, 'up'); b.poi('vila.estatua', 44, 16, 'up'); b.poi('vila.leste', 62, 24);
  b.poi('vila.oeste', 6, 24); b.poi('vila.sul', 29, 46); b.poi('vila.norte', 19, 6); b.poi('vila.capela', 60, 9, 'up'); b.poi('vila.celeiro', 66, 44);
  b.poi('vila.comerciante', 35, 33, 'down');
  return reg(b.build({ outdoor: true, music: 'vila', fishZone: () => 'rio' }));
}

// ======================= INTERIORES DA VILA =======================
function buildTownInteriors() {
  // VENDA (loja + casa dos Arruda)
  let b = interior('venda', 'Venda Arruda', 22, 13, {
    exitTo: 'vila', exitX: 26, exitY: 18, doorX: 7, floorColor: '#c89a6a', wall: '#e8d8a8',
    furniture: (b) => {
      for (let x = 4; x <= 10; x++) b.deco({ x, y: 6, sprite: 'counter', solid: true });
      b.counter(6, 6, 'venda'); b.counter(7, 6, 'venda'); b.counter(8, 6, 'venda');
      b.deco({ x: 3, y: 3, sprite: 'shelf:1', solid: true, solidW: 2 }); b.deco({ x: 7, y: 3, sprite: 'shelf:2', solid: true, solidW: 2 }); b.deco({ x: 10, y: 3, sprite: 'shelf:4', solid: true, solidW: 2 });
      b.deco({ x: 2, y: 9, sprite: 'barrel', solid: true }); b.deco({ x: 3, y: 10, sprite: 'crate', solid: true }); b.deco({ x: 11, y: 10, sprite: 'crate', solid: true });
      b.fill(14, 3, 1, 5, T.WALL); b.fill(14, 10, 1, 2, T.WALL);
      b.deco({ x: 17, y: 5, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 20, y: 5, sprite: 'bed', solid: true, solidH: 2 });
      b.deco({ x: 17, y: 9, sprite: 'table', solid: true, solidW: 2 }); b.deco({ x: 15, y: 3, sprite: 'stove', solid: true });
    },
  });
  b.poi('venda.balcao', 7, 5, 'down'); b.poi('venda.casa1', 16, 7); b.poi('venda.casa2', 19, 7); b.poi('venda.casa3', 18, 11, 'up'); b.poi('venda.prateleira', 9, 8, 'up');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#e8d8a8', floor: '#c89a6a', indoorLight: true }));

  b = interior('taverna', 'Taverna Lamparina', 18, 15, {
    exitTo: 'vila', exitX: 34, exitY: 18, doorX: 8, floorColor: '#8a5a32', wall: '#a8744a',
    furniture: (b) => {
      for (let x = 2; x <= 8; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.counter(4, 5, 'taverna'); b.counter(5, 5, 'taverna'); b.counter(6, 5, 'taverna');
      b.deco({ x: 2, y: 3, sprite: 'barrel', solid: true }); b.deco({ x: 4, y: 3, sprite: 'barrel', solid: true }); b.deco({ x: 7, y: 3, sprite: 'shelf:5', solid: true, solidW: 2 });
      for (const [x, y] of [[11, 6], [14, 6], [11, 10], [14, 10], [4, 10]] as [number, number][]) b.deco({ x, y, sprite: 'table', solid: true, solidW: 2 });
      b.deco({ x: 13, y: 3, sprite: 'fireplace', solid: true, solidW: 2, light: { r: 46, color: '#ffa050', always: true } });
      b.deco({ x: 16, y: 13, sprite: 'plant', solid: true });
    },
  });
  b.poi('taverna.balcao', 5, 4, 'down'); b.poi('taverna.mesa1', 11, 7, 'up'); b.poi('taverna.mesa2', 14, 8, 'up'); b.poi('taverna.mesa3', 12, 11, 'up'); b.poi('taverna.mesa4', 15, 11, 'up'); b.poi('taverna.mesa5', 5, 11, 'up');
  b.poi('taverna.lareira', 13, 5, 'up'); b.poi('taverna.quarto', 16, 4, 'down'); b.poi('taverna.palco', 9, 8, 'down');
  reg(b.build({ outdoor: false, music: 'taverna', wall: '#a8744a', floor: '#8a5a32', indoorLight: true }));

  b = interior('prefeitura', 'Prefeitura', 17, 13, {
    exitTo: 'vila', exitX: 15, exitY: 21, doorX: 8, floorColor: '#a8744a', wall: '#c8d0d8',
    furniture: (b) => {
      b.deco({ x: 8, y: 5, sprite: 'table', solid: true, solidW: 2 }); b.deco({ x: 3, y: 3, sprite: 'shelf:6', solid: true, solidW: 2 }); b.deco({ x: 12, y: 3, sprite: 'shelf:7', solid: true, solidW: 2 });
      b.deco({ x: 14, y: 8, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 2, y: 10, sprite: 'plant', solid: true }); b.deco({ x: 8, y: 9, sprite: 'rug:3', flat: true });
    },
  });
  b.poi('prefeitura.mesa', 8, 4, 'down'); b.poi('prefeitura.cama', 13, 9, 'left'); b.poi('prefeitura.sala', 6, 8);
  reg(b.build({ outdoor: false, music: 'casa', wall: '#c8d0d8', floor: '#a8744a', indoorLight: true }));

  b = interior('clinica', 'Clínica', 15, 12, {
    exitTo: 'vila', exitX: 13, exitY: 31, doorX: 7, floor: T.TILEFLOOR, floorColor: '#e8e8e0', wall: '#d8ece8',
    furniture: (b) => {
      for (let x = 2; x <= 6; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.counter(3, 5, 'clinica'); b.counter(4, 5, 'clinica');
      b.deco({ x: 10, y: 5, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 12, y: 5, sprite: 'bed:1', solid: true, solidH: 2 });
      b.deco({ x: 2, y: 3, sprite: 'shelf:8', solid: true, solidW: 2 }); b.deco({ x: 13, y: 9, sprite: 'plant', solid: true }); b.deco({ x: 2, y: 9, sprite: 'bench', solid: true, solidW: 2 });
    },
  });
  b.poi('clinica.balcao', 4, 4, 'down'); b.poi('clinica.leito', 11, 8, 'up'); b.poi('clinica.espera', 3, 8, 'down');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#d8ece8', floor: '#e8e8e0', indoorLight: true }));

  b = interior('biblioteca', 'Biblioteca e Arquivo', 17, 13, {
    exitTo: 'vila', exitX: 43, exitY: 21, doorX: 8, floorColor: '#8a5a3a', wall: '#7a5a4a',
    furniture: (b) => {
      for (let x = 2; x <= 14; x += 3) b.deco({ x, y: 3, sprite: 'shelf:' + x, solid: true, solidW: 2 });
      for (let x = 2; x <= 5; x++) b.deco({ x, y: 7, sprite: 'shelf:' + (x + 9), solid: true });
      b.deco({ x: 10, y: 7, sprite: 'table', solid: true, solidW: 2 }); b.deco({ x: 13, y: 10, sprite: 'table', solid: true, solidW: 2 });
      b.deco({ x: 8, y: 6, sprite: 'counter', solid: true }); b.deco({ x: 9, y: 6, sprite: 'counter', solid: true });
      b.counter(8, 6, 'biblioteca'); b.counter(9, 6, 'biblioteca');
    },
  });
  b.poi('biblioteca.balcao', 8, 5, 'down'); b.poi('biblioteca.estante', 4, 6, 'up'); b.poi('biblioteca.mesa', 11, 9, 'up'); b.poi('biblioteca.leitura', 14, 9, 'up');
  reg(b.build({ outdoor: false, music: 'biblioteca', wall: '#7a5a4a', floor: '#8a5a3a', indoorLight: true }));

  b = interior('correio', 'Correio', 13, 11, {
    exitTo: 'vila', exitX: 42, exitY: 31, doorX: 6, floorColor: '#a8844a', wall: '#c8d0e8',
    furniture: (b) => {
      for (let x = 3; x <= 9; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.deco({ x: 2, y: 3, sprite: 'crate', solid: true }); b.deco({ x: 10, y: 3, sprite: 'crate', solid: true }); b.deco({ x: 11, y: 4, sprite: 'crate', solid: true }); b.deco({ x: 5, y: 3, sprite: 'shelf:9', solid: true, solidW: 2 });
    },
  });
  b.poi('correio.balcao', 6, 4, 'down');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#c8d0e8', floor: '#a8844a', indoorLight: true }));

  b = interior('carpintaria', 'Carpintaria Cerne', 17, 13, {
    exitTo: 'vila', exitX: 14, exitY: 11, doorX: 8, floorColor: '#b88a5a', wall: '#a8743a',
    furniture: (b) => {
      for (let x = 3; x <= 8; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.counter(5, 5, 'carpintaria'); b.counter(6, 5, 'carpintaria');
      b.deco({ x: 11, y: 4, sprite: 'crate', solid: true }); b.deco({ x: 12, y: 4, sprite: 'crate', solid: true }); b.deco({ x: 2, y: 9, sprite: 'table', solid: true, solidW: 2 });
      b.fill(10, 6, 1, 3, T.WALL);
      b.deco({ x: 13, y: 8, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 15, y: 8, sprite: 'bed', solid: true, solidH: 2 });
    },
  });
  b.poi('carpintaria.balcao', 5, 4, 'down'); b.poi('carpintaria.oficina', 3, 8); b.poi('carpintaria.quarto1', 12, 10); b.poi('carpintaria.quarto2', 14, 11, 'up');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#a8743a', floor: '#b88a5a', indoorLight: true }));

  b = interior('forja', 'Forja Ferraz', 17, 13, {
    exitTo: 'vila', exitX: 58, exitY: 20, doorX: 8, floor: T.STONEFLOOR, wall: '#6a5a5a',
    furniture: (b) => {
      for (let x = 3; x <= 9; x++) b.deco({ x, y: 6, sprite: 'counter', solid: true });
      b.counter(5, 6, 'forja'); b.counter(6, 6, 'forja'); b.counter(7, 6, 'forja');
      b.deco({ x: 4, y: 3, sprite: 'fireplace', solid: true, solidW: 2, light: { r: 50, color: '#ff8030', always: true } });
      b.deco({ x: 9, y: 4, sprite: 'anvil', solid: true }); b.deco({ x: 13, y: 9, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 15, y: 9, sprite: 'bed', solid: true, solidH: 2 });
      b.deco({ x: 12, y: 3, sprite: 'barrel', solid: true }); b.deco({ x: 2, y: 10, sprite: 'crate', solid: true });
    },
  });
  b.poi('forja.balcao', 6, 5, 'down'); b.poi('forja.bigorna', 8, 4, 'right'); b.poi('forja.quarto1', 12, 11); b.poi('forja.quarto2', 14, 11, 'up');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#6a5a5a', indoorLight: true }));

  const house = (id: string, name: string, ex: number, ey: number, wall: string, floor: string, pois: [string, number, number, any?][]) => {
    const h = interior(id, name, 15, 12, {
      exitTo: 'vila', exitX: ex, exitY: ey, doorX: 7, floorColor: floor, wall,
      furniture: (b) => {
        b.deco({ x: 2, y: 5, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 12, y: 5, sprite: 'bed', solid: true, solidH: 2 });
        b.deco({ x: 7, y: 3, sprite: 'fireplace', solid: true, solidW: 2, light: { r: 40, color: '#ffb060', always: true } });
        b.deco({ x: 6, y: 7, sprite: 'table', solid: true, solidW: 2 }); b.deco({ x: 3, y: 9, sprite: 'shelf:' + ex, solid: true, solidW: 2 });
        b.deco({ x: 12, y: 9, sprite: 'plant', solid: true }); b.deco({ x: 10, y: 3, sprite: 'stove', solid: true });
      },
    });
    for (const [n, x, y, d] of pois) h.poi(n, x, y, d);
    return reg(h.build({ outdoor: false, music: 'casa', wall, floor, indoorLight: true }));
  };
  house('casa_lins', 'Casa dos Lins', 57, 32, '#e8c8a8', '#b08060', [['lins.cama1', 3, 7], ['lins.cama2', 11, 7], ['lins.mesa', 6, 9, 'up'], ['lins.sala', 9, 8], ['lins.estante', 4, 10, 'up']]);
  house('casa_saraiva', 'Casa da Vó Marta', 4, 32, '#d8b8c8', '#a87850', [['saraiva.cama', 3, 7], ['saraiva.cadeira', 9, 6, 'up'], ['saraiva.mesa', 6, 9, 'up']]);
  house('casa_mota', 'Casa dos Mota', 4, 16, '#c8e0d8', '#b08860', [['mota.cama1', 3, 7], ['mota.cama2', 11, 7], ['mota.cavalete', 10, 9, 'right'], ['mota.mesa', 6, 9, 'up']]);

  // CASA DOS OFÍCIOS
  b = interior('hall', 'Casa dos Ofícios', 23, 15, {
    exitTo: 'vila', exitX: 43, exitY: 12, doorX: 11, floor: T.WOOD, floorColor: '#8a6a4a', wall: '#9a8a7a',
    furniture: (b) => {
      const sectors = ['lavoura', 'aguas', 'profundezas', 'bosque', 'curral', 'artesanato'];
      sectors.forEach((s, i) => { const x = 3 + (i % 3) * 7, y = i < 3 ? 5 : 10; b.deco({ x, y, sprite: 'altar:' + s, solid: true, solidW: 2, interact: 'hall:' + s }); b.interact(x, y, 'hall:' + s); b.interact(x + 1, y, 'hall:' + s); });
      b.deco({ x: 11, y: 3, sprite: 'statue', solid: true });
    },
  });
  b.poi('hall.centro', 11, 8);
  reg(b.build({ outdoor: false, music: 'hall', wall: '#9a8a7a', floor: '#8a6a4a', indoorLight: true }));
}

// ======================= FLORESTA =======================
function buildForest() {
  const b = new MB('floresta', 'Floresta dos Ipês', 66, 52);
  b.fill(0, 0, 66, 52, T.GRASS);
  for (let i = 0; i < 12; i++) { const R = rng(70 + i); b.fill(Math.floor(R() * 60), Math.floor(R() * 46), 4 + Math.floor(R() * 5), 3 + Math.floor(R() * 4), T.DARKGRASS); }
  b.path(35, 0, 35, 18, 2, T.DIRT, 1, 71);
  b.path(35, 18, 65, 10, 2, T.DIRT, 1, 72);
  b.path(46, 14, 47, 23, 2, T.DIRT, 0, 73);
  b.path(35, 18, 22, 44, 2, T.DIRT, 1.5, 74);
  b.river([[-1, 22], [8, 24], [16, 30], [24, 34]], 3, false, 75);
  b.lake(30, 37, 7, 5, 76);
  b.fill(13, 27, 2, 2, T.BRIDGE);
  b.building({ id: 'rancho', x: 44, y: 20, w: 8, h: 3, sprite: 'b_rancho', name: 'Rancho Campos', door: { x: 47, y: 22, to: 'rancho', tx: 8, ty: 11, gate: shopHours(540, 1020, -1, 'O Rancho') }, chimney: { dx: 6, dy: 0 } },
    { w: 8, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#b84a3a', roofColor: '#5a3a2a', doorX: 3, windows: [1, 6], sign: '#e8c86a', chimney: 6 });
  for (let x = 53; x <= 62; x++) { b.deco({ x, y: 19, sprite: 'fence:cerca', solid: true }); b.deco({ x, y: 27, sprite: 'fence:cerca', solid: true }); }
  for (let y = 20; y <= 26; y++) b.deco({ x: 62, y, sprite: 'fence:cerca', solid: true });
  b.deco({ x: 56, y: 22, sprite: 'hay', solid: true }); b.deco({ x: 59, y: 25, sprite: 'trough', solid: true });
  // árvores densas
  const R = rng(77);
  for (let i = 0; i < 120; i++) {
    const x = 1 + Math.floor(R() * 64), y = 1 + Math.floor(R() * 50);
    const t = b.get(x, y);
    if (t !== T.GRASS && t !== T.DARKGRASS) continue;
    if (Math.abs(x - 35) < 4 && y < 20) continue;
    if (x > 40 && x < 64 && y > 12 && y < 30) continue;
    if (b.get(x, y + 1) === T.DIRT || b.get(x, y - 1) === T.DIRT || b.get(x + 1, y) === T.DIRT || b.get(x - 1, y) === T.DIRT) continue;
    if (b.decos.some(d => Math.abs(d.x - x) < 2 && Math.abs(d.y - y) < 2)) continue;
    b.tree(x, y, ['carvalho', 'bordo', 'pinheiro', 'carvalho'][Math.floor(R() * 4)]);
  }
  for (let i = 0; i < 30; i++) { const x = 1 + Math.floor(R() * 63), y = 1 + Math.floor(R() * 49); if (b.get(x, y) === T.GRASS && b.get(x + 1, y) === T.GRASS && !b.decos.some(d => Math.abs(d.x - x) < 2 && Math.abs(d.y - y) < 2)) b.bush(x, y, i); }
  for (let i = 0; i < 20; i++) { const x = 1 + Math.floor(R() * 63), y = 1 + Math.floor(R() * 49); if (b.get(x, y) === T.GRASS) b.flowers(x, y, i); }
  b.deco({ x: 24, y: 32, sprite: 'cattail' }); b.deco({ x: 36, y: 40, sprite: 'cattail' }); b.deco({ x: 28, y: 36, sprite: 'lilypad', flat: true }); b.deco({ x: 33, y: 38, sprite: 'lilypad', flat: true });
  b.deco({ x: 18, y: 12, sprite: 'rock', solid: true, solidW: 2 }); b.deco({ x: 10, y: 40, sprite: 'rock', solid: true, solidW: 2 });
  b.warp({ x: 34, y: 0, w: 4, h: 1, to: 'fazenda', tx: 35, ty: 57, dir: 'up', label: 'Fazenda' });
  b.warp({ x: 65, y: 9, w: 1, h: 3, to: 'vila', tx: 1, ty: 45, dir: 'right', label: 'Vila' });
  b.poi('floresta.rancho', 47, 24, 'up'); b.poi('floresta.lago', 30, 31, 'down'); b.poi('floresta.ponte', 14, 28); b.poi('floresta.curral', 57, 23, 'right'); b.poi('floresta.trilha', 30, 24);
  return reg(b.build({ outdoor: true, music: 'floresta', fishZone: (x, y) => ((x - 30) ** 2 / 64 + (y - 37) ** 2 / 36 < 1.3 ? 'lagoa' : 'rio') }));
}

function buildRanch() {
  const b = interior('rancho', 'Rancho Campos', 17, 13, {
    exitTo: 'floresta', exitX: 47, exitY: 23, doorX: 8, floorColor: '#a87a4a', wall: '#c8a07a',
    furniture: (b) => {
      for (let x = 3; x <= 8; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.counter(5, 5, 'rancho'); b.counter(6, 5, 'rancho');
      b.deco({ x: 11, y: 4, sprite: 'hay', solid: true }); b.deco({ x: 12, y: 4, sprite: 'hay', solid: true }); b.deco({ x: 2, y: 9, sprite: 'table', solid: true, solidW: 2 });
      b.deco({ x: 13, y: 8, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 15, y: 8, sprite: 'bed', solid: true, solidH: 2 }); b.deco({ x: 7, y: 3, sprite: 'fireplace', solid: true, solidW: 2, light: { r: 40, color: '#ffb060', always: true } });
    },
  });
  b.poi('rancho.balcao', 5, 4, 'down'); b.poi('rancho.quarto1', 12, 10); b.poi('rancho.quarto2', 14, 11, 'up'); b.poi('rancho.mesa', 3, 11, 'up');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#c8a07a', floor: '#a87a4a', indoorLight: true }));
}

// ======================= PRAIA =======================
function buildBeach() {
  const b = new MB('praia', 'Praia do Farol', 70, 38);
  b.fill(0, 9, 70, 29, T.SAND);
  b.fill(0, 26, 70, 3, T.WATER); b.fill(0, 29, 70, 9, T.DEEP);
  for (let x = 0; x < 70; x++) { const R = rng(80 + x); if (R() < 0.5) b.set(x, 25, T.WATER); if (R() < 0.3) b.set(x, 26, T.SAND); }
  b.path(35, 0, 35, 10, 2, T.DIRT, 0.5, 81);
  b.river([[59, -1], [59, 12], [58, 20], [59, 26]], 3, false, 82);
  b.fill(56, 15, 7, 2, T.BRIDGE);
  b.fill(40, 21, 3, 12, T.PLANKS); b.fill(37, 30, 9, 3, T.PLANKS);
  b.building({ id: 'pesca', x: 20, y: 10, w: 7, h: 3, sprite: 'b_pesca', name: 'Anzol Dourado', door: { x: 23, y: 12, to: 'loja_pesca', tx: 7, ty: 11, gate: shopHours(540, 1020, -1, 'O Anzol Dourado') }, chimney: { dx: 5, dy: 0 } },
    { w: 7, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#7a9aa8', roofColor: '#3a6a8a', doorX: 3, windows: [1, 5], sign: '#f8d03a', chimney: 5 });
  b.deco({ x: 46, y: 14, sprite: 'boat', solid: true, solidW: 3 }); b.deco({ x: 12, y: 18, sprite: 'rock', solid: true, solidW: 2 }); b.deco({ x: 64, y: 21, sprite: 'rock', solid: true, solidW: 2 });
  for (const x of [5, 15, 50, 66, 30]) b.tree(x, 10 + (x % 3), 'palmeira');
  b.treeLine(0, 0, 0, 8, 2, 83); b.treeLine(69, 0, 69, 8, 2, 84); b.treeLine(1, 1, 31, 1, 3, 85); b.treeLine(39, 1, 54, 1, 3, 86); b.treeLine(63, 1, 68, 1, 3, 87);
  for (let i = 0; i < 6; i++) b.bush(4 + i * 9, 6, i + 20);
  b.warp({ x: 35, y: 0, w: 2, h: 1, to: 'vila', tx: 29, ty: 54, dir: 'up', label: 'Vila' });
  b.warp({ x: 69, y: 13, w: 1, h: 5, to: 'enseada', tx: 1, ty: 12, dir: 'right', label: 'Enseada', gate: () => hallDone('aguas') ? null : 'A trilha para a enseada está tomada pela maré e por uma ponte desabada. Ninguém passa por aqui há anos.' });
  b.poi('praia.loja', 23, 13, 'up'); b.poi('praia.pier', 41, 31, 'down'); b.poi('praia.areia', 30, 20); b.poi('praia.areia2', 48, 22, 'down'); b.poi('praia.rochas', 13, 20, 'down');
  return reg(b.build({ outdoor: true, music: 'praia', fishZone: (x) => (x >= 56 && x <= 62 ? 'rio' : 'mar') }));
}

function buildFishShop() {
  const b = interior('loja_pesca', 'Anzol Dourado', 15, 13, {
    exitTo: 'praia', exitX: 23, exitY: 13, doorX: 7, floorColor: '#a8845a', wall: '#a8c0c8',
    furniture: (b) => {
      for (let x = 3; x <= 8; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.counter(5, 5, 'pesca'); b.counter(6, 5, 'pesca');
      b.deco({ x: 2, y: 3, sprite: 'barrel', solid: true }); b.deco({ x: 10, y: 3, sprite: 'shelf:12', solid: true, solidW: 2 }); b.deco({ x: 12, y: 8, sprite: 'bed:1', solid: true, solidH: 2 }); b.deco({ x: 2, y: 9, sprite: 'bed', solid: true, solidH: 2 });
      b.deco({ x: 7, y: 9, sprite: 'table', solid: true, solidW: 2 });
    },
  });
  b.poi('pesca.balcao', 5, 4, 'down'); b.poi('pesca.quarto1', 11, 10); b.poi('pesca.quarto2', 3, 11, 'up'); b.poi('pesca.mesa', 7, 10, 'up');
  reg(b.build({ outdoor: false, music: 'loja', wall: '#a8c0c8', floor: '#a8845a', indoorLight: true }));
}

function buildCove() {
  const b = new MB('enseada', 'Enseada Esquecida', 44, 30);
  b.fill(0, 0, 44, 30, T.SAND);
  b.fill(0, 0, 44, 4, T.CLIFF);
  b.fill(0, 20, 44, 3, T.WATER); b.fill(0, 23, 44, 7, T.DEEP);
  b.lake(14, 12, 3, 2, 90); b.lake(30, 9, 2, 2, 91);
  for (const x of [6, 22, 38]) b.tree(x, 6, 'palmeira');
  for (const [x, y] of [[10, 16], [25, 15], [35, 14]] as [number, number][]) b.deco({ x, y, sprite: 'rock', solid: true, solidW: 2 });
  for (const [x, y] of [[4, 8], [18, 7], [33, 17], [41, 10]] as [number, number][]) b.deco({ x, y, sprite: 'mushroomglow', light: { r: 26, color: '#60e8d8' } });
  b.deco({ x: 21, y: 5, sprite: 'statue', solid: true });
  b.warp({ x: 0, y: 10, w: 1, h: 5, to: 'praia', tx: 67, ty: 15, dir: 'left', label: 'Praia' });
  b.poi('enseada.estatua', 21, 7, 'up');
  return reg(b.build({ outdoor: true, music: 'enseada', fishZone: () => 'enseada' }));
}

// ======================= MONTANHA =======================
function buildMountain() {
  const b = new MB('montanha', 'Serra do Candeeiro', 66, 46);
  b.fill(0, 0, 66, 8, T.DARKGRASS);
  b.cliffRow(0, 65, 6, 3);
  b.fill(19, 6, 3, 3, T.DIRT);
  b.path(30, 45, 30, 30, 2, T.DIRT, 1, 91);
  b.path(30, 30, 20, 9, 2, T.DIRT, 1, 92);
  b.path(0, 21, 26, 21, 2, T.DIRT, 1, 93);
  b.path(30, 20, 54, 15, 2, T.DIRT, 1, 94);
  b.lake(45, 30, 9, 6, 95);
  b.fill(34, 29, 3, 1, T.PLANKS); b.fill(35, 29, 1, 1, T.PLANKS);
  b.cliffRow(2, 12, 35, 2); b.cliffRow(56, 65, 38, 2);
  b.deco({ x: 20, y: 8, sprite: 'cave', solid: false });
  b.warp({ x: 19, y: 7, w: 3, h: 1, to: 'mina', tx: 11, ty: 15, dir: 'up', label: 'Minas' });
  b.building({ id: 'posto', x: 24, y: 11, w: 6, h: 3, sprite: 'b_posto', name: 'Posto do Guarda', door: { x: 26, y: 13, to: 'posto', tx: 7, ty: 10, gate: shopHours(720, 1320, -1, 'O Posto do Guarda') }, chimney: { dx: 4, dy: 0 } },
    { w: 6, wallH: 3, roofH: 3, wall: 'stone', wallColor: '#9a907a', roofColor: '#5a5a3a', doorX: 2, windows: [0, 4], chimney: 4, sign: '#c84a3a' });
  b.building({ id: 'selma', x: 52, y: 10, w: 6, h: 3, sprite: 'b_selma', name: 'Casa da Selma', door: { x: 54, y: 12, to: 'casa_selma', tx: 7, ty: 10, gate: homeHours(600, 1380, 'A porta de Selma está trancada') } },
    { w: 6, wallH: 3, roofH: 4, wall: 'log', wallColor: '#6a5a4a', roofColor: '#5a3a7a', doorX: 2, windows: [0, 4], tower: true });
  const R = rng(96);
  for (let i = 0; i < 70; i++) {
    const x = 1 + Math.floor(R() * 64), y = 10 + Math.floor(R() * 35);
    if (b.get(x, y) !== T.GRASS || b.get(x, y + 1) === T.DIRT || b.get(x, y - 1) === T.DIRT || b.get(x + 1, y) === T.DIRT || b.get(x - 1, y) === T.DIRT) continue;
    if (x > 22 && x < 32 && y < 15) continue;
    if (x > 50 && x < 60 && y < 15) continue;
    if (b.decos.some(d => Math.abs(d.x - x) < 2 && Math.abs(d.y - y) < 2)) continue;
    if (R() < 0.6) b.tree(x, y, R() < 0.7 ? 'pinheiro' : 'bordo'); else b.deco({ x, y, sprite: 'rock', solid: true, solidW: 2 });
  }
  for (let x = 1; x < 66; x += 3) b.tree(x, 3, 'pinheiro');
  b.warp({ x: 0, y: 20, w: 1, h: 3, to: 'fazenda', tx: 7, ty: 5, dir: 'down', label: 'Fazenda' });
  b.warp({ x: 30, y: 45, w: 2, h: 1, to: 'vila', tx: 19, ty: 1, dir: 'down', label: 'Vila' });
  b.poi('montanha.lago', 35, 28, 'down'); b.poi('montanha.mina', 20, 10, 'up'); b.poi('montanha.posto', 26, 14, 'up'); b.poi('montanha.mirante', 40, 18, 'down'); b.poi('montanha.selma', 54, 13, 'up'); b.poi('montanha.trilha', 14, 22);
  return reg(b.build({ outdoor: true, music: 'montanha', fishZone: () => 'lago' }));
}

function buildMountainInteriors() {
  let b = interior('posto', 'Posto do Guarda', 15, 12, {
    exitTo: 'montanha', exitX: 26, exitY: 14, doorX: 7, floor: T.STONEFLOOR, wall: '#7a6a5a',
    furniture: (b) => {
      for (let x = 3; x <= 8; x++) b.deco({ x, y: 5, sprite: 'counter', solid: true });
      b.counter(5, 5, 'posto'); b.counter(6, 5, 'posto');
      b.deco({ x: 10, y: 3, sprite: 'shelf:20', solid: true, solidW: 2 }); b.deco({ x: 12, y: 7, sprite: 'bed', solid: true, solidH: 2 }); b.deco({ x: 2, y: 8, sprite: 'barrel', solid: true });
      b.deco({ x: 5, y: 3, sprite: 'fireplace', solid: true, solidW: 2, light: { r: 40, color: '#ffb060', always: true } });
    },
  });
  b.poi('posto.balcao', 5, 4, 'down'); b.poi('posto.cama', 11, 9);
  reg(b.build({ outdoor: false, music: 'loja', wall: '#7a6a5a', indoorLight: true }));

  b = interior('casa_selma', 'Casa da Selma', 15, 12, {
    exitTo: 'montanha', exitX: 54, exitY: 13, doorX: 7, floorColor: '#6a5a7a', wall: '#5a4a6a',
    furniture: (b) => {
      for (let x = 3; x <= 7; x++) b.deco({ x, y: 6, sprite: 'counter', solid: true });
      b.counter(4, 6, 'selma'); b.counter(5, 6, 'selma');
      b.deco({ x: 2, y: 3, sprite: 'shelf:30', solid: true, solidW: 2 }); b.deco({ x: 10, y: 3, sprite: 'shelf:31', solid: true, solidW: 2 }); b.deco({ x: 12, y: 8, sprite: 'bed:1', solid: true, solidH: 2 });
      for (const [x, y] of [[2, 9], [9, 9], [12, 4]] as [number, number][]) b.deco({ x, y, sprite: 'plant', solid: true });
      b.deco({ x: 7, y: 9, sprite: 'crystal', solid: true, light: { r: 30, color: '#a0d0ff', always: true } });
    },
  });
  b.poi('selma.balcao', 4, 5, 'down'); b.poi('selma.cama', 11, 10); b.poi('selma.ervas', 9, 5, 'up');
  reg(b.build({ outdoor: false, music: 'selma', wall: '#5a4a6a', floor: '#6a5a7a', indoorLight: true }));

  // entrada das minas
  b = new MB('mina', 'Entrada das Minas', 23, 18, T.CAVEWALL);
  b.fill(2, 4, 19, 12, T.CAVE);
  b.fill(10, 16, 3, 2, T.CAVE);
  b.deco({ x: 6, y: 5, sprite: 'elevator', solid: true, solidW: 2, interact: 'elevator' }); b.interact(6, 5, 'elevator'); b.interact(7, 5, 'elevator');
  b.deco({ x: 15, y: 6, sprite: 'ladder', interact: 'mine_down' }); b.interact(15, 6, 'mine_down');
  b.deco({ x: 18, y: 6, sprite: 'minecart', solid: true, solidW: 2, interact: 'minecart' }); b.interact(18, 6, 'minecart'); b.interact(19, 6, 'minecart');
  b.deco({ x: 4, y: 12, sprite: 'crate', solid: true }); b.deco({ x: 17, y: 12, sprite: 'barrel', solid: true });
  for (const [x, y] of [[3, 5], [20, 5], [3, 14], [20, 14]] as [number, number][]) b.deco({ x, y, sprite: 'lantern', light: { r: 40, color: '#ffc070', always: true }, offY: -6 });
  b.warp({ x: 10, y: 17, w: 3, h: 1, to: 'montanha', tx: 20, ty: 10, dir: 'down', label: 'Montanha' });
  reg(b.build({ outdoor: false, music: 'mina', biome: 0, isMine: true, mineLevel: 0, indoorLight: true }));
}

// ======================= PRÉDIOS DA FAZENDA =======================
export function buildAnimalHouse(id: string, type: string, level: number, doorX: number, doorY: number) {
  const coop = type === 'galinheiro';
  const w = coop ? (level ? 16 : 13) : (level ? 20 : 16), h = coop ? 10 : 12;
  const b = interior(id, coop ? 'Galinheiro' : 'Celeiro', w, h, { exitTo: 'fazenda', exitX: doorX, exitY: doorY + 1, doorX: 3, floorColor: '#b89060', wall: coop ? '#c8a878' : '#a86a4a' });
  const n = coop ? (level ? 8 : 4) : (level ? 8 : 4);
  for (let i = 0; i < n; i++) { b.deco({ x: 6 + i, y: 3, sprite: 'trough', solid: true, interact: 'trough:' + i }); b.interact(6 + i, 3, 'trough:' + i); }
  b.deco({ x: 2, y: 3, sprite: 'hay', solid: true, interact: 'hopper' }); b.interact(2, 3, 'hopper');
  if (!coop) { b.deco({ x: w - 3, y: h - 3, sprite: 'hay', solid: true }); }
  return reg(b.build({ outdoor: false, music: 'casa', wall: coop ? '#c8a878' : '#a86a4a', floor: '#b89060', indoorLight: true }));
}

export function buildGreenhouse() {
  const b = interior('estufa', 'Estufa', 18, 15, { exitTo: 'fazenda', exitX: 22, exitY: 9, doorX: 8, floor: T.STONEFLOOR, wall: '#9ac8c0' });
  b.fill(2, 4, 14, 8, T.FARMDIRT);
  b.deco({ x: 1, y: 3, sprite: 'plant', solid: true }); b.deco({ x: 16, y: 3, sprite: 'plant', solid: true });
  return reg(b.build({ outdoor: false, tillable: true, music: 'fazenda', wall: '#9ac8c0', indoorLight: true }));
}

export function buildAllMaps() {
  buildFarm(); buildFarmhouse(0); buildTown(); buildTownInteriors(); buildForest(); buildRanch(); buildBeach(); buildFishShop(); buildCove(); buildMountain(); buildMountainInteriors(); buildGreenhouse();
}
export { POIS };
export type { FishZone };
