import { MarioEntity } from '../../types/entity';
import Level from '../Level';

/**
 * Interface for saved game state
 */
export interface SaveState {
  levelName: string;
  position: {
    x: number;
    y: number;
  };
  timestamp: number;
}

/**
 * Service for saving and loading game state
 */
export default class SaveService {
  private static instance: SaveService;
  private readonly STORAGE_KEY = 'super-mario-save';

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService();
    }
    return SaveService.instance;
  }

  /**
   * Save the game state
   * @param state Game state to save
   */
  public saveGame(state: SaveState): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  /**
   * Load the game state
   * @returns Game state or null if no save exists
   */
  public loadGame(): SaveState | null {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      return savedState ? JSON.parse(savedState) : null;
    } catch (e) {
      console.error('Failed to load game:', e);
      return null;
    }
  }

  /**
   * Check if a save exists
   * @returns True if a save exists
   */
  public hasSave(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * Delete the save
   */
  public deleteSave(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Create a save state from the current game state
   * @param mario Mario entity
   * @param level Current level
   * @returns Save state
   */
  public createSaveState(mario: MarioEntity, level: Level): SaveState {
    return {
      levelName: level.name,
      position: {
        x: mario.pos.x,
        y: mario.pos.y,
      },
      timestamp: Date.now(),
    };
  }
}
