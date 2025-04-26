import Compositor from './Compositor.ts';
import EventEmitter from './EventEmitter.ts';
import { GameContext } from '../types/common';
import { IScene } from '../types/level';

export default class Scene implements IScene {
  static readonly EVENT_COMPLETE: string = 'scene complete';

  public events: EventEmitter;
  public comp: Compositor;

  constructor() {
    this.events = new EventEmitter();
    this.comp = new Compositor();
  }

  draw(gameContext: GameContext): void {
    if (gameContext.videoContext && gameContext.camera) {
      this.comp.draw(gameContext.videoContext, gameContext.camera);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_gameContext: GameContext): void {}

  pause(): void {
    console.log('Pause', this);
  }

  // Method to register a completion handler
  onComplete(callback: () => void): void {
    this.events.listen(Scene.EVENT_COMPLETE, callback);
  }

  // Method to trigger completion
  complete(): void {
    this.events.emit(Scene.EVENT_COMPLETE);
  }
}
