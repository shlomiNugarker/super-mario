import Trait from '../Trait.ts';
import Killable from './Killable.ts';
import Entity from '../Entity.ts';

export default class Stomper extends Trait {
  static EVENT_STOMP = Symbol('stomp');
  bounceSpeed: number;

  constructor() {
    super();
    this.bounceSpeed = 400;
  }

  bounce(us: Entity, them: Entity): void {
    us.bounds.bottom = them.bounds.top;
    us.vel.y = -this.bounceSpeed;
  }

  collides(us: Entity, them: Entity): void {
    const killable = them.traits.get(Killable) as Killable | undefined;
    if (!killable || killable.dead) {
      return;
    }

    if (us.vel.y > them.vel.y) {
      this.queue(() => this.bounce(us, them));
      us.sounds.add('stomp');
      us.events.emit(Stomper.EVENT_STOMP, us, them);
    }
  }
}
