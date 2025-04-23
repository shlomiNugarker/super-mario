/**
 * Difficulty Service
 *
 * Provides dynamic difficulty adjustment based on player performance.
 */

import { RUNTIME_CONFIG } from '../config';

// Difficulty levels
export enum DifficultyLevel {
  VERY_EASY = 0,
  EASY = 1,
  NORMAL = 2,
  HARD = 3,
  VERY_HARD = 4,
}

// Performance metrics
interface PerformanceMetrics {
  deathCount: number;
  timeTaken: number[];
  enemiesDefeated: number;
  powerupsCollected: number;
  jumps: number;
  fallsIntoGaps: number;
  levelCompletions: number;
  livesLost: number;
  timeSpentAsSmallMario: number;
  lastUpdated: number;
}

// Difficulty parameters
export interface DifficultyParams {
  enemySpeed: number;
  enemySpawnRate: number;
  powerupFrequency: number;
  playerJumpHeight: number;
  timeLimit: number;
  gapWidth: number;
  assistMode: boolean;
}

export default class DifficultyService {
  private static instance: DifficultyService;
  private currentDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;
  private metrics: PerformanceMetrics = {
    deathCount: 0,
    timeTaken: [],
    enemiesDefeated: 0,
    powerupsCollected: 0,
    jumps: 0,
    fallsIntoGaps: 0,
    levelCompletions: 0,
    livesLost: 0,
    timeSpentAsSmallMario: 0,
    lastUpdated: Date.now(),
  };

  private autoAdjust: boolean = true;
  private difficultyChangeThreshold: number = 3; // Number of deaths before considering difficulty change
  private localStorageKey: string = 'mario-difficulty';
  private defaultDifficulty: DifficultyLevel = DifficultyLevel.NORMAL;
  private defaultParams: Map<DifficultyLevel, DifficultyParams> = new Map();
  private difficultyParams: DifficultyParams;

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {
    this.initDefaultParams();
    this.loadSettings();
    this.difficultyParams = this.getParamsForDifficulty(this.currentDifficulty);
  }

  /**
   * Get the service instance
   */
  public static getInstance(): DifficultyService {
    if (!DifficultyService.instance) {
      DifficultyService.instance = new DifficultyService();
    }
    return DifficultyService.instance;
  }

  /**
   * Initialize default difficulty parameters
   */
  private initDefaultParams(): void {
    // Very Easy
    this.defaultParams.set(DifficultyLevel.VERY_EASY, {
      enemySpeed: 0.6,
      enemySpawnRate: 0.6,
      powerupFrequency: 1.5,
      playerJumpHeight: 1.2,
      timeLimit: 1.5,
      gapWidth: 0.7,
      assistMode: true,
    });

    // Easy
    this.defaultParams.set(DifficultyLevel.EASY, {
      enemySpeed: 0.8,
      enemySpawnRate: 0.8,
      powerupFrequency: 1.2,
      playerJumpHeight: 1.1,
      timeLimit: 1.3,
      gapWidth: 0.8,
      assistMode: false,
    });

    // Normal
    this.defaultParams.set(DifficultyLevel.NORMAL, {
      enemySpeed: 1.0,
      enemySpawnRate: 1.0,
      powerupFrequency: 1.0,
      playerJumpHeight: 1.0,
      timeLimit: 1.0,
      gapWidth: 1.0,
      assistMode: false,
    });

    // Hard
    this.defaultParams.set(DifficultyLevel.HARD, {
      enemySpeed: 1.2,
      enemySpawnRate: 1.2,
      powerupFrequency: 0.8,
      playerJumpHeight: 1.0,
      timeLimit: 0.9,
      gapWidth: 1.1,
      assistMode: false,
    });

    // Very Hard
    this.defaultParams.set(DifficultyLevel.VERY_HARD, {
      enemySpeed: 1.4,
      enemySpawnRate: 1.5,
      powerupFrequency: 0.6,
      playerJumpHeight: 1.0,
      timeLimit: 0.8,
      gapWidth: 1.2,
      assistMode: false,
    });
  }

  /**
   * Load settings from local storage
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.currentDifficulty = data.difficulty ?? this.defaultDifficulty;
        this.autoAdjust = data.autoAdjust ?? true;
      }
    } catch (error) {
      console.warn('Failed to load difficulty settings', error);
      this.currentDifficulty = this.defaultDifficulty;
    }
  }

  /**
   * Save settings to local storage
   */
  private saveSettings(): void {
    try {
      const data = {
        difficulty: this.currentDifficulty,
        autoAdjust: this.autoAdjust,
      };
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save difficulty settings', error);
    }
  }

  /**
   * Get parameters for the specified difficulty level
   */
  private getParamsForDifficulty(level: DifficultyLevel): DifficultyParams {
    return this.defaultParams.get(level) ?? this.defaultParams.get(DifficultyLevel.NORMAL)!;
  }

  /**
   * Get current difficulty level
   */
  public getDifficultyLevel(): DifficultyLevel {
    return this.currentDifficulty;
  }

  /**
   * Get current difficulty parameters
   */
  public getDifficultyParams(): DifficultyParams {
    return { ...this.difficultyParams };
  }

  /**
   * Set difficulty level manually
   * @param level New difficulty level
   */
  public setDifficultyLevel(level: DifficultyLevel): void {
    this.currentDifficulty = level;
    this.difficultyParams = this.getParamsForDifficulty(level);
    this.saveSettings();
  }

