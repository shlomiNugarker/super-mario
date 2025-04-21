import Entity from '../Entity.ts';
import Go from '../traits/Go.ts';
import Jump from '../traits/Jump.ts';
import Killable from '../traits/Killable.ts';
import Physics from '../traits/Physics.ts';
import PipeTraveller from '../traits/PipeTraveller.ts';
import PoleTraveller from '../traits/PoleTraveller.ts';
import Solid from '../traits/Solid.ts';
import Stomper from '../traits/Stomper.ts';
import { loadAudioBoard } from '../loaders/audio.ts';
import { loadSpriteSheet } from '../loaders/sprite.ts';

const SLOW_DRAG = 1 / 1000;
const FAST_DRAG = 1 / 5000;

export function loadMario(audioContext: AudioContext) {
  return Promise.all([loadSpriteSheet('mario'), loadAudioBoard('mario', audioContext)]).then(
    ([sprite, audio]) => {
      return createMarioFactory(sprite, audio);
    }
  );
}

function createMarioFactory(sprite: any, audio: any) {
  const runAnim = sprite.animations.get('run');
  const climbAnim = sprite.animations.get('climb');

  function getHeading(mario: Entity): boolean {
    const poleTraveller = mario.traits.get(PoleTraveller) as PoleTraveller | undefined;
    if (poleTraveller?.distance) {
      return false;
    }
    const go = mario.traits.get(Go) as Go | undefined;
    return go?.heading ? go.heading < 0 : false;
  }

  function routeFrame(mario: Entity): string | number {
    const pipeTraveller = mario.traits.get(PipeTraveller) as PipeTraveller | undefined;
    if (pipeTraveller?.movement?.x !== undefined && pipeTraveller.movement.x !== 0) {
      if (pipeTraveller?.distance?.x !== undefined) {
        return runAnim(pipeTraveller.distance.x * 2);
      }
      return 'idle';
    }
    if (pipeTraveller?.movement?.y !== undefined && pipeTraveller.movement.y !== 0) {
      return 'idle';
    }

    const poleTraveller = mario.traits.get(PoleTraveller) as PoleTraveller | undefined;
    if (poleTraveller?.distance) {
      return climbAnim(poleTraveller.distance);
    }

    const jump = mario.traits.get(Jump) as Jump | undefined;
    if (jump?.falling) {
      return 'jump';
    }

    const go = mario.traits.get(Go) as Go | undefined;
    if (go?.distance !== undefined && go.distance > 0) {
      if (
        (mario.vel.x > 0 && go.dir !== undefined && go.dir < 0) ||
        (mario.vel.x < 0 && go.dir !== undefined && go.dir > 0)
      ) {
        return 'break';
      }

      const goForDistance = mario.traits.get(Go) as Go | undefined;
      return runAnim(goForDistance?.distance);
    }

    return 'idle';
  }

  function setTurboState(this: Entity, turboOn: boolean) {
    const go = this.traits.get(Go) as Go | undefined;
    if (go) {
      go.dragFactor = turboOn ? FAST_DRAG : SLOW_DRAG;
    }
  }

  function drawMario(this: Entity, context: CanvasRenderingContext2D) {
    sprite.draw(routeFrame(this), context, 0, 0, getHeading(this));
  }

  return function createMario(): Entity {
    const mario = new Entity();
    mario.audio = audio;
    mario.size.set(14, 16);

    mario.addTrait(new Physics());
    mario.addTrait(new Solid());
    mario.addTrait(new Go());
    mario.addTrait(new Jump());
    mario.addTrait(new Killable());
    mario.addTrait(new Stomper());
    mario.addTrait(new PipeTraveller());
    mario.addTrait(new PoleTraveller());

    const killable = mario.traits.get(Killable) as Killable;
    if (killable) {
      killable.removeAfter = Infinity;
    }

    const jump = mario.traits.get(Jump) as Jump;
    if (jump) {
      jump.velocity = 175;
    }

    (mario as any).turbo = setTurboState;
    (mario as any).draw = drawMario;

    (mario as any).turbo(false);

    return mario;
  };
}
