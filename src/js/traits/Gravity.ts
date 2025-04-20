import Trait from "../Trait.ts";

export default class Gravity extends Trait {
  update(entity: any, { deltaTime }: { deltaTime: number }, level: any): void {
    entity.vel.y += level.gravity * deltaTime;
  }
}
