// Controlador principal: inicialização, loop, transições de mapa, sono, minas, construções e cenas.
import { G } from './core/ctx';
import { Input } from './core/input';
import { TILE, key } from './core/util';
import { getState, setState, GameState, ItemStack } from './state/state';
import { createNewGame } from './state/newgame';
import { saveGame, loadGame } from './state/save';
import { buildAllMaps, MAPS } from './world/maps';
import { getWorld, invalidateWorld } from './world/world';
import { POIS } from './world/builder';
import { Renderer } from './render/renderer';
import { FX } from './render/fx';
import { UI } from './ui/ui';
import { showTitle, NewGameOpts } from './ui/title';
import { Player, updateDrops, spawnDrop } from './systems/player';
import { NPCManager, eventFor, npcState, addFriendship } from './systems/npcs';
import { tickClock, processNight } from './systems/day';
import { primaryPress, primaryHold, primaryRelease, interact } from './systems/actions';
import { updateFishing } from './systems/fishing';
import { updateMonsters, spawnMonsters } from './systems/combat';
import { loadAnimals, updateAnimals, stableHorse } from './systems/animals';
import { maybeStartFestival, updateFestival, todayFestival } from './systems/festivals';
import { evaluateQuests, startStory, questEvent } from './systems/quests';
import { sfx, setMusic, updateMusic, updateAmbience, setVolumes, unlockAudio } from './audio/audio';
import { BUILDS, HALL } from './data/game';
import { NPC_BY_ID } from './data/npcs';
import { buildCharSheet } from './art/characters';
import { clearSeasonalCache } from './art/objects';
import { el } from './ui/dom';
import { openShop, merchantStock, festivalShop } from './ui/shops';
import { addXP } from './systems/skills';
import { addItem, countItem, removeItem } from './systems/inventory';
import { T } from './world/types';

let renderer: Renderer;
let ui: UI;
let slot = 0;
let last = performance.now();
let fading = 0; // >0 durante transições
let transition: (() => void) | null = null;

export function boot() {
  buildAllMaps();
  const canvas = document.createElement('canvas'); canvas.id = 'game'; document.body.appendChild(canvas);
  Input.init(canvas);
  G.fx = new FX();
  G.drops = []; G.monsters = []; G.animals = [];
  G.fishing = null; G.cutscene = null; G.festival = null; G.placement = null;
  G.frame = 0; G.clockAcc = 0; G.lightningT = 8; G.started = false;
  G.paused = () => !G.started || ui.isBlocking() || !!G.cutscene || fading > 0;
  G.warp = warp; G.sleep = sleep;
  (G as any).goMine = goMine; (G as any).restoreSector = restoreSector; (G as any).startPlacement = startPlacement; (G as any).refreshFarm = () => { invalidateWorld('fazenda'); if (G.world?.def.id === 'fazenda') { G.world = getWorld('fazenda'); } };
  (G as any).dropAtPlayer = (st: ItemStack) => spawnDrop(G.player.x, G.player.y, st);
  ui = new UI(); G.ui = ui;
  // stub mínimo para o renderer funcionar antes do jogo começar
  renderer = null as any;
  ui.init({ screenToTile: () => [0, 0], shakeTile() { }, fallTree() { }, resize() { } });
  extendUI();
  (window as any).__vc = { G, getState, warp: (m: string, x: number, y: number) => warp(m, x, y, 'down', { instant: true }), goMine, sleep, getWorld, MAPS };
  showTitle(ui.root, startNew, startLoad);
  window.addEventListener('mousedown', () => unlockAudio(), { once: true });
  requestAnimationFrame(loop);
}

function startNew(o: NewGameOpts) {
  slot = o.slot;
  createNewGame(o);
  begin(true);
}
async function startLoad(sl: number) {
  slot = sl;
  const s = await loadGame(sl);
  if (!s) { alert('Não foi possível carregar o save.'); location.reload(); return; }
  setState(s);
  begin(false);
}

