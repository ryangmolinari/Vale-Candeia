// Interface do jogo: HUD, diálogos, janelas e menus (DOM sobre o canvas).
import { G } from '../core/ctx';
import { Input } from '../core/input';
import { TILE, fmtMoney, key, makeCanvas } from '../core/util';
import { getState, SEASON_NAMES, WEEKDAYS, weekday, ItemStack, WObj, AnimalState } from '../state/state';
import { el, injectStyles, slotEl, hideTip, iconImg, tooltipFor } from './dom';
import { ITEMS, itemName, CAT_NAMES } from '../data/items';
import { iconURL } from '../art/icons';
import { NPCS, NPC_BY_ID } from '../data/npcs';
import { portrait, hearts, npcState, NPCManager } from '../systems/npcs';
import { sfx, setVolumes } from '../audio/audio';
import { addItem, removeAt, sameKind, stackMax, sortInventory, canFit, countItem, removeItem, sellPrice, hasIngredients } from '../systems/inventory';
import { SKILL_NAMES, XP_TABLE, PROFS, SkillId } from '../systems/skills';
import { RECIPES, COOKING, TV_RECIPES, HALL, FESTIVALS, MAIL } from '../data/game';
import { craft, recipeUnlocked } from '../systems/machines';
import { FISH } from '../data/fish';
import { shipItem } from '../systems/day';
import { openMail, acceptBoard, hallSetComplete, evaluateQuests, questEvent } from '../systems/quests';
import { troughInteract, hopperInteract } from '../systems/animals';
import { CAN_CAP, TOOL_NAMES, held, eat } from '../systems/actions';
import { openShop, openCollections } from './shops';
import { Expr } from '../art/characters';
import { fmtH } from '../world/maps';

type Fn = () => void;

export class UI {
  root!: HTMLDivElement;
  hud!: HTMLDivElement;
  clockEl!: HTMLDivElement; energyBar!: HTMLDivElement; hpBar!: HTMLDivElement; hpWrap!: HTMLDivElement; waterEl!: HTMLDivElement;
  hotbar!: HTMLDivElement; toasts!: HTMLDivElement;
  modal: HTMLElement | null = null;
  modalClose: Fn | null = null;
  dlg: { el: HTMLElement; lines: { who: string; text: string; expr?: Expr }[]; i: number; shown: number; cb?: Fn } | null = null;
  menuTab = 'inv';
  grab: { st: ItemStack; from: number } | null = null;
  cursorEl!: HTMLImageElement;
  hidden = false;
  lastMoney = 0; shownMoney = 0;
  renderer: any;

