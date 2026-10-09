// Passagem do tempo, clima, dormir/desmaiar e processamento da noite.
import { G } from '../core/ctx';
import { getState, ItemStack } from '../state/state';
import { sellPrice, addItem } from './inventory';
import { ITEMS, itemName } from '../data/items';
import { growAll, rainWater, sprinklers, growTrees, crows, regrowDebris, spawnForage } from './farming';
import { dailyMachines } from './machines';
import { animalsOvernight } from './animals';
import { dailyReset, npcState, NPCManager } from './npcs';
import { expireQuests, makeBoardPosting, checkMail, evaluateQuests, questEvent } from './quests';
import { FESTIVALS, BUILDS } from '../data/game';
import { NPCS } from '../data/npcs';
import { invalidateWorld, dropMineCache } from '../world/world';
import { TOOL_NAMES } from './actions';
import { saveGame } from '../state/save';

export const TICK_SECONDS = 7;

export function tickClock(dt: number) {
  const s = getState();
  G.clockAcc += dt;
  while (G.clockAcc >= TICK_SECONDS) {
    G.clockAcc -= TICK_SECONDS;
    s.time.minutes += 10;
    onTick10();
    if (s.time.minutes >= 1560) { G.clockAcc = 0; G.toast('Você desmaiou de cansaço...', undefined, '#ff8a6a'); G.sleep(true); return; }
  }
}

function onTick10() {
  const s = getState();
  (G.npcs as NPCManager).tick10();
  if (s.time.minutes === 1440) G.toast('Já é meia-noite. Hora de voltar para casa!', undefined, '#a8c0ff');
  if (s.time.minutes === 1500) G.toast('Você está ficando muito cansado...', undefined, '#ff8a6a');
  G.ui?.onTick?.();
}

export function rollWeather(season: number, day: number): GameState['weather']['today'] {
  if (day === 1) return 'sol';
  if (FESTIVALS.some(f => f.season === season && f.day === day)) return 'sol';
  const r = Math.random();
  if (season === 0) return r < 0.03 && day > 5 ? 'tempestade' : r < 0.22 ? 'chuva' : 'sol';
  if (season === 1) return r < 0.08 ? 'tempestade' : r < 0.2 ? 'chuva' : 'sol';
  if (season === 2) return r < 0.02 ? 'tempestade' : r < 0.2 ? 'chuva' : r < 0.35 ? 'vento' : 'sol';
  return r < 0.3 ? 'neve' : 'sol';
}
type GameState = ReturnType<typeof getState>;

export interface NightReport { shipped: { item: ItemStack; value: number }[]; total: number; byCat: Record<string, number>; events: string[]; fainted: boolean }

