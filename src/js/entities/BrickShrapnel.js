import Entity from "../Entity.ts";
import LifeLimit from "../traits/LifeLimit.ts";
import Gravity from "../traits/Gravity.ts";
import Velocity from "../traits/Velocity.ts";
import { loadAudioBoard } from "../loaders/audio.ts";
import { loadSpriteSheet } from "../loaders/sprite.js";

export function loadBrickShrapnel(audioContext) {
  return Promise.all([
    loadSpriteSheet("brick-shrapnel"),
    loadAudioBoard("brick-shrapnel", audioContext),
  ]).then(([sprite, audio]) => {
    return createFactory(sprite, audio);
  });
}

function createFactory(sprite, audio) {
  const spinBrick = sprite.animations.get("spinning-brick");

  function draw(context) {
    sprite.draw(spinBrick(this.lifetime), context, 0, 0);
  }

  return function createBrickShrapnel() {
    const entity = new Entity();
    entity.audio = audio;
    entity.size.set(8, 8);
    entity.addTrait(new LifeLimit());
    entity.addTrait(new Gravity());
    entity.addTrait(new Velocity());
    entity.draw = draw;
    return entity;
  };
}