function begin(isNew: boolean) {
  const s = getState();
  setVolumes(s.settings.music, s.settings.sfx);
  renderer = new Renderer(document.getElementById('game') as HTMLCanvasElement);
  ui.renderer = renderer;
  G.player = new Player();
  G.npcs = new NPCManager(); G.npcs.init(); G.npcs.placeAll();
  G.world = getWorld(s.player.map);
  G.player.x = s.player.x; G.player.y = s.player.y; G.player.facing = s.player.facing;
  onEnterMap(false);
  ui.showHud(true); ui.renderHotbar();
  G.started = true;
  if (isNew) introScene();
  else { ui.toast(`Que bom te ver de novo, ${s.player.name}!`); morningChecks(); }
}

function introScene() {
  const s = getState();
  fading = 0;
  ui.showLines([
    { who: '', text: 'Há algumas semanas, chegou uma carta com a letra trêmula da sua tia-avó Celeste.' },
    { who: '', text: '"Querida, se você está lendo isto, eu já parti. Deixo para você minha fazenda no Vale da Candeia. Ela está selvagem como eu fui. Cuide da terra, e a terra cuidará de você."' },
    { who: '', text: 'Você largou a vida cinzenta da cidade grande, juntou o pouco que tinha e pegou o último ônibus para a serra.' },
    { who: 'aurelia', text: `Ah, aí está você! Eu sou a Aurélia, prefeita da Vila Candeia. Boas-vindas à Fazenda @fazenda!`, expr: 'happy' },
    { who: 'aurelia', text: 'Não repare a bagunça... faz anos que ninguém cuida daqui. O mato tomou conta de tudo.', expr: 'sad' },
    { who: 'aurelia', text: 'Deixei umas sementes de nabo na sua mochila. Use a enxada para preparar a terra, plante e regue todo dia. Quando crescerem, coloque na caixa de envio ao lado da casa: vendemos tudo durante a noite.', expr: 'neutral' },
    { who: 'aurelia', text: 'A vila fica a leste. Passe lá para conhecer todo mundo! E durma antes das duas da manhã, ouviu? Bom descanso!', expr: 'happy' },
  ], () => { ui.toast('Dica: clique esquerdo/Espaço usa a ferramenta; clique direito/E interage. Tab abre o inventário.', 'enxada'); });
}

// ---------------- LOOP ----------------
function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (G.started) { update(dt); renderer.render(dt); }
  } catch (e) { console.error(e); }
  Input.endFrame();
  requestAnimationFrame(loop);
}

function update(dt: number) {
  const s = getState();
  G.frame++; G.now = performance.now();
  ui.update(dt);
  G.fx.update();
  if (fading > 0) {
    fading -= dt;
    G.fx.fade = fading > 0.25 ? Math.min(1, (0.5 - fading) / 0.25) : Math.max(0, fading / 0.25);
    if (transition && fading <= 0.25) { const t = transition; transition = null; t(); }
    if (fading <= 0) G.fx.fade = 0;
  }
  const paused = G.paused();
  if (!paused) {
    if (!G.festival && !G.fishing?.contest) tickClock(dt);
    handleInput(dt);
  }
  G.player.update(paused ? 0 : dt);
  if (!paused) {
    G.npcs.update(dt);
    updateAnimals(dt);
    if (G.world.def.isMine) updateMonsters(dt);
    updateDrops(dt);
    if (G.fishing) updateFishing(dt);
    updateFestival(dt);
    if (G.placement) G.placement.update();
  }
  // energia
  if (s.player.energy > 0) s.player.exhausted = false;
  // áudio
  updateMusic();
  const outdoor = G.world.def.outdoor;
  updateAmbience(dt, { rain: s.weather.today === 'chuva' || s.weather.today === 'tempestade', storm: s.weather.today === 'tempestade', ocean: ['praia', 'enseada'].includes(G.world.def.id), night: s.time.minutes > 1200, season: s.time.season, outdoor, mine: !!G.world.def.isMine, wind: s.weather.today === 'vento' || s.time.season === 3 });
  // sincroniza posição no save
  s.player.map = G.world.def.id; s.player.x = G.player.x; s.player.y = G.player.y; s.player.facing = G.player.facing;
}

