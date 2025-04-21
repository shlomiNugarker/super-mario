import Trait from '../Trait.ts';

export default class LifeLimit extends Trait {
  time: number;

  constructor() {
    super();
    this.time = 2;
  }

  update(entity: any, _: any, level: any): void {
    if (entity.lifetime > this.time) {
      this.queue(() => {
        level.entities.delete(entity);
      });
    }
  }
}
