// Estado persistente do jogo (tudo que vai para o save).
import type { Look } from '../art/characters';

export interface ItemStack { id: string; qty: number; q?: number; ref?: string }

export interface Soil { watered: boolean; fert?: string; crop?: { id: string; grown: number; harvests: number; regrowLeft?: number; dead?: boolean; giant?: boolean } }

export type WObj =
  | { t: 'debris'; kind: string; hp: number; v: number }
  | { t: 'tree'; kind: string; stage: number; growth: number; hp: number; tapper?: MachineState }
  | { t: 'fruittree'; kind: string; age: number; fruit: number; hp: number }
  | { t: 'forage'; id: string }
  | { t: 'grass'; v: number }
  | { t: 'placed'; id: string; machine?: MachineState; chest?: (ItemStack | null)[]; color?: number }
  | { t: 'rock'; kind: string; hp: number; v: number }
  | { t: 'ladder' } | { t: 'shaft' } | { t: 'artifact' };

export interface MachineState { input?: ItemStack; output?: ItemStack; readyAt?: number; }

export interface MapState { objects: Record<string, WObj>; soil: Record<string, Soil>; floors?: Record<string, string> }

export interface AnimalState { id: string; kind: string; name: string; building: string; age: number; friendship: number; happiness: number; fedToday: boolean; pettedToday: boolean; produce?: string; x: number; y: number; color: string }

export interface FarmBuilding { id: string; type: string; x: number; y: number; level: number; daysLeft: number; hay?: number; troughs?: boolean[] }

export interface NPCState { friendship: number; talkedToday: boolean; giftsWeek: number; giftedToday: boolean; events: string[]; dating?: boolean; engaged?: number; married?: boolean; met?: boolean; birthdayGift?: number }

export interface Quest { id: string; kind: 'story' | 'request' | 'daily' | 'explore' | 'slay'; title: string; desc: string; npc?: string; item?: string; qty?: number; progress?: number; target?: number; monster?: string; reward: number; deadline?: number; friendship?: number; done?: boolean; rewardItem?: ItemStack }

export interface SkillState { xp: number; level: number; profs: string[] }

export interface GameState {
  version: number;
  seed: number;
  player: {
    name: string; farmName: string; favAnimal: string; look: Look; presentation: string;
    map: string; x: number; y: number; facing: 'up' | 'down' | 'left' | 'right';
    energy: number; maxEnergy: number; hp: number; maxHp: number; money: number; totalEarned: number;
    exhausted?: boolean; weapon?: string; horse?: boolean;
  };
  time: { day: number; season: number; year: number; minutes: number };
  weather: { today: 'sol' | 'chuva' | 'tempestade' | 'neve' | 'vento'; tomorrow: 'sol' | 'chuva' | 'tempestade' | 'neve' | 'vento' };
  inventory: (ItemStack | null)[];
  invSize: number;
  tools: Record<string, number>; // nível 0..4
  toolUpgrade?: { tool: string; daysLeft: number; level: number };
  water: number; // água do regador
  maps: Record<string, MapState>;
  buildings: FarmBuilding[];
  animals: AnimalState[];
  houseLevel: number;
  houseUpgradeDays?: number;
  npcs: Record<string, NPCState>;
  quests: Quest[];
  questsDone: string[];
  skills: Record<'farming' | 'mining' | 'fishing' | 'foraging' | 'combat', SkillState>;
  pendingLevelUps: { skill: string; level: number }[];
  shipping: ItemStack[];
  lastShipped?: { items: ItemStack[]; total: number };
  mineDeepest: number;
  mail: { id: string; read: boolean }[];
  mailSeen: string[];
  recipes: string[]; // crafting
  cooking: string[]; // receitas de cozinha
  hall: Record<string, Record<string, (ItemStack | null)[]>>; // setor -> conjunto -> entregues
  hallDone: string[]; // setores concluídos
  flags: Record<string, any>;
  stats: Record<string, number>;
  collection: { fish: Record<string, number>; shipped: Record<string, number>; minerals: Record<string, number>; cooked: Record<string, number> };
  settings: { music: number; sfx: number; zoom: number };
  spouse?: string;
  festivalsDone: string[];
  luck: number;
  absTime?: number;
}

let STATE: GameState = null as any;
export function getState() { return STATE; }
export function setState(s: GameState) { STATE = s; }

export function newSkill(): SkillState { return { xp: 0, level: 0, profs: [] }; }

export function absMinutes(s: GameState) {
  const t = s.time;
  return ((((t.year - 1) * 4 + t.season) * 28 + (t.day - 1)) * 1440) + t.minutes;
}

export function mapState(id: string): MapState {
  const s = getState();
  if (!s.maps[id]) s.maps[id] = { objects: {}, soil: {} };
  return s.maps[id];
}

export const SEASON_NAMES = ['Primavera', 'Verão', 'Outono', 'Inverno'];
export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export function weekday(day: number) { return (day - 1) % 7; }
