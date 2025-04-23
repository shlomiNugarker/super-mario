import { Vec2 } from './math.ts';
import AudioBoard from './AudioBoard.ts';
import BoundingBox from './BoundingBox.ts';
import EventBuffer from './EventBuffer.ts';
import Trait from './Trait.ts';
import { GameContext, MatchTile } from '../types/common';
import {
  ITraitEntity,
  Sides,
  TraitConstructor,
  GoTrait,
  JumpTrait,
  KillableTrait,
  PhysicsTrait,
  SolidTrait,
  PipeTravellerTrait,
  PoleTravellerTrait,
  StomperTrait,
  PendulumMoveTrait,
} from '../types/entity';
import { BoundedObject } from '../types/common';
import Level from './Level.ts';

/**
 * Alignment utilities for positioning entities relative to each other
 */
export const Align = {
  /**
   * Aligns the center of the subject to the center of the target
   */
  center(target: BoundedObject, subject: BoundedObject): void {
    subject.bounds.setCenter(target.bounds.getCenter());
  },

  /**
   * Aligns the bottom of the subject to the bottom of the target
   */
  bottom(target: BoundedObject, subject: BoundedObject): void {
    subject.bounds.bottom = target.bounds.bottom;
  },

  /**
   * Aligns the top of the subject to the top of the target
   */
  top(target: BoundedObject, subject: BoundedObject): void {
    subject.bounds.top = target.bounds.top;
  },

  /**
   * Aligns the left side of the subject to the left side of the target
   */
  left(target: BoundedObject, subject: BoundedObject): void {
    subject.bounds.left = target.bounds.left;
  },

  /**
   * Aligns the right side of the subject to the right side of the target
   */
  right(target: BoundedObject, subject: BoundedObject): void {
    subject.bounds.right = target.bounds.right;
  },
};

// Export Sides from types/entity
export { Sides };

/**
 * Base Entity class for all game objects
 * Handles position, velocity, traits, and collisions
 */
export default class Entity implements ITraitEntity {
  id: string | null;
  audio: AudioBoard;
  events: EventBuffer;
  sounds: Set<string>;
  pos: Vec2;
  vel: Vec2;
  size: Vec2;
  offset: Vec2;
  bounds: BoundingBox;
  lifetime: number;
  traits: Map<TraitConstructor, Trait>;

  constructor() {
    this.id = null;
    this.audio = new AudioBoard();
    this.events = new EventBuffer();
    this.sounds = new Set();

    this.pos = new Vec2(0, 0);
    this.vel = new Vec2(0, 0);
    this.size = new Vec2(0, 0);
    this.offset = new Vec2(0, 0);
    this.bounds = new BoundingBox(this.pos, this.size, this.offset);
    this.lifetime = 0;

    this.traits = new Map();
  }

  /**
   * Adds a trait to the entity
   * @param trait The trait to add
   */
  addTrait(trait: Trait): void {
    this.traits.set(trait.constructor as TraitConstructor, trait);
  }

  /**
   * Gets a trait by its constructor
   * @param TraitClass The trait constructor
   * @returns The trait instance or undefined if not found
   */
  getTrait<T extends Trait>(TraitClass: TraitConstructor<T>): T | undefined {
    return this.traits.get(TraitClass as TraitConstructor) as T | undefined;
  }

  /**
   * Gets Go trait
   */
  getGoTrait(): GoTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is GoTrait => 'acceleration' in trait && 'dragFactor' in trait
    );
  }

  /**
   * Gets Jump trait
   */
  getJumpTrait(): JumpTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is JumpTrait => 'velocity' in trait && 'falling' in trait && 'start' in trait
    );
  }

  /**
   * Gets Killable trait
   */
  getKillableTrait(): KillableTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is KillableTrait => 'dead' in trait && 'kill' in trait
    );
  }

  /**
   * Gets Physics trait
   */
  getPhysicsTrait(): PhysicsTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is PhysicsTrait => 'enabled' in trait && trait.constructor.name === 'Physics'
    );
  }

  /**
   * Gets Solid trait
   */
  getSolidTrait(): SolidTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is SolidTrait => 'enabled' in trait && trait.constructor.name === 'Solid'
    );
  }

  /**
   * Gets PipeTraveller trait
   */
  getPipeTravellerTrait(): PipeTravellerTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is PipeTravellerTrait => 'movement' in trait && 'distance' in trait
    );
  }

  /**
   * Gets PoleTraveller trait
   */
  getPoleTravellerTrait(): PoleTravellerTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is PoleTravellerTrait =>
        'distance' in trait && trait.constructor.name === 'PoleTraveller'
    );
  }

  /**
   * Gets Stomper trait
   */
  getStomperTrait(): StomperTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is StomperTrait => 'bounceSpeed' in trait
    );
  }

  /**
   * Gets PendulumMove trait
   */
  getPendulumMoveTrait(): PendulumMoveTrait | undefined {
    return Array.from(this.traits.values()).find(
      (trait): trait is PendulumMoveTrait =>
        'speed' in trait && trait.constructor.name === 'PendulumMove'
    );
  }

  /**
   * Handles collision with another entity
   * @param candidate The entity collided with
   */
  collides(candidate: Entity): void {
    this.traits.forEach((trait) => {
      trait.collides(this, candidate);
    });
  }

  /**
   * Handles obstruction from the environment
   * @param side The side that is obstructed
   * @param match The matching object causing obstruction
   */
  obstruct(side: symbol, match: MatchTile): void {
    this.traits.forEach((trait) => {
      trait.obstruct(this, side, match);
    });
  }

  /**
   * Finalizes the entity state after update
   * Processes pending events and tasks
   */
  finalize(): void {
    this.events.emit(Trait.EVENT_TASK, this);

    this.traits.forEach((trait) => {
      trait.finalize(this);
    });

    this.events.clear();
  }

  /**
   * Plays all queued sounds
   * @param audioBoard The audio board to use
   * @param audioContext The audio context
   */
  playSounds(audioBoard: AudioBoard, audioContext: AudioContext): void {
    this.sounds.forEach((name) => {
      audioBoard.playAudio(name, audioContext);
    });

    this.sounds.clear();
  }

  /**
   * Updates the entity state
   * @param gameContext The current game context
   * @param level The current level
   */
  update(gameContext: GameContext, level: Level): void {
    this.traits.forEach((trait) => {
      trait.update(this, gameContext, level);
    });

    this.playSounds(this.audio, gameContext.audioContext);

    this.lifetime += gameContext.deltaTime;
  }
}
