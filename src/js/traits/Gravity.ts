import Trait from '../Trait.ts';

export default class Gravity extends Trait {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(entity: any, _gameContext: any, level: any): void {
    entity.vel.y += level.gravity;
  }
}
