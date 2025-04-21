import { Vec2 } from './math.ts';

export default class Camera {
  public pos: Vec2;
  public size: Vec2;
  public min: Vec2;
  public max: Vec2;

  constructor() {
    this.pos = new Vec2(0, 0);
    this.size = new Vec2(256, 224);

    this.min = new Vec2(0, 0);
    this.max = new Vec2(Infinity, Infinity);
  }
}
