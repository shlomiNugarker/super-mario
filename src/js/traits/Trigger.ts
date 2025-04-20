import Trait from "../Trait.ts";
import { Entity } from "../Trait.ts";

export default class Trigger extends Trait {
  touches: Set<Entity>;
  conditions: Array<
    (entity: Entity, touches: Set<Entity>, gameContext: any, level: any) => void
  >;

  constructor() {
    super();
    this.touches = new Set();
    this.conditions = [];
  }

  collides(_: Entity, them: Entity): void {
    this.touches.add(them);
  }

  update(entity: Entity, gameContext: any, level: any): void {
    if (this.touches.size > 0) {
      for (const condition of this.conditions) {
        condition(entity, this.touches, gameContext, level);
      }
      this.touches.clear();
    }
  }
}
