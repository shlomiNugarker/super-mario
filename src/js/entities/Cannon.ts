import Entity from '../Entity.ts';
import Emitter from '../traits/Emitter.ts';
import { findPlayers } from '../player.ts';
import { loadAudioBoard } from '../loaders/audio.ts';
import AudioBoard from '../AudioBoard.ts';

const HOLD_FIRE_THRESHOLD = 30;

export function loadCannon(audioContext: AudioContext): Promise<() => Entity> {
  return loadAudioBoard('cannon', audioContext).then((audio) => {
    return createCannonFactory(audio);
  });
}

function createCannonFactory(audio: AudioBoard) {
  function emitBullet(
    cannon: Entity,
    gameContext: { entityFactory: any; audioContext: AudioContext; deltaTime: number },
    level: { entities: any }
  ) {
    let dir = 1;
    for (const player of findPlayers(level.entities)) {
      if (
        player.pos.x > cannon.pos.x - HOLD_FIRE_THRESHOLD &&
        player.pos.x < cannon.pos.x + HOLD_FIRE_THRESHOLD
      ) {
        return;
      }

      if (player.pos.x < cannon.pos.x) {
        dir = -1;
      }
    }

    const bullet = gameContext.entityFactory.bullet();

    bullet.pos.copy(cannon.pos);
    bullet.vel.set(80 * dir, 0);

    cannon.sounds.add('shoot');
    level.entities.add(bullet);
  }

  return function createCannon(): Entity {
    const cannon = new Entity();
    cannon.audio = audio;

    const emitter = new Emitter();
    emitter.setInterval(4);
    emitter.addEmitter(emitBullet);
    cannon.addTrait(emitter);
    return cannon;
  };
}
