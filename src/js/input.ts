import Keyboard from './KeyboardState.ts';
import InputRouter from './InputRouter.ts';
import Jump from './traits/Jump.ts';
import PipeTraveller from './traits/PipeTraveller.ts';
import Go from './traits/Go.ts';
import Entity from './Entity.ts';
import Trait from './Trait.ts';

const KEYMAP = {
  UP: 'KeyW',
  DOWN: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  A: 'KeyP',
  B: 'KeyO',
};

export function setupKeyboard(window: Window) {
  const input = new Keyboard();
  const router = new InputRouter<Entity>();

  input.listenTo(window);

  input.addMapping(KEYMAP.A, (keyState) => {
    if (keyState) {
      router.route((entity: Entity) => {
        const jump = entity.traits.get(Jump) as Jump;
        if (jump) jump.start();
      });
    } else {
      router.route((entity: Entity) => {
        const jump = entity.traits.get(Jump) as Jump;
        if (jump) jump.cancel();
      });
    }
  });

  input.addMapping(KEYMAP.B, (keyState) => {
    router.route((entity: Entity) => (entity as any).turbo(keyState));
  });

  input.addMapping(KEYMAP.UP, (keyState) => {
    router.route((entity: Entity) => {
      const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;
      if (pipeTraveller) pipeTraveller.direction.y += keyState ? -1 : 1;
    });
  });

  input.addMapping(KEYMAP.DOWN, (keyState) => {
    router.route((entity: Entity) => {
      const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;
      if (pipeTraveller) pipeTraveller.direction.y += keyState ? 1 : -1;
    });
  });

  input.addMapping(KEYMAP.RIGHT, (keyState) => {
    router.route((entity: Entity) => {
      const go = entity.traits.get(Go) as Go;
      const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;

      if (go) go.dir += keyState ? 1 : -1;
      if (pipeTraveller) pipeTraveller.direction.x += keyState ? 1 : -1;
    });
  });

  input.addMapping(KEYMAP.LEFT, (keyState) => {
    router.route((entity: Entity) => {
      const go = entity.traits.get(Go) as Go;
      const pipeTraveller = entity.traits.get(PipeTraveller) as PipeTraveller;

      if (go) go.dir += keyState ? -1 : 1;
      if (pipeTraveller) pipeTraveller.direction.x += keyState ? -1 : 1;
    });
  });

  return router;
}
