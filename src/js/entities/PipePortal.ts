import { Direction } from '../math.ts';
import Entity from '../Entity.ts';
import Pipe from '../traits/Pipe.ts';
import { loadAudioBoard } from '../loaders/audio.ts';
import AudioBoard from '../AudioBoard.ts';

interface PipePortalProps {
  dir: keyof typeof Direction;
  goesTo?: {
    name: string;
  };
  backTo?: string;
}

export function loadPipePortal(
  audioContext: AudioContext
): Promise<(props: PipePortalProps) => Entity> {
  return Promise.all([loadAudioBoard('pipe-portal', audioContext)]).then(([audio]) => {
    return createFactory(audio);
  });
}

function createFactory(audio: AudioBoard): (props: PipePortalProps) => Entity {
  return function createPipePortal(props: PipePortalProps): Entity {
    const pipe = new Pipe();
    pipe.direction.copy(Direction[props.dir]);
    const entity = new Entity();
    (entity as any).props = props; // Type assertion needed since props is not on Entity type
    entity.audio = audio;
    entity.size.set(24, 30);
    entity.addTrait(pipe);
    return entity;
  };
}
