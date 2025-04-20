import Scene from "./Scene";

interface GameContext {
  videoContext: CanvasRenderingContext2D;
  camera: any;
}

export default class SceneRunner {
  private sceneIndex: number;
  private scenes: Scene[];

  constructor() {
    this.sceneIndex = -1;
    this.scenes = [];
  }

  addScene(scene: Scene): void {
    scene.onComplete(() => this.runNext());
    this.scenes.push(scene);
  }

  runNext(): void {
    const currentScene = this.scenes[this.sceneIndex];
    if (currentScene) {
      currentScene.pause();
    }
    this.sceneIndex++;
  }

  update(gameContext: GameContext): void {
    const currentScene = this.scenes[this.sceneIndex];
    if (currentScene) {
      currentScene.update(gameContext);
      currentScene.draw(gameContext);
    }
  }
}
