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

  // Cache for trait lookups to improve performance
  private traitCache: Map<string, Trait | undefined>;

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
    this.traitCache = new Map();
  }

  /**
   * Adds a trait to the entity
   * @param trait The trait to add
   */
  addTrait(trait: Trait): void {
    this.traits.set(trait.constructor as TraitConstructor, trait);
    // Clear cache when adding a trait
    this.traitCache.clear();
  }

  /**
   * Removes a trait from the entity
   * @param TraitClass The trait constructor to remove
   */
  removeTrait<T extends Trait>(TraitClass: TraitConstructor<T>): void {
    this.traits.delete(TraitClass as TraitConstructor);
    // Clear cache when removing a trait
    this.traitCache.clear();
  }

  /**
   * Checks if entity has a trait
   * @param TraitClass The trait constructor to check for
   * @returns True if entity has the trait
   */
  hasTrait<T extends Trait>(TraitClass: TraitConstructor<T>): boolean {
    return this.traits.has(TraitClass as TraitConstructor);
  }

  /**
   * Gets a trait by its constructor
   * @param TraitClass The trait constructor
   * @returns The trait instance or undefined if not found
   */
  getTrait<T extends Trait>(TraitClass: TraitConstructor<T>): T | undefined {
    const cacheKey = TraitClass.name;

    if (this.traitCache.has(cacheKey)) {
      return this.traitCache.get(cacheKey) as T | undefined;
    }

    const trait = this.traits.get(TraitClass as TraitConstructor) as T | undefined;
    this.traitCache.set(cacheKey, trait);
    return trait;
  }

  /**
   * Gets a trait by checking for characteristic properties
   * @param predicate Function to test if a trait has specific characteristics
   * @returns The first matching trait or undefined
   */
  getTraitByProperties<T extends Trait>(predicate: (trait: Trait) => trait is T): T | undefined {
    // Check cache for the predicate result
    const cacheKey = predicate.toString();

    if (this.traitCache.has(cacheKey)) {
      return this.traitCache.get(cacheKey) as T | undefined;
    }

    const trait = Array.from(this.traits.values()).find(predicate);
    this.traitCache.set(cacheKey, trait);
    return trait;
  }

  /**
   * Gets Go trait
   */
  getGoTrait(): GoTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is GoTrait => 'acceleration' in trait && 'dragFactor' in trait
    );
  }

  /**
   * Gets Jump trait
   */
  getJumpTrait(): JumpTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is JumpTrait => 'velocity' in trait && 'falling' in trait && 'start' in trait
    );
  }

  /**
   * Gets Killable trait
   */
  getKillableTrait(): KillableTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is KillableTrait => 'dead' in trait && 'kill' in trait
    );
  }

  /**
   * Gets Physics trait
   */
  getPhysicsTrait(): PhysicsTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is PhysicsTrait => 'enabled' in trait && trait.constructor.name === 'Physics'
    );
  }

  /**
   * Gets Solid trait
   */
  getSolidTrait(): SolidTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is SolidTrait => 'enabled' in trait && trait.constructor.name === 'Solid'
    );
  }

  /**
   * Gets PipeTraveller trait
   */
  getPipeTravellerTrait(): PipeTravellerTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is PipeTravellerTrait => 'movement' in trait && 'distance' in trait
    );
  }

  /**
   * Gets PoleTraveller trait
   */
  getPoleTravellerTrait(): PoleTravellerTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is PoleTravellerTrait =>
        'distance' in trait && trait.constructor.name === 'PoleTraveller'
    );
  }

  /**
   * Gets Stomper trait
   */
  getStomperTrait(): StomperTrait | undefined {
    return this.getTraitByProperties((trait): trait is StomperTrait => 'bounceSpeed' in trait);
  }

  /**
   * Gets PendulumMove trait
   */
  getPendulumMoveTrait(): PendulumMoveTrait | undefined {
    return this.getTraitByProperties(
      (trait): trait is PendulumMoveTrait => 'speed' in trait && 'amplitude' in trait
    );
  }

  /**
   * Handle collision with another entity
   * @param candidate Entity to collide with
   */
  collides(candidate: Entity): void {
    this.traits.forEach((trait) => {
      trait.collides(this, candidate);
    });
  }

  /**
   * Handle obstruction from a tile
   * @param side Which side was obstructed
   * @param match The tile that caused the obstruction
   */
  obstruct(side: symbol, match: MatchTile): void {
    this.traits.forEach((trait) => {
      trait.obstruct(this, side, match);
    });
  }

  /**
   * Finalize all traits, triggering any queued events
   */
  finalize(): void {
    this.traits.forEach((trait) => {
      trait.finalize(this);
    });

    this.events.clear();
  }

  /**
   * Play all sounds that have been triggered
   * @param audioBoard Audio board to use
   * @param audioContext Audio context
   */
  playSounds(audioBoard: AudioBoard, audioContext: AudioContext): void {
    this.sounds.forEach((name) => {
      audioBoard.playAudio(name, audioContext);
    });

    this.sounds.clear();
  }

  /**
   * Update entity state
   * @param gameContext Game context
   * @param level Level
   */
  update(gameContext: GameContext, level: Level): void {
    this.traits.forEach((trait) => {
      trait.update(this, gameContext, level);
    });

    this.lifetime += gameContext.deltaTime;
  }

  /**
   * Draw the entity
   * @param context Canvas context
   * @virtual
   */
  draw(_context: CanvasRenderingContext2D): void {
    // Implementation to be provided in subclasses
  }
}
