// Lojas, ferreiro, carpintaria, rancho e coleções.
import { G } from '../core/ctx';
import { fmtMoney } from '../core/util';
import { getState, ItemStack, SEASON_NAMES } from '../state/state';
import { el, slotEl, iconImg, tooltipFor, hideTip } from './dom';
import { SHOPS, ShopEntry, BUILDS, HOUSE_UPGRADES, ANIMALS, MERCHANT_POOL, COOKING, FESTIVALS } from '../data/game';
import { ITEMS, itemName } from '../data/items';
import { CROP_BY_ID } from '../data/crops';
import { FISH } from '../data/fish';
import { addItem, canFit, sellPrice, removeAt, countItem, removeItem } from '../systems/inventory';
import { sfx } from '../audio/audio';
import { isShopkeeperPresent, portrait } from '../systems/npcs';
import { NPC_BY_ID } from '../data/npcs';
import { TOOL_NAMES } from '../systems/actions';
import { level } from '../systems/skills';
import { houseFor, buildingCapacity, buyAnimal } from '../systems/animals';
import { todayFestival } from '../systems/festivals';

function priceOf(e: ShopEntry) {
  if (e.price) return e.price;
  const d = ITEMS[e.id];
  if (d?.seedOf && CROP_BY_ID[d.seedOf]) return CROP_BY_ID[d.seedOf].seedPrice;
  return (d?.price || 0) * 2;
}
function reqOk(req?: string) {
  if (!req) return true;
  const s = getState();
  if (req === 'year2') return s.time.year >= 2;
  if (req.startsWith('mine')) return s.mineDeepest >= +req.slice(4);
  if (req.startsWith('hall:')) return s.hallDone.includes(req.slice(5));
  return true;
}

export function openShop(id: string, entriesOverride?: ShopEntry[], title?: string) {
  const s = getState();
  const shop = SHOPS[id];
  if (!shop) return;
  if (!entriesOverride && shop.npc && !isShopkeeperPresent(shop.npc, G.world.def.id)) {
    G.toast(`${NPC_BY_ID[shop.npc]?.name.split(' ')[0] || 'Ninguém'} não está no balcão agora.`); return;
  }
  const ui = G.ui;
  const w = ui.windowEl(title || shop.name); w.style.width = 'min(62em, 96vw)';
  const top = el('div', 'flex', '', w); top.style.alignItems = 'center';
  if (shop.npc) { const img = el('img', '', '', top); img.src = portrait(shop.npc, 'happy').toDataURL(); img.style.width = '4.5em'; img.style.imageRendering = 'pixelated'; img.style.border = '3px solid #5c3a1e'; }
  el('div', 'letter', shop.greeting, top).style.flex = '1';
  const money = el('div', 'frame-dark', '', top); money.style.minWidth = '8em'; money.style.textAlign = 'right';
  const body = el('div', 'flex', '', w); body.style.alignItems = 'flex-start'; body.style.marginTop = '6px';
  const listEl = el('div', 'list', '', body); listEl.style.flex = '1.3'; listEl.style.maxHeight = '52vh'; listEl.style.overflow = 'auto';
  const sellEl = el('div', 'col', '', body); sellEl.style.flex = '1';
  const entries = (entriesOverride || shop.items).filter(e => (!e.seasons || e.seasons.includes(s.time.season)) && reqOk(e.req));
  const draw = () => {
    money.innerHTML = `${fmtMoney(s.player.money)} ◉`;
    listEl.innerHTML = '';
    for (const e of entries) {
      if (e.special === 'backpack1' && s.invSize >= 36) continue;
      if (e.special === 'backpack2' && s.invSize !== 36) continue;
      if (e.special === 'rod1' && (s.flags.rod1 || s.flags.rod2)) continue;
      if (e.special === 'rod2' && s.flags.rod2) continue;
      const p = priceOf(e);
      const row = el('div', 'rowi' + (s.player.money < p && !['tools', 'build', 'house', 'animals', 'collection'].includes(e.special || '') ? ' off' : ''), '', listEl);
      if (e.special) {
        row.appendChild(iconImg(e.special.startsWith('rod') ? 'vara' : e.special.startsWith('back') ? 'bau' : e.special === 'tools' ? 'picareta' : e.special === 'build' ? 'madeira' : e.special === 'house' ? 'mesa' : e.special === 'animals' ? 'ovo' : 'quadro', '2.2em'));
        el('span', '', `${e.label}<br><span class="muted">${e.desc || ''}</span>`, row);
        if (p) el('span', 'price', fmtMoney(p), row);
        row.onclick = () => special(e, draw);
        continue;
      }
      row.appendChild(iconImg(e.id, '2.2em'));
      el('span', '', ITEMS[e.id].name, row);
      el('span', 'price', fmtMoney(p), row);
      row.addEventListener('mousemove', ev => tooltipFor({ id: e.id, qty: 1 }, ev));
      row.addEventListener('mouseleave', () => hideTip());
      row.onclick = (ev) => {
        const n = ev.shiftKey ? 5 : 1;
        if (s.player.money < p * n) { G.toast('Dinheiro insuficiente.'); sfx('error'); return; }
        if (!canFit({ id: e.id, qty: n })) { G.toast('Inventário cheio.'); sfx('error'); return; }
        s.player.money -= p * n; addItem({ id: e.id, qty: n }, false); sfx('coin'); draw();
      };
    }
    sellEl.innerHTML = '';
    if (shop.buys?.length) {
      el('div', 'muted', 'Vender (clique: pilha · Shift: 1 unidade)', sellEl);
      const g = el('div', 'grid', '', sellEl); g.style.gridTemplateColumns = 'repeat(6, auto)';
      for (let i = 0; i < s.invSize; i++) {
        const st = s.inventory[i];
        const ok = st && shop.buys.includes(ITEMS[st.id].cat) && sellPrice(st) > 0;
        g.appendChild(slotEl(st, { dim: !!st && !ok, onClick: (ev) => { if (!ok) return; const take = removeAt(i, ev.shiftKey ? 1 : st!.qty)!; const v = sellPrice(take) * take.qty; s.player.money += v; s.player.totalEarned += v; sfx('coin'); G.toast(`Vendeu ${itemName(take.id, take.ref)} x${take.qty} por ${v}`); draw(); } }));
      }
    }
  };
  draw();
  ui.openModal(w);
}

