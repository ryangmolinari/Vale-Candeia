// Helpers de DOM e estilos da interface rústica (madeira + pergaminho).
import { makeCanvas, shade } from '../core/util';
import { iconURL } from '../art/icons';
import { ItemStack } from '../state/state';
import { ITEMS, itemName, CAT_NAMES, QUALITY_NAMES } from '../data/items';
import { sellPrice } from '../systems/inventory';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = '', parent?: HTMLElement): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}

function frameImage(kind: 'wood' | 'parch' | 'dark' | 'slot' | 'btn') {
  const { c, ctx } = makeCanvas(24, 24);
  const p = (x: number, y: number, w: number, h: number, col: string) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };
  if (kind === 'wood' || kind === 'dark') {
    const base = kind === 'wood' ? '#8a5a32' : '#5a3a22';
    p(1, 0, 22, 24, '#3a2414'); p(0, 1, 24, 22, '#3a2414');
    p(1, 1, 22, 22, base);
    for (let y = 2; y < 22; y += 3) p(1, y, 22, 1, shade(base, -0.12));
    p(1, 1, 22, 1, shade(base, 0.25)); p(1, 1, 1, 22, shade(base, 0.15));
    p(5, 5, 14, 14, '#3a2414');
    p(6, 6, 12, 12, kind === 'wood' ? '#f4e2b8' : '#2a1a10');
    p(6, 6, 12, 1, kind === 'wood' ? '#d9bf8a' : '#1a100a');
    for (const [x, y] of [[2, 2], [21, 2], [2, 21], [21, 21]]) { p(x, y, 1, 1, '#d8b070'); }
  } else if (kind === 'parch') {
    p(0, 0, 24, 24, '#d9bf8a'); p(1, 1, 22, 22, '#f4e2b8'); p(2, 2, 20, 20, '#f8ead0');
  } else if (kind === 'slot') {
    p(0, 0, 24, 24, '#a8784a'); p(1, 1, 22, 22, '#c89a62'); p(2, 2, 20, 20, '#e8c88a'); p(2, 2, 20, 2, '#b88a52'); p(2, 2, 2, 20, '#b88a52');
  } else {
    p(1, 0, 22, 24, '#3a2414'); p(0, 1, 24, 22, '#3a2414'); p(1, 1, 22, 21, '#c8843a'); p(1, 1, 22, 2, '#e8a85a'); p(1, 19, 22, 3, '#8a5a22');
  }
  return c.toDataURL();
}

