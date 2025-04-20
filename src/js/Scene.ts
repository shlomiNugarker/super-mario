import Compositor from "./Compositor";
import EventEmitter from "./EventEmitter";
import { Camera } from "./debug";

interface GameContext {
  videoContext: CanvasRenderingContext2D;
  camera: Camera;
}

export default class Scene {
  static readonly EVENT_COMPLETE: symbol = Symbol("scene complete");

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
    console.log("Pause", this);
  }
}