function special(e: ShopEntry, redraw: () => void) {
  const s = getState();
  const ui = G.ui;
  switch (e.special) {
    case 'backpack1': case 'backpack2': {
      if (s.player.money < e.price) { G.toast('Dinheiro insuficiente.'); return; }
      s.player.money -= e.price; s.invSize = e.special === 'backpack1' ? 36 : 48; sfx('levelup'); G.toast('Mochila ampliada!'); redraw(); return;
    }
    case 'rod1': case 'rod2': {
      const need = e.special === 'rod1' ? 2 : 6;
      if (level('fishing') < need) { G.toast(`Precisa de Pesca nível ${need}.`); return; }
      if (s.player.money < e.price) { G.toast('Dinheiro insuficiente.'); return; }
      s.player.money -= e.price; s.flags[e.special] = true; sfx('levelup'); G.toast(e.label + ' adquirida! Sua vara foi melhorada.'); redraw(); return;
    }
    case 'tools': return toolUpgrades();
    case 'build': return buildMenu();
    case 'house': return houseMenu();
    case 'animals': return animalMenu();
    case 'collection': { const w = ui.windowEl('Coleções do Arquivo'); w.style.width = 'min(60em, 96vw)'; openCollections(w); ui.openModal(w); return; }
  }
}

function toolUpgrades() {
  const s = getState();
  const ui = G.ui;
  const w = ui.windowEl('Melhorar ferramentas'); w.style.maxWidth = '40em';
  if (s.toolUpgrade) { el('p', '', `Estou trabalhando na sua ferramenta. Fica pronta em ${s.toolUpgrade.daysLeft} dia(s).`, w); ui.openModal(w); return; }
  const costs = [[2000, 'bar_cobre'], [5000, 'bar_ferro'], [10000, 'bar_ouro'], [25000, 'bar_astral']] as [number, string][];
  const l = el('div', 'list', '', w);
  for (const [t, name, icon] of [['hoe', 'Enxada', 'enxada'], ['axe', 'Machado', 'machado'], ['pick', 'Picareta', 'picareta'], ['can', 'Regador', 'regador']] as [string, string, string][]) {
    const lv = s.tools[t];
    const row = el('div', 'rowi', '', l); row.appendChild(iconImg(icon, '2.2em'));
    if (lv >= 4) { el('span', '', `${name} ${TOOL_NAMES[lv]} <span class="muted">(máximo)</span>`, row); continue; }
    const [cost, bar] = costs[lv];
    el('span', '', `${name} ${TOOL_NAMES[lv]} → <b>${TOOL_NAMES[lv + 1]}</b><br><span class="muted">${fmtMoney(cost)} moedas + 5 ${ITEMS[bar].name} (você tem ${countItem(bar)})</span>`, row);
    row.onclick = () => {
      if (s.player.money < cost || countItem(bar) < 5) { G.toast('Faltam moedas ou barras.'); sfx('error'); return; }
      ui.confirm(`Deixar ${name.toLowerCase()} com o Otávio por 2 dias?`, () => {
        s.player.money -= cost; removeItem(bar, 5);
        s.toolUpgrade = { tool: t, daysLeft: 2, level: lv + 1 };
        G.ui.dialogue('otavio', 'Hm. Bom metal. Volta em dois dias. E não me apresse.', 'neutral');
      });
    };
  }
  el('p', 'muted', 'Ferramentas melhores gastam menos energia, quebram objetos mais duros e, com a enxada e o regador, permitem segurar o botão para atingir uma área maior.', w);
  ui.openModal(w);
}