export function injectStyles() {
  const wood = frameImage('wood'), dark = frameImage('dark'), slot = frameImage('slot'), btn = frameImage('btn');
  const css = `
  :root { --ink:#4a2e1a; --parch:#f4e2b8; --wood:#8a5a32; --gold:#f8d86a; }
  html, body { margin:0; padding:0; overflow:hidden; background:#120c0a; font-family:'Pixelify Sans', 'Trebuchet MS', monospace; color:var(--ink); user-select:none; -webkit-user-select:none; }
  canvas#game { position:fixed; inset:0; image-rendering:pixelated; image-rendering:crisp-edges; cursor:none; }
  #ui { position:fixed; inset:0; pointer-events:none; font-size:var(--fs,18px); }
  #ui * { box-sizing:border-box; }
  .pe { pointer-events:auto; }
  .frame { border:24px solid transparent; border-image:url(${wood}) 8 fill / 24px stretch; image-rendering:pixelated; padding:4px 8px; }
  .frame-dark { border:24px solid transparent; border-image:url(${dark}) 8 fill / 24px stretch; image-rendering:pixelated; color:#f4e2b8; padding:2px 6px; }
  .btn { border:15px solid transparent; border-image:url(${btn}) 8 fill / 15px stretch; image-rendering:pixelated; color:#fff8e0; font-family:inherit; font-size:0.85em; padding:0 6px; cursor:pointer; text-shadow:1px 1px 0 #5a3412; background:none; line-height:1; min-height:42px; pointer-events:auto; }
  .btn:hover { filter:brightness(1.12); } .btn:active { transform:translateY(2px); } .btn[disabled] { filter:grayscale(0.8) brightness(0.8); cursor:default; }
  .slot { width:3.1em; height:3.1em; border:9px solid transparent; border-image:url(${slot}) 8 fill / 9px stretch; image-rendering:pixelated; position:relative; display:inline-flex; align-items:center; justify-content:center; cursor:pointer; pointer-events:auto; vertical-align:top; }
  .slot img { width:2.4em; height:2.4em; image-rendering:pixelated; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); }
  .slot .q { position:absolute; right:-6px; bottom:-6px; font-size:0.62em; color:#fff; text-shadow:1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000; }
  .slot .st { position:absolute; left:-7px; bottom:-8px; font-size:0.85em; }
  .slot.sel { outline:3px solid #f8e04a; outline-offset:2px; }
  .slot.hl { filter:brightness(1.15); }
  .slot.grab { opacity:0.4; }
  .slot .num { position:absolute; left:-5px; top:-7px; font-size:0.55em; color:#5a3a20; }
  #hud-clock { position:absolute; right:12px; top:10px; min-width:12em; text-align:right; pointer-events:auto; }
  #hud-clock .row { display:flex; justify-content:space-between; align-items:center; gap:0.5em; white-space:nowrap; }
  #hud-clock .date { font-size:1em; } #hud-clock .time { font-size:1.25em; } #hud-clock .money { font-size:1.1em; color:#6a3a10; background:#f8ead0; border:2px solid #b88a52; padding:0 6px; margin-top:4px; text-align:right; letter-spacing:1px; }
  #hud-bars { position:absolute; right:14px; bottom:14px; display:flex; gap:8px; align-items:flex-end; }
  .vbar { width:30px; height:180px; border:4px solid #3a2414; background:#2a1a10; position:relative; box-shadow:0 0 0 3px #8a5a32, 0 0 0 5px #3a2414; }
  .vbar > div { position:absolute; left:0; right:0; bottom:0; transition:height .25s; }
  .vbar .lbl { position:absolute; top:-1.5em; left:50%; transform:translateX(-50%); font-size:0.8em; color:#fff8e0; text-shadow:2px 2px 0 #3a2414; font-weight:bold; }
  #hotbar { position:absolute; left:50%; bottom:8px; transform:translateX(-50%); display:flex; gap:2px; padding:2px 6px; }
  #toasts { position:absolute; left:14px; bottom:6.5em; display:flex; flex-direction:column; gap:6px; align-items:flex-start; max-width:40vw; }
  .toast { padding:4px 10px; font-size:0.85em; animation:tin .25s ease-out; display:flex; gap:8px; align-items:center; }
  .toast img { width:2em; height:2em; image-rendering:pixelated; }
  @keyframes tin { from { transform:translateX(-30px); opacity:0 } to { transform:none; opacity:1 } }
  #dialogue { position:absolute; left:50%; bottom:1.2em; transform:translateX(-50%); width:min(58em, 94vw); min-height:9.5em; display:flex; gap:12px; pointer-events:auto; cursor:pointer; }
  #dialogue .txt { flex:1; font-size:1.05em; line-height:1.45; padding:4px; white-space:pre-wrap; }
  #dialogue .por { display:flex; flex-direction:column; align-items:center; gap:4px; }
  #dialogue .por canvas, #dialogue .por img { width:7.5em; height:7.5em; image-rendering:pixelated; border:3px solid #5c3a1e; }
  #dialogue .name { background:#8a5a32; color:#fff8e0; padding:2px 10px; border:2px solid #3a2414; font-size:0.9em; }
  #dialogue .more { position:absolute; right:1.4em; bottom:0.8em; animation:bob .6s infinite alternate; }
  @keyframes bob { to { transform:translateY(4px) } }
  .modal-back { position:absolute; inset:0; background:rgba(20,10,5,0.45); pointer-events:auto; display:flex; align-items:center; justify-content:center; }
  .window { max-width:96vw; max-height:94vh; overflow:auto; position:relative; }
  .window h2 { margin:0 0 6px; font-size:1.25em; text-align:center; color:#5a3412; }
  .window h3 { margin:6px 0 4px; font-size:1em; color:#6a3a10; }
  .tabs { display:flex; gap:2px; justify-content:center; margin-bottom:4px; flex-wrap:wrap; }
  .tab { padding:4px 10px; background:#c8945a; border:3px solid #5c3a1e; cursor:pointer; color:#3a2414; font-size:0.85em; }
  .tab.on { background:#f4e2b8; border-bottom-color:#f4e2b8; }
  .grid { display:grid; gap:3px; }
  .list { display:flex; flex-direction:column; gap:3px; }
  .rowi { display:flex; align-items:center; gap:8px; padding:3px 6px; background:#f8ead0; border:2px solid #d9bf8a; cursor:pointer; }
  .rowi:hover { background:#fff4dc; border-color:#b88a52; } .rowi.off { opacity:0.55; }
  .rowi img { width:2.2em; height:2.2em; image-rendering:pixelated; }
  .rowi .price { margin-left:auto; color:#8a5a10; white-space:nowrap; }
  #tooltip { position:fixed; pointer-events:none; z-index:50; max-width:20em; font-size:0.85em; display:none; }
  #tooltip b { display:block; font-size:1.05em; } #tooltip .cat { color:#8a6a4a; font-size:0.85em; } #tooltip .desc { margin-top:3px; }
  .x { position:absolute; right:2px; top:-2px; cursor:pointer; font-size:1.3em; color:#5a3412; pointer-events:auto; background:none; border:none; font-family:inherit; }
  .muted { color:#8a6a4a; font-size:0.85em; }
  .hearts { color:#e85a7a; letter-spacing:1px; font-size:0.9em; } .hearts .e { color:#c8b090; }
  .skillbar { display:inline-flex; gap:2px; } .skillbar i { width:12px; height:14px; background:#c8b090; border:1px solid #8a6a4a; display:inline-block; } .skillbar i.on { background:#6ab84a; }
  .title-screen { position:absolute; inset:0; pointer-events:auto; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; }
  .logo { font-size:4.2em; color:#fff4d0; text-shadow:4px 4px 0 #6a3a12, 8px 8px 0 #2a1408; letter-spacing:2px; text-align:center; line-height:1; }
  .logo small { display:block; font-size:0.32em; color:#f8d86a; letter-spacing:6px; margin-top:8px; text-shadow:2px 2px 0 #2a1408; }
  input.txt { font-family:inherit; font-size:1em; padding:4px 8px; border:3px solid #8a5a32; background:#fff8e8; color:#3a2414; width:100%; pointer-events:auto; }
  .swatches { display:flex; gap:4px; flex-wrap:wrap; } .sw { width:1.6em; height:1.6em; border:3px solid #5c3a1e; cursor:pointer; } .sw.on { outline:3px solid #f8e04a; }
  .opt { display:flex; gap:4px; flex-wrap:wrap; } .opt button { font-family:inherit; font-size:0.8em; background:#f8ead0; border:2px solid #b88a52; cursor:pointer; padding:3px 7px; color:#3a2414; } .opt button.on { background:#8a5a32; color:#fff8e0; }
  .summary-row { display:flex; justify-content:space-between; gap:20px; padding:2px 0; border-bottom:1px dashed #d9bf8a; }
  .fade-black { position:absolute; inset:0; background:#000; pointer-events:auto; transition:opacity .6s; }
  .cursor { position:fixed; width:30px; height:30px; pointer-events:none; z-index:60; image-rendering:pixelated; }
  .map-wrap { position:relative; width:min(54em,88vw); aspect-ratio: 1.55; background:#a8c878; border:4px solid #5c3a1e; overflow:hidden; }
  .map-wrap .loc { position:absolute; transform:translate(-50%,-50%); font-size:0.75em; background:#f4e2b8; border:2px solid #5c3a1e; padding:1px 5px; white-space:nowrap; }
  .map-wrap .me { position:absolute; width:16px; height:16px; background:#e83a3a; border:3px solid #fff; border-radius:50%; transform:translate(-50%,-50%); animation:bob .5s infinite alternate; }
  .flex { display:flex; gap:10px; } .col { display:flex; flex-direction:column; gap:6px; } .wrap { flex-wrap:wrap; } .center { justify-content:center; align-items:center; }
  .badge { background:#e85a3a; color:#fff; border-radius:8px; padding:0 6px; font-size:0.7em; margin-left:4px; }
  .letter { background:#fff8e8; border:3px solid #d9bf8a; padding:16px 20px; white-space:pre-wrap; line-height:1.5; max-width:32em; font-size:0.95em; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
}

let tipEl: HTMLDivElement | null = null;
export function tooltipFor(st: ItemStack | null, ev?: MouseEvent, extra = '') {
  if (!tipEl) { tipEl = el('div', 'frame', '', document.body); tipEl.id = 'tooltip'; }
  if (!st || !ev) { tipEl.style.display = 'none'; return; }
  const d = ITEMS[st.id];
  if (!d) return;
  const q = st.q ? ` <span style="color:${['', '#8a9aa8', '#d8a83a', '#a85ad8'][st.q]}">★ ${QUALITY_NAMES[st.q]}</span>` : '';
  const price = sellPrice(st);
  tipEl.innerHTML = `<b>${itemName(st.id, st.ref)}${q}</b><div class="cat">${CAT_NAMES[d.cat]}</div><div class="desc">${d.desc}</div>` +
    (d.energy ? `<div class="desc" style="color:#6a8a2a">+${Math.round(d.energy * (1 + (st.q || 0) * 0.4))} energia${d.hp ? `, +${Math.round(d.hp * (1 + (st.q || 0) * 0.4))} vida` : ''}</div>` : '') +
    (price > 0 ? `<div class="desc" style="color:#8a5a10">Vende por ${price} moedas</div>` : '') + extra;
  tipEl.style.display = 'block';
  const x = Math.min(window.innerWidth - tipEl.offsetWidth - 8, ev.clientX + 18), y = Math.min(window.innerHeight - tipEl.offsetHeight - 8, ev.clientY + 18);
  tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
}
export function hideTip() { tooltipFor(null); }

export function slotEl(st: ItemStack | null, opts: { sel?: boolean; num?: string; onClick?: (e: MouseEvent) => void; onRight?: (e: MouseEvent) => void; extraTip?: string; dim?: boolean } = {}) {
  const s = el('div', 'slot' + (opts.sel ? ' sel' : ''));
  if (st) {
    const img = el('img'); img.src = iconURL(st.id, st.ref); s.appendChild(img);
    if (st.qty > 1) el('span', 'q', String(st.qty), s);
    if (st.q) el('span', 'st', ['', '<span style="color:#c8d0d8">★</span>', '<span style="color:#f8c83a">★</span>', '<span style="color:#c87af8">★</span>'][st.q], s);
    s.addEventListener('mousemove', e => tooltipFor(st, e, opts.extraTip || ''));
    s.addEventListener('mouseleave', () => hideTip());
  }
  if (opts.dim) s.style.opacity = '0.4';
  if (opts.num) el('span', 'num', opts.num, s);
  if (opts.onClick) s.addEventListener('click', e => { e.stopPropagation(); opts.onClick!(e); });
  s.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); opts.onRight?.(e); });
  return s;
}

export function iconImg(id: string, size = '2em', ref?: string) { const i = el('img'); i.src = iconURL(id, ref); i.style.width = size; i.style.height = size; i.style.imageRendering = 'pixelated'; return i; }
