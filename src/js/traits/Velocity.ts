import Trait from '../Trait.ts';

export default class Velocity extends Trait {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(entity: any, { deltaTime }: { deltaTime: number }, _level: any): void {
    entity.pos.x += entity.vel.x * deltaTime;
    entity.pos.y += entity.vel.y * deltaTime;
  }
}
