import Camera from './Camera.ts';
import MusicController from './MusicController.ts';
import EntityCollider from './EntityCollider.ts';
import Scene from './Scene.ts';
import TileCollider from './TileCollider.js';
import { clamp, Vec2 } from './math.ts';
import { findPlayers } from './player.ts';
import Compositor from './Compositor.ts';
import Entity from './Entity.ts';

function focusPlayer(level: Level): void {
  for (const player of findPlayers(level.entities)) {
    level.camera.pos.x = clamp(
      player.pos.x - 100,
      level.camera.min.x,
      level.camera.max.x - level.camera.size.x
    );
  }
}

class EntityCollection extends Set<Entity> {
  get(id: string): Entity | undefined {
    for (const entity of this) {
      if (entity.id === id) {
        return entity;
      }
    }
    return undefined;
  }
}

export default class Level extends Scene {
  static readonly EVENT_TRIGGER = Symbol('trigger');
  static readonly EVENT_COMPLETE = Symbol('complete') as unknown as string;

  public name: string;
  public checkpoints: Vec2[];
  public gravity: number;
  public totalTime: number;
  public camera: Camera;
  public music: MusicController<any>;
  public entities: EntityCollection;
  public entityCollider: EntityCollider;
  public tileCollider: TileCollider;
  declare protected comp: Compositor;

  constructor() {
    super();

    this.name = '';
    this.checkpoints = [];
    this.gravity = 1500;
    this.totalTime = 0;
    this.camera = new Camera();
    this.music = new MusicController();
    this.entities = new EntityCollection();
    this.entityCollider = new EntityCollider(this.entities as unknown as Entity[]);
    this.tileCollider = new TileCollider();
  }

  override draw(gameContext: any): void {
    this.comp.draw(gameContext.videoContext, this.camera);
  }

  override update(gameContext: any): void {
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

  override pause(): void {
    this.music.pause();
  }
}
