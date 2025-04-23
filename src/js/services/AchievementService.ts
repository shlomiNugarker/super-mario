/**
 * Achievement Service
 *
 * Manages game achievements and progression tracking.
 */

// Achievement structure
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  secret?: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: number;
}

// Achievement notification
export interface AchievementNotification {
  achievement: Achievement;
  timestamp: number;
  displayed: boolean;
}

export default class AchievementService {
  private static instance: AchievementService;
  private achievements: Map<string, Achievement> = new Map();
  private notifications: AchievementNotification[] = [];
  private localStorageKey = 'mario-achievements';
  private listeners: ((achievement: Achievement) => void)[] = [];

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {
    this.initAchievements();
    this.loadSavedProgress();
  }

  /**
   * Get the service instance
   */
  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Initialize default achievements
   */
  private initAchievements(): void {
    // Game progression
    this.registerAchievement({
      id: 'level_1_1',
      title: 'World 1-1',
      description: 'Complete World 1-1',
      icon: 'flag',
      unlocked: false,
    });

    this.registerAchievement({
      id: 'all_levels',
      title: 'World Champion',
      description: 'Complete all levels',
      icon: 'trophy',
      unlocked: false,
    });

    // Player actions
    this.registerAchievement({
      id: 'first_coin',
      title: 'Coin Collector',
      description: 'Collect your first coin',
      icon: 'coin',
      unlocked: false,
    });

    this.registerAchievement({
      id: 'hundred_coins',
      title: 'Rich Mario',
      description: 'Collect 100 coins in total',
      icon: 'coins',
      unlocked: false,
      progress: 0,
      maxProgress: 100,
    });

    this.registerAchievement({
      id: 'first_mushroom',
      title: 'Power Up',
      description: 'Collect your first mushroom',
      icon: 'mushroom',
      unlocked: false,
    });

    this.registerAchievement({
      id: 'first_fire_flower',
      title: 'Bring the Heat',
      description: 'Collect your first fire flower',
      icon: 'fire-flower',
      unlocked: false,
    });

    this.registerAchievement({
      id: 'first_star',
      title: 'Invincible',
      description: 'Collect your first star',
      icon: 'star',
      unlocked: false,
    });

    // Enemy interactions
    this.registerAchievement({
      id: 'first_goomba',
      title: 'Goomba Stomper',
      description: 'Defeat your first Goomba',
      icon: 'goomba',
      unlocked: false,
    });

    this.registerAchievement({
      id: 'ten_goombas',
      title: 'Goomba Hunter',
      description: 'Defeat 10 Goombas',
      icon: 'goomba',
      unlocked: false,
      progress: 0,
      maxProgress: 10,
    });

    this.registerAchievement({
      id: 'first_koopa',
      title: 'Shell Shocker',
      description: 'Defeat your first Koopa',
      icon: 'koopa',
      unlocked: false,
    });

    // Secret achievements
    this.registerAchievement({
      id: 'speedrun',
      title: 'Speed Demon',
      description: 'Complete a level in under 100 seconds',
      icon: 'clock',
      unlocked: false,
      secret: true,
    });

    this.registerAchievement({
      id: 'no_damage',
      title: 'Untouchable',
      description: 'Complete a level without taking damage',
      icon: 'shield',
      unlocked: false,
      secret: true,
    });

    this.registerAchievement({
      id: 'all_coins',
      title: 'Treasure Hunter',
      description: 'Collect all coins in a level',
      icon: 'chest',
      unlocked: false,
      secret: true,
    });
  }

  /**
   * Register a new achievement
   * @param achievement Achievement to register
   */
  public registerAchievement(achievement: Achievement): void {
    this.achievements.set(achievement.id, achievement);
  }

  /**
   * Get all achievements
   * @param includeSecret Whether to include secret achievements
   */
  public getAllAchievements(includeSecret: boolean = true): Achievement[] {
    return Array.from(this.achievements.values()).filter(
      (achievement) => includeSecret || !achievement.secret || achievement.unlocked
    );
  }

