import { Vec2 } from '../math.ts';
import Trait from '../Trait.ts';

export default class PipeTraveller extends Trait {
  direction: Vec2;
  movement: Vec2;
  distance: Vec2;

  constructor() {
    super();
    this.direction = new Vec2(0, 0);
    this.movement = new Vec2(0, 0);
    this.distance = new Vec2(0, 0);
  }
}
