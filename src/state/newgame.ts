// Criação de um novo jogo e geração da fazenda abandonada.
import { GameState, newSkill, setState, mapState } from './state';
import type { Look } from '../art/characters';
import { MAPS } from '../world/maps';
import { rng, key } from '../core/util';
import { T } from '../world/types';
import { spawnForage } from '../systems/farming';
import { makeBoardPosting, startStory } from '../systems/quests';

export function createNewGame(o: { name: string; farmName: string; favAnimal: string; look: Look; presentation: string }): GameState {
  const seed = Math.floor(Math.random() * 1e9);
  const s: GameState = {
    version: 1, seed,
    player: { name: o.name, farmName: o.farmName, favAnimal: o.favAnimal, look: o.look, presentation: o.presentation, map: 'casa', x: 3 * 16 + 8, y: 7 * 16 + 12, facing: 'down', energy: 270, maxEnergy: 270, hp: 100, maxHp: 100, money: 500, totalEarned: 0 },
    time: { day: 1, season: 0, year: 1, minutes: 360 },
    weather: { today: 'sol', tomorrow: 'sol' },
    inventory: Array(48).fill(null), invSize: 24,
    tools: { hoe: 0, axe: 0, pick: 0, can: 0, scythe: 0, rod: 0 },
    water: 40, maps: {}, buildings: [], animals: [], houseLevel: 0,
    npcs: {}, quests: [], questsDone: [],
    skills: { farming: newSkill(), mining: newSkill(), fishing: newSkill(), foraging: newSkill(), combat: newSkill() },
    pendingLevelUps: [], shipping: [], mineDeepest: 0, mail: [], mailSeen: [], recipes: [], cooking: [],
    hall: {}, hallDone: [], flags: { hay: 0 }, stats: {}, collection: { fish: {}, shipped: {}, minerals: {}, cooked: {} },
    settings: { music: 0.5, sfx: 0.7, zoom: 0 }, festivalsDone: [], luck: 0,
  };
  const start = ['enxada', 'machado', 'regador', 'picareta', 'foice'];
  start.forEach((id, i) => (s.inventory[i] = { id, qty: 1 }));
  s.inventory[5] = { id: 'sem_nabo', qty: 15 };
  setState(s);
  generateFarm(seed);
  spawnForage();
  makeBoardPosting();
  startStory('q_plantar');
  return s;
}

function generateFarm(seed: number) {
  const def = MAPS.fazenda;
  const ms = mapState('fazenda');
  const R = rng(seed);
  const clear = (x: number, y: number) => Math.abs(x - 34) < 6 && y < 14 || Math.abs(x - 35) < 3 || (y >= 22 && y <= 25 && x > 30) || (x >= 5 && x <= 9 && y < 15) || (x >= 18 && x <= 28 && y >= 5 && y <= 11);
  for (let y = 6; y < def.h - 2; y++) for (let x = 2; x < def.w - 2; x++) {
    const t = def.tiles[y * def.w + x];
    if (t !== T.GRASS && t !== T.DARKGRASS) continue;
    if (def.decos.some(d => Math.abs(d.x - x) <= 1 && Math.abs(d.y - y) <= 1)) continue;
    if (clear(x, y)) continue;
    // ilhas de vegetação densa
    const n = Math.sin(x * 0.21 + seed) * Math.cos(y * 0.17 + seed * 0.5) * 0.5 + 0.5;
    const r = R();
    const k = key(x, y);
    if (r < 0.05 + n * 0.06) ms.objects[k] = { t: 'tree', kind: R() < 0.45 ? 'carvalho' : R() < 0.6 ? 'bordo' : 'pinheiro', stage: 4, growth: 0, hp: 8 };
    else if (r < 0.2 + n * 0.12) ms.objects[k] = { t: 'debris', kind: 'weed', hp: 1, v: Math.floor(R() * 6) };
    else if (r < 0.27 + n * 0.1) ms.objects[k] = { t: 'debris', kind: 'stone', hp: 1, v: 0 };
    else if (r < 0.32 + n * 0.08) ms.objects[k] = { t: 'debris', kind: 'twig', hp: 1, v: 0 };
    else if (r < 0.39 + n * 0.12) ms.objects[k] = { t: 'grass', v: Math.floor(R() * 4) };
    else if (r < 0.40 + n * 0.02) ms.objects[k] = { t: 'debris', kind: 'stump', hp: 6, v: 0 };
    else if (r < 0.41 + n * 0.02) ms.objects[k] = { t: 'debris', kind: 'boulder', hp: 8, v: 0 };
  }
  // garante uma pequena área inicial limpa com mato fácil ao redor
  for (let y = 12; y < 18; y++) for (let x = 28; x < 34; x++) { const k = key(x, y); if (ms.objects[k]?.t === 'tree') delete ms.objects[k]; }
}