/** Processa tudo que acontece entre um dia e outro. */
export function processNight(fainted: boolean): NightReport {
  const s = getState();
  const events: string[] = [];
  // ---- vendas ----
  const shipped: NightReport['shipped'] = [];
  const byCat: Record<string, number> = {};
  let total = 0;
  let crops = 0;
  for (const it of s.shipping) {
    const v = sellPrice(it) * it.qty;
    shipped.push({ item: it, value: v });
    total += v;
    const c = ITEMS[it.id]?.cat || 'outros';
    const group = ['crop', 'fruit', 'flower', 'seed'].includes(c) ? 'Lavoura' : ['forage'].includes(c) ? 'Coleta' : c === 'fish' ? 'Pesca' : ['ore', 'bar', 'gem', 'monster'].includes(c) ? 'Mineração' : c === 'animal' ? 'Animais' : c === 'artisan' ? 'Artesanato' : 'Outros';
    byCat[group] = (byCat[group] || 0) + v;
    s.collection.shipped[it.id] = (s.collection.shipped[it.id] || 0) + it.qty;
    if (['crop', 'fruit', 'flower'].includes(c)) crops += it.qty;
  }
  s.shipping = [];
  s.player.money += total; s.player.totalEarned += total;
  s.lastShipped = { items: shipped.map(x => x.item), total };
  if (crops) questEvent('ship_crop', crops);
  // ---- desmaio ----
  if (fainted) {
    const loss = Math.min(1000, Math.floor(s.player.money * 0.1));
    s.player.money -= loss;
    if (loss) events.push(`Você desmaiou e alguém te levou para casa. Perdeu ${loss} moedas.`);
    s.stats.faints = (s.stats.faints || 0) + 1;
  }
  // ---- energia ----
  const late = Math.max(0, s.time.minutes - 1440);
  let energyMult = fainted ? 0.5 : late > 0 ? Math.max(0.5, 1 - late / 240) : 1;
  s.player.energy = Math.round(s.player.maxEnergy * energyMult);
  s.player.exhausted = false;
  s.player.hp = s.player.maxHp;
  // ---- avança a data ----
  s.time.day++;
  let seasonChanged = false;
  if (s.time.day > 28) { s.time.day = 1; s.time.season++; seasonChanged = true; if (s.time.season > 3) { s.time.season = 0; s.time.year++; } }
  s.time.minutes = 360;
  s.weather.today = s.weather.tomorrow;
  s.weather.tomorrow = rollWeather(s.time.season, s.time.day + 1 > 28 ? 1 : s.time.day + 1);
  if (s.time.season === 3 && s.weather.today === 'chuva') s.weather.today = 'neve';
  if (s.time.season !== 3 && s.weather.today === 'neve') s.weather.today = 'chuva';
  s.luck = (Math.random() - 0.5) * 0.2;
  // ---- mundo ----
  growAll(seasonChanged);
  if (s.weather.today === 'chuva' || s.weather.today === 'tempestade') rainWater();
  sprinklers();
  growTrees();
  const eaten = crows();
  if (eaten) events.push(`Corvos comeram ${eaten} planta(s) da sua fazenda. Um espantalho ajudaria!`);
  if (seasonChanged) events.push('Começou uma nova estação! Plantas fora de época murcharam.');
  regrowDebris();
  spawnForage();
  dailyMachines();
  animalsOvernight();
  // ---- construções ----
  for (const b of s.buildings) if (b.daysLeft > 0) { b.daysLeft--; if (b.daysLeft === 0) { const d = BUILDS.find(x => x.id === b.type)!; events.push(`${d.name} concluído! Obrigado pela paciência. — Zeca`); invalidateWorld('fazenda'); } }
  if (s.houseUpgradeDays && s.houseUpgradeDays > 0) { s.houseUpgradeDays--; if (s.houseUpgradeDays === 0) { s.houseLevel++; events.push('A reforma da sua casa ficou pronta!'); invalidateWorld('casa'); } }
  if (s.toolUpgrade) { s.toolUpgrade.daysLeft--; if (s.toolUpgrade.daysLeft <= 0) { s.tools[s.toolUpgrade.tool] = s.toolUpgrade.level; const nm = { hoe: 'Enxada', axe: 'Machado', pick: 'Picareta', can: 'Regador', scythe: 'Foice', rod: 'Vara' }[s.toolUpgrade.tool]; events.push(`${nm} ${TOOL_NAMES[s.toolUpgrade.level]} pronta! Otávio a deixou na sua caixa de correio.`); s.toolUpgrade = undefined; questEvent('upgrade'); } }
  // ---- moradores ----
  dailyReset();
  for (const n of NPCS) {
    const st = npcState(n.id);
    if (st.engaged !== undefined) { st.engaged--; if (st.engaged <= 0) { delete st.engaged; st.married = true; s.spouse = n.id; s.flags.weddingToday = n.id; } }
  }
  // ---- missões e correio ----
  const expired = expireQuests();
  if (expired) events.push(`${expired} pedido(s) do mural expiraram.`);
  if (!s.flags.board || Math.random() < 0.5) makeBoardPosting();
  checkMail();
  evaluateQuests();
  dropMineCache();
  // cavalo volta para o estábulo
  s.player.horse = false; s.flags.horsePos = null;
  // posição
  s.player.map = 'casa'; s.player.x = 3 * 16 + 8; s.player.y = 7 * 16 + 12; s.player.facing = 'down';
  return { shipped, total, byCat, events, fainted };
}

export function shipItem(st: ItemStack) {
  const s = getState();
  const ex = s.shipping.find(x => x.id === st.id && (x.q || 0) === (st.q || 0) && (x.ref || '') === (st.ref || ''));
  if (ex) ex.qty += st.qty; else s.shipping.push({ ...st });
}

export async function autosave(slot: number) { return saveGame(getState(), slot); }
export { itemName, addItem };
