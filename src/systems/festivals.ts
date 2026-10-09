// Festivais sazonais com atividades e recompensas.
import { TILE } from '../core/util';
import { G } from '../core/ctx';
import { getState, ItemStack } from '../state/state';
import { FESTIVALS, FestivalDef } from '../data/game';
import { NPCS } from '../data/npcs';
import { addFriendship, hearts, npcState, tasteOf } from './npcs';
import { addItem, sellPrice } from './inventory';
import { sfx, setMusic } from '../audio/audio';
import { ITEMS, itemName } from '../data/items';
import type { FishDef } from '../data/fish';

export function todayFestival(): FestivalDef | undefined {
  const s = getState();
  return FESTIVALS.find(f => f.season === s.time.season && f.day === s.time.day);
}
function festKey(f: FestivalDef) { return f.id + '_' + getState().time.year; }

export function maybeStartFestival(mapId: string) {
  const s = getState();
  const f = todayFestival();
  if (!f || mapId !== 'vila' || G.festival) return false;
  if (s.festivalsDone.includes(festKey(f))) return false;
  if (s.time.minutes < f.from - 60 || s.time.minutes > f.to) return false;
  G.festival = { def: f, phase: 'intro', t: 0, tokens: [] as { x: number; y: number; got: boolean }[], count: 0, timer: 0, blockNpc: false, onNpc: undefined as any, onFish: undefined as any };
  setMusic('festival', s.time.season, true);
  const lines = [f.intro, f.desc];
  G.ui.festivalIntro(f, lines, () => begin(f));
  return true;
}

function begin(f: FestivalDef) {
  const fs = G.festival;
  const s = getState();
  fs.phase = 'active';
  switch (f.activity) {
    case 'hunt': {
      for (let i = 0; i < 12; i++) fs.tokens.push({ x: (22 + Math.random() * 15) * TILE, y: (20 + Math.random() * 11) * TILE, got: false });
      fs.timer = 50;
      G.toast('Encontre as sementes pintadas! 50 segundos!', undefined, '#f8d86a');
      break;
    }
    case 'fishing': {
      fs.timer = 120; fs.count = 0;
      if (!s.inventory.some(x => x?.id === 'vara')) addItem({ id: 'vara', qty: 1 });
      G.toast('Pesque o máximo que puder no rio da vila! 2 minutos!', undefined, '#8ad0ff');
      fs.onFish = (fish: FishDef | null) => { if (fish) { fs.count++; G.toast(`Peixes no concurso: ${fs.count}`); } };
      break;
    }
    case 'dance': {
      const partners = NPCS.filter(n => n.romance && (hearts(n.id) >= 4 || npcState(n.id).dating));
      G.ui.choose('Convidar alguém para dançar?', [...partners.map(n => ({ label: n.name + (npcState(n.id).dating ? ' ♥' : ''), value: n.id })), { label: 'Só assistir', value: '' }], (id: string) => {
        if (id) { addFriendship(id, npcState(id).dating ? 250 : 150); G.ui.dialogue(id, 'Seria uma honra dançar com você!', 'blush', () => finish(f, 'Vocês dançaram sob as guirlandas até o fim da música. A vila inteira aplaudiu.')); }
        else finish(f, 'Você assistiu ao baile da beira da praça. A música era linda.');
      });
      break;
    }
    case 'soup': {
      G.ui.pickItem('Escolha um ingrediente para o caldeirão:', (st: ItemStack | null) => {
        if (!st) { finish(f, 'Você não colocou nada no caldeirão. A prefeita fez cara feia.'); return; }
        const score = sellPrice(st) * (1 + (st.q || 0) * 0.3) * (ITEMS[st.id].cat === 'trash' ? -5 : 1);
        let txt: string, pts: number;
        if (score < 0) { txt = 'A prefeita prova a sopa e fica verde. "Quem colocou uma BOTA aqui?!"'; pts = -50; }
        else if (score > 250) { txt = 'A prefeita prova e arregala os olhos: "A melhor sopa de todos os tempos!"'; pts = 80; }
        else if (score > 80) { txt = 'A prefeita sorri: "Muito boa! Saborosa e bem temperada."'; pts = 40; }
        else { txt = 'A prefeita prova: "Hm... está ok. Comestível."'; pts = 10; }
        for (const n of NPCS) if (npcState(n.id).met) addFriendship(n.id, pts);
        finish(f, `Você colocou ${itemName(st.id, st.ref)} no caldeirão. ${txt}`);
      }, true);
      break;
    }
    case 'judge': {
      G.ui.pickItem('Escolha seu melhor produto para a exposição:', (st: ItemStack | null) => {
        if (!st) { finish(f, 'Você só passeou pela feira. Comeu pastel e foi feliz.'); return; }
        const score = sellPrice(st) * (1 + (st.q || 0) * 0.5);
        const place = score >= 500 ? 1 : score >= 200 ? 2 : score >= 80 ? 3 : 0;
        const prize = [0, 1500, 700, 300][place];
        if (prize) { s.player.money += prize; s.player.totalEarned += prize; }
        finish(f, place ? `O júri concedeu o ${place}º lugar ao seu ${itemName(st.id, st.ref)}! Prêmio: ${prize} moedas.` : `O júri achou seu ${itemName(st.id, st.ref)} simpático, mas não premiou.`);
      }, false);
      break;
    }
    case 'cutscene': {
      const lines = f.id === 'vagalumes'
        ? ['A noite cai sobre a praia. Um a um, os vaga-lumes acendem.', 'Pipo segura a mão de Rosa. Tainá esquece de fotografar.', 'Por um instante, o vale inteiro parece respirar junto.']
        : ['Cada lanterna carrega um nome. Raul acende duas.', 'Vó Marta sussurra uma prece. Aurélia segura uma lanterna com o nome "Joaquim".', 'Você acende uma para sua tia Celeste. Ela sobe mais alto que todas.'];
      fs.lanterns = f.id === 'lanternas';
      G.ui.narrate(lines, () => { for (const n of NPCS) if (npcState(n.id).met) addFriendship(n.id, 20); finish(f, 'A noite termina em silêncio. Você volta para casa com o coração leve.', true); });
      break;
    }
    case 'gifts': {
      let sf = s.flags.secretFriend;
      if (!sf) { const pool = NPCS.filter(n => n.id !== s.spouse); sf = pool[Math.floor(Math.random() * pool.length)].id; s.flags.secretFriend = sf; }
      const n = NPCS.find(x => x.id === sf)!;
      G.ui.pickItem(`Seu amigo secreto é ${n.name}. Escolha um presente:`, (st: ItemStack | null) => {
        let msg = '';
        if (st) { const t = tasteOf(n.id, st); addFriendship(n.id, { love: 200, like: 120, neutral: 60, dislike: 0, hate: -40 }[t]); msg = `${n.name} abre seu presente: "${n.gift[t]}"`; }
        else msg = `${n.name} fica sem presente. Que climão.`;
        const gifts = ['bolo', 'doce_leite', 'tecido', 'pedralua', 'quadro', 'tonico', 'vinho', 'luminaria'];
        const g = gifts[Math.floor(Math.random() * gifts.length)];
        addItem({ id: g, qty: 1, ref: g === 'vinho' ? 'uva' : undefined });
        finish(f, msg + ` Você também ganhou um presente: ${itemName(g)}!`);
        delete s.flags.secretFriend;
      }, true);
      break;
    }
  }
}

