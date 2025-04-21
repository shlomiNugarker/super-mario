import Entity from '../Entity.ts';
import Trait from '../Trait.ts';
import Killable from '../traits/Killable.ts';
import Gravity from '../traits/Gravity.ts';
import Stomper from '../traits/Stomper.ts';
import Velocity from '../traits/Velocity.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';

export function loadBullet() {
  return loadSpriteSheet('bullet').then(createBulletFactory);
}

class Behavior extends Trait {
  private gravity: Gravity;

  constructor() {
    super();
    this.gravity = new Gravity();
  }

  collides(us: Entity, them: Entity): void {
    const killable = us.traits.get(Killable) as Killable;
    if (killable?.dead) {
      return;
    }

    console.log('Collision in Bullet', them.vel.y);
    if (them.traits.has(Stomper)) {
      if (them.vel.y > us.vel.y) {
        (us.traits.get(Killable) as Killable).kill();
        us.vel.set(100, -200);
      } else {
        (them.traits.get(Killable) as Killable).kill();
      }
    }
  }

  update(entity: Entity, gameContext: { deltaTime: number }, level: any): void {
    const killable = entity.traits.get(Killable) as Killable;
    if (killable?.dead) {
      this.gravity.update(entity, gameContext, level);
    }
  }
}

function createBulletFactory(sprite: any) {
  function drawBullet(this: Entity, context: CanvasRenderingContext2D): void {
    sprite.draw('bullet', context, 0, 0, this.vel.x > 0);
  }

  return function createBullet(): Entity {
    const bullet = new Entity();
    bullet.size.set(16, 14);

    bullet.addTrait(new Velocity());
    bullet.addTrait(new Behavior());
    bullet.addTrait(new Killable());

    (bullet as any).draw = drawBullet;

    return bullet;
  };
}