function handleInput(dt: number) {
  const p = G.player;
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
  keys.forEach((k, i) => { if (Input.isPressed(k)) { p.sel = i; ui.renderHotbar(); } });
  if (Input.wheel) { p.sel = (p.sel + Input.wheel + 12) % 12; ui.renderHotbar(); }
  if (G.fishing) return;
  if (G.placement) {
    if (Input.mPressed[0] || Input.isPressed('space')) G.placement.confirm();
    if (Input.mPressed[2] || Input.isPressed('escape')) G.placement.cancel();
    return;
  }
  if (Input.mPressed[0] || Input.isPressed('space') || Input.isPressed('c') && false) primaryPress();
  if (Input.mDown[0] || Input.isDown('space')) primaryHold(dt);
  if (Input.mReleased[0] || Input.released.has('space')) primaryRelease();
  if (Input.mPressed[2] || Input.isPressed('e', 'x')) interact();
  if (p.action == null && (Input.mPressed[0] || Input.mPressed[2])) ui.renderHotbar();
  if (Input.pressed.size || Input.mReleased[0]) ui.renderHotbar();
}

// ---------------- MAPAS ----------------
function warp(map: string, tx: number, ty: number, dir?: 'up' | 'down' | 'left' | 'right', opts: { instant?: boolean; fresh?: boolean } = {}) {
  const s = getState();
  if (map === 'mina' && !s.flags.minesOpen) { ui.toast('A entrada das minas está bloqueada por um desmoronamento. Dizem que o guarda está limpando.'); G.player.y += 6; return; }
  if (fading > 0) return;
  if (G.fishing) G.fishing = null;
  G.player.charge.active = false; G.player.action = null;
  const doIt = () => {
    G.drops = [];
    G.world = getWorld(map, opts.fresh);
    G.player.x = tx * TILE + 8; G.player.y = ty * TILE + 12;
    if (dir) G.player.facing = dir;
    G.player.warpLock = G.player.tx + ',' + Math.floor((G.player.y - 2) / TILE);
    if (s.player.horse && (!G.world.def.outdoor)) { s.player.horse = false; s.flags.horsePos = null; }
    onEnterMap(true);
  };
  sfx('door');
  if (opts.instant) { doIt(); return; }
  fading = 0.5; transition = doIt;
}

function onEnterMap(checkEvents: boolean) {
  const s = getState();
  const w = G.world;
  G.monsters = [];
  if (w.def.isMine && (w.def as any).mineSpawns) spawnMonsters((w.def as any).mineSpawns);
  loadAnimals(w.def.id);
  // cavalo do estábulo aparece na fazenda
  if (w.def.id === 'fazenda' && stableHorse() && !s.player.horse && !s.flags.horsePos) { const st = s.buildings.find(b => b.type === 'estabulo')!; s.flags.horsePos = { map: 'fazenda', x: (st.x + 2) * TILE, y: (st.y + 4) * TILE }; }
  const fest = todayFestival();
  const festMusic = fest && w.def.id === 'vila' && s.time.minutes >= fest.from - 60 && s.time.minutes <= fest.to && !s.festivalsDone.includes(fest.id + '_' + s.time.year);
  setMusic(festMusic ? 'festival' : w.def.music, s.time.season);
  if (w.def.isMine && w.def.mineLevel) {
    if (w.def.mineLevel > s.mineDeepest) { s.mineDeepest = w.def.mineLevel; evaluateQuests(); if (w.def.mineLevel % 5 === 0) ui.toast(`Elevador desbloqueado: andar ${w.def.mineLevel}!`, undefined, '#f8d86a'); }
    ui.toast(w.def.name);
    if (w.def.mineLevel === 80 && !s.flags.gilSeen) { s.flags.gilSeen = true; setTimeout(() => ui.narrate(['No fundo das minas, uma luz dourada pulsa entre os cristais...', 'São antigos equipamentos da guilda dos mineiros, abandonados há décadas. Gil vai querer saber disso.']), 800); }
  }
  questEvent('visit:' + w.def.id);
  if (!checkEvents) return;
  // eventos de coração
  const ev = eventFor(w.def.id);
  if (ev) { setTimeout(() => playHeartEvent(ev.npc.id, ev.ev), 600); return; }
  if (maybeStartFestival(w.def.id)) return;
  if (w.def.id === 'vila' && !s.flags.visitedTown) { s.flags.visitedTown = true; setTimeout(() => ui.toast('Vila Candeia! Converse com os moradores (clique direito ou E).', undefined, '#f8d86a'), 700); }
  if (w.def.id === 'hall' && !s.flags.hallIntro) { s.flags.hallIntro = true; setTimeout(() => ui.narrate(['O ar aqui dentro é parado e cheira a madeira velha.', 'Seis altares cobertos de pó formam um círculo. Cada um tem o símbolo de uma antiga guilda.', 'Você sente que eles esperam alguma coisa...']), 600); }
}

