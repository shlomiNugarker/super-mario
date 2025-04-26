/**
 * Game timer class that manages the game loop and frame rate
 */
export default class Timer {
  private accumulatedTime: number = 0;
  private lastTime: number = 0;
  private deltaTime: number = 1 / 60;
  private frameId: number | null = null;
  private isRunning: boolean = false;
  private _fps: number = 0;
  private _frameCount: number = 0;
  private _fpsUpdateTime: number = 0;
  private readonly _targetDelta: number;
  private readonly _maxDeltaTime: number;

  // Function to call on each update
  public update: (deltaTime: number) => void;

  /**
   * Constructor
   * @param deltaTime The fixed time step for the game loop in seconds
   * @param maxStep Maximum time step (to avoid spiral of death) in seconds
   */
  constructor(deltaTime: number = 1 / 60, maxStep: number = 1 / 30) {
    this.update = () => {}; // Default empty update
    this._targetDelta = deltaTime;
    this._maxDeltaTime = maxStep;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this._fpsUpdateTime = this.lastTime;
    this._frameCount = 0;
    this.accumulatedTime = 0;
    this.enqueue();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  /**
   * Enqueue the next frame update
   */
  private enqueue(): void {
    this.frameId = requestAnimationFrame(this.updateProxy.bind(this));
  }

  /**
   * Update proxy called by requestAnimationFrame
   * @param currentTime Current time in milliseconds
   */
  private updateProxy(currentTime: number): void {
    if (!this.isRunning) {
      return;
    }

    // Calculate time since last frame
    const elapsedMS = currentTime - this.lastTime;
    const elapsed = elapsedMS / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // FPS calculation
    this._frameCount++;
    const fpsElapsed = currentTime - this._fpsUpdateTime;
    if (fpsElapsed >= 1000) {
      // Update FPS every second
      this._fps = (this._frameCount * 1000) / fpsElapsed;
      this._frameCount = 0;
      this._fpsUpdateTime = currentTime;
    }

    // Add elapsed time to accumulated time, but clamp it to avoid spiral of death
    this.accumulatedTime += Math.min(elapsed, this._maxDeltaTime);

    // Fixed time step updating
    // Process as many updates as needed to catch up
    let updated = false;
    while (this.accumulatedTime >= this._targetDelta) {
      this.deltaTime = this._targetDelta;
      this.update(this.deltaTime);
      this.accumulatedTime -= this._targetDelta;
      updated = true;
    }

    // If no updates happened (e.g., on very slow computers), force an update
    // with the actual elapsed time to ensure visuals keep moving
    if (!updated && elapsed > 0) {
      this.deltaTime = elapsed;
      this.update(this.deltaTime);
    }

    // Queue the next frame
    this.enqueue();
  }

  /**
   * Get the current FPS
   */
  get fps(): number {
    return this._fps;
  }

  /**
   * Check if timer is running
   */
  get running(): boolean {
    return this.isRunning;
  }
}
