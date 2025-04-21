import Entity from '../Entity.ts';
import Trait from '../Trait.ts';
import Killable from '../traits/Killable.ts';
import PendulumMove from '../traits/PendulumMove.ts';
import Physics from '../traits/Physics.ts';
import Solid from '../traits/Solid.ts';
import Stomper from '../traits/Stomper.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';
import SpriteSheet from '../SpriteSheet.ts';

export function loadGoombaBrown() {
  return loadSpriteSheet('goomba-brown').then(createGoombaFactory);
}

export function loadGoombaBlue() {
  return loadSpriteSheet('goomba-blue').then(createGoombaFactory);
}

class Behavior extends Trait {
  collides(us: Entity, them: Entity): void {
    const killable = us.traits.get(Killable);
    if (killable && (killable as Killable).dead) {
      return;
    }

    if (them.traits.has(Stomper)) {
      if (them.vel.y > us.vel.y) {
        const usKillable = us.traits.get(Killable) as Killable;
        const usPendulum = us.traits.get(PendulumMove) as PendulumMove;
        if (usKillable) usKillable.kill();
        if (usPendulum) (usPendulum as any).speed = 0;
      } else {
        const themKillable = them.traits.get(Killable) as Killable;
        if (themKillable) themKillable.kill();
      }
    }
  }
}

function createGoombaFactory(sprite: SpriteSheet) {
  const walkAnimFunc = (sprite as any).animations.get('walk');

  function routeAnim(goomba: Entity): string {
    const killable = goomba.traits.get(Killable) as Killable;
    if (killable && killable.dead) {
      return 'flat';
    }

    return walkAnimFunc(goomba.lifetime);
  }

  function drawGoomba(this: Entity, context: CanvasRenderingContext2D): void {
    sprite.draw(routeAnim(this), context, 0, 0);
  }

  return function createGoomba(): Entity {
    const goomba = new Entity();
    goomba.size.set(16, 16);

    goomba.addTrait(new Physics());
    goomba.addTrait(new Solid());
    goomba.addTrait(new PendulumMove());
    goomba.addTrait(new Behavior());
    goomba.addTrait(new Killable());

    (goomba as any).draw = drawGoomba;

    return goomba;
  };
}
