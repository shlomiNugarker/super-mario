import Trait from '../Trait.ts';
import Entity from '../Entity.ts';

export default class Emitter extends Trait {
  private interval: number;
  private coolDown: number;
  private emitters: ((entity: Entity, gameContext: any, level: any) => void)[];

  constructor() {
    super();
    this.interval = 2;
    this.coolDown = this.interval;
    this.emitters = [];
  }

  emit(entity: Entity, gameContext: any, level: any): void {
    for (const emitter of this.emitters) {
      emitter(entity, gameContext, level);
    }
  }

  update(entity: Entity, gameContext: any, level: any): void {
    const { deltaTime } = gameContext;
    this.coolDown -= deltaTime;
    if (this.coolDown <= 0) {
      this.emit(entity, gameContext, level);
      this.coolDown = this.interval;
    }
  }

  // Add accessor methods
  setInterval(interval: number): void {
    this.interval = interval;
  }

  getInterval(): number {
    return this.interval;
  }

  addEmitter(emitter: (entity: any, gameContext: any, level: any) => void): void {
    this.emitters.push(emitter);
  }
}
