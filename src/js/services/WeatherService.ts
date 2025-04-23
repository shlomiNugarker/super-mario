/**
 * Weather Service
 *
 * Provides dynamic weather effects for the game.
 * Supports different weather types including rain, snow, fog, and wind.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';

// Weather particle types
type Particle = {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  lifetime?: number;
};

// Weather types
export enum WeatherType {
  CLEAR = 'clear',
  RAIN = 'rain',
  SNOW = 'snow',
  FOG = 'fog',
  WIND = 'wind',
}

export default class WeatherService {
  private static instance: WeatherService;
  private ctx: CanvasRenderingContext2D | null = null;
  private weatherType: WeatherType = WeatherType.CLEAR;
  private intensity: number = 0.5; // 0 to 1
  private particles: Particle[] = [];
  private isActive: boolean = false;
  private lastUpdate: number = 0;
  private windDirection: number = 0; // 0 to 2*PI
  private weatherTimer: number | null = null;

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {}

  /**
   * Get the service instance
   */
  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  /**
   * Initialize the weather service
   * @param ctx Canvas rendering context
   */
  public init(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;
    this.isActive = true;
  }

  /**
   * Set the current weather type
   * @param type Weather type
   * @param intensity Intensity from 0 to 1
   * @param duration Optional duration in seconds (returns to clear after)
   */
  public setWeather(type: WeatherType, intensity: number = 0.5, duration?: number): void {
    this.weatherType = type;
    this.intensity = Math.max(0, Math.min(1, intensity));
    this.particles = [];

    // Create initial particles based on weather type
    this.generateParticles();

    // Set up wind direction if applicable
    if (type === WeatherType.WIND || type === WeatherType.RAIN) {
      this.windDirection = Math.random() * Math.PI;
    }

    // Clear any existing timer
    if (this.weatherTimer !== null) {
      window.clearTimeout(this.weatherTimer);
      this.weatherTimer = null;
    }

    // Set up duration timer if specified
    if (duration) {
      this.weatherTimer = window.setTimeout(() => {
        this.setWeather(WeatherType.CLEAR);
        this.weatherTimer = null;
      }, duration * 1000);
    }
  }

  /**
   * Generate initial particles based on weather type
   */
  private generateParticles(): void {
    const count = Math.floor(this.intensity * 100);

    switch (this.weatherType) {
      case WeatherType.RAIN:
        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 1 + Math.random() * 2,
            speed: 10 + Math.random() * 15,
            opacity: 0.3 + Math.random() * 0.7,
          });
        }
        break;

      case WeatherType.SNOW:
        for (let i = 0; i < count; i++) {
          this.particles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 1 + Math.random() * 3,
            speed: 1 + Math.random() * 3,
            opacity: 0.5 + Math.random() * 0.5,
          });
        }
        break;

      case WeatherType.FOG:
        for (let i = 0; i < 20; i++) {
          this.particles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 50 + Math.random() * 100,
            speed: 0.2 + Math.random() * 0.3,
            opacity: 0.05 + Math.random() * 0.1 * this.intensity,
          });
        }
        break;

      case WeatherType.WIND:
        for (let i = 0; i < count / 2; i++) {
          this.particles.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: 1 + Math.random() * 1,
            speed: 5 + Math.random() * 10,
            opacity: 0.1 + Math.random() * 0.2,
            lifetime: 20 + Math.random() * 40,
          });
        }
        break;
    }
  }

  /**
   * Update weather particles
   * @param deltaTime Time since last frame in seconds
   */
  public update(deltaTime: number): void {
    if (!this.isActive || this.weatherType === WeatherType.CLEAR) {
      return;
    }

    const currentTime = performance.now();

    // Add new particles periodically
    if (currentTime - this.lastUpdate > 100 && this.particles.length < this.intensity * 100) {
      this.addNewParticles();
      this.lastUpdate = currentTime;
    }

    // Update existing particles
    this.updateParticles(deltaTime);
  }

  /**
   * Add new particles based on weather type
   */
  private addNewParticles(): void {
    if (this.weatherType === WeatherType.RAIN) {
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: Math.random() * CANVAS_WIDTH,
          y: -5,
          size: 1 + Math.random() * 2,
          speed: 10 + Math.random() * 15,
          opacity: 0.3 + Math.random() * 0.7,
        });
      }
    } else if (this.weatherType === WeatherType.SNOW) {
      this.particles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: -5,
        size: 1 + Math.random() * 3,
        speed: 1 + Math.random() * 3,
        opacity: 0.5 + Math.random() * 0.5,
      });
    } else if (this.weatherType === WeatherType.WIND && Math.random() < 0.3) {
      this.particles.push({
        x: 0,
        y: Math.random() * CANVAS_HEIGHT,
        size: 1 + Math.random() * 1,
        speed: 5 + Math.random() * 10,
        opacity: 0.1 + Math.random() * 0.2,
        lifetime: 20 + Math.random() * 40,
      });
    }
  }

  /**
   * Update all particles
   * @param deltaTime Time since last frame
   */
  private updateParticles(deltaTime: number): void {
    const removeList: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      switch (this.weatherType) {
        case WeatherType.RAIN:
          p.y += p.speed * deltaTime;
          p.x += Math.sin(this.windDirection) * p.speed * 0.5 * deltaTime;

          // Remove if out of bounds
          if (p.y > CANVAS_HEIGHT) {
            removeList.push(i);
          }
          break;

        case WeatherType.SNOW:
          p.y += p.speed * deltaTime;
          // Snow moves with a slight wobble
          p.x += Math.sin(p.y * 0.01) * 0.5 + Math.sin(this.windDirection) * deltaTime * 2;

          // Remove if out of bounds
          if (p.y > CANVAS_HEIGHT) {
            removeList.push(i);
          }
          break;

        case WeatherType.FOG:
          p.x += Math.sin(this.windDirection) * p.speed * deltaTime;

          // Fog wraps around the screen
          if (p.x > CANVAS_WIDTH + p.size) {
            p.x = -p.size;
          } else if (p.x < -p.size) {
            p.x = CANVAS_WIDTH + p.size;
          }
          break;

        case WeatherType.WIND:
          p.x += p.speed * deltaTime;
          p.y += Math.sin(this.windDirection + Math.PI / 2) * p.speed * 0.2 * deltaTime;

          // Reduce lifetime
          if (p.lifetime) {
            p.lifetime -= deltaTime * 10;
            if (p.lifetime <= 0) {
              removeList.push(i);
            }
          }

          // Remove if out of bounds
          if (p.x > CANVAS_WIDTH) {
            removeList.push(i);
          }
          break;
      }
    }

    // Remove particles (in reverse order to avoid index issues)
    for (let i = removeList.length - 1; i >= 0; i--) {
      this.particles.splice(removeList[i], 1);
    }
  }

  /**
   * Render weather effects
   */
  public render(): void {
    if (!this.ctx || !this.isActive || this.weatherType === WeatherType.CLEAR) {
      return;
    }

    const ctx = this.ctx;

    ctx.save();

    switch (this.weatherType) {
      case WeatherType.RAIN:
        this.renderRain(ctx);
        break;

      case WeatherType.SNOW:
        this.renderSnow(ctx);
        break;

      case WeatherType.FOG:
        this.renderFog(ctx);
        break;

      case WeatherType.WIND:
        this.renderWind(ctx);
        break;
    }

    ctx.restore();
  }

  /**
   * Render rain particles
   */
  private renderRain(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#99aaff';
    ctx.lineCap = 'round';

    for (const p of this.particles) {
      ctx.globalAlpha = p.opacity;
      ctx.lineWidth = p.size / 2;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.sin(this.windDirection) * 10, p.y + 10);
      ctx.stroke();
    }
  }

  /**
   * Render snow particles
   */
  private renderSnow(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffffff';

    for (const p of this.particles) {
      ctx.globalAlpha = p.opacity;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render fog particles
   */
  private renderFog(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = p.opacity;

      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);

      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Render wind particles
   */
  private renderWind(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';

    for (const p of this.particles) {
      ctx.globalAlpha = p.opacity;
      ctx.lineWidth = p.size / 2;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 10, p.y + Math.sin(this.windDirection + Math.PI / 2) * 2);
      ctx.stroke();
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.isActive = false;
    this.particles = [];
    if (this.weatherTimer !== null) {
      window.clearTimeout(this.weatherTimer);
      this.weatherTimer = null;
    }
  }
}
