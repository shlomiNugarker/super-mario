import Trait from "../Trait.ts";

export default class Gravity extends Trait {
  update(entity, { deltaTime }, level) {
    entity.vel.y += level.gravity * deltaTime;
  }
}
