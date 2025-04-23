import { GameContext, EntityFactories } from '../../types/common';
import { RUNTIME_CONFIG } from '../config';

/**
 * Font interface representing the font used in the game
 */
interface Font {
  size: number;
  print(text: string, context: CanvasRenderingContext2D, x: number, y: number): void;
}

/**
 * Central game service for dependency injection
 */
export default class GameService {
  private static instance: GameService;

  public audioContext: AudioContext;
  public videoContext: CanvasRenderingContext2D | null;
  public entityFactory: EntityFactories | null;
  public font: Font | null;

  private deltaTime: number;
  private tick: number;
  private paused: boolean;

  private constructor() {
    this.audioContext = new AudioContext();
    this.videoContext = null;
    this.entityFactory = null;
    this.font = null;

    this.deltaTime = 0;
    this.tick = 0;
    this.paused = false;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }

  /**
   * Initialize the game service
   * @param videoContext Canvas context
   */
  public init(videoContext: CanvasRenderingContext2D): void {
    this.videoContext = videoContext;
  }

  /**
   * Set the entity factory
   * @param entityFactory Entity factory
   */
  public setEntityFactory(entityFactory: EntityFactories): void {
    this.entityFactory = entityFactory;
  }

  /**
   * Set the font
   * @param font Font
   */
  public setFont(font: Font): void {
    this.font = font;
  }

  /**
   * Update the game service
   * @param deltaTime Delta time
   */
  public update(deltaTime: number): void {
    if (this.paused) return;

    this.deltaTime = deltaTime;
    this.tick++;
  }

  /**
   * Pause the game
   */
  public pause(): void {
    this.paused = true;
    this.audioContext.suspend();
  }

  /**
   * Resume the game
   */
  public resume(): void {
    this.paused = false;
    this.audioContext.resume();
  }

  /**
   * Toggle the music
   */
  public toggleMusic(): void {
    RUNTIME_CONFIG.musicEnabled = !RUNTIME_CONFIG.musicEnabled;
  }

  /**
   * Toggle the sound effects
   */
  public toggleSound(): void {
    RUNTIME_CONFIG.soundEnabled = !RUNTIME_CONFIG.soundEnabled;
  }

  /**
   * Check if music is enabled
   * @returns True if music is enabled
   */
  public isMusicEnabled(): boolean {
    return RUNTIME_CONFIG.musicEnabled;
  }

  /**
   * Check if sound effects are enabled
   * @returns True if sound effects are enabled
   */
  public isSoundEnabled(): boolean {
    return RUNTIME_CONFIG.soundEnabled;
  }

  /**
   * Stop all sounds when game is unloaded/cleanup
   */
  public stopAllSounds(): void {
    // Close and create a new AudioContext to effectively stop all sounds
    this.audioContext.close();
    this.audioContext = new AudioContext();
  }

  /**
   * Get the game context
   */
  public getGameContext(): GameContext {
    return {
      audioContext: this.audioContext,
      videoContext: this.videoContext,
      entityFactory: this.entityFactory as EntityFactories,
      deltaTime: this.deltaTime,
      tick: this.tick,
    };
  }
}