  /**
   * Toggle automatic difficulty adjustment
   * @param enabled Whether auto-adjustment is enabled
   */
  public setAutoAdjust(enabled: boolean): void {
    this.autoAdjust = enabled;
    this.saveSettings();
  }

  /**
   * Check if auto-adjust is enabled
   */
  public isAutoAdjustEnabled(): boolean {
    return this.autoAdjust;
  }

  /**
   * Register a player death
   */
  public registerDeath(): void {
    this.metrics.deathCount++;
    this.metrics.livesLost++;
    this.metrics.lastUpdated = Date.now();

    if (this.autoAdjust && this.metrics.deathCount >= this.difficultyChangeThreshold) {
      this.adjustDifficultyBasedOnPerformance();
    }
  }

  /**
   * Register completion of a level
   * @param timeTaken Time taken to complete the level in seconds
   */
  public registerLevelCompletion(timeTaken: number): void {
    this.metrics.levelCompletions++;
    this.metrics.timeTaken.push(timeTaken);

    // Keep only the last 5 times
    if (this.metrics.timeTaken.length > 5) {
      this.metrics.timeTaken.shift();
    }

    this.metrics.lastUpdated = Date.now();

    if (this.autoAdjust) {
      this.considerDifficultyIncrease();
    }
  }

  /**
   * Register an enemy defeat
   */
  public registerEnemyDefeated(): void {
    this.metrics.enemiesDefeated++;
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Register powerup collection
   */
  public registerPowerupCollected(): void {
    this.metrics.powerupsCollected++;
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Register a jump
   */
  public registerJump(): void {
    this.metrics.jumps++;
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Register falling into a gap
   */
  public registerFallIntoGap(): void {
    this.metrics.fallsIntoGaps++;
    this.metrics.lastUpdated = Date.now();

    if (this.autoAdjust && this.metrics.fallsIntoGaps >= this.difficultyChangeThreshold) {
      this.considerDifficultyDecrease();
    }
  }

  /**
   * Register time spent as small Mario
   * @param seconds Time in seconds
   */
  public registerSmallMarioTime(seconds: number): void {
    this.metrics.timeSpentAsSmallMario += seconds;
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Consider decreasing difficulty
   */
  private considerDifficultyDecrease(): void {
    if (this.currentDifficulty > DifficultyLevel.VERY_EASY) {
      this.setDifficultyLevel(this.currentDifficulty - 1);
      this.resetMetrics();
      this.notifyDifficultyChange(false);
    }
  }

  /**
   * Consider increasing difficulty
   */
  private considerDifficultyIncrease(): void {
    // Only increase difficulty if player is doing well
    if (
      this.metrics.levelCompletions >= 2 &&
      this.metrics.deathCount < 2 &&
      this.currentDifficulty < DifficultyLevel.VERY_HARD
    ) {
      this.setDifficultyLevel(this.currentDifficulty + 1);
      this.resetMetrics();
      this.notifyDifficultyChange(true);
    }
  }

  /**
   * Adjust difficulty based on performance metrics
   */
  private adjustDifficultyBasedOnPerformance(): void {
    const difficultyScore = this.calculatePerformanceScore();

    if (difficultyScore < -10) {
      this.considerDifficultyDecrease();
    } else if (difficultyScore > 10 && this.metrics.levelCompletions > 0) {
      this.considerDifficultyIncrease();
    }

    // Reset counters that led to this adjustment
    this.resetMetrics();
  }

  /**
   * Calculate performance score
   * Higher score = better performance
   */
  private calculatePerformanceScore(): number {
    let score = 0;

    // Deaths reduce score significantly
    score -= this.metrics.deathCount * 5;

    // Falling into gaps reduces score
    score -= this.metrics.fallsIntoGaps * 3;

    // Completing levels increases score
    score += this.metrics.levelCompletions * 8;

    // Defeated enemies increase score slightly
    score += Math.min(this.metrics.enemiesDefeated, 10);

    // Collected powerups increase score slightly
    score += Math.min(this.metrics.powerupsCollected, 5);

    // Time spent as small Mario decreases score
    if (this.metrics.timeSpentAsSmallMario > 60) {
      score -= 3;
    }

    return score;
  }

  /**
   * Reset performance metrics
   */
  private resetMetrics(): void {
    this.metrics = {
      deathCount: 0,
      timeTaken: this.metrics.timeTaken, // Keep time records
      enemiesDefeated: 0,
      powerupsCollected: 0,
      jumps: 0,
      fallsIntoGaps: 0,
      levelCompletions: 0,
      livesLost: 0,
      timeSpentAsSmallMario: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Notify of difficulty change
   */
  private notifyDifficultyChange(increased: boolean): void {
    const difficultyNames = ['Very Easy', 'Easy', 'Normal', 'Hard', 'Very Hard'];

    if (RUNTIME_CONFIG.debugEnabled) {
      console.log(
        `Difficulty ${increased ? 'increased' : 'decreased'} to ${
          difficultyNames[this.currentDifficulty]
        }`
      );
    }

    // Could show UI notification here
  }

  /**
   * Reset to default settings
   */
  public resetToDefaults(): void {
    this.currentDifficulty = this.defaultDifficulty;
    this.autoAdjust = true;
    this.difficultyParams = this.getParamsForDifficulty(this.currentDifficulty);
    this.resetMetrics();
    this.saveSettings();
  }
}
