import { Sides } from '../Entity.ts';
import Trait from '../Trait.ts';
import { PENDULUM_SPEED } from '../config.ts';

export default class PendulumMove extends Trait {
  private enabled: boolean;
  private speed: number;

  constructor() {
    super();
    this.enabled = true;
    this.speed = -PENDULUM_SPEED;
  }

  obstruct(_entity: any, side: symbol): void {
    if (side === Sides.LEFT || side === Sides.RIGHT) {
      this.speed = -this.speed;
    }
  }

  update(entity: any): void {
    if (this.enabled) {
      entity.vel.x = this.speed;
    }
  }
}
