import Entity from '../Entity.ts';
import Trait from '../Trait.ts';
import Killable from '../traits/Killable.ts';
import PendulumMove from '../traits/PendulumMove.ts';
import Physics from '../traits/Physics.ts';
import Solid from '../traits/Solid.ts';
import Stomper from '../traits/Stomper.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';
import SpriteSheet from '../SpriteSheet.ts';
import { EnemyEntity, EntityFactoryOptions } from '../../types/entity';

export function loadGoombaBrown() {
  return loadSpriteSheet('goomba-brown').then(createGoombaFactory);
}

export function loadGoombaBlue() {
  return loadSpriteSheet('goomba-blue').then(createGoombaFactory);
}

class Behavior extends Trait {
  collides(us: Entity, them: Entity): void {
    const killable = us.getKillableTrait();
    if (killable?.dead) {
      return;
    }

    if (them.traits.has(Stomper)) {
      if (them.vel.y > us.vel.y) {
        const usKillable = us.getKillableTrait();
        const usPendulum = us.getPendulumMoveTrait();
        if (usKillable) usKillable.kill();
        if (usPendulum) usPendulum.speed = 0;
      } else {
        const themKillable = them.getKillableTrait();
        if (themKillable) themKillable.kill();
      }
    }
  }
}

function createGoombaFactory(sprite: SpriteSheet) {
  const walkAnim = sprite.getAnimation('walk');

  function routeAnim(goomba: Entity): string {
    const killable = goomba.getKillableTrait();
    if (killable?.dead) {
      return 'flat';
    }

    return walkAnim ? walkAnim(goomba.lifetime) : 'walk-1';
  }

  function drawGoomba(this: Entity, context: CanvasRenderingContext2D): void {
    sprite.draw(routeAnim(this), context, 0, 0);
  }

  return function createGoomba(options?: EntityFactoryOptions): EnemyEntity {
    const goomba = new Entity() as unknown as EnemyEntity;
    goomba.size.set(16, 16);

    // Set initial position if provided
    if (options?.startX !== undefined && options?.startY !== undefined) {
      goomba.pos.set(options.startX, options.startY);
    }

    // Add traits
    goomba.addTrait(new Physics());
    goomba.addTrait(new Solid());
    goomba.addTrait(new PendulumMove());
    goomba.addTrait(new Behavior());
    goomba.addTrait(new Killable());

    // Enemy-specific properties
    goomba.isActive = true;

    // Enemy-specific methods
    goomba.activate = function () {
      this.isActive = true;
    };

    goomba.deactivate = function () {
      this.isActive = false;
    };

    goomba.getEnemyType = function () {
      return 'goomba';
    };

    // Set draw method
    goomba.draw = drawGoomba;

    return goomba;
  };
}
