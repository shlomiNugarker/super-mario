import { Vec2 } from '../math.ts';
import Trait from '../Trait.ts';
import Entity from '../Entity.ts';

declare class Pipe extends Trait {
  direction: Vec2;
  addTraveller(pipeEntity: Entity, travellerEntity: Entity): void;
}

export function connectEntity(pipeEntity: Entity, travellerEntity: Entity): void;

export default Pipe; 