function playHeartEvent(npcId: string, ev: any) {
  const s = getState();
  const st = npcState(npcId);
  st.events.push(ev.id);
  const n = G.npcs.get(npcId);
  const p = G.player;
  let actor: any = null;
  if (!n || n.map !== G.world.def.id || Math.hypot(n.x - p.x, n.y - p.y) > 120) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing as string]!;
    let ax = p.x + d[0] * 22, ay = p.y + d[1] * 22;
    if (G.world.rectSolid(ax - 5, ay - 4, 10, 4)) { ax = p.x + 20; ay = p.y; }
    actor = { x: ax, y: ay, facing: ({ up: 'down', down: 'up', left: 'right', right: 'left' } as any)[p.facing], sheet: buildCharSheet(NPC_BY_ID[npcId].look), moving: false, frame: 0, emoteT: 1.5, emote: '!' };
  } else { n.pause = 30; n.emote = '!'; n.emoteT = 1.5; }
  G.cutscene = { npcs: [npcId], actors: actor ? [actor] : [] };
  ui.showLines(ev.lines.map((l: any) => ({ who: l[0], text: l[1], expr: l[2] })), () => {
    G.cutscene = null;
    if (n) n.pause = 0;
    addFriendship(npcId, 60);
    const r = ev.reward;
    if (r) {
      if (r.item) { const left = addItem({ id: r.item, qty: r.qty || 1 }); if (left) spawnDrop(p.x, p.y, { id: r.item, qty: left }); }
      if (r.cooking && !s.cooking.includes(r.cooking)) { s.cooking.push(r.cooking); ui.toast('Nova receita de cozinha aprendida!', r.cooking, '#f8d86a'); }
      if (r.recipe && !s.recipes.includes(r.recipe)) s.recipes.push(r.recipe);
      if (r.money) s.player.money += r.money;
    }
    sfx('heart');
  });
}

function goMine(level: number) {
  const s = getState();
  level = Math.min(80, Math.max(1, level));
  G.world && (G.world.def.isMine) && sfx('ladder');
  const id = 'mina_' + level;
  getWorld(id, true);
  const def: any = MAPS[id];
  warp(id, def.start.x, def.start.y, 'down', { fresh: false });
  addXP('mining', 1);
}

// ---------------- DORMIR ----------------
function sleep(fainted = false) {
  if (fading > 0 || G.cutscene) return;
  const s = getState();
  G.fishing = null; G.player.action = null; G.player.charge.active = false; G.placement = null; G.festival = null;
  fading = 99; G.fx.fade = 0;
  sfx('sleep');
  const fadeOut = () => {
    let a = 0;
    const iv = setInterval(() => {
      a += 0.08; G.fx.fade = Math.min(1, a);
      if (a >= 1) {
        clearInterval(iv);
        const seasonBefore = s.time.season;
        const rep = processNight(fainted);
        if (s.time.season !== seasonBefore) { clearSeasonalCache(); renderer.invalidateGround(); }
        G.npcs.placeAll();
        G.world = getWorld('casa');
        G.player.x = s.player.x; G.player.y = s.player.y; G.player.facing = 'down';
        G.drops = []; G.monsters = []; G.animals = [];
        saveGame(s, slot).then(ok => { if (!ok) ui.toast('Não foi possível salvar!'); });
        fading = 0;
        G.fx.fade = 1;
        ui.nightSummary(rep, () => {
          let b = 1;
          const iv2 = setInterval(() => { b -= 0.06; G.fx.fade = Math.max(0, b); if (b <= 0) clearInterval(iv2); }, 30);
          onEnterMap(false);
          morningChecks();
        });
      }
    }, 30);
  };
  if (fainted) ui.toast('Tudo fica escuro...', undefined, '#ff8a6a');
  fadeOut();
}

