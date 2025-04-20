import Scene from "./Scene.ts";

export default class TimedScene extends Scene {
  countDown: number;

  constructor() {
    super();
    this.countDown = 2;
  }

  update(gameContext: any): void {
    this.countDown -= gameContext.deltaTime;
    if (this.countDown <= 0) {
      this.events.emit(Scene.EVENT_COMPLETE);
    }
  }
}
