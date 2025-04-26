import Camera from './Camera.ts';
import MusicController from './MusicController.ts';
import EntityCollider from './EntityCollider.ts';
import Scene from './Scene.ts';
import TileCollider from './TileCollider.ts';
import { clamp, Vec2 } from './math.ts';
import { findPlayers } from './player.ts';
import Entity from './Entity.ts';
import { LevelEvents } from '../types/level';
import { GameContext } from '../types/common';
import { GRAVITY, DEBUG_COLLISIONS } from './config.ts';

/**
 * Minimal AudioPlayer interface for MusicController
 */
interface AudioPlayer {
  playTrack(trackName: string): {
    playbackRate: number;
    loop: boolean;
    addEventListener(event: string, listener: () => void, options?: { once: boolean }): void;
  };
  pauseAll(): void;
}

/**
 * Focuses the camera on the player
 * @param level Level to focus camera on
 */
function focusPlayer(level: Level): void {
  for (const player of findPlayers(level.entities)) {
    level.camera.pos.x = clamp(
      player.pos.x - 100,
      level.camera.min.x,
      level.camera.max.x - level.camera.size.x
    );
  }
}

/**
 * Collection of entities with extra functionality
 */
class EntityCollection extends Set<Entity> {
  /**
   * Get an entity by id
   * @param id Entity id
   * @returns Entity or undefined
   */
  get(id: string): Entity | undefined {
    for (const entity of this) {
      if (entity.id === id) {
        return entity;
      }
    }
    return undefined;
  }

  /**
   * Get entities within the viewport with optional margin
   * @param camera Camera defining the viewport
   * @param margin Extra margin around viewport to include
   * @returns Set of entities in the viewport
   */
  getInViewport(camera: Camera, margin: number = 100): Set<Entity> {
    const result = new Set<Entity>();

    // Calculate viewport bounds with margin
    const left = camera.pos.x - margin;
    const right = camera.pos.x + camera.size.x + margin;
    const top = camera.pos.y - margin;
    const bottom = camera.pos.y + camera.size.y + margin;

    // Find entities in viewport
    for (const entity of this) {
      // Simple AABB check
      if (
        entity.bounds.right >= left &&
        entity.bounds.left <= right &&
        entity.bounds.bottom >= top &&
        entity.bounds.top <= bottom
      ) {
        result.add(entity);
      }
    }

    return result;
  }
}

/**
 * Level class representing a game level
 */
export default class Level extends Scene {
  static readonly EVENT_TRIGGER = LevelEvents.TRIGGER;
  static readonly EVENT_COMPLETE = LevelEvents.COMPLETE;

  public name: string;
  public checkpoints: Vec2[];
  public gravity: number;
  public totalTime: number;
  public camera: Camera;
  public music: MusicController<AudioPlayer>;
  public entities: EntityCollection;
  public entityCollider: EntityCollider;
  public tileCollider: TileCollider;
  private lastUpdateTime: number = 0;
  private spatialUpdateFrequency: number = 0.1; // Update spatial grid every 100ms

  constructor() {
    super();

    this.name = '';
    this.checkpoints = [];
    this.gravity = GRAVITY;
    this.totalTime = 0;
    this.camera = new Camera();
    this.music = new MusicController();
    this.entities = new EntityCollection();
    this.entityCollider = new EntityCollider(this.entities as unknown as Entity[]);
    this.tileCollider = new TileCollider();

    // Enable debug mode for tile collider if debug collisions are enabled
    this.tileCollider.setDebug(DEBUG_COLLISIONS);
  }

  /**
   * Draw the level
   * @param gameContext Game context
   */
  override draw(gameContext: GameContext): void {
    if (gameContext.videoContext) {
      this.comp.draw(gameContext.videoContext, this.camera);
    }
  }

  /**
   * Update the level
   * @param gameContext Game context
   */
  override update(gameContext: GameContext): void {
    // Update only entities in viewport for better performance
    const activeEntities = this.entities.getInViewport(this.camera);

    // Update spatial grid when needed
    if (this.totalTime - this.lastUpdateTime > this.spatialUpdateFrequency) {
      this.tileCollider.updateSpatialGrid(activeEntities);
      this.lastUpdateTime = this.totalTime;
    }

    // Update active entities
    for (const entity of activeEntities) {
      entity.update(gameContext, this);
    }

    // Check collisions using optimized collision detection
    for (const entity of activeEntities) {
      // Use spatial grid to find potential colliders
      const potentialColliders = this.tileCollider.getPotentialColliders(entity);

      // Check only against potential colliders
      for (const collider of potentialColliders) {
        if (collider.bounds.overlaps(entity.bounds)) {
          entity.collides(collider);
        }
      }
    }

    // Finalize all entities
    for (const entity of this.entities) {
      entity.finalize();
    }

    focusPlayer(this);
    this.totalTime += gameContext.deltaTime;
  }

  /**
   * Pause the level
   */
  override pause(): void {
    this.music.pause();
  }

  /**
   * Add entity to level
   * @param entity Entity to add
   */
  addEntity(entity: Entity): void {
    this.entities.add(entity);
  }

  /**
   * Remove entity from level
   * @param entity Entity to remove
   */
  removeEntity(entity: Entity): void {
    this.entities.delete(entity);
  }
}