function morningChecks() {
  const s = getState();
  const unread = s.mail.filter(m => !m.read).length;
  if (unread) ui.toast(`Você tem ${unread} carta(s) nova(s) na caixa de correio!`, 'livro_receitas', '#f8d86a');
  const fest = todayFestival();
  if (fest) ui.toast(`Hoje: ${fest.name} na praça da vila (${String(Math.floor(fest.from / 60)).padStart(2, '0')}h–${String(Math.floor(fest.to / 60)).padStart(2, '0')}h)!`, undefined, '#f8d86a');
  const bdays = Object.values(NPC_BY_ID).filter(n => n.birthday[0] === s.time.season && n.birthday[1] === s.time.day);
  for (const n of bdays) ui.toast(`Hoje é aniversário de ${n.name}!`, 'bolo', '#e85a7a');
  updateTownDecor();
  if (s.flags.weddingToday) {
    const id = s.flags.weddingToday; delete s.flags.weddingToday;
    setTimeout(() => ui.showLines([
      { who: '', text: 'Hoje é o dia do casamento! A vila inteira se reúne diante da capela, enfeitada de flores.' },
      { who: 'aurelia', text: `Estamos aqui para celebrar a união de @nome e ${NPC_BY_ID[id].name}.`, expr: 'happy' },
      { who: id, text: 'Prometo cuidar de você, da fazenda e de todos os nossos dias. Para sempre.', expr: 'blush' },
      { who: '', text: 'Os sinos tocam. Pétalas caem do céu. A partir de hoje, a fazenda tem mais um coração.' },
    ], () => { G.npcs.placeAll(); sfx('levelup'); }), 900);
  }
}

/** Comerciante itinerante e barraca do festival na praça. */
function updateTownDecor() {
  const s = getState();
  const vila = MAPS.vila;
  vila.decos = vila.decos.filter(d => d.interact !== 'merchant' && d.interact !== 'festshop');
  vila.interacts = (vila.interacts || []).filter(i => i.id !== 'merchant' && i.id !== 'festshop');
  const wd = (s.time.day - 1) % 7;
  if (s.hallDone.includes('artesanato') && (wd === 4 || wd === 6)) { vila.decos.push({ x: 35, y: 33, sprite: 'stall:2', solid: true, solidW: 2, interact: 'merchant' }); vila.interacts.push({ x: 35, y: 33, id: 'merchant' }, { x: 36, y: 33, id: 'merchant' }); }
  if (festivalShop()) { vila.decos.push({ x: 23, y: 33, sprite: 'stall:0', solid: true, solidW: 2, interact: 'festshop' }); vila.interacts.push({ x: 23, y: 33, id: 'festshop' }, { x: 24, y: 33, id: 'festshop' }); }
  invalidateWorld('vila');
  if (G.world?.def.id === 'vila') G.world = getWorld('vila');
}

// ---------------- CASA DOS OFÍCIOS ----------------
function restoreSector(sector: string) {
  const s = getState();
  if (s.hallDone.includes(sector)) return;
  s.hallDone.push(sector);
  const sec = HALL.find(h => h.id === sector)!;
  G.fx.doFlash(sec.color, 0.8); G.fx.doShake(3, 30); sfx('levelup');
  for (let i = 0; i < 60; i++) G.fx.parts.push({ x: G.player.x + (Math.random() - 0.5) * 160, y: G.player.y + (Math.random() - 0.5) * 100, z: 0, vx: 0, vy: -0.3 - Math.random() * 0.5, vz: 0, life: 0, max: 120, color: sec.color, size: 2, grav: 0, fade: true });
  const extra: string[] = [];
  if (sector === 'curral') { for (const r of ['funil', 'coletor']) if (!s.recipes.includes(r)) s.recipes.push(r); }
  if (sector === 'lavoura') invalidateWorld('fazenda');
  if (sector === 'artesanato') updateTownDecor();
  if (sector === 'aguas') setTimeout(() => startStory('q_enseada'), 4000);
  if (s.hallDone.length === 6) extra.push('Os seis altares brilham juntos. Os sinos da capela tocam sozinhos. Pela primeira vez em décadas, a Casa dos Ofícios está viva!', 'Todos os moradores vêm correndo para ver. Aurélia chora abraçada à estátua da praça.');
  ui.showLines([
    { who: '', text: `O ${sec.name.toLowerCase()} se acende com uma luz ${sec.color === '#6ab84a' ? 'verde' : 'cálida'}. Um murmúrio antigo ecoa pelas paredes.` },
    { who: '', text: `O espírito da ${sec.guild} despertou!` },
    { who: '', text: 'Recompensa: ' + sec.reward },
    ...extra.map(t => ({ who: '', text: t })),
  ], () => { evaluateQuests(); if (s.hallDone.length === 6) for (const id of Object.keys(NPC_BY_ID)) addFriendship(id, 100); });
}

