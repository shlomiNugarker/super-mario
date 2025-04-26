import { Sides } from '../Entity.ts';
import Trait from '../Trait.ts';

// We'll use a type that just ensures the essential properties we need
type EntityWithSounds = {
  sounds: Set<string>;
  vel: {
    x: number;
    y: number;
  };
};

export default class Jump extends Trait {
  ready: number;
  duration: number;
  engageTime: number;
  requestTime: number;
  gracePeriod: number;
  speedBoost: number;
  velocity: number;

  constructor() {
    super();

    this.ready = 0;
    this.duration = 0.3;
    this.engageTime = 0;
    this.requestTime = 0;
    this.gracePeriod = 0.1;
    this.speedBoost = 0.3;
    this.velocity = 200;
  }

  get falling(): boolean {
    return this.ready < 0;
  }

  start(): void {
    this.requestTime = this.gracePeriod;
  }

  cancel(): void {
    this.engageTime = 0;
    this.requestTime = 0;
  }

  obstruct(_entity: EntityWithSounds, side: symbol): void {
    if (side === Sides.BOTTOM) {
      this.ready = 1;
    } else if (side === Sides.TOP) {
      this.cancel();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(entity: EntityWithSounds, gameContext: { deltaTime: number }, _level: any): void {
    const { deltaTime } = gameContext;

    if (this.requestTime > 0) {
      if (this.ready > 0) {
        entity.sounds.add('jump');
        this.engageTime = this.duration;
        this.requestTime = 0;
      }

      this.requestTime -= deltaTime;
    }

    if (this.engageTime > 0) {
      entity.vel.y = -(this.velocity + Math.abs(entity.vel.x) * this.speedBoost);
      this.engageTime -= deltaTime;
    }

    this.ready--;
  }
}