function buildMenu() {
  const s = getState();
  const ui = G.ui;
  const w = ui.windowEl('Construções da Fazenda'); w.style.width = 'min(46em, 96vw)';
  const l = el('div', 'list', '', w);
  for (const b of BUILDS) {
    const target = b.upgradeOf ? s.buildings.find(x => x.type === b.upgradeOf && x.daysLeft <= 0) : null;
    if (b.upgradeOf && !target) continue;
    if (b.id === 'estabulo' && s.buildings.some(x => x.type === 'estabulo')) continue;
    const ok = s.player.money >= b.cost && b.mats.every(([id, n]) => countItem(id) >= n);
    const row = el('div', 'rowi' + (ok ? '' : ' off'), '', l);
    row.appendChild(iconImg(b.id.startsWith('galinheiro') ? 'ovo' : b.id.startsWith('celeiro') ? 'leite' : b.id === 'silo' ? 'feno' : b.id === 'poco' ? 'regador' : 'madeira_dura', '2.2em'));
    el('span', '', `<b>${b.name}</b> <span class="muted">(${b.days} dia${b.days > 1 ? 's' : ''})</span><br><span class="muted">${b.desc}</span><br><span class="muted">${fmtMoney(b.cost)} moedas · ${b.mats.map(([id, n]) => `<span style="color:${countItem(id) >= n ? '#3a6a2a' : '#a83a2a'}">${n} ${ITEMS[id].name}</span>`).join(', ')}</span>`, row);
    row.onclick = () => {
      if (!ok) { G.toast('Faltam moedas ou materiais.'); sfx('error'); return; }
      if (s.buildings.some(x => x.daysLeft > 0)) { G.toast('O Zeca já está com uma obra em andamento.'); return; }
      if (target) {
        ui.confirm(`Ampliar para ${b.name}?`, () => { s.player.money -= b.cost; for (const [id, n] of b.mats) removeItem(id, n); target.type = b.id; target.daysLeft = b.days; ui.dialogue('zeca', 'Pode deixar. Em alguns dias está pronto.', 'happy'); (G as any).refreshFarm?.(); });
        return;
      }
      ui.closeModal(true);
      (G as any).startPlacement(b);
    };
  }
  ui.openModal(w);
}

function houseMenu() {
  const s = getState();
  const ui = G.ui;
  const up = HOUSE_UPGRADES.find(h => h.level === s.houseLevel + 1);
  if (!up) { G.toast('Sua casa já está no tamanho máximo!'); return; }
  if (s.houseUpgradeDays) { G.toast(`A reforma fica pronta em ${s.houseUpgradeDays} dia(s).`); return; }
  ui.confirm(`Reforma da casa: ${up.desc}\nCusto: ${fmtMoney(up.cost)} moedas + ${up.mats.map(([id, n]) => n + ' ' + ITEMS[id].name).join(', ')}. Leva 3 dias. Confirmar?`, () => {
    if (s.player.money < up.cost || !up.mats.every(([id, n]) => countItem(id) >= n)) { G.toast('Faltam moedas ou materiais.'); sfx('error'); return; }
    s.player.money -= up.cost; for (const [id, n] of up.mats) removeItem(id, n);
    s.houseUpgradeDays = 3;
    ui.dialogue('zeca', 'Combinado! Em três dias sua casa vai estar de cara nova.', 'happy');
  });
}

