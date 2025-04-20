export default class Timer {
  updateProxy: (time: number) => void;
  update!: (deltaTime: number) => void;

  constructor(deltaTime: number = 1 / 60) {
    let accumulatedTime = 0;
    let lastTime: number | null = null;

    this.updateProxy = (time: number) => {
      if (lastTime) {
        accumulatedTime += (time - lastTime) / 1000;

        if (accumulatedTime > 1) {
          accumulatedTime = 1;
        }

        while (accumulatedTime > deltaTime) {
          this.update(deltaTime);
          accumulatedTime -= deltaTime;
        }
      }

      lastTime = time;

      this.enqueue();
    };
  }

  enqueue(): void {
    requestAnimationFrame(this.updateProxy);
  }

  start(): void {
    this.enqueue();
  }
}
