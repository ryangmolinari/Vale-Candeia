// Tela de título e criação de personagem.
import { el } from './dom';
import { makeCanvas, rng } from '../core/util';
import { buildCharSheet, Look, SKINS, HAIR_COLORS, HAIR_STYLES, SHIRT_STYLES } from '../art/characters';
import { treeSprite, buildingSprite } from '../art/objects';
import { SEASON_PAL } from '../art/palette';
import { listSlots, lastSlot, deleteSlot } from '../state/save';
import { SEASON_NAMES } from '../state/state';
import { sfx, unlockAudio, setMusic } from '../audio/audio';

export interface NewGameOpts { name: string; farmName: string; favAnimal: string; look: Look; presentation: string; slot: number }

function titleBackground(): HTMLCanvasElement {
  const W = 480, H = 270;
  const { c, ctx } = makeCanvas(W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f8b878'); g.addColorStop(0.45, '#f8d8a0'); g.addColorStop(0.46, '#a8c8e8'); g.addColorStop(1, '#a8c8e8');
  const sky = ctx.createLinearGradient(0, 0, 0, 160); sky.addColorStop(0, '#4a6ab8'); sky.addColorStop(0.6, '#f8a878'); sky.addColorStop(1, '#f8d8a0');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 160);
  ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(360, 120, 22, 0, Math.PI * 2); ctx.fill();
  const R = rng(4);
  const hill = (y: number, amp: number, col: string, f: number) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 4) ctx.lineTo(x, y + Math.sin(x * f + y) * amp + Math.sin(x * f * 2.3) * amp * 0.4); ctx.lineTo(W, H); ctx.fill(); };
  hill(130, 14, '#7a6a9a', 0.012); hill(150, 10, '#5a8a6a', 0.02); hill(175, 8, SEASON_PAL[0].grassDark, 0.03); hill(200, 6, SEASON_PAL[0].grass, 0.025);
  for (let i = 0; i < 18; i++) { const t = treeSprite(['carvalho', 'pinheiro', 'bordo'][i % 3], 0, 4); const x = R() * W, y = 150 + R() * 40; ctx.drawImage(t.img, x - t.ox, y - t.oy); }
  const house = buildingSprite('title_house', { w: 6, wallH: 3, roofH: 3, wall: 'wood', wallColor: '#c89a6a', roofColor: '#a8443a', doorX: 2, windows: [0, 4], chimney: 4 }, 0);
  ctx.drawImage(house.img, 210, 238 - house.oy);
  ctx.fillStyle = SEASON_PAL[0].grass; ctx.fillRect(0, 236, W, 40);
  for (let i = 0; i < 200; i++) { ctx.fillStyle = R() < 0.5 ? SEASON_PAL[0].grassLight : SEASON_PAL[0].tuft; ctx.fillRect(R() * W, 236 + R() * 34, 1, 2); }
  for (let i = 0; i < 30; i++) { ctx.fillStyle = SEASON_PAL[0].flowers[i % 4]; ctx.fillRect(R() * W, 238 + R() * 30, 2, 2); }
  return c;
}

