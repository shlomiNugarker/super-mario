import { Vec2, Direction } from '../math.ts';
import { Sides, Align } from '../Entity.ts';
import Trait from '../Trait.ts';
import PoleTraveller from './PoleTraveller.ts';
import Entity from '../Entity.ts';

interface TravellerState {
  current: Vec2;
  goal: Vec2;
  done: boolean;
}

function createTravellerState(): TravellerState {
  return {
    current: new Vec2(0, 0),
    goal: new Vec2(0, 0),
    done: false,
  };
}

export default class Pole extends Trait {
  velocity: number;
  travellers: Map<Entity, TravellerState>;

  constructor() {
    super();
    this.velocity = 100;
    this.travellers = new Map();
  }

  addTraveller(pole: Entity, traveller: Entity): void {
    pole.sounds.add('ride');

    const poleTraveller = traveller.traits.get(PoleTraveller) as PoleTraveller;
    poleTraveller.distance = 0;

    const state = createTravellerState();
    state.current.x = pole.bounds.meridian;
    state.current.y = traveller.bounds.bottom;
    state.goal.x = state.current.x;
    state.goal.y = pole.bounds.bottom;
    this.travellers.set(traveller, state);
  }

  collides(pole: Entity, traveller: Entity): void {
    if (!traveller.traits.has(PoleTraveller)) {
      return;
    }

    if (this.travellers.has(traveller)) {
      return;
    }

    this.addTraveller(pole, traveller);
  }

  update(pole: Entity, gameContext: { deltaTime: number }, level: any): void {
    const { deltaTime } = gameContext;
    const distance = this.velocity * deltaTime;
    for (const [traveller, state] of this.travellers.entries()) {
      if (!state.done) {
        state.current.y += distance;
        traveller.bounds.right = state.current.x;
        traveller.bounds.bottom = state.current.y;

        const poleTraveller = traveller.traits.get(PoleTraveller) as PoleTraveller;
        poleTraveller.distance += distance;

        if (traveller.bounds.bottom > state.goal.y) {
          state.done = true;
          traveller.bounds.bottom = state.goal.y;
          poleTraveller.distance = 0;
        }
      } else if (!pole.bounds.overlaps(traveller.bounds)) {
        this.travellers.delete(traveller);
      }
    }
  }
}
