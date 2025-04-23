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
import { GRAVITY } from './config.ts';

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
    this.entities.forEach((entity) => {
      entity.update(gameContext, this);
    });

    this.entities.forEach((entity) => {
      this.entityCollider.check(entity);
    });

    this.entities.forEach((entity) => {
      entity.finalize();
    });

    focusPlayer(this);

    this.totalTime += gameContext.deltaTime;
  }

  /**
   * Pause the level
   */
  override pause(): void {
    this.music.pause();
  }
}
