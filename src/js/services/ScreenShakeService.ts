/**
 * Screen Shake Service
 *
 * Provides dynamic screen/camera shake effects for various game events.
 */

// Different types of screen shake patterns
export enum ShakePattern {
  HORIZONTAL, // Side to side
  VERTICAL, // Up and down
  RANDOM, // Random direction
  EXPLOSION, // Outward and back in
  RUMBLE, // Small continuous shaking
}

// Options for configuring a shake effect
export interface ShakeOptions {
  pattern: ShakePattern;
  intensity: number; // 0-1 scale
  duration: number; // in ms
  decay: boolean; // whether shake should decay over time
  frequency?: number; // how many shakes per second
}

export default class ScreenShakeService {
  private static instance: ScreenShakeService;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isShaking: boolean = false;
  private shakeOptions: ShakeOptions | null = null;
  private startTime: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private originalTransform: DOMMatrix | null = null;
  private enabled: boolean = true;
  private intensityMultiplier: number = 1.0;

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {}

  /**
   * Get the service instance
   */
  public static getInstance(): ScreenShakeService {
    if (!ScreenShakeService.instance) {
      ScreenShakeService.instance = new ScreenShakeService();
    }
    return ScreenShakeService.instance;
  }

  /**
   * Initialize the screen shake service
   * @param canvas The game canvas
   * @param ctx The rendering context
   */
  public init(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.ctx = ctx;

    // Load settings
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const savedSettings = localStorage.getItem('mario-screen-shake');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.enabled = settings.enabled ?? true;
        this.intensityMultiplier = settings.intensityMultiplier ?? 1.0;
      }
    } catch (error) {
      console.warn('Failed to load screen shake settings', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      const settings = {
        enabled: this.enabled,
        intensityMultiplier: this.intensityMultiplier,
      };
      localStorage.setItem('mario-screen-shake', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save screen shake settings', error);
    }
  }

  /**
   * Set whether screen shake is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveSettings();

    if (!enabled && this.isShaking) {
      this.stopShaking();
    }
  }

  /**
   * Check if screen shake is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set the intensity multiplier for all shakes
   * @param multiplier Value between 0 and 2
   */
  public setIntensityMultiplier(multiplier: number): void {
    this.intensityMultiplier = Math.max(0, Math.min(2, multiplier));
    this.saveSettings();
  }

  /**
   * Get the current intensity multiplier
   */
  public getIntensityMultiplier(): number {
    return this.intensityMultiplier;
  }

  /**
   * Start a screen shake effect
   * @param options Shake configuration options
   */
  public shake(options: ShakeOptions): void {
    if (!this.enabled || !this.ctx) {
      return;
    }

    // Stop any current shake
    this.stopShaking();

    // Store original transform to restore later
    this.originalTransform = this.ctx.getTransform();

    // Set up shake properties
    this.shakeOptions = {
      ...options,
      intensity: options.intensity * this.intensityMultiplier,
      frequency: options.frequency || 8,
    };

    this.isShaking = true;
    this.startTime = performance.now();
  }

  /**
   * Stop the current screen shake and reset the view
   */
  public stopShaking(): void {
    if (this.isShaking && this.ctx && this.originalTransform) {
      this.ctx.setTransform(this.originalTransform);
      this.isShaking = false;
      this.shakeOptions = null;
      this.offsetX = 0;
      this.offsetY = 0;
      this.originalTransform = null;
    }
  }

  /**
   * Update the screen shake effect
   * Should be called in the game loop before rendering
   */
  public update(): void {
    if (!this.isShaking || !this.shakeOptions || !this.ctx || !this.originalTransform) {
      return;
    }

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;

    // Check if shake duration has expired
    if (elapsed >= this.shakeOptions.duration) {
      this.stopShaking();
      return;
    }

    // Calculate normalized progress (0 to 1)
    const progress = elapsed / this.shakeOptions.duration;

    // Calculate intensity with decay if enabled
    let intensity = this.shakeOptions.intensity;
    if (this.shakeOptions.decay) {
      intensity *= 1 - progress;
    }

    // Calculate shake amount based on pattern
    this.calculateShakeOffset(intensity, elapsed, this.shakeOptions.pattern);

    // Apply the shake transform
    this.ctx.setTransform(this.originalTransform);
    this.ctx.translate(this.offsetX, this.offsetY);
  }

  /**
   * Calculate the current shake offset based on the pattern
   */
  private calculateShakeOffset(intensity: number, elapsed: number, pattern: ShakePattern): void {
    const amplitude = intensity * 10; // Maximum pixels to move
    const frequency = this.shakeOptions?.frequency || 8; // Shakes per second
    const radians = (elapsed / 1000) * frequency * Math.PI * 2;

    // Pre-declare variables used in switch cases
    let randomRad = 0;
    let explosionProgress = 0;
    let distance = 0;
    let angle = 0;

    switch (pattern) {
      case ShakePattern.HORIZONTAL:
        this.offsetX = Math.sin(radians) * amplitude;
        this.offsetY = 0;
        break;

      case ShakePattern.VERTICAL:
        this.offsetX = 0;
        this.offsetY = Math.sin(radians) * amplitude;
        break;

      case ShakePattern.RANDOM:
        // Change direction more frequently for random pattern
        randomRad = radians * 2;
        this.offsetX = Math.sin(randomRad) * amplitude * Math.sin(randomRad * 0.5);
        this.offsetY = Math.cos(randomRad) * amplitude * Math.sin(randomRad * 0.5);
        break;

      case ShakePattern.EXPLOSION:
        // Outward and back in
        explosionProgress = Math.sin(Math.min(Math.PI, (elapsed / 1000) * 15));
        distance = explosionProgress * amplitude;
        angle = (elapsed / 1000) * 4;
        this.offsetX = Math.sin(angle) * distance;
        this.offsetY = Math.cos(angle) * distance;
        break;

      case ShakePattern.RUMBLE:
        // Small continuous vibration
        this.offsetX = (Math.random() * 2 - 1) * amplitude * 0.3;
        this.offsetY = (Math.random() * 2 - 1) * amplitude * 0.3;
        break;
    }
  }

  /**
   * Predefined shake: Small impact (enemy stomp)
   */
  public smallImpact(): void {
    this.shake({
      pattern: ShakePattern.VERTICAL,
      intensity: 0.2,
      duration: 200,
      decay: true,
      frequency: 12,
    });
  }

  /**
   * Predefined shake: Medium impact (break block)
   */
  public mediumImpact(): void {
    this.shake({
      pattern: ShakePattern.RANDOM,
      intensity: 0.4,
      duration: 300,
      decay: true,
      frequency: 10,
    });
  }

  /**
   * Predefined shake: Large impact (explosion, boss defeat)
   */
  public largeImpact(): void {
    this.shake({
      pattern: ShakePattern.EXPLOSION,
      intensity: 0.7,
      duration: 500,
      decay: true,
      frequency: 8,
    });
  }

  /**
   * Predefined shake: Ground pound
   */
  public groundPound(): void {
    this.shake({
      pattern: ShakePattern.VERTICAL,
      intensity: 0.6,
      duration: 400,
      decay: true,
      frequency: 9,
    });
  }

  /**
   * Predefined shake: Death sequence
   */
  public playerDeath(): void {
    this.shake({
      pattern: ShakePattern.RANDOM,
      intensity: 0.5,
      duration: 700,
      decay: false,
      frequency: 6,
    });
  }

  /**
   * Predefined shake: Continuous rumble (earthquake, moving platform)
   */
  public rumble(duration: number = 2000): void {
    this.shake({
      pattern: ShakePattern.RUMBLE,
      intensity: 0.3,
      duration,
      decay: false,
      frequency: 20,
    });
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopShaking();
  }
}
