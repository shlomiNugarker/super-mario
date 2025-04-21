import { Vec2, Direction } from '../math.ts';
import { Sides, Align } from '../Entity.ts';
import Trait from '../Trait.ts';
import PipeTraveller from './PipeTraveller.ts';
import Entity from '../Entity.ts';

interface TravellerState {
  time: number;
  start: Vec2;
  end: Vec2;
}

interface GameContext {
  deltaTime: number;
  audioContext: AudioContext;
}

interface LevelEvents {
  emit(name: symbol, pipe: Entity, traveller: Entity): void;
}

interface Level {
  events: LevelEvents;
}

function createTravellerState(): TravellerState {
  return {
    time: 0,
    start: new Vec2(0, 0),
    end: new Vec2(0, 0),
  };
}

export function connectEntity(pipeEntity: Entity, travellerEntity: Entity): void {
  const pipeTrait = pipeEntity.traits.get(Pipe) as Pipe | undefined;
  if (!pipeTrait) return;

  Align.center(pipeEntity, travellerEntity);
  if (pipeTrait.direction.equals(Direction.UP)) {
    Align.bottom(pipeEntity, travellerEntity);
  } else if (pipeTrait.direction.equals(Direction.DOWN)) {
    Align.top(pipeEntity, travellerEntity);
  } else if (pipeTrait.direction.equals(Direction.LEFT)) {
    Align.right(pipeEntity, travellerEntity);
  } else if (pipeTrait.direction.equals(Direction.RIGHT)) {
    Align.left(pipeEntity, travellerEntity);
  }
  pipeTrait.addTraveller(pipeEntity, travellerEntity);
}

export default class Pipe extends Trait {
  static EVENT_PIPE_COMPLETE = Symbol('pipe complete');

  private duration: number;
  direction: Vec2;
  private travellers: Map<Entity, TravellerState>;

  constructor() {
    super();
    this.duration = 1;
    this.direction = new Vec2(0, 0);
    this.travellers = new Map();
  }

  addTraveller(pipe: Entity, traveller: Entity): void {
    const pipeTraveller = traveller.traits.get(PipeTraveller) as PipeTraveller;
    pipeTraveller.distance.set(0, 0);

    const state = createTravellerState();
    state.start.copy(traveller.pos);
    state.end.copy(traveller.pos);
    state.end.x += this.direction.x * pipe.size.x;
    state.end.y += this.direction.y * pipe.size.y;
    this.travellers.set(traveller, state);
  }

  collides(pipe: Entity, traveller: Entity): void {
    if (!traveller.traits.has(PipeTraveller)) {
      return;
    }

    if (this.travellers.has(traveller)) {
      return;
    }

    const pipeTraveller = traveller.traits.get(PipeTraveller) as PipeTraveller;
    if (pipeTraveller.direction.equals(this.direction)) {
      const tBounds = traveller.bounds;
      const pBounds = pipe.bounds;
      if (this.direction.x && (tBounds.top < pBounds.top || tBounds.bottom > pBounds.bottom)) {
        return;
      }
      if (this.direction.y && (tBounds.left < pBounds.left || tBounds.right > pBounds.right)) {
        return;
      }
      pipe.sounds.add('pipe');
      this.addTraveller(pipe, traveller);
    }
  }

  update(pipe: Entity, gameContext: GameContext, level: Level): void {
    const { deltaTime } = gameContext;
    for (const [traveller, state] of this.travellers.entries()) {
      state.time += deltaTime;
      const progress = state.time / this.duration;
      traveller.pos.x = state.start.x + (state.end.x - state.start.x) * progress;
      traveller.pos.y = state.start.y + (state.end.y - state.start.y) * progress;
      traveller.vel.set(0, 0);

      const pipeTraveller = traveller.traits.get(PipeTraveller) as PipeTraveller;
      pipeTraveller.movement.copy(this.direction);
      pipeTraveller.distance.x = traveller.pos.x - state.start.x;
      pipeTraveller.distance.y = traveller.pos.y - state.start.y;

      if (state.time > this.duration) {
        this.travellers.delete(traveller);
        pipeTraveller.movement.set(0, 0);
        pipeTraveller.distance.set(0, 0);

        level.events.emit(Pipe.EVENT_PIPE_COMPLETE, pipe, traveller);
      }
    }
  }
}
