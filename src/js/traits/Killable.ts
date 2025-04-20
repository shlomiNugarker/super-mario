import Trait from "../Trait.ts";
import Entity from "../Entity.ts";

export default class Killable extends Trait {
  dead: boolean;
  deadTime: number;
  removeAfter: number;

  constructor() {
    super();
    this.dead = false;
    this.deadTime = 0;
    this.removeAfter = 2;
  }

  kill(): void {
    this.queue(() => (this.dead = true));
  }

  revive(): void {
    this.dead = false;
    this.deadTime = 0;
  }

  update(
    entity: Entity,
    { deltaTime }: { deltaTime: number },
    level: any
  ): void {
    if (this.dead) {
      this.deadTime += deltaTime;
      if (this.deadTime > this.removeAfter) {
        this.queue(() => {
          level.entities.delete(entity);
        });
      }
    }
  }
}
