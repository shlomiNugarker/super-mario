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
import { MarioEntity } from '../../types/entity';
import { EntityFactoryOptions } from '../../types/entity';
import SpriteSheet from '../SpriteSheet.ts';
import AudioBoard from '../AudioBoard.ts';
import { InputEvent, InputEventTypes, InputReceiver } from '../../types/input';
import { LOW_FRICTION, HIGH_FRICTION, PLAYER_JUMP_VELOCITY } from '../config.ts';

// Use config constants for drag values with better naming
const WALK_DRAG = HIGH_FRICTION; // גרירה גבוהה = הליכה
const RUN_DRAG = LOW_FRICTION; // גרירה נמוכה = ריצה

export function loadMario(audioContext: AudioContext) {
  return Promise.all([loadSpriteSheet('mario'), loadAudioBoard('mario', audioContext)]).then(
    ([sprite, audio]) => {
      return createMarioFactory(sprite, audio);
    }
  );
}

function createMarioFactory(sprite: SpriteSheet, audio: AudioBoard) {
  // Validate sprite frames exist
  const validateSprites = () => {
    const requiredFrames = ['idle', 'jump', 'run-1', 'run-2', 'run-3', 'break'];
    const missingFrames = requiredFrames.filter((frame) => !sprite.has(frame));

    if (missingFrames.length > 0) {
      console.warn('Missing Mario sprite frames:', missingFrames);
      // Create missing frames if needed (fallback to idle)
      missingFrames.forEach((frame) => {
        if (sprite.has('idle')) {
          // Add the frame manually using the define method
          sprite.define(frame, 0, 88, 16, 16); // Use the same dimensions as idle
        }
      });
    }
  };

  // Run validation once at startup
  validateSprites();

  function getHeading(mario: Entity): boolean {
    const go = mario.getGoTrait();
    return go?.heading ? go.heading < 0 : false;
  }

  function routeFrame(mario: Entity): string {
    const jump = mario.getJumpTrait();
    if (jump?.falling) {
      return 'jump';
    }

    const go = mario.getGoTrait();
    if (go?.distance !== undefined && go.distance > 0) {
      if (
        (mario.vel.x > 0 && go.dir !== undefined && go.dir < 0) ||
        (mario.vel.x < 0 && go.dir !== undefined && go.dir > 0)
      ) {
        return 'break';
      }

      // Fix: Ensure correct frame sequence matches the frames in mario.json
      if (go.distance < 10) {
        return 'run-1'; // Use 'run-1' as defined in mario.json
      } else {
        const frameIndex = Math.floor(go.distance / 10) % 3;
        const validFrames = ['run-1', 'run-2', 'run-3']; // Match the names in mario.json
        return validFrames[frameIndex];
      }
    }

    // Always return idle frame when not moving
    return 'idle';
  }

  function drawMario(this: Entity, context: CanvasRenderingContext2D): void {
    // Get frame and heading
    let frame = routeFrame(this);
    const heading = getHeading(this);

    // Check if frame exists in sprite sheet
    if (!sprite.has(frame)) {
      console.warn(`Mario frame "${frame}" not found, falling back to idle`);
      frame = 'idle'; // Fallback to idle frame
    }

    try {
      sprite.draw(frame, context, 0, 0, heading);
    } catch (error) {
      console.error(`Failed to draw Mario with frame ${frame}:`, error);

      // Last resort fallback - draw a rectangle placeholder
      context.fillStyle = 'red';
      context.fillRect(0, 0, 16, 16);
    }
  }

  return function createMario(options?: EntityFactoryOptions): MarioEntity & InputReceiver {
    const mario = new Entity() as unknown as MarioEntity & InputReceiver;
    mario.audio = audio;

    if (options?.startX !== undefined && options?.startY !== undefined) {
      mario.pos.set(options.startX, options.startY);
    }

    mario.size.set(14, 16);

    mario.addTrait(new Physics());
    mario.addTrait(new Solid());
    mario.addTrait(new Go());
    mario.addTrait(new Jump());
    mario.addTrait(new Killable());
    mario.addTrait(new Stomper());
    mario.addTrait(new PipeTraveller());
    mario.addTrait(new PoleTraveller());

    const killable = mario.getKillableTrait();
    if (killable) {
      killable.removeAfter = Infinity;
    }

    const jump = mario.getJumpTrait();
    if (jump) {
      jump.velocity = options?.jumpVelocity || PLAYER_JUMP_VELOCITY;
    }

    mario.turbo = function (turboOn: boolean): void {
      const go = this.getGoTrait();
      if (go) {
        go.dragFactor = turboOn ? RUN_DRAG : WALK_DRAG;
      }
    };

    mario.draw = drawMario;

    mario.turbo(false);

    mario.receive = function (event: InputEvent): void {
      if (event.action === 'jump') {
        const jump = this.getJumpTrait();
        if (jump) {
          if (event.type === InputEventTypes.PRESS) {
            jump.start();
          } else {
            jump.cancel();
          }
        }
      } else if (event.action === 'move') {
        const go = this.getGoTrait();
        if (go && typeof event.direction === 'number') {
          const keyState = typeof event.keyState === 'number' ? event.keyState : 0;
          go.dir += keyState ? event.direction : -event.direction;
        }
      } else if (event.action === 'turbo') {
        const keyState = typeof event.keyState === 'number' ? event.keyState : 0;
        this.turbo(keyState === 1);
      }
    };

    return mario;
  };
}
