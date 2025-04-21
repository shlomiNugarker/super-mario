import Level from './Level.ts';
import Timer from './Timer.ts';
import Pipe from './traits/Pipe.ts';
import { createLevelLoader } from './loaders/level.js';
import { loadFont } from './loaders/font.ts';
import { loadEntities } from './entities.ts';
import { makePlayer, bootstrapPlayer, resetPlayer, findPlayers } from './player.ts';
import { setupKeyboard } from './input.ts';
import { createColorLayer } from './layers/color.ts';
import { createTextLayer } from './layers/text.ts';
import { createCollisionLayer } from './layers/collision.ts';
import { createDashboardLayer } from './layers/dashboard.ts';
import { createPlayerProgressLayer } from './layers/player-progress.ts';
import SceneRunner from './SceneRunner.ts';
import Scene from './Scene.ts';
import TimedScene from './TimedScene.ts';
import { connectEntity } from './traits/Pipe.js';
import { Camera } from './debug.ts';

// Define the window.mario property
declare global {
  interface Window {
    mario: any;
  }
}

interface GameContext {
  audioContext: AudioContext;
  videoContext: CanvasRenderingContext2D | null;
  entityFactory: any;
  deltaTime: number;
  tick: number;
  camera?: Camera;
}

async function main(canvas: HTMLCanvasElement) {
  const videoContext = canvas.getContext('2d');
  const audioContext = new AudioContext();

  const [entityFactory, font] = await Promise.all([loadEntities(audioContext), loadFont()]);

  const loadLevel = await createLevelLoader(entityFactory);

  const sceneRunner = new SceneRunner();

  const mario: any = entityFactory.mario();
  makePlayer(mario, 'MARIO');

  window.mario = mario;

  const inputRouter = setupKeyboard(window);
  inputRouter.addReceiver(mario);

  function createLoadingScreen(name: string) {
    const scene = new Scene();
    // Access Scene's protected and Compositor's private members
    // We're assuming that these properties have appropriate getters/methods
    (scene as any).comp.layers.push(createColorLayer('#000'));
    (scene as any).comp.layers.push(createTextLayer(font, `Loading ${name}...`));
    return scene;
  }

  async function setupLevel(name: string) {
    const loadingScreen = createLoadingScreen(name);
    sceneRunner.addScene(loadingScreen);
    sceneRunner.runNext();

    const level = await loadLevel(name);
    bootstrapPlayer(mario, level);

    // Access protected events property with type casting
    (level as any).events.listen(
      Level.EVENT_TRIGGER as unknown as string,
      (spec: any, trigger: any, touches: any) => {
        if (spec.type === 'goto') {
          for (const _ of findPlayers(touches)) {
            startWorld(spec.name);
            return;
          }
        }
      }
    );

    // Access protected events property with type casting
    (level as any).events.listen(
      Pipe.EVENT_PIPE_COMPLETE as unknown as string,
      async (pipe: any) => {
        if (pipe.props.goesTo) {
          const nextLevel = await setupLevel(pipe.props.goesTo.name);
          sceneRunner.addScene(nextLevel);
          sceneRunner.runNext();
          if (pipe.props.backTo) {
            console.log(pipe.props);
            // Access protected events property with type casting
            (nextLevel as any).events.listen(
              Level.EVENT_COMPLETE as unknown as string,
              async () => {
                const level = await setupLevel(name);
                const exitPipe = (level as any).entities.get(pipe.props.backTo);
                if (exitPipe) {
                  connectEntity(exitPipe, mario);
                  sceneRunner.addScene(level);
                  sceneRunner.runNext();
                }
              }
            );
          }
        } else {
          // Access protected events property with type casting
          (level as any).events.emit(Level.EVENT_COMPLETE as unknown as string);
        }
      }
    );

    // Access protected comp property and private layers property with type casting
    (level as any).comp.layers.push(createCollisionLayer(level));

    const dashboardLayer = createDashboardLayer(font, mario);
    // Access protected comp property and private layers property with type casting
    (level as any).comp.layers.push(dashboardLayer);

    return level;
  }

  async function startWorld(name: string) {
    const level = await setupLevel(name);
    resetPlayer(mario, name);

    const playerProgressLayer = createPlayerProgressLayer(font, level);
    const dashboardLayer = createDashboardLayer(font, mario);

    const waitScreen = new TimedScene();
    waitScreen.countDown = 0;
    // Access protected comp property and private layers property with type casting
    (waitScreen as any).comp.layers.push(createColorLayer('#000'));
    (waitScreen as any).comp.layers.push(dashboardLayer);
    (waitScreen as any).comp.layers.push(playerProgressLayer);

    sceneRunner.addScene(waitScreen);
    sceneRunner.addScene(level);
    sceneRunner.runNext();
  }

  const gameContext: GameContext = {
    audioContext,
    videoContext,
    entityFactory,
    deltaTime: 0,
    tick: 0,
    camera: undefined,
  };

  const timer = new Timer(1 / 60);
  timer.update = function update(deltaTime: number) {
    gameContext.tick++;
    gameContext.deltaTime = deltaTime;
    sceneRunner.update(gameContext as any);
  };

  timer.start();

  startWorld('1-1');
}

const canvas = document.getElementById('screen') as HTMLCanvasElement;

const start = () => {
  window.removeEventListener('click', start);
  if (canvas) {
    main(canvas);
  }
};

window.addEventListener('click', start);
