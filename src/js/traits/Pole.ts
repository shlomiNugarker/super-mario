import Trait from '../Trait.ts';
import Entity from '../Entity.ts';

export default class Pole extends Trait {
  static FLAG_TOP_POS = Symbol('flag top position');

  private distance: number;
  private velocity: number;
  private handled: boolean; // Whether the pole traversal has been handled

  constructor() {
    super();
    this.distance = 0;
    this.velocity = 100;
    this.handled = false;
  }

  setHandled(val: boolean): void {
    this.handled = val;
  }

  isHandled(): boolean {
    return this.handled;
  }

  /**
   * Gets the total distance of the pole
   * @returns The distance of the pole
   */
  getDistance(): number {
    return this.distance;
  }

  /**
   * Sets the total distance of the pole
   * @param dist The distance to set
   */
  setDistance(dist: number): void {
    this.distance = dist;
  }

  /**
   * Gets velocity to descend the pole at
   * @returns The velocity
   */
  getVelocity(): number {
    return this.velocity;
  }

  /**
   * Sets velocity to descend the pole at
   * @param vel The velocity to set
   */
  setVelocity(vel: number): void {
    this.velocity = vel;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_pole: Entity, _gameContext: { deltaTime: number }, _level: any): void {
    // Custom update method for the pole - no implementation needed yet
  }
}
