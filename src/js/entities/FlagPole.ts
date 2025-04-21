import Entity from '../Entity.ts';
import Pole from '../traits/Pole.ts';
import { loadAudioBoard } from '../loaders/audio.ts';
import AudioBoard from '../AudioBoard.ts';

export function loadFlagPole(audioContext: AudioContext): Promise<() => Entity> {
  return Promise.all([loadAudioBoard('flag-pole', audioContext)]).then(([audio]) => {
    return createFactory(audio);
  });
}

function createFactory(audio: AudioBoard): () => Entity {
  return function createFlagPole(): Entity {
    const entity = new Entity();
    const pole = new Pole();
    entity.audio = audio;
    entity.size.set(8, 144);
    entity.offset.set(4, 0);
    entity.addTrait(pole);
    return entity;
  };
}
