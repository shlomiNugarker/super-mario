import Trait from '../Trait.ts';

export default class Velocity extends Trait {
  update(entity: any, { deltaTime }: { deltaTime: number }, level: any): void {
    entity.pos.x += entity.vel.x * deltaTime;
    entity.pos.y += entity.vel.y * deltaTime;
  }
}