// ---------------- CONSTRUÇÃO ----------------
function startPlacement(def: typeof BUILDS[number]) {
  const s = getState();
  const go = () => {
    G.placement = {
      def, tx: 0, ty: 0, ok: false,
      update() {
        const [mx, my] = ui.mouseTile();
        this.tx = mx - Math.floor(def.w / 2); this.ty = my - def.h + 1;
        this.ok = canBuildAt(this.tx, this.ty, def.w, def.h);
      },
      confirm() {
        if (!this.ok) { ui.toast('Não dá para construir aqui: a área precisa estar limpa.'); sfx('error'); return; }
        if (s.player.money < def.cost || !def.mats.every(([id, n]) => countItem(id) >= n)) { ui.toast('Faltam materiais.'); G.placement = null; return; }
        s.player.money -= def.cost; for (const [id, n] of def.mats) removeItem(id, n);
        s.buildings.push({ id: def.id + '_' + Date.now(), type: def.id, x: this.tx, y: this.ty, level: 0, daysLeft: def.days });
        G.placement = null;
        invalidateWorld('fazenda'); G.world = getWorld('fazenda');
        sfx('place'); G.fx.doShake(2, 10);
        ui.dialogue('zeca', `Perfeito! O ${def.name.toLowerCase()} fica pronto em ${def.days} dia(s).`, 'happy');
      },
      cancel() { G.placement = null; ui.toast('Construção cancelada.'); },
    };
    ui.toast('Escolha o local da construção com o mouse e clique. (Botão direito/Esc cancela)', undefined, '#f8d86a');
  };
  if (G.world.def.id !== 'fazenda') { warp('fazenda', 34, 12, 'down'); setTimeout(go, 600); } else go();
}
function canBuildAt(x: number, y: number, w: number, h: number) {
  const W = getWorld('fazenda');
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const tx = x + i, ty = y + j;
    if (!W.inBounds(tx, ty) || W.solid(tx, ty) || W.obj(tx, ty) || W.st.soil[key(tx, ty)]) return false;
    const t = W.tile(tx, ty);
    if (t !== T.GRASS && t !== T.DARKGRASS && t !== T.DIRT) return false;
    if (ty < 6) return false;
    for (const wp of W.def.warps) if (tx >= wp.x - 1 && tx <= wp.x + wp.w && ty >= wp.y - 1 && ty <= wp.y + wp.h) return false;
  }
  // espaço livre na frente da porta
  if (W.solid(x + Math.floor(w / 2), y + h)) return false;
  return true;
}

// ---------------- extensões de UI ----------------
function extendUI() {
  const orig = ui.interactId.bind(ui);
  ui.interactId = (id: string, tx: number, ty: number) => {
    if (id === 'merchant') { openShop('comerciante', merchantStock(), 'Comerciante Itinerante'); return; }
    if (id === 'festshop') { const sh = festivalShop(); if (sh) openShop('comerciante', sh, todayFestival()!.name); return; }
    orig(id, tx, ty);
  };
  // fantasma de construção desenhado sobre o canvas
  const ghost = el('div', '', '', document.body);
  ghost.style.cssText = 'position:fixed;pointer-events:none;z-index:5;border:3px dashed #fff;display:none';
  setInterval(() => {
    const P = G.placement;
    if (!P || !renderer) { ghost.style.display = 'none'; return; }
    const z = renderer.zoom;
    ghost.style.display = 'block';
    ghost.style.left = (P.tx * TILE - renderer.camX) * z + 'px'; ghost.style.top = (P.ty * TILE - renderer.camY) * z + 'px';
    ghost.style.width = P.def.w * TILE * z + 'px'; ghost.style.height = P.def.h * TILE * z + 'px';
    ghost.style.background = P.ok ? 'rgba(100,230,100,0.35)' : 'rgba(230,80,80,0.35)';
  }, 30);
}

export { POIS };
