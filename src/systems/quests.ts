// Missões (história, pedidos do mural, caça), cartas e progresso.
import { G } from '../core/ctx';
import { getState, Quest } from '../state/state';
import { STORY, MAIL, REQUEST_ITEMS, HALL, MONSTERS } from '../data/game';
import { NPCS } from '../data/npcs';
import { ITEMS, itemName } from '../data/items';
import { countItem, removeItem, addItem } from './inventory';
import { addFriendship, hearts, npcState } from './npcs';
import { sfx } from '../audio/audio';

export function startStory(id: string) {
  const s = getState();
  if (s.questsDone.includes(id) || s.quests.some(q => q.id === id)) return;
  const sq = STORY.find(q => q.id === id); if (!sq) return;
  s.quests.push({ id, kind: 'story', title: sq.title, desc: sq.desc, reward: sq.reward, progress: 0, target: sq.target, rewardItem: sq.rewardItem });
  G.toast?.('Nova missão: ' + sq.title, undefined, '#f8d86a');
  sfx('quest');
  evaluateQuests();
}

/** Eventos incrementais (plantar, enviar, pescar...). */
export function questEvent(goal: string, n = 1) {
  const s = getState();
  for (const q of s.quests) {
    if (q.done) continue;
    if (q.kind === 'story') { const sq = STORY.find(x => x.id === q.id); if (sq && sq.goal === goal) q.progress = (q.progress || 0) + n; }
    if (q.kind === 'slay' && goal === 'kill:' + q.monster) q.progress = (q.progress || 0) + n;
  }
  evaluateQuests();
}

function computed(goal: string): number | null {
  const s = getState();
  switch (goal) {
    case 'meet': return NPCS.filter(n => s.npcs[n.id]?.met).length;
    case 'hearts3': return NPCS.some(n => hearts(n.id) >= 3) ? 1 : 0;
    case 'rod': return s.flags.rodGiven ? 1 : 0;
    case 'species': return Object.keys(s.collection.fish).length;
    case 'mine': return s.mineDeepest;
    case 'upgrade': return Object.values(s.tools).some(l => l > 0) ? 1 : 0;
    case 'hallset': return Object.keys(s.flags).filter(k => k.startsWith('hallset_') && s.flags[k]).length;
    case 'hallsector': return s.hallDone.length;
    case 'animal': return s.animals.length;
    case 'earned': return s.player.totalEarned;
  }
  return null;
}

export function evaluateQuests() {
  const s = getState();
  for (const q of s.quests) {
    if (q.done) continue;
    if (q.kind === 'story') {
      const sq = STORY.find(x => x.id === q.id)!;
      const c = computed(sq.goal);
      if (c !== null) q.progress = c;
      if ((q.progress || 0) >= (q.target || 1)) completeQuest(q);
    } else if (q.kind === 'slay') {
      if ((q.progress || 0) >= (q.target || 1)) completeQuest(q);
    }
  }
  s.quests = s.quests.filter(q => !q.done);
}

export function completeQuest(q: Quest) {
  const s = getState();
  q.done = true;
  s.questsDone.push(q.id);
  if (q.reward) { s.player.money += q.reward; s.player.totalEarned += q.reward; }
  if (q.rewardItem) addItem({ ...q.rewardItem });
  if (q.npc && q.friendship) addFriendship(q.npc, q.friendship);
  G.toast?.(`Missão concluída: ${q.title}` + (q.reward ? ` (+${q.reward} moedas)` : ''), undefined, '#8ae86a');
  sfx('quest');
  const sq = STORY.find(x => x.id === q.id);
  if (sq?.next) setTimeout(() => startStory(sq.next!), 1200);
  s.stats.questsDone = (s.stats.questsDone || 0) + 1;
}

