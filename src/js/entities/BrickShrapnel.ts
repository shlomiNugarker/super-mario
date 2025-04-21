import Entity from '../Entity.ts';
import LifeLimit from '../traits/LifeLimit.ts';
import Gravity from '../traits/Gravity.ts';
import Velocity from '../traits/Velocity.ts';
import { loadAudioBoard } from '../loaders/audio.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';
import SpriteSheet from '../SpriteSheet.ts';
import AudioBoard from '../AudioBoard.ts';

export function loadBrickShrapnel(audioContext: AudioContext) {
  return Promise.all([
    loadSpriteSheet('brick-shrapnel'),
    loadAudioBoard('brick-shrapnel', audioContext),
  ]).then(([sprite, audio]) => {
    return createFactory(sprite, audio);
  });
}

function createFactory(sprite: SpriteSheet, audio: AudioBoard) {
  function draw(this: Entity, context: CanvasRenderingContext2D) {
    sprite.drawAnim('spinning-brick', context, 0, 0, this.lifetime);
  }

  return function createBrickShrapnel() {
    const entity = new Entity();
    entity.audio = audio;
    entity.size.set(8, 8);
    entity.addTrait(new LifeLimit());
    entity.addTrait(new Gravity());
    entity.addTrait(new Velocity());
    (entity as any).draw = draw;
    return entity;
  };
}
