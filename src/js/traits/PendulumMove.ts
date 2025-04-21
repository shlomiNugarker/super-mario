import { Sides } from '../Entity.ts';
import Trait from '../Trait.ts';

export default class PendulumMove extends Trait {
  private enabled: boolean;
  private speed: number;

  constructor() {
    super();
    this.enabled = true;
    this.speed = -30;
  }

  obstruct(entity: any, side: symbol): void {
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
