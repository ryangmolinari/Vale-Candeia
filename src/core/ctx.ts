// Contexto global compartilhado (preenchido em game.ts) para desacoplar módulos.
import type { World } from '../world/world';
import type { FX } from '../render/fx';

export interface GameCtx {
  world: World;
  player: any;
  fx: FX;
  npcs: any;
  ui: any;
  drops: any[];
  monsters: any[];
  animals: any[];
  fishing: any;
  cutscene: any;
  festival: any;
  placement: any;
  frame: number;
  now: number;
  clockAcc: number;
  lightningT: number;
  warp: (map: string, tx: number, ty: number, dir?: 'up' | 'down' | 'left' | 'right', opts?: { instant?: boolean; fresh?: boolean }) => void;
  toast: (msg: string, icon?: string, color?: string) => void;
  paused: () => boolean;
  sleep: (fainted?: boolean) => void;
  started: boolean;
}

export const G: GameCtx = {} as any;
