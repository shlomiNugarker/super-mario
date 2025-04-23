import { Vec2 } from '../js/math.ts';
import Level from '../js/Level.ts';
import { ITraitEntity, EntityFactory } from './entity';
import Camera from '../js/Camera.ts';
import TileResolver from '../js/TileResolver.ts';

/**
 * Game context passed to update methods
 */
export interface GameContext {
  audioContext: AudioContext;
  videoContext: CanvasRenderingContext2D | null;
  entityFactory: EntityFactories;
  deltaTime: number;
  tick: number;
  camera?: Camera; // Updated from any to Camera
}

/**
 * Collection of entity factories
 */
export interface EntityFactories {
  [name: string]: EntityFactory;

  // Common entity factories
  mario: EntityFactory;
  goomba: EntityFactory;
  koopa: EntityFactory;
  piranha: EntityFactory;
  flagpole: EntityFactory;
  bullet: EntityFactory;
  cannon: EntityFactory;
}

/**
 * Match object for tile collisions
 */
export interface MatchTile {
  tile: {
    name?: string;
    type?: string;
    behavior?: string;
  };
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  indexX: number;
  indexY: number;
}

/**
 * Context passed to tile collision handlers
 */
export interface TileCollisionContext {
  entity: ITraitEntity;
  match: MatchTile;
  resolver: TileResolver; // Updated from any to TileResolver
  gameContext: GameContext;
  level: Level;
}

/**
 * Interface for objects with bounds
 */
export interface BoundedObject {
  bounds: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    overlaps(bounds: BoundingBox): boolean; // Updated from any to BoundingBox
    getCenter(): Vec2;
    setCenter(center: Vec2): void;
  };
}

// BoundingBox interface to replace 'any'
export interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
  getCenter(): Vec2;
  setCenter(center: Vec2): void;
}

/**
 * Event callback type
 */
export type EventCallback = (...args: unknown[]) => void;

/**
 * Event listener interface
 */
export interface Listener {
  name: symbol | string;
  callback: EventCallback;
  count: number;
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Sprite animation frame
 */
export interface SpriteAnimationFrame {
  name: string;
  rect: [number, number, number, number]; // [x, y, width, height]
}

/**
 * Sprite sheet specification
 */
export interface SpriteSheetSpec {
  imageUrl: string;
  tileWidth: number;
  tileHeight: number;
  frames?: SpriteAnimationFrame[];
  animations?: Record<string, number[]>;
}

/**
 * Level specification for loading
 */
export interface LevelSpec {
  spriteSheet: string;
  musicSheet?: string;
  patterns?: Record<string, PatternSpec>;
  entities?: EntitySpec[];
  tiles: LayerSpec[];
  backgrounds?: LayerSpec[];
  triggers?: TriggerSpec[];
}

/**
 * Pattern specification for level loading
 */
export interface PatternSpec {
  tiles: TileSpec[];
}

/**
 * Tile specification for level loading
 */
export interface TileSpec {
  name: string;
  type?: string;
  ranges: [number, number, number, number][];
}

/**
 * Entity specification for level loading
 */
export interface EntitySpec {
  name: string;
  pos: [number, number];
  props?: Record<string, unknown>;
}

/**
 * Layer specification for level loading
 */
export interface LayerSpec {
  name: string;
  tiles: number[][];
  ranges?: [number, number, number, number][];
}

/**
 * Trigger specification for level loading
 */
export interface TriggerSpec {
  type: string;
  name?: string;
  pos: [number, number];
  width: number;
  height: number;
}

/**
 * SpriteSheet interface to make animations accessible
 */
export interface SpriteSheet {
  defineAnim(name: string, animation: (distance: number) => string): void;
  define(name: string, x: number, y: number, width: number, height: number): void;
  defineTile(name: string, x: number, y: number): void;
  draw(name: string, context: CanvasRenderingContext2D, x: number, y: number, flip?: boolean): void;
  drawAnim(
    name: string,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    distance: number
  ): void;
  drawTile(name: string, context: CanvasRenderingContext2D, x: number, y: number): void;

  // Make animations accessible for entity files
  animations: {
    get(name: string): (distance: number) => string;
  };
}
