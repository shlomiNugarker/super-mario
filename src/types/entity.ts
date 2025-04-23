import { Vec2 } from '../js/math.ts';
import Trait from '../js/Trait.ts';
import BoundingBox from '../js/BoundingBox.ts';
import { GameContext, MatchTile } from './common';
import EventBuffer from '../js/EventBuffer.ts';
import AudioBoard from '../js/AudioBoard.ts';
import Level from '../js/Level.ts';

/**
 * Type for trait constructor
 */
export type TraitConstructor<T extends Trait = Trait> = new (...args: unknown[]) => T;

/**
 * Specific trait types for better type checking
 */
export interface GoTrait extends Trait {
  acceleration: number;
  dragFactor: number;
  distance: number;
  heading: number;
  dir: number;
  isDraging(): boolean;
}

export interface JumpTrait extends Trait {
  velocity: number;
  ready: number;
  duration: number;
  requestTime: number;
  gracePeriod: number;
  speedBoost: number;
  falling: boolean;
  engageTime: number;
  requestJump(entity: ITraitEntity): void;
  start(): void;
  cancel(): void;
}

export interface StomperTrait extends Trait {
  bounceSpeed: number;
}

export interface KillableTrait extends Trait {
  dead: boolean;
  removeAfter: number;
  kill(): void;
  revive(): void;
}

export interface PipeTravellerTrait extends Trait {
  movement: Vec2;
  distance: Vec2;
  inPipe: boolean;
}

export interface PoleTravellerTrait extends Trait {
  distance: number;
  climbing: boolean;
  attachToFlagpole(pole: ITraitEntity): void;
}

export interface PhysicsTrait extends Trait {
  enabled: boolean;
}

export interface SolidTrait extends Trait {
  enabled: boolean;
}

export interface PendulumMoveTrait extends Trait {
  speed: number;
  enabled: boolean;
}

/**
 * Base entity interface without traits
 */
export interface IEntity {
  id: string | null;
  pos: Vec2;
  vel: Vec2;
  size: Vec2;
  offset: Vec2;
  bounds: BoundingBox;
  lifetime: number;
  events: EventBuffer;

  // Audio methods
  audio: AudioBoard;
  sounds: Set<string>;
  playSounds(audioBoard: AudioBoard, audioContext: AudioContext): void;

  update(gameContext: GameContext, level: Level): void;
  finalize(): void;

  // Drawing method
  draw: (context: CanvasRenderingContext2D) => void;
}

/**
 * Entity with traits
 */
export interface ITraitEntity extends IEntity {
  traits: Map<TraitConstructor, Trait>;

  addTrait(trait: Trait): void;
  getTrait<T extends Trait>(TraitClass: TraitConstructor<T>): T | undefined;
  collides(candidate: ITraitEntity): void;
  obstruct(side: symbol, match: MatchTile): void;

  // Specific trait getters for convenience and type safety
  getGoTrait(): GoTrait | undefined;
  getJumpTrait(): JumpTrait | undefined;
  getKillableTrait(): KillableTrait | undefined;
  getPhysicsTrait(): PhysicsTrait | undefined;
  getSolidTrait(): SolidTrait | undefined;
  getPipeTravellerTrait(): PipeTravellerTrait | undefined;
  getPoleTravellerTrait(): PoleTravellerTrait | undefined;
  getStomperTrait(): StomperTrait | undefined;
  getPendulumMoveTrait(): PendulumMoveTrait | undefined;
}

/**
 * Mario entity with specific Mario behavior
 */
export interface MarioEntity extends ITraitEntity {
  turbo(on: boolean): void;
}

/**
 * Enemy entity with specific enemy behavior
 */
export interface EnemyEntity extends ITraitEntity {
  // Enemy-specific properties
  isActive: boolean;

  // Enemy-specific methods
  activate(): void;
  deactivate(): void;
  getEnemyType(): string;
}

/**
 * Entity factory options
 */
export interface EntityFactoryOptions {
  spriteSheet?: string;
  audio?: string;

  // Common trait options
  jumpVelocity?: number;
  goAcceleration?: number;
  goDragFactor?: number;

  // Position options
  startX?: number;
  startY?: number;

  // Custom props
  [key: string]: unknown;
}

/**
 * Entity factory function type
 */
export type EntityFactory<T extends IEntity = IEntity> = (options?: EntityFactoryOptions) => T;

/**
 * Sides for collision detection
 */
export const Sides = {
  TOP: Symbol('top'),
  BOTTOM: Symbol('bottom'),
  LEFT: Symbol('left'),
  RIGHT: Symbol('right'),
};
