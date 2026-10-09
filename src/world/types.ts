// Tipos centrais do mundo: tiles, mapas, objetos e saídas.
import type { Sprite } from '../art/painter';

export enum T {
  VOID = 0, GRASS, DIRT, SAND, WATER, DEEP, CLIFF, WOOD, STONEFLOOR, COBBLE, BRIDGE, WALL,
  CAVE, CAVEWALL, TILEFLOOR, DARKGRASS, PLANKS, ROOF, FARMDIRT,
}

export interface TileInfo { solid: boolean; water?: boolean; tillable?: boolean; name: string; }
export const TILE_INFO: Record<number, TileInfo> = {
  [T.VOID]: { solid: true, name: 'vazio' },
  [T.GRASS]: { solid: false, tillable: true, name: 'grama' },
  [T.DIRT]: { solid: false, tillable: true, name: 'terra' },
  [T.FARMDIRT]: { solid: false, tillable: true, name: 'terra' },
  [T.SAND]: { solid: false, name: 'areia' },
  [T.WATER]: { solid: true, water: true, name: 'água' },
  [T.DEEP]: { solid: true, water: true, name: 'água funda' },
  [T.CLIFF]: { solid: true, name: 'penhasco' },
  [T.WOOD]: { solid: false, name: 'assoalho' },
  [T.STONEFLOOR]: { solid: false, name: 'piso de pedra' },
  [T.COBBLE]: { solid: false, name: 'calçamento' },
  [T.BRIDGE]: { solid: false, name: 'ponte' },
  [T.WALL]: { solid: true, name: 'parede' },
  [T.CAVE]: { solid: false, name: 'chão de caverna' },
  [T.CAVEWALL]: { solid: true, name: 'rocha' },
  [T.TILEFLOOR]: { solid: false, name: 'ladrilho' },
  [T.DARKGRASS]: { solid: false, tillable: true, name: 'grama densa' },
  [T.PLANKS]: { solid: false, name: 'tábuas' },
  [T.ROOF]: { solid: true, name: 'telhado' },
};

export type FishZone = 'rio' | 'lago' | 'mar' | 'mina' | 'enseada' | 'lagoa';

export interface Warp {
  x: number; y: number; w: number; h: number;
  to: string; tx: number; ty: number; dir?: 'up' | 'down' | 'left' | 'right';
  /** porta exige pressionar interagir em vez de apenas atravessar */
  door?: boolean;
  /** retorna mensagem de bloqueio, ou null se pode passar */
  gate?: () => string | null;
  label?: string;
}

/** Decoração estática definida pelo mapa (não salva). */
export interface Deco {
  x: number; y: number; // tile do "pé"
  sprite: string; // chave de sprite
  solid?: boolean; solidW?: number; solidH?: number; // área sólida em tiles a partir de (x,y) para cima/direita
  light?: { r: number; color: string; dx?: number; dy?: number; always?: boolean };
  sway?: boolean;
  interact?: string; // id de interação ("board", "hall", etc.)
  shadow?: boolean;
  flat?: boolean; // desenhado no chão (tapete, flores rasteiras)
  offY?: number;
}

/** Prédio estático (vila) com porta. */
export interface Building {
  id: string; x: number; y: number; w: number; h: number; // footprint em tiles (x,y = canto sup. esquerdo do footprint)
  sprite: string;
  door?: { x: number; y: number; to: string; tx: number; ty: number; gate?: () => string | null };
  name?: string;
  lights?: { dx: number; dy: number }[];
  chimney?: { dx: number; dy: number };
}

export interface MapDef {
  id: string; name: string; w: number; h: number;
  tiles: Uint8Array;
  outdoor: boolean;
  tillable: boolean;
  music: string;
  warps: Warp[];
  decos: Deco[];
  buildings: Building[];
  fishZone?: (x: number, y: number) => FishZone | null;
  wall?: string; floor?: string; // cores de interior
  biome?: number; // minas
  spawn?: { x: number; y: number };
  counters?: { x: number; y: number; shop: string }[];
  interacts?: { x: number; y: number; id: string }[];
  /** interior com luz própria (não escurece como exterior) */
  indoorLight?: boolean;
  isMine?: boolean;
  mineLevel?: number;
  festival?: boolean;
}

export interface SpriteStore { [k: string]: Sprite }
