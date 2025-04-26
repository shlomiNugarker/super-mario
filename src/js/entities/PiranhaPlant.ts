import Entity from '../Entity.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';
import { findPlayers } from '../player.ts';
import SpriteSheet from '../SpriteSheet.ts';
import Trait from '../Trait.ts';

export function loadPiranhaPlant() {
  return loadSpriteSheet('piranha-plant').then(createPiranhaPlantFactory);
}

class Behavior extends Trait {
  graceDistance: number;
  idleTime: number;
  idleCounter: number | null;
  attackTime: number;
  attackCounter: number | null;
  holdTime: number;
  holdCounter: number | null;
  retreatTime: number;
  retreatCounter: number | null;
  velocity: number;
  deltaMove: number;

  constructor() {
    super();

    this.graceDistance = 32;

    this.idleTime = 4;
    this.idleCounter = 0;
    this.attackTime = 2;
    this.attackCounter = null;
    this.holdTime = 2;
    this.holdCounter = null;
    this.retreatTime = 2;
    this.retreatCounter = null;

    this.velocity = 30;
    this.deltaMove = 0;
  }

  update(entity: Entity, gameContext: any, level: any): void {
    const { deltaTime } = gameContext;

    if (this.idleCounter !== null) {
      for (const player of findPlayers(level.entities)) {
        const distance = player.bounds.getCenter().distance(entity.bounds.getCenter());
        if (distance < this.graceDistance) {
          this.idleCounter = 0;
          return;
        }
      }

      this.idleCounter += deltaTime;
      if (this.idleCounter >= this.idleTime) {
        this.attackCounter = 0;
        this.idleCounter = null;
      }
    } else if (this.attackCounter !== null) {
      this.attackCounter += deltaTime;
      const movement = this.velocity * deltaTime;
      this.deltaMove += movement;
      entity.pos.y -= movement;
      if (this.deltaMove >= entity.size.y) {
        entity.pos.y += entity.size.y - this.deltaMove;
        this.attackCounter = null;
        this.holdCounter = 0;
      }
    } else if (this.holdCounter !== null) {
      this.holdCounter += deltaTime;
      if (this.holdCounter >= this.holdTime) {
        this.retreatCounter = 0;
        this.holdCounter = null;
      }
    } else if (this.retreatCounter !== null) {
      this.retreatCounter += deltaTime;
      const movement = this.velocity * deltaTime;
      this.deltaMove -= movement;
      entity.pos.y += movement;
      if (this.deltaMove <= 0) {
        entity.pos.y -= this.deltaMove;
        this.retreatCounter = null;
        this.idleCounter = 0;
      }
    }
  }
}

function createPiranhaPlantFactory(sprite: SpriteSheet) {
  const chewAnim = (sprite as any).animations.get('chew');

  function routeAnim(entity: { lifetime: number }) {
    return chewAnim(entity.lifetime);
  }

  function drawPiranhaPlant(this: Entity, context: CanvasRenderingContext2D) {
    sprite.draw(routeAnim(this), context, 0, 0);
  }

  return function createPiranhaPlant() {
    const entity = new Entity();
    entity.size.set(16, 24);

    entity.addTrait(new Behavior());

    (entity as any).draw = drawPiranhaPlant;

    return entity;
  };
}