  /**
   * Get a specific achievement
   * @param id Achievement ID
   */
  public getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  /**
   * Check if an achievement is unlocked
   * @param id Achievement ID
   */
  public isUnlocked(id: string): boolean {
    const achievement = this.achievements.get(id);
    return achievement ? achievement.unlocked : false;
  }

  /**
   * Unlock an achievement
   * @param id Achievement ID
   */
  public unlockAchievement(id: string): boolean {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();

      // Add to notifications
      this.notifications.push({
        achievement,
        timestamp: Date.now(),
        displayed: false,
      });

      // Notify listeners
      this.notifyListeners(achievement);

      // Save progress
      this.saveProgress();

      return true;
    }
    return false;
  }

  /**
   * Update progress for an achievement
   * @param id Achievement ID
   * @param progress Current progress
   */
  public updateProgress(id: string, progress: number): boolean {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked && achievement.maxProgress !== undefined) {
      achievement.progress = Math.min(progress, achievement.maxProgress);

      // Check if achievement should be unlocked
      if (achievement.progress >= achievement.maxProgress) {
        return this.unlockAchievement(id);
      }

      // Save progress
      this.saveProgress();
    }
    return false;
  }

  /**
   * Increment progress for an achievement
   * @param id Achievement ID
   * @param amount Amount to increment (default: 1)
   */
  public incrementProgress(id: string, amount: number = 1): boolean {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked && achievement.progress !== undefined) {
      const newProgress = (achievement.progress || 0) + amount;
      return this.updateProgress(id, newProgress);
    }
    return false;
  }

  /**
   * Get pending notifications that haven't been displayed
   */
  public getPendingNotifications(): AchievementNotification[] {
    return this.notifications.filter((notification) => !notification.displayed);
  }

  /**
   * Mark notifications as displayed
   * @param notifications Notifications to mark
   */
  public markNotificationsAsDisplayed(notifications: AchievementNotification[]): void {
    for (const notification of notifications) {
      notification.displayed = true;
    }
  }

  /**
   * Add a listener for achievement unlocks
   * @param listener Function to call when an achievement is unlocked
   */
  public addListener(listener: (achievement: Achievement) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   * @param listener Listener to remove
   */
  public removeListener(listener: (achievement: Achievement) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners about an unlocked achievement
   * @param achievement Unlocked achievement
   */
  private notifyListeners(achievement: Achievement): void {
    for (const listener of this.listeners) {
      try {
        listener(achievement);
      } catch (error) {
        console.error('Error in achievement listener:', error);
      }
    }
  }

  /**
   * Save progress to local storage
   */
  private saveProgress(): void {
    try {
      const data = Array.from(this.achievements.values()).map((achievement) => ({
        id: achievement.id,
        unlocked: achievement.unlocked,
        progress: achievement.progress,
        unlockedAt: achievement.unlockedAt,
      }));
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
    }
  }

  /**
   * Load saved progress from local storage
   */
  private loadSavedProgress(): void {
    try {
      const savedData = localStorage.getItem(this.localStorageKey);
      if (savedData) {
        const data = JSON.parse(savedData);
        for (const item of data) {
          const achievement = this.achievements.get(item.id);
          if (achievement) {
            achievement.unlocked = item.unlocked;
            if (item.progress !== undefined) {
              achievement.progress = item.progress;
            }
            if (item.unlockedAt) {
              achievement.unlockedAt = item.unlockedAt;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load achievement progress:', error);
    }
  }

  /**
   * Reset all achievements
   */
  public resetAchievements(): void {
    for (const achievement of this.achievements.values()) {
      achievement.unlocked = false;
      if (achievement.progress !== undefined) {
        achievement.progress = 0;
      }
      achievement.unlockedAt = undefined;
    }
    this.notifications = [];
    this.saveProgress();
  }
}
