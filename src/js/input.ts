import Keyboard from './KeyboardState.ts';
import InputRouter from './InputRouter.ts';
import Jump from './traits/Jump.ts';
import PipeTraveller from './traits/PipeTraveller.ts';
import Go from './traits/Go.ts';
import Entity from './Entity.ts';

const KEYMAP = {
  UP: 'KeyW',
  DOWN: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  JUMP: 'Space',
  RUN: 'ShiftLeft',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
};

export function setupKeyboard(window: Window) {
  const input = new Keyboard();
  const router = new InputRouter<Entity>();

  input.listenTo(window);

  // Set up jump action (Space and ArrowUp)
  [KEYMAP.JUMP, KEYMAP.ARROW_UP, KEYMAP.UP].forEach((key) => {
    input.addMapping(key, (keyState) => {
      router.route((entity: Entity) => {
        const jump = entity.traits.get(Jump) as Jump;
        if (jump) {
          if (keyState) {
            jump.start();
            console.log('Jump started');
          } else {
            jump.cancel();
            console.log('Jump canceled');
          }
        }
      });
    });
  });

  // Set up run/turbo action (Shift and ArrowDown)
  [KEYMAP.RUN, KEYMAP.ARROW_DOWN, KEYMAP.DOWN].forEach((key) => {
    input.addMapping(key, (keyState) => {
      router.route((entity: Entity) => {
        if (typeof (entity as any).turbo === 'function') {
          (entity as any).turbo(keyState === 1);
          console.log('Turbo:', keyState === 1);
        }
      });
    });
  });

  // Set up up movement (W and ArrowUp)
  [KEYMAP.UP, KEYMAP.ARROW_UP].forEach((key) => {
    input.addMapping(key, (keyState) => {
      router.route((entity: Entity) => {
        const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;
        if (pipeTraveller && pipeTraveller.direction) {
          pipeTraveller.direction.y += keyState ? -1 : 1;
        }
      });
    });
  });

  // Set up down movement (S and ArrowDown)
  [KEYMAP.DOWN, KEYMAP.ARROW_DOWN].forEach((key) => {
    input.addMapping(key, (keyState) => {
      router.route((entity: Entity) => {
        const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;
        if (pipeTraveller && pipeTraveller.direction) {
          pipeTraveller.direction.y += keyState ? 1 : -1;
        }
      });
    });
  });

  // Set up right movement (D and ArrowRight)
  [KEYMAP.RIGHT, KEYMAP.ARROW_RIGHT].forEach((key) => {
    input.addMapping(key, (keyState) => {
      router.route((entity: Entity) => {
        const go = entity.traits.get(Go) as Go;
        if (go) {
          go.dir += keyState ? 1 : -1;
          console.log('Move right:', keyState, 'Dir:', go.dir);
        }

        const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;
        if (pipeTraveller && pipeTraveller.direction) {
          pipeTraveller.direction.x += keyState ? 1 : -1;
        }
      });
    });
  });

  // Set up left movement (A and ArrowLeft)
  [KEYMAP.LEFT, KEYMAP.ARROW_LEFT].forEach((key) => {
    input.addMapping(key, (keyState) => {
      router.route((entity: Entity) => {
        const go = entity.traits.get(Go) as Go;
        if (go) {
          go.dir += keyState ? -1 : 1;
          console.log('Move left:', keyState, 'Dir:', go.dir);
        }

        const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;
        if (pipeTraveller && pipeTraveller.direction) {
          pipeTraveller.direction.x += keyState ? -1 : 1;
        }
      });
    });
  });

  return router;
}