  init(renderer: any) {
    this.renderer = renderer;
    injectStyles();
    this.root = el('div', '', '', document.body); this.root.id = 'ui';
    this.hud = el('div', '', '', this.root);
    this.clockEl = el('div', 'frame', '', this.hud); this.clockEl.id = 'hud-clock';
    const bars = el('div', '', '', this.hud); bars.id = 'hud-bars';
    this.waterEl = el('div', 'frame-dark', '', bars); this.waterEl.style.fontSize = '0.75em'; this.waterEl.style.display = 'none';
    this.hpWrap = el('div', 'vbar', '<span class="lbl">V</span>', bars); this.hpBar = el('div', '', '', this.hpWrap); this.hpBar.style.background = 'linear-gradient(90deg,#c8343a,#f86a5a)';
    const eb = el('div', 'vbar', '<span class="lbl">E</span>', bars); this.energyBar = el('div', '', '', eb); eb.title = 'Energia';
    this.hotbar = el('div', 'frame', '', this.hud); this.hotbar.id = 'hotbar';
    this.toasts = el('div', '', '', this.root); this.toasts.id = 'toasts';
    // cursor
    const { c, ctx } = makeCanvas(10, 10);
    const pts = ['X.........', 'XX........', 'XWX.......', 'XWWX......', 'XWWWX.....', 'XWWWWX....', 'XWWWWWX...', 'XWWXXXX...', 'XXX.......', 'X.........'];
    pts.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { ctx.fillStyle = ch === 'X' ? '#3a2414' : '#fff4d0'; ctx.fillRect(x, y, 1, 1); } }));
    this.cursorEl = el('img', 'cursor', '', document.body); this.cursorEl.src = c.toDataURL();
    window.addEventListener('mousemove', e => { this.cursorEl.style.left = e.clientX + 'px'; this.cursorEl.style.top = e.clientY + 'px'; });
    this.resize(); window.addEventListener('resize', () => this.resize());
    this.hud.style.display = 'none';
    G.toast = (m, i, c) => this.toast(m, i, c);
    window.addEventListener('keydown', e => this.onKey(e), true);
  }
  resize() {
    const fs = Math.max(11, Math.min(24, Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * 20));
    document.documentElement.style.setProperty('--fs', fs + 'px');
    this.root.style.setProperty('--fs', fs + 'px');
  }
  showHud(on: boolean) { this.hud.style.display = on ? '' : 'none'; }
  isBlocking() { return !!this.modal || !!this.dlg; }
  mouseTile(): [number, number] { return this.renderer.screenToTile(Input.mx, Input.my); }
  shakeTile(map: string, k: string) { this.renderer.shakeTile(map, k); }
  fallTree(map: string, x: number, y: number, kind: string, f: string) { this.renderer.fallTree(map, x, y, kind, f); }

  // ---------------- HUD ----------------
  updateHud() {
    const s = getState();
    if (!s) return;
    const t = s.time;
    const wIcon = { sol: '☀', chuva: '☂', tempestade: '⚡', neve: '❄', vento: '🍂' }[s.weather.today];
    const h24 = Math.floor(t.minutes / 60) % 24, mm = t.minutes % 60;
    const ampm = `${String(h24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    if (this.shownMoney !== s.player.money) { const d = s.player.money - this.shownMoney; this.shownMoney += Math.abs(d) < 3 ? d : Math.round(d * 0.2); }
    const html = `<div class="row date"><span>${WEEKDAYS[weekday(t.day)]}. ${t.day}</span><span>${SEASON_NAMES[t.season]} · Ano ${t.year}</span></div>
      <div class="row time"><span title="Clima">${wIcon}</span><span>${ampm}</span></div>
      <div class="money">${fmtMoney(this.shownMoney)} <span style="color:#c89a2a">◉</span></div>`;
    if (this.clockEl.innerHTML !== html) this.clockEl.innerHTML = html;
    const e = Math.max(0, s.player.energy) / s.player.maxEnergy;
    this.energyBar.style.height = e * 100 + '%';
    this.energyBar.style.background = e > 0.5 ? 'linear-gradient(90deg,#4aa83a,#8ae86a)' : e > 0.2 ? 'linear-gradient(90deg,#c8a83a,#f8e06a)' : 'linear-gradient(90deg,#c83a2a,#f87a5a)';
    this.energyBar.parentElement!.title = `Energia ${Math.round(s.player.energy)}/${s.player.maxEnergy}`;
    const showHp = G.world?.def.isMine || s.player.hp < s.player.maxHp;
    this.hpWrap.style.display = showHp ? '' : 'none';
    this.hpBar.style.height = (s.player.hp / s.player.maxHp) * 100 + '%';
    const h = held();
    if (h?.id === 'regador') { this.waterEl.style.display = ''; this.waterEl.innerHTML = `💧 ${s.water}/${CAN_CAP[s.tools.can]}`; } else this.waterEl.style.display = 'none';
  }
  renderHotbar() {
    const s = getState();
    this.hotbar.innerHTML = '';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
    for (let i = 0; i < 12; i++) {
      const st = s.inventory[i];
      const sl = slotEl(st, { sel: G.player.sel === i, num: keys[i], onClick: () => { G.player.sel = i; this.renderHotbar(); sfx('menu'); } });
      this.hotbar.appendChild(sl);
    }
  }
  toast(msg: string, icon?: string, color?: string) {
    const t = el('div', 'frame toast', '', this.toasts);
    if (icon) t.appendChild(iconImg(icon, '2em'));
    const sp = el('span', '', msg, t); if (color) sp.style.color = color === '#f8d86a' ? '#8a5a10' : color === '#8ae86a' ? '#3a7a2a' : color === '#e85a7a' ? '#b83a5a' : color === '#ff8a6a' ? '#b84a2a' : color === '#a8c0ff' ? '#3a5a9a' : color === '#8ad0ff' ? '#2a6a9a' : '';
    while (this.toasts.children.length > 5) this.toasts.firstElementChild!.remove();
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 450); }, 3600);
  }
  onTick() { this.updateHud(); }

  // ---------------- MODAIS ----------------
  openModal(content: HTMLElement, onClose?: Fn, closable = true) {
    this.closeModal(true);
    const back = el('div', 'modal-back', '', this.root);
    back.appendChild(content);
    if (closable) back.addEventListener('mousedown', e => { if (e.target === back) this.closeModal(); });
    this.modal = back; this.modalClose = onClose || null;
    Input.clear();
    sfx('open');
  }
  closeModal(silent = false) {
    if (!this.modal) return;
    this.modal.remove(); this.modal = null; hideTip();
    if (this.grab) { this.returnGrab(); }
    const cb = this.modalClose; this.modalClose = null;
    if (!silent) sfx('close');
    cb?.();
    this.renderHotbar();
    Input.clear();
  }
  windowEl(title: string, width = '') {
    const w = el('div', 'frame window pe');
    if (width) w.style.width = width;
    if (title) el('h2', '', title, w);
    const x = el('button', 'x', '✕', w); x.onclick = () => this.closeModal();
    return w;
  }

  // ---------------- DIÁLOGO ----------------
  dialogue(npcId: string, text: string, expr: Expr = 'neutral', cb?: Fn) { this.showLines([{ who: npcId, text, expr }], cb); }
  narrate(lines: string[], cb?: Fn) { this.showLines(lines.map(t => ({ who: '', text: t })), cb); }
  showLines(lines: { who: string; text: string; expr?: Expr }[], cb?: Fn) {
    if (this.dlg) { this.dlg.el.remove(); }
    const box = el('div', 'frame', '', this.root); box.id = 'dialogue';
    this.dlg = { el: box, lines, i: 0, shown: 0, cb };
    box.addEventListener('mousedown', e => { e.stopPropagation(); this.advance(); });
    this.drawLine();
  }
  private drawLine() {
    const d = this.dlg!; const ln = d.lines[d.i];
    d.el.innerHTML = '';
    const txt = el('div', 'txt', '', d.el);
    const s = getState();
    const text = ln.text.replace(/@nome/g, s.player.name).replace(/@fazenda/g, s.player.farmName);
    (txt as any)._full = text;
    txt.textContent = '';
    d.shown = 0;
    if (ln.who && ln.who !== '@' && NPC_BY_ID[ln.who]) {
      const por = el('div', 'por', '', d.el);
      const pc = portrait(ln.who, ln.expr || 'neutral');
      const img = el('img', '', '', por); img.src = pc.toDataURL();
      el('div', 'name', NPC_BY_ID[ln.who].name.split(' ')[0], por);
    } else if (ln.who === '@') { txt.style.fontStyle = 'italic'; (txt as any)._full = '— ' + text; }
    else { txt.style.fontStyle = 'italic'; txt.style.color = '#6a4a2a'; }
    el('div', 'more', '▼', d.el);
  }
  updateDialogue(dt: number) {
    const d = this.dlg; if (!d) return;
    const txt = d.el.querySelector('.txt') as any; if (!txt) return;
    const full: string = txt._full;
    if (d.shown < full.length) { d.shown = Math.min(full.length, d.shown + dt * 55); txt.textContent = full.slice(0, Math.floor(d.shown)); if (Math.floor(d.shown) % 3 === 0) sfx('reel'); }
  }
  advance() {
    const d = this.dlg; if (!d) return;
    const txt = d.el.querySelector('.txt') as any;
    if (txt && d.shown < txt._full.length) { d.shown = txt._full.length; txt.textContent = txt._full; return; }
    d.i++;
    if (d.i >= d.lines.length) { d.el.remove(); this.dlg = null; Input.clear(); d.cb?.(); return; }
    sfx('menu');
    this.drawLine();
  }
  confirm(text: string, yes: Fn, no?: Fn) {
    const w = this.windowEl(''); w.style.maxWidth = '30em';
    el('p', '', text, w).style.textAlign = 'center';
    const r = el('div', 'flex center', '', w);
    const b1 = el('button', 'btn', 'Sim', r); b1.onclick = () => { this.closeModal(true); yes(); };
    const b2 = el('button', 'btn', 'Não', r); b2.onclick = () => { this.closeModal(); no?.(); };
    this.openModal(w);
  }
  choose(title: string, opts: { label: string; value: string }[], cb: (v: string) => void) {
    const w = this.windowEl(title); w.style.minWidth = '22em';
    const l = el('div', 'list', '', w);
    for (const o of opts) { const r = el('div', 'rowi', o.label, l); r.onclick = () => { this.closeModal(true); cb(o.value); }; }
    this.openModal(w, undefined, false);
  }
  pickItem(title: string, cb: (st: ItemStack | null) => void, consume = true) {
    const s = getState();
    const w = this.windowEl(title);
    const g = el('div', 'grid', '', w); g.style.gridTemplateColumns = 'repeat(12, auto)';
    for (let i = 0; i < s.invSize; i++) {
      const st = s.inventory[i];
      const ok = st && !ITEMS[st.id].tool && !ITEMS[st.id].weapon;
      g.appendChild(slotEl(st, { dim: !!st && !ok, onClick: () => { if (!ok) return; const taken = consume ? removeAt(i, 1) : { ...st!, qty: 1 }; this.closeModal(true); cb(taken); } }));
    }
    const r = el('div', 'flex center', '', w); r.style.marginTop = '8px';
    const b = el('button', 'btn', 'Nenhum', r); b.onclick = () => { this.closeModal(true); cb(null); };
    this.openModal(w, undefined, false);
  }

  // ---------------- TECLADO ----------------
  onKey(e: KeyboardEvent) {
    if (!G.started) return;
    const k = e.key.toLowerCase();
    if (this.dlg) { if (['e', 'enter', ' ', 'escape', 'x'].includes(k) || e.code === 'Space') { e.preventDefault(); e.stopPropagation(); this.advance(); } return; }
    if (this.modal) {
      if (k === 'escape' || (k === 'tab' && this.modal.dataset.menu) || (k === 'e' && this.modal.dataset.closeE)) { e.preventDefault(); e.stopPropagation(); this.closeModal(); }
      else if (this.modal.dataset.menu && ['c', 'j', 'm'].includes(k)) { e.preventDefault(); this.openMenu({ c: 'craft', j: 'quests', m: 'map' }[k]!); }
      return;
    }
    if (G.paused() || G.fishing) return;
    if (k === 'tab' || k === 'i') { e.preventDefault(); this.openMenu('inv'); }
    else if (k === 'escape') { e.preventDefault(); if (G.placement) G.placement.cancel(); else this.openMenu('options'); }
    else if (k === 'c') this.openMenu('craft');
    else if (k === 'j') this.openMenu('quests');
    else if (k === 'm') this.openMenu('map');
    else if (k === 'h') { this.hidden = !this.hidden; this.hud.style.opacity = this.hidden ? '0' : '1'; }
  }

  // ---------------- MENU PRINCIPAL ----------------
  openMenu(tab: string) {
    this.menuTab = tab;
    const w = el('div', 'frame window pe'); w.style.width = 'min(60em, 96vw)'; w.style.minHeight = '30em';
    const x = el('button', 'x', '✕', w); x.onclick = () => this.closeModal();
    const tabs = el('div', 'tabs', '', w);
    const body = el('div', '', '', w);
    const T: [string, string][] = [['inv', 'Inventário'], ['craft', 'Fabricar'], ['skills', 'Habilidades'], ['social', 'Relações'], ['quests', 'Missões'], ['map', 'Mapa'], ['coll', 'Coleções'], ['options', 'Opções']];
    const draw = () => {
      tabs.innerHTML = '';
      for (const [id, name] of T) { const t = el('div', 'tab' + (this.menuTab === id ? ' on' : ''), name, tabs); t.onclick = () => { this.menuTab = id; sfx('menu'); draw(); }; }
      body.innerHTML = '';
      ({ inv: () => this.tabInv(body, draw), craft: () => this.tabCraft(body, draw), skills: () => this.tabSkills(body), social: () => this.tabSocial(body), quests: () => this.tabQuests(body), map: () => this.tabMap(body), coll: () => openCollections(body), options: () => this.tabOptions(body) } as any)[this.menuTab]();
    };
    draw();
    this.openModal(w);
    this.modal!.dataset.menu = '1';
  }

  invGrid(parent: HTMLElement, redraw: Fn, onShift?: (i: number) => void, extraTip?: (st: ItemStack) => string) {
    const s = getState();
    const g = el('div', 'grid', '', parent); g.style.gridTemplateColumns = 'repeat(12, auto)'; g.style.justifyContent = 'center';
    for (let i = 0; i < s.invSize; i++) {
      const st = s.inventory[i];
      const sl = slotEl(st, {
        sel: i === G.player.sel, extraTip: st && extraTip ? extraTip(st) : '',
        onClick: (e) => { if (e.shiftKey && onShift && st) { onShift(i); redraw(); return; } this.clickSlot(i); redraw(); },
        onRight: () => { this.rightSlot(i); redraw(); },
      });
      if (this.grab?.from === i && !s.inventory[i]) sl.classList.add('grab');
      if (i === 11) sl.style.marginRight = '0';
      g.appendChild(sl);
      if (i === 11) { /* quebra visual da hotbar */ }
    }
    if (this.grab) { const gi = el('div', 'muted', `Segurando: ${itemName(this.grab.st.id, this.grab.st.ref)} x${this.grab.st.qty}`, parent); gi.style.textAlign = 'center'; }
    return g;
  }
  clickSlot(i: number) {
    const s = getState();
    const st = s.inventory[i];
    if (!this.grab) { if (st) { this.grab = { st, from: i }; s.inventory[i] = null; sfx('menu'); } return; }
    const g = this.grab.st;
    if (!st) { s.inventory[i] = g; this.grab = null; }
    else if (sameKind(st, g) && st.qty < stackMax(st.id)) { const add = Math.min(stackMax(st.id) - st.qty, g.qty); st.qty += add; g.qty -= add; if (g.qty <= 0) this.grab = null; }
    else { s.inventory[i] = g; this.grab = { st, from: i }; }
    sfx('menu');
  }
  rightSlot(i: number) {
    const s = getState();
    const st = s.inventory[i];
    if (this.grab) { if (!st) { s.inventory[i] = { ...this.grab.st, qty: 1 }; this.grab.st.qty--; if (this.grab.st.qty <= 0) this.grab = null; } else if (sameKind(st, this.grab.st) && st.qty < stackMax(st.id)) { st.qty++; this.grab.st.qty--; if (this.grab.st.qty <= 0) this.grab = null; } return; }
    if (st && st.qty > 1) { const half = Math.floor(st.qty / 2); st.qty -= half; this.grab = { st: { ...st, qty: half }, from: i }; }
  }
  returnGrab() {
    if (!this.grab) return;
    const s = getState();
    if (!s.inventory[this.grab.from]) s.inventory[this.grab.from] = this.grab.st;
    else { const left = addItem(this.grab.st, false); if (left) { G.drops && (G as any).dropAtPlayer?.({ ...this.grab.st, qty: left }); } }
    this.grab = null;
  }

  tabInv(body: HTMLElement, redraw: Fn) {
    const s = getState();
    const top = el('div', 'flex wrap center', '', body);
    const info = el('div', 'col', '', top); info.style.minWidth = '14em';
    info.innerHTML = `<h3>${s.player.name}</h3><div>Fazenda ${s.player.farmName}</div><div class="muted">Dinheiro: ${fmtMoney(s.player.money)} · Lucro total: ${fmtMoney(s.player.totalEarned)}</div><div class="muted">Energia ${Math.round(s.player.energy)}/${s.player.maxEnergy} · Vida ${s.player.hp}/${s.player.maxHp}</div>` +
      `<div class="muted">Ferramentas: ${(['hoe', 'axe', 'pick', 'can'] as const).map(t => ({ hoe: 'Enxada', axe: 'Machado', pick: 'Picareta', can: 'Regador' }[t] + ' ' + TOOL_NAMES[s.tools[t]])).join(', ')}</div>` +
      (s.spouse ? `<div class="hearts">Casada(o) com ${NPC_BY_ID[s.spouse].name} ♥</div>` : '');
    const acts = el('div', 'col', '', top);
    const sortB = el('button', 'btn', 'Organizar', acts); sortB.onclick = () => { sortInventory(); redraw(); sfx('menu'); };
    const trash = el('button', 'btn', '🗑 Lixeira', acts); trash.title = 'Clique segurando um item para descartá-lo';
    trash.onclick = () => { if (!this.grab) { this.toast('Pegue um item e clique na lixeira para descartar.'); return; } const g = this.grab; if (ITEMS[g.st.id].tool) { this.toast('Não dá para jogar ferramentas fora.'); return; } this.grab = null; sfx('pick'); redraw(); this.toast(`Descartou ${itemName(g.st.id, g.st.ref)} x${g.st.qty}`); };
    const hint = el('div', 'muted', 'Clique para pegar/soltar · botão direito divide · Shift+clique move entre barra e mochila', body); hint.style.textAlign = 'center'; hint.style.margin = '10px 0 4px';
    this.invGrid(body, redraw, (i) => {
      const st = s.inventory[i]!; s.inventory[i] = null;
      const range = i < 12 ? [12, s.invSize] : [0, 12];
      let placed = false;
      for (let j = range[0]; j < range[1] && !placed; j++) { const t = s.inventory[j]; if (t && sameKind(t, st) && t.qty + st.qty <= stackMax(st.id)) { t.qty += st.qty; placed = true; } }
      for (let j = range[0]; j < range[1] && !placed; j++) if (!s.inventory[j]) { s.inventory[j] = st; placed = true; }
      if (!placed) s.inventory[i] = st;
    });
  }

  tabCraft(body: HTMLElement, redraw: Fn) {
    const s = getState();
    el('h3', '', 'Receitas de fabricação', body);
    const l = el('div', 'grid', '', body); l.style.gridTemplateColumns = 'repeat(auto-fill, minmax(17em, 1fr))';
    for (const r of RECIPES) {
      const un = recipeUnlocked(r, 'craft');
      const ok = un && hasIngredients(r.ing);
      const row = el('div', 'rowi' + (ok ? '' : ' off'), '', l);
      if (!un) { row.innerHTML = `<span style="width:2.2em;height:2.2em;display:inline-block;background:#c8b090"></span><span>???<br><span class="muted">${unlockText(r.unlock)}</span></span>`; continue; }
      row.appendChild(iconImg(r.id, '2.2em'));
      const t = el('span', '', `${ITEMS[r.id].name}${r.qty > 1 ? ' x' + r.qty : ''}<br><span class="muted">${r.ing.map(([id, n]) => `<span style="color:${countItem(id) >= n ? '#3a6a2a' : '#a83a2a'}">${n} ${ITEMS[id]?.name || id}</span>`).join(', ')}</span>`, row);
      row.addEventListener('mousemove', e => tooltipFor({ id: r.id, qty: 1 }, e));
      row.addEventListener('mouseleave', () => hideTip());
      row.onclick = () => { const err = craft(r); if (err) { this.toast(err); sfx('error'); } else { this.toast(`Fabricou ${ITEMS[r.id].name}!`, r.id); } redraw(); };
    }
  }

  tabSkills(body: HTMLElement) {
    const s = getState();
    for (const sk of Object.keys(SKILL_NAMES) as SkillId[]) {
      const st = s.skills[sk];
      const row = el('div', 'rowi', '', body); row.style.cursor = 'default';
      const next = st.level >= 10 ? 'MAX' : `${st.xp}/${XP_TABLE[st.level]} XP`;
      row.innerHTML = `<b style="min-width:7em">${SKILL_NAMES[sk]}</b><span class="skillbar">${Array.from({ length: 10 }, (_, i) => `<i class="${i < st.level ? 'on' : ''}"></i>`).join('')}</span><span class="muted">Nível ${st.level} · ${next}</span><span class="price">${st.profs.map(p => [...PROFS[sk][5], ...PROFS[sk][10]].find(x => x.id === p)?.name).join(', ')}</span>`;
    }
    el('h3', '', 'Estatísticas', body);
    const st = s.stats;
    el('div', 'muted', `Colheitas: ${st.harvested || 0} · Peixes: ${st.fish || 0} · Monstros: ${st.kills || 0} · Árvores: ${st.trees || 0} · Itens de coleta: ${st.forage || 0} · Andar mais fundo: ${s.mineDeepest} · Presentes: ${st.gifts || 0} · Missões: ${st.questsDone || 0}`, body);
  }

  tabSocial(body: HTMLElement) {
    const l = el('div', 'grid', '', body); l.style.gridTemplateColumns = 'repeat(auto-fill, minmax(26em, 1fr))';
    for (const n of NPCS) {
      const st = npcState(n.id);
      const row = el('div', 'rowi', '', l); row.style.cursor = 'default';
      const p = portrait(n.id, 'neutral'); const img = el('img', '', '', row); img.src = p.toDataURL(); img.style.width = '3em'; img.style.height = '3em';
      if (!st.met) { el('span', 'muted', '??? (ainda não conheceu)', row); continue; }
      const hh = hearts(n.id), max = (n.romance && !st.dating && !st.married) ? 8 : 10;
      const status = st.married ? ' · Casado(a) ♥' : st.engaged ? ' · Noivado!' : st.dating ? ' · Namorando' : n.romance ? ' · Solteiro(a)' : '';
      el('span', '', `<b>${n.name}</b> <span class="muted">${n.job}${status}</span><br><span class="hearts">${'♥'.repeat(hh)}<span class="e">${'♥'.repeat(Math.max(0, max - hh))}</span></span><br><span class="muted">Aniversário: ${n.birthday[1]} de ${SEASON_NAMES[n.birthday[0]]} · ${st.talkedToday ? '✔ conversou' : '✘ não conversou'} · presentes na semana: ${st.giftsWeek}/2</span>`, row);
      row.title = `${n.personality}\n${n.family}`;
    }
  }

  tabQuests(body: HTMLElement) {
    const s = getState();
    el('h3', '', 'Missões ativas', body);
    if (!s.quests.length) el('div', 'muted', 'Nenhuma missão no momento. Confira o mural da praça!', body);
    for (const q of s.quests) {
      const row = el('div', 'rowi', '', body); row.style.cursor = 'default'; row.style.flexDirection = 'column'; row.style.alignItems = 'flex-start';
      const prog = q.target ? ` <span class="muted">(${Math.min(q.progress || 0, q.target)}/${q.target})</span>` : '';
      const kind = { story: 'História', request: 'Pedido', daily: 'Diária', explore: 'Exploração', slay: 'Caça' }[q.kind];
      row.innerHTML = `<b>${q.title}${prog}</b><span class="muted">[${kind}] ${q.desc}</span>` + (q.item ? `<span class="muted">Entregue ${q.qty}x ${ITEMS[q.item].name} a ${NPC_BY_ID[q.npc!]?.name} (você tem ${countItem(q.item)}).</span>` : '') + (q.reward ? `<span class="price">Recompensa: ${q.reward} moedas</span>` : '');
    }
    el('h3', '', 'Casa dos Ofícios', body);
    el('div', 'muted', `Altares restaurados: ${s.hallDone.length}/6 — ${HALL.map(h => (s.hallDone.includes(h.id) ? '✔ ' : '· ') + h.name.replace('Altar d', '').replace(/^[ao]s? /, '')).join(' · ')}`, body);
  }

  tabMap(body: HTMLElement) {
    const wrap = el('div', 'map-wrap', '', body); wrap.style.margin = '0 auto';
    wrap.style.background = 'linear-gradient(180deg,#7a8a6a 0%,#7a8a6a 22%,#8ab868 22%,#8ab868 72%,#e8d49a 72%,#e8d49a 86%,#4a8ad0 86%)';
    const locs: [string, number, number, string][] = [['Fazenda', 22, 45, 'fazenda'], ['Vila Candeia', 55, 47, 'vila'], ['Serra do Candeeiro', 40, 14, 'montanha'], ['Minas', 30, 8, 'mina'], ['Floresta dos Ipês', 25, 70, 'floresta'], ['Praia do Farol', 58, 80, 'praia'], ['Enseada', 86, 80, 'enseada']];
    const s = getState();
    const cur = G.world.def.id;
    const where = cur.startsWith('mina') ? 'mina' : cur.startsWith('bld_') || cur === 'casa' || cur === 'estufa' ? 'fazenda' : ['venda', 'taverna', 'prefeitura', 'clinica', 'biblioteca', 'correio', 'carpintaria', 'forja', 'casa_lins', 'casa_saraiva', 'casa_mota', 'hall'].includes(cur) ? 'vila' : cur === 'rancho' ? 'floresta' : cur === 'loja_pesca' ? 'praia' : ['posto', 'casa_selma'].includes(cur) ? 'montanha' : cur;
    for (const [n, x, y, id] of locs) {
      const l = el('div', 'loc', n + (id === 'enseada' && !s.hallDone.includes('aguas') ? ' 🔒' : ''), wrap); l.style.left = x + '%'; l.style.top = y + '%';
      if (id === where) { const m = el('div', 'me', '', wrap); m.style.left = x + '%'; m.style.top = (y - 7) + '%'; }
    }
    el('div', 'muted', `Você está em: ${G.world.def.name}`, body).style.textAlign = 'center';
  }

  tabOptions(body: HTMLElement) {
    const s = getState();
    const mk = (label: string, val: number, set: (v: number) => void) => {
      const r = el('div', 'flex center', '', body);
      el('span', '', label, r).style.minWidth = '8em';
      const i = el('input', '', '', r) as HTMLInputElement; i.type = 'range'; i.min = '0'; i.max = '100'; i.value = String(Math.round(val * 100)); i.style.pointerEvents = 'auto';
      i.oninput = () => set(+i.value / 100);
    };
    mk('Música', s.settings.music, v => { s.settings.music = v; setVolumes(s.settings.music, s.settings.sfx); });
    mk('Efeitos', s.settings.sfx, v => { s.settings.sfx = v; setVolumes(s.settings.music, s.settings.sfx); });
    const zr = el('div', 'flex center', '<span style="min-width:8em">Zoom</span>', body);
    const zo = el('div', 'opt', '', zr);
    for (const z of [0, 2, 3, 4, 5, 6]) { const b = el('button', s.settings.zoom === z ? 'on' : '', z ? z + 'x' : 'Auto', zo); b.onclick = () => { s.settings.zoom = z; this.renderer.resize(); this.closeModal(); this.openMenu('options'); }; }
    el('h3', '', 'Controles', body);
    el('div', 'muted', 'WASD/Setas: mover · Clique esquerdo/Espaço: usar ferramenta ou item (segure para carregar enxada/regador) · Clique direito/E: interagir, conversar, colher, presentear · 1–9, 0, -, = ou roda do mouse: barra rápida · Tab/I: inventário · C: fabricar · J: missões · M: mapa · H: ocultar HUD · Esc: menu', body);
    const r = el('div', 'flex center', '', body); r.style.marginTop = '12px';
    const sv = el('button', 'btn', 'Sair para o título', r);
    sv.onclick = () => this.confirm('Voltar ao título? O progresso é salvo automaticamente ao dormir.', () => location.reload());
  }

  // ---------------- INTERAÇÕES DO MUNDO ----------------
  interactId(id: string, tx: number, ty: number) {
    const s = getState();
    if (id === 'bed') { this.confirm(s.time.minutes < 1080 ? 'Ainda é cedo... Dormir e encerrar o dia?' : 'Ir dormir? (O jogo será salvo)', () => G.sleep(false)); return; }
    if (id === 'tv') return this.tv();
    if (id === 'stove') return this.cooking();
    if (id === 'bin') return this.shippingBin();
    if (id === 'mail') return this.mailbox();
    if (id === 'board') return this.board();
    if (id.startsWith('hall:')) return this.hallAltar(id.slice(5));
    if (id === 'elevator') return this.elevator();
    if (id === 'mine_down') { (G as any).goMine(Math.max(1, 1)); return; }
    if (id === 'mine_up') { G.warp('mina', 15, 7, 'down'); return; }
    if (id === 'minecart') return this.minecart();
    if (id.startsWith('trough:')) { troughInteract(+id.slice(7)); return; }
    if (id === 'hopper') { hopperInteract(); return; }
    if (id === 'well') { s.water = CAN_CAP[s.tools.can]; sfx('water'); this.toast('Regador cheio!'); return; }
    if (id === 'silo') { const cap = s.buildings.filter(b => b.type === 'silo' && b.daysLeft <= 0).length * 240; this.toast(`Silo: ${s.flags.hay || 0}/${cap} feno.`); return; }
    if (id === 'stable') { this.toast('Seu cavalo descansa no estábulo. Interaja com ele para montar.'); return; }
  }
  openShopAtCounter(shop: string) { openShop(shop); }
  mineDescend() { (G as any).goMine((G.world.def.mineLevel || 0) + 1); }

  tv() {
    const s = getState();
    const opts = [{ label: 'Previsão do tempo', value: 'w' }, { label: 'Fortuna do dia', value: 'l' }, { label: 'Cozinha do Vale (receita da semana)', value: 'r' }];
    this.choose('Televisão', opts, v => {
      if (v === 'w') this.narrate([`"E amanhã no Vale da Candeia: ${{ sol: 'sol e céu limpo', chuva: 'chuva o dia inteiro — ótimo para as plantações', tempestade: 'tempestade com raios! Fiquem em casa', neve: 'neve! Agasalhem-se', vento: 'ventania com folhas voando' }[s.weather.tomorrow]}."`]);
      if (v === 'l') { const l = s.luck; this.narrate([l > 0.06 ? '"Os astros sorriem para você hoje! Grande sorte!"' : l > 0 ? '"Um dia tranquilo, com uma pitada de sorte."' : l > -0.06 ? '"Dia neutro. Siga em frente."' : '"Cuidado hoje... os ventos não estão a seu favor."']); }
      if (v === 'r') {
        const week = Math.floor(((s.time.year - 1) * 112 + s.time.season * 28 + s.time.day - 1) / 7);
        const rid = TV_RECIPES[week % TV_RECIPES.length];
        if (!s.cooking.includes(rid)) s.cooking.push(rid);
        this.narrate([`"Olá, cozinheiros! Hoje vamos preparar ${ITEMS[rid].name}!"`, `Você aprendeu a receita: ${ITEMS[rid].name}.` + (s.houseLevel < 1 ? ' (Você precisa de uma cozinha para cozinhar.)' : '')]);
      }
    });
  }

  cooking() {
    const s = getState();
    const w = this.windowEl('Cozinha'); w.style.width = 'min(44em, 94vw)';
    const draw = () => {
      w.querySelectorAll('.rowi,.grid').forEach(e => e.remove());
      const l = el('div', 'grid', '', w); l.style.gridTemplateColumns = 'repeat(auto-fill, minmax(18em, 1fr))';
      for (const r of COOKING) {
        const un = recipeUnlocked(r, 'cook');
        const ok = un && hasIngredients(r.ing);
        const row = el('div', 'rowi' + (ok ? '' : ' off'), '', l);
        if (!un) { row.innerHTML = '<span>??? <span class="muted">(receita desconhecida)</span></span>'; continue; }
        row.appendChild(iconImg(r.id, '2.2em'));
        el('span', '', `${ITEMS[r.id].name}<br><span class="muted">${r.ing.map(([id, n]) => `<span style="color:${countItem(id) >= n ? '#3a6a2a' : '#a83a2a'}">${n} ${id.startsWith('cat:') ? ({ fish: 'Peixe (qualquer)', fruit: 'Fruta (qualquer)' } as any)[id.slice(4)] : ITEMS[id].name}</span>`).join(', ')}</span>`, row);
        row.onclick = () => { const err = craft(r, 'cook'); if (err) { this.toast(err); sfx('error'); } else this.toast(`Cozinhou ${ITEMS[r.id].name}!`, r.id); draw(); };
      }
    };
    draw();
    this.openModal(w);
  }

  shippingBin() {
    const s = getState();
    const w = this.windowEl('Caixa de Envio'); w.style.width = 'min(48em, 96vw)';
    el('div', 'muted', 'Clique em um item para colocar na caixa. Tudo é vendido durante a noite.', w).style.textAlign = 'center';
    const info = el('div', '', '', w);
    const gw = el('div', '', '', w);
    const draw = () => {
      const tot = s.shipping.reduce((a, it) => a + sellPrice(it) * it.qty, 0);
      info.innerHTML = `<h3>Na caixa: ${s.shipping.reduce((a, b) => a + b.qty, 0)} itens · estimativa ${fmtMoney(tot)} moedas</h3>`;
      if (s.shipping.length) { const last = s.shipping[s.shipping.length - 1]; const u = el('button', 'btn', `Desfazer último (${itemName(last.id, last.ref)} x${last.qty})`, info); u.onclick = () => { const it = s.shipping.pop()!; const left = addItem(it, false); if (left) s.shipping.push({ ...it, qty: left }); draw(); }; }
      gw.innerHTML = '';
      const g = el('div', 'grid', '', gw); g.style.gridTemplateColumns = 'repeat(12, auto)';
      for (let i = 0; i < s.invSize; i++) {
        const st = s.inventory[i];
        const ok = st && sellPrice(st) > 0;
        g.appendChild(slotEl(st, { dim: !!st && !ok, onClick: (e) => { if (!ok) return; const take = removeAt(i, e.shiftKey ? 1 : st!.qty)!; shipItem(take); sfx('ship'); draw(); } }));
      }
    };
    // segurando item: envia a pilha direto
    const h = held();
    if (h && sellPrice(h) > 0) { const take = removeAt(G.player.sel, h.qty)!; shipItem(take); sfx('ship'); this.toast(`Enviou ${itemName(take.id, take.ref)} x${take.qty}`, take.id); return; }
    draw();
    this.openModal(w);
  }

  mailbox() {
    const s = getState();
    const unread = s.mail.filter(m => !m.read);
    if (!unread.length) {
      const all = s.mail.slice(-8).reverse();
      if (!all.length) { this.toast('A caixa de correio está vazia.'); return; }
      this.choose('Cartas antigas', all.map(m => ({ label: (MAIL.find(x => x.id === m.id)?.from || '') + ' — ' + (MAIL.find(x => x.id === m.id)?.text.split('\n')[0] || ''), value: m.id })), id => this.showLetter(id));
      return;
    }
    this.showLetter(unread[0].id);
  }
  showLetter(id: string) {
    const m = MAIL.find(x => x.id === id)!;
    const w = this.windowEl('Carta');
    const st0 = getState(); const l = el('div', 'letter', '', w); l.textContent = m.text.replace(/@nome/g, st0.player.name).replace(/@fazenda/g, st0.player.farmName);
    if (m.attach) { const a = el('div', 'flex center', '', w); a.style.marginTop = '8px'; for (const at of m.attach) { a.appendChild(slotEl(at)); } }
    const b = el('button', 'btn', 'Fechar', el('div', 'flex center', '', w)); b.onclick = () => this.closeModal();
    openMail(id);
    sfx('open');
    this.openModal(w);
  }

  board() {
    const s = getState();
    const w = this.windowEl('Mural da Vila'); w.style.maxWidth = '34em';
    const b = s.flags.board;
    if (!b) el('p', 'muted', 'Nenhum pedido novo hoje. Volte amanhã!', w);
    else {
      const card = el('div', 'letter', `<b>${b.title}</b>\n\n${b.desc}\n\nRecompensa: ${b.reward} moedas` + (b.kind === 'request' ? ' · Prazo: 2 dias' : ''), w);
      const r = el('div', 'flex center', '', w); r.style.marginTop = '8px';
      const ac = el('button', 'btn', 'Aceitar', r); ac.onclick = () => { if (acceptBoard()) { this.toast('Pedido aceito: ' + b.title, undefined, '#f8d86a'); this.closeModal(); } };
    }
    const f = FESTIVALS.filter(x => x.season === s.time.season);
    el('h3', '', 'Calendário da estação', w);
    el('div', 'muted', f.map(x => `Dia ${x.day}: ${x.name}`).join(' · ') + ' · Aniversários: ' + NPCS.filter(n => n.birthday[0] === s.time.season).sort((a, c) => a.birthday[1] - c.birthday[1]).map(n => `${n.birthday[1]} ${n.name.split(' ')[0]}`).join(', '), w);
    this.openModal(w);
  }

  hallAltar(sector: string) {
    const s = getState();
    const sec = HALL.find(h => h.id === sector)!;
    const w = this.windowEl(sec.name); w.style.width = 'min(52em, 96vw)';
    const draw = () => {
      w.querySelectorAll('.hallbody').forEach(e => e.remove());
      const bd = el('div', 'hallbody', '', w);
      el('div', 'muted', `${sec.guild}. Recompensa ao restaurar: ${sec.reward}`, bd).style.textAlign = 'center';
      if (s.hallDone.includes(sector)) el('h3', '', '✨ Este altar já foi restaurado! ✨', bd).style.textAlign = 'center';
      for (const set of sec.sets) {
        s.hall[sector] ||= {}; s.hall[sector][set.id] ||= Array(set.items.length).fill(null);
        const got = s.hall[sector][set.id];
        const done = hallSetComplete(sector, set.id);
        el('h3', '', `${set.name} ${done ? '✔' : ''} <span class="muted">(${got.filter(Boolean).length}/${set.need ?? set.items.length})</span>`, bd);
        const row = el('div', 'flex wrap', '', bd);
        set.items.forEach(([id, qty, minQ], i) => {
          const have = countItem(id, minQ || 0);
          const slot = slotEl(got[i] ? { id, qty, q: minQ } : { id, qty, q: minQ }, { dim: !got[i], extraTip: got[i] ? '<div style="color:#3a7a2a">Entregue!</div>' : `<div class="muted">Precisa: ${qty}x${minQ ? ' (qualidade ' + ['', 'prata', 'ouro'][minQ] + '+)' : ''} · você tem ${have}</div>`, onClick: () => {
            if (got[i] || done) return;
            if (have < qty) { this.toast(`Você precisa de ${qty}x ${ITEMS[id].name}${minQ ? ' de qualidade ' + ['', 'prata', 'ouro'][minQ] + ' ou melhor' : ''}.`); sfx('error'); return; }
            removeItem(id, qty, minQ || 0); got[i] = { id, qty }; sfx('quest');
            if (hallSetComplete(sector, set.id)) { s.flags['hallset_' + sector + '_' + set.id] = true; this.toast(`Conjunto "${set.name}" completo!`, undefined, '#8ae86a'); evaluateQuests(); }
            if (sec.sets.every(x => hallSetComplete(sector, x.id)) && !s.hallDone.includes(sector)) { this.closeModal(true); (G as any).restoreSector(sector); return; }
            draw();
          } });
          if (got[i]) slot.style.boxShadow = '0 0 0 3px #6ad84a';
          row.appendChild(slot);
        });
      }
    };
    draw();
    this.openModal(w);
  }

  elevator() {
    const s = getState();
    const floors = [0]; for (let f = 5; f <= Math.min(80, s.mineDeepest); f += 5) floors.push(f);
    this.choose('Elevador das Minas', floors.map(f => ({ label: f === 0 ? 'Entrada' : `Andar ${f}`, value: String(f) })), v => { if (+v === 0) return; (G as any).goMine(+v); });
  }
  minecart() {
    const s = getState();
    if (!s.hallDone.includes('profundezas')) { this.toast('O carrinho está enferrujado e sem trilhos. Talvez a Casa dos Ofícios possa ajudar.'); return; }
    this.choose('Carrinho de Mina', [{ label: 'Fazenda', value: 'fazenda|34|11' }, { label: 'Vila (praça)', value: 'vila|29|25' }, { label: 'Minas', value: 'mina|11|14' }, { label: 'Praia', value: 'praia|35|3' }], v => { const [m, x, y] = v.split('|'); G.warp(m, +x, +y, 'down'); });
  }
  animalInfo(a: AnimalState, msg: string) {
    const f = Math.round(a.friendship / 200);
    this.toast(`${a.name}: ${'♥'.repeat(f)}${'♡'.repeat(5 - f)} ${a.happiness > 180 ? '(feliz)' : a.happiness > 90 ? '' : '(triste)'} ${msg}`);
  }
  knockout() {
    const s = getState();
    G.monsters = []; G.fishing = null;
    const lost: string[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = s.inventory.map((x, j) => (x && !ITEMS[x.id].tool && !ITEMS[x.id].weapon ? j : -1)).filter(j => j >= 0);
      if (!idx.length || Math.random() < 0.4) continue;
      const j = idx[Math.floor(Math.random() * idx.length)]; lost.push(itemName(s.inventory[j]!.id)); s.inventory[j] = null;
    }
    const loss = Math.min(5000, Math.floor(s.player.money * 0.1)); s.player.money -= loss;
    s.player.hp = Math.round(s.player.maxHp * 0.5); s.player.energy = Math.min(s.player.energy, s.player.maxEnergy * 0.5);
    G.warp('clinica', 11, 8, 'down');
    setTimeout(() => this.showLines([{ who: 'nina', text: `Você foi encontrada desacordada nas minas e trazida para a clínica. A conta foi de ${loss} moedas.` + (lost.length ? ` Na confusão, você perdeu: ${lost.join(', ')}.` : ''), expr: 'sad' }, { who: 'nina', text: 'Por favor, leve comida e não desça tão fundo sem preparo!', expr: 'neutral' }]), 700);
  }
  horseAt(cx: number, cy: number) {
    const hp = getState().flags.horsePos;
    return !!hp && hp.map === G.world.def.id && Math.hypot(hp.x - cx, hp.y - 8 - cy) < 22;
  }
  dismount() {
    const s = getState(); const p = G.player;
    s.player.horse = false; s.flags.horsePos = { map: G.world.def.id, x: p.x, y: p.y };
    p.moveBy(0, 6);
  }
  festivalIntro(f: any, lines: string[], cb: Fn) {
    this.showLines([{ who: '', text: `— ${f.name} —` }, ...lines.map(t => ({ who: '', text: t })), { who: 'aurelia', text: 'Sejam todos bem-vindos! Que comece a festa!', expr: 'happy' as Expr }], cb);
  }

  // ---------------- FIM DO DIA ----------------
  nightSummary(rep: any, cb: Fn) {
    const s = getState();
    const w = this.windowEl('Fim do dia'); w.style.width = 'min(34em, 94vw)';
    w.querySelector('.x')?.remove();
    if (rep.shipped.length) {
      for (const [cat, v] of Object.entries(rep.byCat)) el('div', 'summary-row', `<span>${cat}</span><span>${fmtMoney(v as number)}</span>`, w);
      const items = el('div', 'flex wrap center', '', w); items.style.margin = '6px 0';
      for (const it of rep.shipped.slice(0, 24)) items.appendChild(slotEl(it.item, { extraTip: `<div>Total: ${it.value}</div>` }));
      el('div', 'summary-row', `<b>Total</b><b>${fmtMoney(rep.total)} moedas</b>`, w);
    } else el('p', 'muted', 'Nada foi vendido hoje.', w).style.textAlign = 'center';
    for (const ev of rep.events) el('p', '', '• ' + ev, w);
    const r = el('div', 'flex center', '', w); r.style.marginTop = '8px';
    const b = el('button', 'btn', 'Continuar', r);
    b.onclick = () => { this.closeModal(true); this.levelUps(cb); };
    this.openModal(w, undefined, false);
    if (rep.total) sfx('coin');
  }
  levelUps(cb: Fn) {
    const s = getState();
    const lu = s.pendingLevelUps.shift();
    if (!lu) { cb(); return; }
    const sk = lu.skill as SkillId;
    const w = this.windowEl(`${SKILL_NAMES[sk]}: nível ${lu.level}!`); w.querySelector('.x')?.remove(); w.style.maxWidth = '36em';
    sfx('levelup');
    const perks: string[] = [];
    if (sk === 'combat') perks.push('+5 de vida máxima');
    const unlocked = RECIPES.filter(r => r.unlock === `${sk}:${lu.level}`).map(r => ITEMS[r.id].name);
    if (unlocked.length) perks.push('Novas receitas: ' + unlocked.join(', '));
    perks.push('Ferramentas da área gastam menos energia');
    el('p', '', perks.join('<br>'), w).style.textAlign = 'center';
    if (lu.level === 5 || lu.level === 10) {
      el('h3', '', 'Escolha uma especialização:', w).style.textAlign = 'center';
      const opts = PROFS[sk][lu.level as 5 | 10];
      const r = el('div', 'flex center', '', w);
      for (const p of opts) { const b = el('div', 'rowi', `<b>${p.name}</b><br><span class="muted">${p.desc}</span>`, r); b.style.flexDirection = 'column'; b.style.width = '14em'; b.onclick = () => { s.skills[sk].profs.push(p.id); if (p.id === 'defensor') { s.player.maxHp += 25; s.player.hp += 25; } this.closeModal(true); this.levelUps(cb); }; }
    } else { const b = el('button', 'btn', 'Ótimo!', el('div', 'flex center', '', w)); b.onclick = () => { this.closeModal(true); this.levelUps(cb); }; }
    this.openModal(w, undefined, false);
  }

  openChest(o: any) {
    const s = getState();
    const w = this.windowEl(o.id === 'coletor' ? 'Coletor Automático' : 'Baú'); w.style.width = 'min(48em, 96vw)';
    const draw = () => {
      w.querySelectorAll('.cbody').forEach(e => e.remove());
      const bd = el('div', 'cbody', '', w);
      const tools = el('div', 'flex center', '', bd);
      const st = el('button', 'btn', 'Empilhar no baú', tools); st.title = 'Move itens que já existem no baú';
      st.onclick = () => { for (let i = 0; i < s.invSize; i++) { const it = s.inventory[i]; if (!it || i < 12 && ITEMS[it.id].tool) continue; if (o.chest.some((c: any) => c && sameKind(c, it))) { const left = putInChest(o.chest, it); if (left) it.qty = left; else s.inventory[i] = null; } } draw(); };
      const so = el('button', 'btn', 'Organizar', tools); so.onclick = () => { const items = o.chest.filter(Boolean); items.sort((a: any, b: any) => a.id.localeCompare(b.id)); o.chest = [...items, ...Array(36 - items.length).fill(null)]; draw(); };
      if (o.id === 'bau') { const col = el('button', 'btn', 'Cor', tools); col.onclick = () => { o.color = ((o.color || 0) + 1) % 6; draw(); }; }
      const cg = el('div', 'grid', '', bd); cg.style.gridTemplateColumns = 'repeat(12, auto)'; cg.style.justifyContent = 'center'; cg.style.marginBottom = '8px';
      for (let i = 0; i < 36; i++) { const it = o.chest[i]; cg.appendChild(slotEl(it, { onClick: () => { if (!it) return; const left = addItem(it, false); if (left) it.qty = left; else o.chest[i] = null; sfx('menu'); draw(); } })); }
      el('div', 'muted', 'Inventário (clique para guardar)', bd).style.textAlign = 'center';
      const ig = el('div', 'grid', '', bd); ig.style.gridTemplateColumns = 'repeat(12, auto)'; ig.style.justifyContent = 'center';
      for (let i = 0; i < s.invSize; i++) { const it = s.inventory[i]; ig.appendChild(slotEl(it, { sel: i === G.player.sel, onClick: () => { if (!it || o.id === 'coletor') return; const left = putInChest(o.chest, it); if (left) it.qty = left; else s.inventory[i] = null; sfx('menu'); draw(); } })); }
    };
    draw();
    sfx('open');
    this.openModal(w);
    this.modal!.dataset.closeE = '1';
  }

  update(dt: number) {
    this.updateDialogue(dt);
    this.updateHud();
  }
}

function putInChest(chest: (ItemStack | null)[], it: ItemStack): number {
  let left = it.qty; const max = stackMax(it.id);
  for (const c of chest) if (c && sameKind(c, it) && c.qty < max && left > 0) { const add = Math.min(max - c.qty, left); c.qty += add; left -= add; }
  for (let i = 0; i < chest.length && left > 0; i++) if (!chest[i]) { const add = Math.min(max, left); chest[i] = { ...it, qty: add }; left -= add; }
  return left;
}
function unlockText(u: string) {
  const [t, v] = u.split(':');
  if (t === 'mail') return 'Desbloqueia por carta';
  if (t === 'hall') return 'Restaure um altar da Casa dos Ofícios';
  const nm: any = { farming: 'Agricultura', mining: 'Mineração', fishing: 'Pesca', foraging: 'Coleta', combat: 'Combate' };
  return nm[t] ? `${nm[t]} nível ${v}` : 'Bloqueada';
}
export { key, TILE, fmtH, questEvent, iconURL, canFit, CAT_NAMES, FISH, eat };
