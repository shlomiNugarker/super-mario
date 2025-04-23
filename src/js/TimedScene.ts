import Scene from './Scene.ts';
import { GameContext } from '../types/common';

/**
 * Scene that automatically transitions after a countdown
 */
export default class TimedScene extends Scene {
  public countDown: number;

  constructor() {
    super();
    this.countDown = 2;
  }

  /**
   * Update the scene and countdown
   * @param gameContext Game context
   */
  override update(gameContext: GameContext): void {
    this.countDown -= gameContext.deltaTime;

    if (this.countDown <= 0) {
      this.complete();
    }
  }
}
