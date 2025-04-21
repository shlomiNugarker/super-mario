import { Vec2 } from '../math.ts';
import Trait from '../Trait.ts';

export default class PoleTraveller extends Trait {
  distance: number;

  constructor() {
    super();
    this.distance = 0;
  }
}
