import Trait from '../Trait.ts';
import Entity from '../Entity.ts';
import { GameContext } from '../../types/common';
import Level from '../Level.ts';
import Jump from './Jump.ts';

export default class Go extends Trait {
  dir: number;
  acceleration: number;
  deceleration: number;
  dragFactor: number;
  distance: number;
  heading: number;
  lastVelX: number; // Track the last velocity to detect changes
  isMoving: boolean; // Track whether the entity is currently moving

  constructor() {
    super();

    this.dir = 0;
    this.acceleration = 400;
    this.deceleration = 300;
    this.dragFactor = 1 / 5000;

    this.distance = 0;
    this.heading = 1;
    this.lastVelX = 0;
    this.isMoving = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(entity: Entity, gameContext: GameContext, _level: Level): void {
    const { deltaTime } = gameContext;
    const absVelX = Math.abs(entity.vel.x);
    const velXChanged = Math.abs(this.lastVelX - entity.vel.x) > 0.5;

    // Debug velocity transitions to detect disappearing issues
    if (velXChanged) {
      console.log(
        `Velocity changed from ${this.lastVelX.toFixed(2)} to ${entity.vel.x.toFixed(2)}`
      );
    }

    // Apply acceleration based on input direction
    if (this.dir !== 0) {
      entity.vel.x += this.acceleration * deltaTime * this.dir;

      // Update heading based on direction if not in the air
      const jumpTrait = entity.traits.get(Jump);
      if (jumpTrait) {
        if (!(jumpTrait as Jump).falling) {
          this.heading = this.dir;
        }
      } else {
        this.heading = this.dir;
      }

      this.isMoving = true;
    }
    // Apply deceleration when no input
    else if (entity.vel.x !== 0) {
      const decel = Math.min(absVelX, this.deceleration * deltaTime);
      entity.vel.x += entity.vel.x > 0 ? -decel : decel;

      // Stop completely if velocity is very small
      if (absVelX < 1) {
        entity.vel.x = 0;

        // Reset distance when stopped
        if (this.isMoving) {
          console.log('Stopping movement, resetting distance');
          this.distance = 0;
          this.isMoving = false;
        }
      }
    } else {
      // Entity not moving
      if (this.isMoving) {
        console.log('Entity stopped, resetting distance');
        this.distance = 0;
        this.isMoving = false;
      }
    }

    // Apply drag based on velocity
    const drag = this.dragFactor * entity.vel.x * absVelX;
    entity.vel.x -= drag;

    // Update distance if actually moving (with a higher threshold)
    if (absVelX > 1) {
      this.distance += absVelX * deltaTime;
    }

    // Store current velocity for next frame comparison
    this.lastVelX = entity.vel.x;
  }
}
