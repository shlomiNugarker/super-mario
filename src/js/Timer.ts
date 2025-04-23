/**
 * Game timer that handles animation frame timing and delta time calculation
 * Controls the main game loop timing and provides consistent update intervals
 */
export default class Timer {
  /** Proxy function that handles the animation frame callback */
  updateProxy: (time: number) => void;

  /** The main update function that will be called with fixed delta time */
  update!: (deltaTime: number) => void;

  /** Current animation frame ID for cancellation */
  private animationFrameId: number | null = null;

  /** Whether the timer is currently running */
  private running: boolean = false;

  /** Frames per second monitoring */
  private fps: number = 0;

  /** Frame count for FPS calculation */
  private frameCount: number = 0;

  /** Timestamp for FPS calculation */
  private fpsTimestamp: number = 0;

  /** Maximum delta time to prevent spiral of death */
  private maxDeltaTime: number;

  /**
   * Constructor
   * @param deltaTime Fixed delta time for updates (default: 1/60 second)
   * @param maxDeltaTime Maximum allowed delta time to prevent spiral of death (default: 0.5 seconds)
   */
  constructor(deltaTime: number = 1 / 60, maxDeltaTime: number = 0.5) {
    let accumulatedTime = 0;
    let lastTime: number | null = null;
    this.maxDeltaTime = maxDeltaTime;

    this.updateProxy = (time: number) => {
      if (lastTime) {
        // Calculate real delta time in seconds
        const realDeltaTime = (time - lastTime) / 1000;

        // Update FPS counter
        this.frameCount++;
        if (time - this.fpsTimestamp >= 1000) {
          this.fps = (this.frameCount * 1000) / (time - this.fpsTimestamp);
          this.frameCount = 0;
          this.fpsTimestamp = time;
        }

        // Add to accumulated time, but cap it to prevent spiral of death
        accumulatedTime += Math.min(realDeltaTime, this.maxDeltaTime);

        // Process as many fixed time steps as needed
        while (accumulatedTime > deltaTime) {
          this.update(deltaTime);
          accumulatedTime -= deltaTime;
        }
      } else {
        // Initialize FPS timestamp on first frame
        this.fpsTimestamp = time;
      }

      lastTime = time;

      if (this.running) {
        this.enqueue();
      }
    };
  }

  /**
   * Enqueue the next animation frame
   */
  private enqueue(): void {
    this.animationFrameId = requestAnimationFrame(this.updateProxy);
  }

  /**
   * Start the timer
   * @returns This timer instance for chaining
   */
  start(): Timer {
    if (!this.running) {
      this.running = true;
      this.enqueue();
    }
    return this;
  }

  /**
   * Stop the timer
   * @returns This timer instance for chaining
   */
  stop(): Timer {
    if (this.running && this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.running = false;
      this.animationFrameId = null;
    }
    return this;
  }

  /**
   * Toggle the timer on/off
   * @returns This timer instance for chaining
   */
  toggle(): Timer {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
    return this;
  }

  /**
   * Get the current frames per second
   * @returns The current FPS value
   */
  getFPS(): number {
    return Math.round(this.fps);
  }

  /**
   * Check if the timer is currently running
   * @returns True if the timer is running
   */
  isRunning(): boolean {
    return this.running;
  }
}
