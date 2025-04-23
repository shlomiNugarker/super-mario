import { Matrix } from '../js/math.ts';
import { GameContext } from './common';

/**
 * Base scene interface
 */
export interface IScene {
  update(gameContext: GameContext): void;
  draw(gameContext: GameContext): void;
  pause?(): void;
  resume?(): void;
}

/**
 * Level specification from JSON
 */
export interface LevelSpec {
  spriteSheet: string;
  musicSheet: string;
  patternSheet: string;
  layers: LayerSpec[];
  entities: EntitySpec[];
  triggers?: TriggerSpec[];
  checkpoints?: number[][];
}

/**
 * Layer specification
 */
export interface LayerSpec {
  tiles: TileSpec[];
}

/**
 * Tile specification
 */
export interface TileSpec {
  name: string;
  type?: string;
  pattern?: string;
  ranges: number[][];
}

/**
 * Entity specification
 */
export interface EntitySpec {
  name: string;
  pos: [number, number];
  id?: string;
  props?: Record<string, unknown>;
}

/**
 * Trigger specification
 */
export interface TriggerSpec {
  type: string;
  name?: string;
  pos: [number, number];
  [key: string]: unknown;
}

/**
 * Pattern specification
 */
export interface PatternSpec {
  [key: string]: {
    tiles: TileSpec[];
  };
}

/**
 * Level events
 */
export const LevelEvents = {
  TRIGGER: Symbol('trigger'),
  COMPLETE: 'scene complete' as string,
};

/**
 * Tile interface
 */
export interface Tile {
  style: string;
  type?: string;
  name?: string;
  behavior?: string;
}

/**
 * Tile match interface
 */
export interface TileMatch {
  tile: Tile;
  indexX: number;
  indexY: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/**
 * TileResolver interface
 */
export interface ITileResolver {
  toIndex(pos: number): number;
  toIndexRange(pos1: number, pos2: number): number[];
  getByIndex(indexX: number, indexY: number): TileMatch | undefined;
  matchByIndex(indexX: number, indexY: number): TileMatch | undefined;
  matchByPosition(x: number, y: number): TileMatch | undefined;
  searchByRange(x1: number, x2: number, y1: number, y2: number): TileMatch[];
  tileSize: number;
  matrix: Matrix<Tile>;
}
