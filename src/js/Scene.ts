import Compositor from './Compositor';
import EventEmitter from './EventEmitter';
import { Camera } from './debug';

interface GameContext {
  videoContext: CanvasRenderingContext2D;
  camera: Camera;
}

export default class Scene {
  static readonly EVENT_COMPLETE: string = 'scene complete';

  protected events: EventEmitter;
  protected comp: Compositor;

  constructor() {
    this.events = new EventEmitter();
    this.comp = new Compositor();
  }

  draw(gameContext: GameContext): void {
    this.comp.draw(gameContext.videoContext, gameContext.camera);
  }

  update(gameContext: GameContext): void {}

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
