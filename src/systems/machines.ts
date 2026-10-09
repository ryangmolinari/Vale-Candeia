// Máquinas de processamento, extrator de seiva, fabricação e cozinha.
import { G } from '../core/ctx';
import { getState, absMinutes, ItemStack, WObj, MapState } from '../state/state';
import { MACHINES, MACHINE_HINT, RECIPES, COOKING, Recipe } from '../data/game';
import { ITEMS, itemName } from '../data/items';
import { matches, countItem, removeItem, addItem, canFit, hasIngredients } from './inventory';
import { sfx } from '../audio/audio';
import { level } from './skills';
import { questEvent } from './quests';

type Placed = Extract<WObj, { t: 'placed' }>;

export function isMachine(id: string) { return !!MACHINES[id] || id === 'abelheira'; }
export function machineReady(o: Placed) { return !!o.machine?.output && (o.machine.readyAt || 0) <= absMinutes(getState()); }
export function machineWorking(o: Placed) { return !!o.machine?.output && (o.machine.readyAt || 0) > absMinutes(getState()); }

/** Tenta inserir o item segurado. Retorna mensagem (ou null se ok). */
export function insert(o: Placed, held: ItemStack | null): string | null {
  const rules = MACHINES[o.id];
  if (!rules) return o.id === 'abelheira' ? 'As abelhas trabalham sozinhas.' : null;
  if (o.machine?.output) return machineReady(o) ? null : 'Ainda processando...';
  if (!held) return MACHINE_HINT[o.id] || 'Coloque um item.';
  const rule = rules.find(r => matches(held, r.input) && !(r.input.startsWith('cat:') && held.ref));
  if (!rule) return 'Isso não serve aqui. ' + (MACHINE_HINT[o.id] || '');
  const need = rule.inQty || 1;
  if (countItem(held.id) < need) return `Precisa de ${need}x ${ITEMS[held.id].name}.`;
  if (rule.extra && countItem(rule.extra[0]) < rule.extra[1]) return `Precisa de ${rule.extra[1]}x ${ITEMS[rule.extra[0]].name}.`;
  removeItem(held.id, need);
  if (rule.extra) removeItem(rule.extra[0], rule.extra[1]);
  const out = typeof rule.output === 'function' ? rule.output(held.id) : { id: rule.output };
  if (!ITEMS[out.id]) return 'Isso não serve aqui.';
  let q = 0;
  if (o.id === 'barril' && out.id === 'vinho') q = held.q || 0;
  if (['prensa', 'maq_maionese', 'tear'].includes(o.id)) q = held.q || 0;
  o.machine = { input: { id: held.id, qty: need }, output: { id: out.id, qty: rule.outQty || 1, ref: (out as any).ref, q }, readyAt: absMinutes(getState()) + rule.minutes };
  sfx('machine');
  return null;
}

export function collect(o: Placed): boolean {
  if (!machineReady(o)) return false;
  const out = o.machine!.output!;
  if (!canFit(out)) { G.toast('Inventário cheio.'); return false; }
  addItem({ ...out });
  delete o.machine;
  sfx('pickup');
  const s = getState();
  s.stats.artisan = (s.stats.artisan || 0) + 1;
  if (o.id === 'abelheira') startBees(o);
  return true;
}

export function startBees(o: Placed) {
  const s = getState();
  if (s.time.season === 3) return;
  o.machine = { output: { id: 'mel', qty: 1 }, readyAt: absMinutes(s) + 4 * 1440 - 60 };
}

/** Rotinas diárias: abelheiras e extratores. */
export function dailyMachines() {
  const s = getState();
  for (const ms of Object.values(s.maps) as MapState[]) {
    for (const o of Object.values(ms.objects)) {
      if (o.t === 'placed' && o.id === 'abelheira' && !o.machine) startBees(o);
      if (o.t === 'tree' && o.tapper && !o.tapper.output) setTapper(o);
    }
  }
}
export function setTapper(o: Extract<WObj, { t: 'tree' }>) {
  const s = getState();
  const prod = o.kind === 'bordo' ? ['xarope', 7] : o.kind === 'pinheiro' ? ['resina', 5] : ['resina', 7];
  o.tapper = { output: { id: prod[0] as string, qty: 1 }, readyAt: absMinutes(s) + (prod[1] as number) * 1440 - 60 };
}

export function statusText(o: Placed) {
  if (!o.machine?.output) return MACHINE_HINT[o.id] || '';
  const left = (o.machine.readyAt || 0) - absMinutes(getState());
  if (left <= 0) return 'Pronto: ' + itemName(o.machine.output.id, o.machine.output.ref);
  const h = Math.ceil(left / 60);
  return `${itemName(o.machine.output.id, o.machine.output.ref)} — falta${h > 1 ? 'm' : ''} ${h >= 48 ? Math.ceil(h / 24) + ' dias' : h + 'h'}`;
}

// ---------- fabricação ----------
export function recipeUnlocked(r: Recipe, kind: 'craft' | 'cook' = 'craft') {
  const s = getState();
  const known = kind === 'craft' ? s.recipes : s.cooking;
  if (known.includes(r.id)) return true;
  if (r.unlock === 'start') return true;
  const [type, val] = r.unlock.split(':');
  if (type in s.skills && kind === 'craft') return level(type as any) >= +val;
  if (type === 'hall') return s.hallDone.includes(val);
  return false;
}
export function craftableList(kind: 'craft' | 'cook') { return (kind === 'craft' ? RECIPES : COOKING); }

export function craft(r: Recipe, kind: 'craft' | 'cook' = 'craft'): string | null {
  if (!recipeUnlocked(r, kind)) return 'Receita desconhecida.';
  if (!hasIngredients(r.ing)) return 'Faltam ingredientes.';
  const out = { id: r.id, qty: r.qty };
  if (!canFit(out)) return 'Inventário cheio.';
  for (const [id, n] of r.ing) removeItem(id, n);
  addItem(out);
  sfx(kind === 'cook' ? 'eat' : 'craft');
  const s = getState();
  if (kind === 'cook') { s.collection.cooked[r.id] = (s.collection.cooked[r.id] || 0) + 1; questEvent('cook'); }
  else { s.stats.crafted = (s.stats.crafted || 0) + 1; questEvent('craft:' + r.id); }
  return null;
}