export function showTitle(root: HTMLElement, onNew: (o: NewGameOpts) => void, onLoad: (slot: number) => void) {
  const scr = el('div', 'title-screen', '', root);
  const bg = titleBackground();
  bg.style.position = 'absolute'; bg.style.inset = '0'; bg.style.width = '100%'; bg.style.height = '100%'; bg.style.imageRendering = 'pixelated'; bg.style.objectFit = 'cover'; bg.style.zIndex = '-1';
  scr.appendChild(bg);
  el('div', 'logo', 'Vale da Candeia<small>RAÍZES DO VALE</small>', scr);
  const box = el('div', 'frame col', '', scr); box.style.minWidth = '18em'; box.style.alignItems = 'stretch';
  const start = () => { unlockAudio(); setMusic('fazenda', 0); };
  (async () => {
    const slots = await listSlots();
    const last = await lastSlot();
    if (last >= 0 && slots[last]) { const b = el('button', 'btn', 'Continuar', box); b.onclick = () => { start(); sfx('open'); scr.remove(); onLoad(last); }; }
    const nb = el('button', 'btn', 'Novo Jogo', box); nb.onclick = () => { start(); sfx('open'); pickSlot(slots); };
    if (slots.some(Boolean)) { const lb = el('button', 'btn', 'Carregar', box); lb.onclick = () => { start(); loadMenu(slots); }; }
    el('div', 'muted', 'Um RPG de vida no campo · tudo gerado por código', box).style.textAlign = 'center';
  })();
  const loadMenu = (slots: any[]) => {
    box.innerHTML = '<h3 style="text-align:center;margin:0">Carregar</h3>';
    slots.forEach((sl, i) => {
      if (!sl) return;
      const r = el('div', 'rowi', `<b>${sl.name}</b> — Fazenda ${sl.farm}<br><span class="muted">${sl.day} de ${SEASON_NAMES[sl.season]}, Ano ${sl.year} · ${sl.money} moedas</span>`, box);
      r.onclick = () => { scr.remove(); onLoad(i); };
      const d = el('button', 'btn', 'Apagar', r); d.style.marginLeft = 'auto'; d.onclick = async (e) => { e.stopPropagation(); if (d.dataset.sure) { await deleteSlot(i); location.reload(); } else { d.dataset.sure = '1'; d.textContent = 'Confirmar?'; } };
    });
    const back = el('button', 'btn', 'Voltar', box); back.onclick = () => location.reload();
  };
  const pickSlot = (slots: any[]) => {
    const free = slots.findIndex(s => !s);
    if (free >= 0) { creation(free); return; }
    box.innerHTML = '<h3 style="text-align:center;margin:0">Escolha um espaço (será substituído)</h3>';
    slots.forEach((sl, i) => { const r = el('div', 'rowi', `Espaço ${i + 1}: ${sl.name} — ${sl.farm}`, box); r.onclick = () => creation(i); });
  };
  const creation = (slot: number) => {
    scr.querySelector('.logo')?.remove();
    box.remove();
    const w = el('div', 'frame window pe', '', scr); w.style.width = 'min(52em, 96vw)';
    el('h2', '', 'Crie seu personagem', w);
    const look: Look = { skin: SKINS[1], hair: 0, hairColor: HAIR_COLORS[1], shirt: 0, shirtColor: '#4a8ad8', pants: '#3a4a6a', eyes: '#3a2414' };
    let presentation = 'Neutra', fav = 'Gato';
    const row = el('div', 'flex wrap', '', w);
    const left = el('div', 'col', '', row); left.style.flex = '1'; left.style.minWidth = '20em';
    const right = el('div', 'col center', '', row); right.style.minWidth = '12em';
    const prev = el('canvas', '', '', right) as HTMLCanvasElement; prev.width = 16 * 3; prev.height = 26; prev.style.width = '12em'; prev.style.imageRendering = 'pixelated'; prev.style.background = '#a8c878'; prev.style.border = '4px solid #5c3a1e';
    const field = (label: string, val: string) => { el('div', 'muted', label, left); const i = el('input', 'txt', '', left) as HTMLInputElement; i.value = val; i.maxLength = 16; return i; };
    const name = field('Seu nome', 'Celina');
    const farm = field('Nome da fazenda', 'Recanto');
    const swRow = (label: string, colors: string[], get: () => string, set: (c: string) => void) => {
      el('div', 'muted', label, left); const sw = el('div', 'swatches', '', left);
      const draw = () => { sw.innerHTML = ''; for (const c of colors) { const d = el('div', 'sw' + (get() === c ? ' on' : ''), '', sw); d.style.background = c; d.onclick = () => { set(c); draw(); redraw(); sfx('menu'); }; } };
      draw();
    };
    const optRow = (label: string, opts: string[], get: () => number | string, set: (i: number) => void) => {
      el('div', 'muted', label, left); const o = el('div', 'opt', '', left);
      const draw = () => { o.innerHTML = ''; opts.forEach((t, i) => { const b = el('button', (get() === i || get() === t) ? 'on' : '', t, o); b.onclick = () => { set(i); draw(); redraw(); sfx('menu'); }; }); };
      draw();
    };
    swRow('Tom de pele', SKINS, () => look.skin, c => look.skin = c);
    optRow('Cabelo', HAIR_STYLES, () => look.hair, i => look.hair = i);
    swRow('Cor do cabelo', HAIR_COLORS, () => look.hairColor, c => look.hairColor = c);
    optRow('Roupa', SHIRT_STYLES, () => look.shirt, i => look.shirt = i);
    swRow('Cor da roupa', ['#4a8ad8', '#e85a4a', '#4ab84a', '#f8c83a', '#a85ad8', '#f0f0f0', '#3a3a3a', '#e88ab0', '#3ab8a8', '#c8843a'], () => look.shirtColor, c => look.shirtColor = c);
    swRow('Calça', ['#3a4a6a', '#5a4a3a', '#2a2a2a', '#6a8a4a', '#8a3a3a', '#c8b89a'], () => look.pants, c => look.pants = c);
    swRow('Olhos', ['#3a2414', '#2a5a8a', '#3a7a3a', '#6a4a2a', '#5a3a6a'], () => look.eyes!, c => look.eyes = c);
    optRow('Detalhes', ['Nenhum', 'Óculos', 'Sardas', 'Brinco', 'Barba'], () => (look.glasses ? 1 : look.freckles ? 2 : look.earring ? 3 : look.beard ? 4 : 0), i => { look.glasses = i === 1; look.freckles = i === 2; look.earring = i === 3; look.beard = i === 4; });
    optRow('Apresentação', ['Feminina', 'Masculina', 'Neutra'], () => presentation, i => presentation = ['Feminina', 'Masculina', 'Neutra'][i]);
    optRow('Animal preferido', ['Gato', 'Cachorro', 'Coelho'], () => fav, i => fav = ['Gato', 'Cachorro', 'Coelho'][i]);
    let dirI = 0;
    const redraw = () => {
      const sheet = buildCharSheet(look);
      const ctx = prev.getContext('2d')!; ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, prev.width, prev.height);
      ['down', 'right', 'up'].forEach((d, i) => ctx.drawImage(sheet[`${d}_walk_${dirI % 4}`].img, i * 16, 0));
    };
    redraw();
    const anim = setInterval(() => { dirI++; redraw(); }, 220);
    const go = el('button', 'btn', 'Começar a jornada', right); go.style.marginTop = '12px';
    go.onclick = () => {
      clearInterval(anim); sfx('quest');
      scr.remove();
      onNew({ name: name.value.trim() || 'Celina', farmName: farm.value.trim() || 'Recanto', favAnimal: fav, look, presentation, slot });
    };
  };
}