// ---------- pedidos do mural ----------
export function makeBoardPosting() {
  const s = getState();
  const r = Math.random();
  const npcPool = NPCS.filter(n => n.id !== 'pipo' && n.id !== 'selma');
  const npc = npcPool[Math.floor(Math.random() * npcPool.length)];
  if (r < 0.25 && s.mineDeepest >= 5) {
    const mons = MONSTERS.filter(m => m.levels[0] <= Math.max(5, s.mineDeepest));
    const m = mons[Math.floor(Math.random() * mons.length)];
    const target = 4 + Math.floor(Math.random() * 6);
    s.flags.board = { id: 'slay_' + Date.now(), kind: 'slay', title: `Caça: ${m.name}`, desc: `"Tem ${m.name.toLowerCase()} demais nas minas. Elimine ${target}." — Gil`, npc: 'gil', monster: m.id, target, progress: 0, reward: target * 40 + m.hp * 2, friendship: 100 } as Quest;
    return;
  }
  const pool = REQUEST_ITEMS[s.time.season].filter(id => ITEMS[id]);
  const item = pool[Math.floor(Math.random() * pool.length)];
  const price = ITEMS[item].price;
  const qty = price < 40 ? 5 : price < 90 ? 3 : price < 200 ? 2 : 1;
  const lines = [`"Preciso de ${qty}x ${ITEMS[item].name}. Pago bem!"`, `"Alguém tem ${qty}x ${ITEMS[item].name} sobrando? Por favor!"`, `"Procura-se: ${qty}x ${ITEMS[item].name}. Urgente!"`];
  s.flags.board = { id: 'req_' + Date.now(), kind: 'request', title: `Pedido de ${npc.name.split(' ')[0]}`, desc: lines[Math.floor(Math.random() * lines.length)] + ` — ${npc.name}`, npc: npc.id, item, qty, reward: Math.max(80, price * qty * 3), deadline: absDay() + 2, friendship: 150 } as Quest;
}
export function absDay() { const t = getState().time; return (t.year - 1) * 112 + t.season * 28 + t.day; }

export function acceptBoard() {
  const s = getState();
  const b = s.flags.board as Quest;
  if (!b) return false;
  if (s.quests.filter(q => q.kind !== 'story').length >= 3) { G.toast('Você já tem pedidos demais em andamento.'); return false; }
  if (b.kind === 'request') b.deadline = absDay() + 2;
  s.quests.push(b); s.flags.board = null;
  sfx('quest');
  return true;
}

/** Ao conversar: entrega pedidos se tiver os itens. */
export function tryDeliver(npcId: string): string | null {
  const s = getState();
  const q = s.quests.find(x => x.kind === 'request' && x.npc === npcId && !x.done);
  if (!q || !q.item) return null;
  if (countItem(q.item) < (q.qty || 1)) return null;
  removeItem(q.item, q.qty || 1);
  completeQuest(q);
  s.quests = s.quests.filter(x => !x.done);
  return `Você trouxe ${q.qty}x ${itemName(q.item)}! Muito obrigado, de verdade!`;
}

export function expireQuests() {
  const s = getState();
  const d = absDay();
  const before = s.quests.length;
  s.quests = s.quests.filter(q => !(q.kind === 'request' && q.deadline && d > q.deadline));
  return before - s.quests.length;
}

// ---------- cartas ----------
export function checkMail() {
  const s = getState();
  for (const m of MAIL) {
    if (s.mailSeen.includes(m.id)) continue;
    try { if (!m.when(s)) continue; } catch { continue; }
    s.mailSeen.push(m.id);
    s.mail.push({ id: m.id, read: false });
  }
  for (const n of NPCS) {
    const st = npcState(n.id);
    if (st.engaged !== undefined) { /* tratado em day.ts */ }
  }
}

export function openMail(id: string) {
  const s = getState();
  const m = MAIL.find(x => x.id === id);
  const entry = s.mail.find(x => x.id === id);
  if (!m || !entry) return;
  if (!entry.read) {
    entry.read = true;
    if (m.attach) for (const a of m.attach) addItem({ ...a });
    if (m.recipe && !s.recipes.includes(m.recipe)) { s.recipes.push(m.recipe); G.toast('Receita aprendida: ' + ITEMS[m.recipe].name); }
    if (m.cooking && !s.cooking.includes(m.cooking)) { s.cooking.push(m.cooking); G.toast('Receita de cozinha: ' + ITEMS[m.cooking].name); }
    if (m.money) { s.player.money += m.money; }
    if (m.flag) s.flags[m.flag] = true;
    if (m.quest) startStory(m.quest);
  }
}

export function hallSetComplete(sector: string, set: string) {
  const s = getState();
  const sec = HALL.find(h => h.id === sector)!;
  const st = sec.sets.find(x => x.id === set)!;
  const got = s.hall[sector]?.[set] || [];
  const need = st.need ?? st.items.length;
  return got.filter(Boolean).length >= need;
}
