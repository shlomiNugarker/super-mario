import Entity from '../Entity.ts';
import Trait from '../Trait.ts';
import Killable from '../traits/Killable.ts';
import PendulumMove from '../traits/PendulumMove.ts';
import Physics from '../traits/Physics.ts';
import Solid from '../traits/Solid.ts';
import Stomper from '../traits/Stomper.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';
import SpriteSheet from '../SpriteSheet.ts';

export function loadKoopaGreen() {
  return loadSpriteSheet('koopa-green').then(createKoopaFactory);
}

export function loadKoopaBlue() {
  return loadSpriteSheet('koopa-blue').then(createKoopaFactory);
}

const STATE_WALKING = Symbol('walking');
const STATE_HIDING = Symbol('hiding');
const STATE_PANIC = Symbol('panic');

type KoopaState = typeof STATE_WALKING | typeof STATE_HIDING | typeof STATE_PANIC;

interface GameContext {
  deltaTime: number;
  audioContext: AudioContext;
}

class Behavior extends Trait {
  hideTime: number;
  hideDuration: number;
  walkSpeed: number | null;
  panicSpeed: number;
  state: KoopaState;

  constructor() {
    super();

    this.hideTime = 0;
    this.hideDuration = 5;

    this.walkSpeed = null;
    this.panicSpeed = 300;

    this.state = STATE_WALKING;
  }

  collides(us: Entity, them: Entity): void {
    const killable = us.traits.get(Killable) as Killable;
    if (killable?.dead) {
      return;
    }

    if (them.traits.has(Stomper)) {
      if (them.vel.y > us.vel.y) {
        this.handleStomp(us, them);
      } else {
        this.handleNudge(us, them);
      }
    }
  }

  handleNudge(us: Entity, them: Entity): void {
    if (this.state === STATE_WALKING) {
      const killable = them.traits.get(Killable) as Killable;
      if (killable) killable.kill();
    } else if (this.state === STATE_HIDING) {
      this.panic(us, them);
    } else if (this.state === STATE_PANIC) {
      const travelDir = Math.sign(us.vel.x);
      const impactDir = Math.sign(us.pos.x - them.pos.x);
      if (travelDir !== 0 && travelDir !== impactDir) {
        const killable = them.traits.get(Killable) as Killable;
        if (killable) killable.kill();
      }
    }
  }

  handleStomp(us: Entity, them: Entity): void {
    if (this.state === STATE_WALKING) {
      this.hide(us);
    } else if (this.state === STATE_HIDING) {
      const killable = us.traits.get(Killable) as Killable;
      if (killable) killable.kill();
      us.vel.set(100, -200);
      const solid = us.traits.get(Solid) as Solid;
      if (solid) solid.obstructs = false;
    } else if (this.state === STATE_PANIC) {
      this.hide(us);
    }
  }

  hide(us: Entity): void {
    us.vel.x = 0;

    // Use update method to modify PendulumMove behavior
    us.traits.forEach((trait) => {
      if (trait instanceof PendulumMove) {
        if (this.walkSpeed === null) {
          // Store the speed for later
          this.walkSpeed = 0; // We'll rely on the entity's vel.x instead
        }
        // PendulumMove will be disabled in its update method
      }
    });

    this.hideTime = 0;
    this.state = STATE_HIDING;
  }

  unhide(us: Entity): void {
    // Reset to walking state
    this.state = STATE_WALKING;
  }

  panic(us: Entity, them: Entity): void {
    // Set the velocity direction based on impact
    us.vel.x = this.panicSpeed * Math.sign(them.vel.x);
    this.state = STATE_PANIC;
  }

  update(us: Entity, gameContext: GameContext): void {
    const deltaTime = gameContext.deltaTime;

    // Handle PendulumMove interaction based on state
    us.traits.forEach((trait) => {
      if (trait instanceof PendulumMove) {
        if (this.state === STATE_WALKING) {
          // Allow normal pendulum movement in walking state
          us.vel.x = this.walkSpeed || -30; // Default speed if walkSpeed is null
        } else if (this.state === STATE_HIDING) {
          // Keep still while hiding
          us.vel.x = 0;
        } else if (this.state === STATE_PANIC) {
          // Keep panic velocity (set in panic method)
        }
      }
    });

    if (this.state === STATE_HIDING) {
      this.hideTime += deltaTime;
      if (this.hideTime > this.hideDuration) {
        this.unhide(us);
      }
    }
  }
}

function createKoopaFactory(sprite: SpriteSheet) {
  function routeAnim(koopa: Entity): string {
    const behavior = koopa.traits.get(Behavior) as Behavior;
    if (behavior?.state === STATE_HIDING) {
      if (behavior.hideTime > 3) {
        // For waking animation, use a frame based on hideTime
        return `wake-${Math.floor(behavior.hideTime * 2) % 3}`;
      }
      return 'hiding';
    }

    if (behavior?.state === STATE_PANIC) {
      return 'hiding';
    }

    // For walking animation, use a frame based on lifetime
    return `walk-${Math.floor(koopa.lifetime * 6) % 2}`;
  }

  function drawKoopa(this: Entity, context: CanvasRenderingContext2D): void {
    const name = routeAnim(this);
    sprite.draw(name, context, 0, 0, this.vel.x < 0);
  }

  return function createKoopa(): Entity {
    const koopa = new Entity();
    koopa.size.set(16, 16);
    koopa.offset.y = 8;

    koopa.addTrait(new Physics());
    koopa.addTrait(new Solid());
    koopa.addTrait(new PendulumMove());
    koopa.addTrait(new Killable());
    koopa.addTrait(new Behavior());

    (koopa as any).draw = drawKoopa;

    return koopa;
  };
}
