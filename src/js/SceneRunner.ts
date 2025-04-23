import Scene from './Scene.ts';
import { GameContext } from '../types/common';

/**
 * SceneRunner to manage and transition between different scenes
 */
export default class SceneRunner {
  private sceneIndex: number;
  private scenes: Scene[];

  constructor() {
    this.sceneIndex = -1;
    this.scenes = [];
  }

  /**
   * Add a scene to the queue
   * @param scene Scene to add
   */
  addScene(scene: Scene): void {
    scene.onComplete(() => {
      this.runNext();
    });
    this.scenes.push(scene);
  }

  /**
   * Run the next scene in the queue
   */
  runNext(): void {
    const currentScene = this.scenes[this.sceneIndex];
    if (currentScene) {
      currentScene.pause();
    }

    this.sceneIndex++;
  }

  /**
   * Update the current scene
   * @param gameContext Game context
   */
  update(gameContext: GameContext): void {
    const currentScene = this.scenes[this.sceneIndex];
    if (currentScene) {
      currentScene.update(gameContext);
      currentScene.draw(gameContext);
    }
  }
}