export function updateFestival(dt: number) {
  const fs = G.festival;
  if (!fs || fs.phase !== 'active') return;
  const f = fs.def as FestivalDef;
  if (f.activity === 'hunt') {
    fs.timer -= dt;
    const p = G.player;
    for (const t of fs.tokens) if (!t.got && Math.hypot(p.x - t.x, p.y - t.y) < 12) { t.got = true; fs.count++; sfx('pickup'); G.fx.burst(t.x, t.y, ['#f8d03a', '#e85a8a', '#4ab8e8'], 8); }
    if (fs.timer <= 0 || fs.count >= 12) {
      const prize = fs.count >= 10 ? 1000 : fs.count >= 6 ? 400 : 100;
      getState().player.money += prize;
      if (fs.count >= 10) addItem({ id: 'vaso', qty: 1 });
      finish(f, `Você encontrou ${fs.count} sementes pintadas! Prêmio: ${prize} moedas${fs.count >= 10 ? ' e um Vaso de Samambaia' : ''}.`);
    }
  }
  if (f.activity === 'fishing') {
    fs.timer -= dt;
    if (fs.timer <= 0 && !G.fishing) {
      const place = fs.count >= 5 ? 1 : fs.count >= 3 ? 2 : fs.count >= 1 ? 3 : 0;
      const prize = [0, 1500, 600, 200][place];
      getState().player.money += prize;
      if (place === 1) addItem({ id: 'isca', qty: 50 });
      finish(f, place ? `Você pescou ${fs.count} peixes e ficou em ${place}º lugar! Prêmio: ${prize} moedas.` : 'Nenhum peixe dessa vez. Quinzinho te dá um tapinha nas costas.');
    }
  }
}

function finish(f: FestivalDef, text: string, goHome = false) {
  const s = getState();
  s.festivalsDone.push(festKey(f));
  G.festival.phase = 'done';
  sfx('quest');
  G.ui.narrate([text], () => {
    G.festival = null;
    s.time.minutes = Math.max(s.time.minutes, f.to);
    G.clockAcc = 0;
    (G.npcs as any).placeAll();
    if (goHome) G.warp('fazenda', 34, 11, 'down');
    else setMusic('vila', s.time.season, true);
  });
}
