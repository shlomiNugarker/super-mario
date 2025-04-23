import Level from '../Level.ts';
import { createLevelLoader } from '../loaders/level.ts';

/**
 * Service for loading game levels
 */
export default class LevelService {
  private static instance: LevelService;
  private levelLoader: ((name: string) => Promise<Level>) | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): LevelService {
    if (!LevelService.instance) {
      LevelService.instance = new LevelService();
    }
    return LevelService.instance;
  }

  /**
   * Initialize the level loader
   * @param entityFactory Factory for creating entities
   */
  public async initLevelLoader(entityFactory: any): Promise<void> {
    this.levelLoader = await createLevelLoader(entityFactory);
  }

  /**
   * Get a level by name
   * @param name Level name
   * @returns Promise<Level>
   */
  public static async getLevel(
    name: string,
    loadFunction?: (name: string) => Promise<Level>
  ): Promise<Level> {
    const instance = LevelService.getInstance();

    // Use provided load function if available, otherwise use the initialized level loader
    const loader = loadFunction || instance.levelLoader;

    if (!loader) {
      throw new Error('Level loader not initialized');
    }

    return loader(name);
  }

  /**
   * Load a level by name using the initialized level loader
   * @param name Level name
   * @returns Promise<Level>
   */
  public async loadLevel(name: string): Promise<Level> {
    if (!this.levelLoader) {
      throw new Error('Level loader not initialized');
    }

    return this.levelLoader(name);
  }
}
