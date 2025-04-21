import Trait from '../Trait.ts';
import Entity from '../Entity.ts';

export default class Physics extends Trait {
  update(entity: Entity, gameContext: any, level: any): void {
    const { deltaTime } = gameContext;
    entity.pos.x += entity.vel.x * deltaTime;
    level.tileCollider.checkX(entity, gameContext, level);

    entity.pos.y += entity.vel.y * deltaTime;
    level.tileCollider.checkY(entity, gameContext, level);

    entity.vel.y += level.gravity * deltaTime;
  }
}