function animalMenu() {
  const s = getState();
  const ui = G.ui;
  const w = ui.windowEl('Animais à venda'); w.style.width = 'min(44em, 96vw)';
  const l = el('div', 'list', '', w);
  for (const a of ANIMALS) {
    const homes = houseFor(a.house).filter(b => (b.type.endsWith('_g') ? 1 : 0) >= a.houseLevel && s.animals.filter(x => x.building === b.id).length < buildingCapacity(b.type));
    const row = el('div', 'rowi' + (homes.length && s.player.money >= a.price ? '' : ' off'), '', l);
    row.appendChild(iconImg(a.produce, '2.2em'));
    el('span', '', `<b>${a.name}</b><br><span class="muted">Produz ${ITEMS[a.produce].name}${a.every > 1 ? ' a cada ' + a.every + ' dias' : ' todo dia'}. Precisa de ${a.house === 'coop' ? 'galinheiro' : 'celeiro'}${a.houseLevel ? ' grande' : ''}.</span>`, row);
    el('span', 'price', fmtMoney(a.price), row);
    row.onclick = () => {
      if (!homes.length) { G.toast(`Você precisa de um ${a.house === 'coop' ? 'galinheiro' : 'celeiro'}${a.houseLevel ? ' grande' : ''} com espaço.`); return; }
      if (s.player.money < a.price) { G.toast('Dinheiro insuficiente.'); return; }
      const names = ['Pipoca', 'Mimosa', 'Estrela', 'Cacau', 'Paçoca', 'Fubá', 'Nuvem', 'Jabuticaba', 'Canjica', 'Bolota', 'Quindim', 'Pitanga'];
      const name = names[(s.animals.length * 7 + a.id.length) % names.length];
      const err = buyAnimal(a.id, homes[0].id, name.slice(0, 16));
      if (err) G.toast(err); else { sfx('coin'); G.ui.dialogue('dora', `${name} vai adorar a fazenda! Cuide bem, viu? Alimente e faça carinho todo dia.`, 'happy'); }
    };
  }
  ui.openModal(w);
}

export function openCollections(body: HTMLElement) {
  const s = getState();
  el('h3', '', `Peixes (${Object.keys(s.collection.fish).length}/${FISH.length})`, body);
  const g = el('div', 'grid', '', body); g.style.gridTemplateColumns = 'repeat(auto-fill, 3.4em)';
  for (const f of FISH) {
    const got = s.collection.fish[f.id];
    const sl = slotEl({ id: f.id, qty: 1 }, { dim: !got, extraTip: got ? `<div class="muted">Pescado ${got}x · ${f.zones.join(', ')} · ${f.seasons.map(x => SEASON_NAMES[x]).join('/')} · ${f.weather === 'any' ? 'qualquer clima' : f.weather}</div>` : '<div class="muted">Ainda não pescado.</div>' });
    if (!got) { const img = sl.querySelector('img'); if (img) img.style.filter = 'brightness(0)'; }
    g.appendChild(sl);
  }
  const shipped = Object.keys(s.collection.shipped);
  el('h3', '', `Itens enviados (${shipped.length} tipos)`, body);
  const g2 = el('div', 'grid', '', body); g2.style.gridTemplateColumns = 'repeat(auto-fill, 3.4em)';
  for (const id of shipped) g2.appendChild(slotEl({ id, qty: s.collection.shipped[id] }));
  const mins = Object.keys(s.collection.minerals);
  el('h3', '', `Minerais e metais encontrados (${mins.length})`, body);
  const g3 = el('div', 'grid', '', body); g3.style.gridTemplateColumns = 'repeat(auto-fill, 3.4em)';
  for (const id of mins) g3.appendChild(slotEl({ id, qty: s.collection.minerals[id] }));
  el('h3', '', `Receitas cozinhadas (${Object.keys(s.collection.cooked).length}/${COOKING.length})`, body);
  const g4 = el('div', 'grid', '', body); g4.style.gridTemplateColumns = 'repeat(auto-fill, 3.4em)';
  for (const r of COOKING) { const sl = slotEl({ id: r.id, qty: 1 }, { dim: !s.collection.cooked[r.id] }); g4.appendChild(sl); }
}

/** Comerciante itinerante (sextas e domingos após restaurar o altar do artesanato). */
export function merchantStock(): ShopEntry[] {
  const s = getState();
  const seed = s.time.day + s.time.season * 31 + s.time.year * 131;
  const pool = [...MERCHANT_POOL];
  const out: ShopEntry[] = [];
  for (let i = 0; i < 7 && pool.length; i++) { const j = (seed * (i + 7) * 2654435761 >>> 0) % pool.length; const id = pool.splice(j, 1)[0]; if (!ITEMS[id]) continue; const d = ITEMS[id]; const base = d.seedOf && CROP_BY_ID[d.seedOf] ? CROP_BY_ID[d.seedOf].seedPrice : Math.max(50, d.price); out.push({ id, price: Math.round(base * (2 + ((seed + i) % 3) * 0.5)) }); }
  return out;
}
export function festivalShop() { const f = todayFestival(); return f?.shop; }
export { FESTIVALS };
