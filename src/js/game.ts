import Level from './Level.ts';
import Timer from './Timer.ts';
import { createLevelLoader } from './loaders/level.ts';
import { loadFont } from './loaders/font.ts';
import { loadEntities } from './entities.ts';
import { makePlayer, bootstrapPlayer, resetPlayer, findPlayers } from './player.ts';
import { createColorLayer } from './layers/color.ts';
import { createTextLayer } from './layers/text.ts';
import { createCollisionLayer } from './layers/collision.ts';
import { createDashboardLayer } from './layers/dashboard.ts';
import { createPlayerProgressLayer } from './layers/player-progress.ts';
import SceneRunner from './SceneRunner.ts';
import Scene from './Scene.ts';
import TimedScene from './TimedScene.ts';
import { LevelEvents } from '../types/level';
import { CANVAS_WIDTH, CANVAS_HEIGHT, DEBUG_COLLISIONS, PLAYER_JUMP_VELOCITY } from './config.ts';
import Pipe from './traits/Pipe.ts';
import { connectEntity } from './traits/Pipe.js';
import GameService from './services/GameService.ts';
import InputService from './services/InputService.ts';
import DebugService from './services/DebugService.ts';
import SaveService from './services/SaveService.ts';
import AssetService from './services/AssetService.ts';
import LevelService from './services/LevelService.ts';
import WeatherService, { WeatherType } from './services/WeatherService';
import AchievementService from './services/AchievementService';
import DifficultyService from './services/DifficultyService';
import ScreenShakeService from './services/ScreenShakeService';
import AchievementNotificationUI from './ui/AchievementNotification';

// Define the window.mario property
declare global {
  interface Window {
    mario: any;
  }
}

/**
 * Game class
 */
export default class Game {
  private canvas: HTMLCanvasElement;
  private gameService: GameService;
  private inputService: InputService;
  private debugService: DebugService;
  private saveService: SaveService;
  private weatherService: WeatherService;
  private achievementService: AchievementService;
  private difficultyService: DifficultyService;
  private screenShakeService: ScreenShakeService;
  private achievementUI: AchievementNotificationUI;
  private sceneRunner: SceneRunner;
  private timer: Timer;
  private mario: any;
  private currentLevel: any;
  private _isPaused: boolean;
  private pauseMenu: HTMLElement | null;
  private gameUI: HTMLElement | null;
  private debugPanel: HTMLElement | null;
  private _weatherInterval: number | null = null;

  /**
   * Constructor
   * @param canvas Canvas element
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gameService = GameService.getInstance();
    this.inputService = InputService.getInstance();
    this.debugService = DebugService.getInstance();
    this.saveService = SaveService.getInstance();
    this.weatherService = WeatherService.getInstance();
    this.achievementService = AchievementService.getInstance();
    this.difficultyService = DifficultyService.getInstance();
    this.screenShakeService = ScreenShakeService.getInstance();
    this.achievementUI = new AchievementNotificationUI();
    this.sceneRunner = new SceneRunner();
    this.timer = new Timer(1 / 60);
    this.mario = null;
    this.currentLevel = null;
    this._isPaused = false;
    this.pauseMenu = null;
    this.gameUI = null;
    this.debugPanel = null;
  }

  /**
   * Initialize the game
   */
  async init() {
    // Set up the canvas dimensions
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    // Create UI elements
    this.createGameUI();

    // Create loading indicator
    const loadingElement = this.createLoadingIndicator();
    document.body.appendChild(loadingElement);

    const videoContext = this.canvas.getContext('2d');
    if (!videoContext) {
      throw new Error('Could not get canvas context');
    }

    this.gameService.init(videoContext);
    this.inputService.init(window);
    this.debugService.init();

    // Initialize new services
    this.weatherService.init(videoContext);
    this.screenShakeService.init(this.canvas, videoContext);

    // Register pause handler with InputService
    this.inputService.setPauseHandler(() => {
      if (this._isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    });

    // Set up debug panel
    this.setupDebugPanel();

    // Check for pending achievement notifications
    this.checkPendingAchievements();

    try {
      // Try to preload assets, but continue even if it fails
      try {
        const assetService = AssetService.getInstance();
        await assetService.preloadEssentialAssets();

        assetService.preloadAllInBackground((progress) => {
          // Update loading progress
          this.updateLoadingProgress(loadingElement, progress);
        });
      } catch (assetError) {
        console.warn('Asset preloading error, continuing anyway:', assetError);
      }

      const [entityFactory, font] = await Promise.all([
        loadEntities(this.gameService.audioContext),
        loadFont(),
      ]);

      this.gameService.setEntityFactory(entityFactory);
      this.gameService.setFont(font as any); // Type assertion to fix incompatible Font types

      // Initialize the LevelService
      const levelService = LevelService.getInstance();
      await levelService.initLevelLoader(entityFactory);

      const loadLevel = await createLevelLoader(entityFactory);

      this.mario = entityFactory.mario();
      makePlayer(this.mario, 'MARIO');

      window.mario = this.mario;

      this.inputService.addReceiver(this.mario);

      this.timer.update = (deltaTime: number) => {
        // Update screen shake
        this.screenShakeService.update();

        // Apply difficulty settings
        this.applyDifficultySettings();

        // Update game state
        this.gameService.update(deltaTime);
        this.sceneRunner.update(this.gameService.getGameContext());

        // Update weather effects
        this.weatherService.update(deltaTime);

        // Update debug information
        if (this.mario) {
          this.debugService.set('FPS', Math.round(1 / deltaTime));
          this.debugService.set(
            'Position',
            `X: ${Math.round(this.mario.pos.x)}, Y: ${Math.round(this.mario.pos.y)}`
          );
          this.debugService.set(
            'Velocity',
            `X: ${this.mario.vel.x.toFixed(2)}, Y: ${this.mario.vel.y.toFixed(2)}`
          );
          const go = this.mario.traits.get(Function('return function Go(){}').constructor);
          if (go) {
            this.debugService.set('Speed', go.distance.toFixed(2));
          }
        }

        // Update debug panel
        this.updateDebugPanel();
      };

      // Set up achievement listeners
      this.setupAchievementListeners();

      await this.startWorld('1-1', loadLevel);

      // Remove loading indicator after initialization
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.remove();
      }

      // Make sure ALL loading indicators are gone
      this.clearAllLoadingIndicators();

      this.timer.start();

      // Add random weather to demo the feature
      this.addRandomWeather();
    } catch (error) {
      console.error('Error initializing game:', error);

      // Show error message
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent = 'Failed to load game resources. Please refresh and try again.';
      document.body.appendChild(errorMsg);

      // Remove loading indicator
      if (loadingElement && loadingElement.parentNode) {
        loadingElement.remove();
      }
    }
  }

  /**
   * Create the game UI
   */
  private createGameUI(): void {
    // Create UI container
    this.gameUI = document.createElement('div');
    this.gameUI.id = 'game-ui';
    document.body.appendChild(this.gameUI);

    // Create debug panel
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'debug-panel';
    document.body.appendChild(this.debugPanel);

    // Create settings button
    const settingsButton = document.createElement('button');
    settingsButton.id = 'settings-button';
    settingsButton.textContent = '⚙️'; // Gear emoji
    settingsButton.style.position = 'absolute';
    settingsButton.style.top = '10px';
    settingsButton.style.right = '10px';
    settingsButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    settingsButton.style.color = 'white';
    settingsButton.style.border = 'none';
    settingsButton.style.borderRadius = '5px';
    settingsButton.style.padding = '5px 10px';
    settingsButton.style.fontSize = '20px';
    settingsButton.style.cursor = 'pointer';
    settingsButton.style.zIndex = '100';
    settingsButton.title = 'Settings';

    settingsButton.addEventListener('click', () => {
      this.showSettingsMenu();
    });

    document.body.appendChild(settingsButton);

    // Note: Touch controls are now handled by InputService
    // No need to call createTouchControls() here
  }

  /**
   * Update the debug panel with current debug info
   */
  private updateDebugPanel(): void {
    if (!this.debugPanel) return;

    if (this.debugService.isEnabled()) {
      document.body.classList.add('debug-active');

      const debugInfo = this.debugService.getAll();
      let html = '';

      for (const [key, value] of Object.entries(debugInfo)) {
        html += `<div><strong>${key}:</strong> ${value}</div>`;
      }

      this.debugPanel.innerHTML = html;
    } else {
      document.body.classList.remove('debug-active');
    }
  }

  /**
   * Set up debug panel
   */
  private setupDebugPanel(): void {
    // Setup initial state
    this.updateDebugPanel();
  }

  /**
   * Create the pause menu
   */
  private createPauseMenu(): void {
    if (this.pauseMenu) {
      // Menu already exists, just show it
      this.pauseMenu.style.display = 'block';
      return;
    }

    // Create pause menu
    this.pauseMenu = document.createElement('div');
    this.pauseMenu.className = 'menu';

    // Title
    const title = document.createElement('div');
    title.className = 'menu-title';
    title.textContent = 'Paused';
    this.pauseMenu.appendChild(title);

    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.className = 'menu-button';
    resumeButton.textContent = 'Resume';
    resumeButton.addEventListener('click', () => this.resume());
    this.pauseMenu.appendChild(resumeButton);

    // Restart button
    const restartButton = document.createElement('button');
    restartButton.className = 'menu-button';
    restartButton.textContent = 'Restart Level';
    restartButton.addEventListener('click', () => {
      this.restartLevel();
      this.resume();
    });
    this.pauseMenu.appendChild(restartButton);

    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'menu-button';
    saveButton.textContent = 'Save Game';
    saveButton.addEventListener('click', () => {
      this.saveGame();
      // Keep the menu open
    });
    this.pauseMenu.appendChild(saveButton);

    // Load button - only enabled if save exists
    const loadButton = document.createElement('button');
    loadButton.className = 'menu-button';
    loadButton.textContent = 'Load Game';
    loadButton.disabled = !this.hasSave();
    loadButton.addEventListener('click', () => {
      this.loadSavedGame();
      this.resume();
    });
    this.pauseMenu.appendChild(loadButton);

    // Sound toggle
    const soundButton = document.createElement('button');
    soundButton.className = 'menu-button';
    soundButton.textContent = this.gameService.isSoundEnabled() ? 'Sound: ON' : 'Sound: OFF';
    soundButton.addEventListener('click', () => {
      this.toggleSound();
      soundButton.textContent = this.gameService.isSoundEnabled() ? 'Sound: ON' : 'Sound: OFF';
    });
    this.pauseMenu.appendChild(soundButton);

    // Music toggle
    const musicButton = document.createElement('button');
    musicButton.className = 'menu-button';
    musicButton.textContent = this.gameService.isMusicEnabled() ? 'Music: ON' : 'Music: OFF';
    musicButton.addEventListener('click', () => {
      this.toggleMusic();
      musicButton.textContent = this.gameService.isMusicEnabled() ? 'Music: ON' : 'Music: OFF';
    });
    this.pauseMenu.appendChild(musicButton);

    // Debug toggle
    const debugButton = document.createElement('button');
    debugButton.className = 'menu-button';
    debugButton.textContent = this.debugService.isEnabled() ? 'Debug: ON' : 'Debug: OFF';
    debugButton.addEventListener('click', () => {
      this.toggleDebug();
      debugButton.textContent = this.debugService.isEnabled() ? 'Debug: ON' : 'Debug: OFF';
    });
    this.pauseMenu.appendChild(debugButton);

    // Append to UI
    if (this.gameUI) {
      this.gameUI.appendChild(this.pauseMenu);
    } else {
      document.body.appendChild(this.pauseMenu);
    }
  }

  /**
   * Hide the pause menu
   */
  private hidePauseMenu(): void {
    if (this.pauseMenu) {
      this.pauseMenu.style.display = 'none';
    }
  }

  /**
   * Restart the current level
   */
  private restartLevel(): void {
    if (this.currentLevel && this.mario) {
      resetPlayer(this.mario, this.currentLevel.name);
    }
  }

  /**
   * Creates a loading screen
   * @param name Level name
   * @returns Scene
   */
  private createLoadingScreen(name: string): Scene {
    const font = this.gameService.font;
    const scene = new Scene();
    scene.comp.layers.push(createColorLayer('#000'));

    if (font) {
      scene.comp.layers.push(createTextLayer(font as any, `Loading ${name}...`));
    }

    // Create DOM loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = `Loading ${name}`;

    if (this.gameUI) {
      this.gameUI.appendChild(loadingElement);
    } else {
      document.body.appendChild(loadingElement);
    }

    // Remove loading element when scene is done
    scene.events.listen(Scene.EVENT_COMPLETE, () => {
      loadingElement.remove();
    });

    return scene;
  }

  /**
   * Sets up a level
   * @param name Level name
   * @param loadLevel Level loader function
   * @returns Promise<Level>
   */
  private async setupLevel(
    name: string,
    loadLevel: (name: string) => Promise<Level>
  ): Promise<Level> {
    const loadingScreen = this.createLoadingScreen(name);
    this.sceneRunner.addScene(loadingScreen);
    this.sceneRunner.runNext();

    const level = await loadLevel(name);
    this.currentLevel = level;
    bootstrapPlayer(this.mario, level);

    // Force the loading screen to complete - this ensures it's removed
    loadingScreen.complete();

    // Level trigger events
    level.events.listen(LevelEvents.TRIGGER as any, (spec: any, _trigger: any, touches: any) => {
      if (spec.type === 'goto') {
        if (findPlayers(touches).next().done === false) {
          this.startWorld(spec.name, loadLevel);
          return;
        }
      }
    });

    // Pipe teleportation events
    level.events.listen(Pipe.EVENT_PIPE_COMPLETE as any, async (pipe: any) => {
      if (pipe.props.goesTo) {
        const nextLevel = await this.setupLevel(pipe.props.goesTo.name, loadLevel);
        this.sceneRunner.addScene(nextLevel);
        this.sceneRunner.runNext();
        if (pipe.props.backTo) {
          console.log(pipe.props);
          nextLevel.events.listen(LevelEvents.COMPLETE, async () => {
            const level = await this.setupLevel(name, loadLevel);
            const exitPipe = level.entities.get(pipe.props.backTo);
            if (exitPipe) {
              connectEntity(exitPipe, this.mario);
              this.sceneRunner.addScene(level);
              this.sceneRunner.runNext();
            }
          });
        }
      } else {
        level.events.emit(LevelEvents.COMPLETE);
      }
    });

    // Add debug collision layer if enabled
    if (DEBUG_COLLISIONS) {
      level.comp.layers.push(createCollisionLayer(level));
    }

    const font = this.gameService.font;
    if (font) {
      const dashboardLayer = createDashboardLayer(font as any, this.mario);
      level.comp.layers.push(dashboardLayer);
    }

    return level;
  }

  /**
   * Clean up any loading indicators that might be visible
   */
  private clearAllLoadingIndicators(): void {
    // Remove all elements with the 'loading' class
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach((element) => {
      element.remove();
    });
  }

  /**
   * Starts a world from a level
   * @param name Level name
   * @param loadLevel Level loader function
   * @returns Promise<void>
   */
  private async startWorld(
    name: string,
    loadLevel: (name: string) => Promise<Level>
  ): Promise<void> {
    const level = await this.setupLevel(name, loadLevel);
    resetPlayer(this.mario, name);

    // Make sure all loading indicators are gone
    this.clearAllLoadingIndicators();

    const font = this.gameService.font;
    if (font) {
      const playerProgressLayer = createPlayerProgressLayer(font as any, level);
      const dashboardLayer = createDashboardLayer(font as any, this.mario);

      const waitScreen = new TimedScene();
      waitScreen.countDown = 0;
      waitScreen.comp.layers.push(createColorLayer('#000'));
      waitScreen.comp.layers.push(dashboardLayer);
      waitScreen.comp.layers.push(playerProgressLayer);

      this.sceneRunner.addScene(waitScreen);
    }

    this.sceneRunner.addScene(level);
    this.sceneRunner.runNext();
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (this._isPaused) return;

    this._isPaused = true;
    this.timer.stop();
    this.gameService.pause();
    this.createPauseMenu();
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (!this._isPaused) return;

    this._isPaused = false;
    this.timer.start();
    this.gameService.resume();
    this.hidePauseMenu();
  }

  /**
   * Check if the game is paused
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Toggle music
   */
  toggleMusic(): void {
    this.gameService.toggleMusic();
  }

  /**
   * Toggle sound effects
   */
  toggleSound(): void {
    this.gameService.toggleSound();
  }

  /**
   * Toggle debug mode
   */
  toggleDebug(): void {
    this.debugService.toggle();
  }

  /**
   * Save the current game state
   */
  saveGame(): void {
    if (!this.mario || !this.currentLevel) return;

    const saveState = this.saveService.createSaveState(this.mario, this.currentLevel);
    this.saveService.saveGame(saveState);

    // Show a save notification
    const notification = document.createElement('div');
    notification.textContent = 'Game saved!';
    notification.style.position = 'absolute';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.fontFamily = 'sans-serif';
    notification.style.zIndex = '1000';
    document.body.appendChild(notification);

    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  }

  /**
   * Load a saved game
   * @param loadLevel Level loader function
   */
  async loadGame(loadLevel: (name: string) => Promise<Level>): Promise<boolean> {
    const saveState = this.saveService.loadGame();
    if (!saveState) return false;

    await this.startWorld(saveState.levelName, loadLevel);

    // Set Mario's position from the save
    if (this.mario && saveState.position) {
      this.mario.pos.set(saveState.position.x, saveState.position.y);
    }

    return true;
  }

  /**
   * Check if a save exists
   * @returns True if a save exists
   */
  hasSave(): boolean {
    return this.saveService.hasSave();
  }

  /**
   * Load the saved game
   */
  async loadSavedGame(): Promise<void> {
    const loaderFactory = this.gameService.entityFactory;
    if (!loaderFactory) {
      console.error('Entity factory not initialized');
      return;
    }

    try {
      const loadLevel = await createLevelLoader(loaderFactory);
      const success = await this.loadGame(loadLevel);

      if (!success) {
        console.log('No saved game found');
      } else {
        console.log('Game loaded successfully');
      }
    } catch (error) {
      console.error('Error loading saved game:', error);
    }
  }

  /**
   * Create loading indicator
   */
  private createLoadingIndicator(): HTMLElement {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';

    const loadingText = document.createElement('div');
    loadingText.textContent = 'Loading...';
    loadingElement.appendChild(loadingText);

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    loadingElement.appendChild(progressContainer);

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '10%'; // Start with some progress
    progressContainer.appendChild(progressBar);

    const progressText = document.createElement('div');
    progressText.className = 'progress-text';
    progressText.textContent = 'Preparing game...';
    loadingElement.appendChild(progressText);

    return loadingElement;
  }

  /**
   * Update loading progress
   */
  private updateLoadingProgress(
    loadingElement: HTMLElement,
    progress: { percentage: number }
  ): void {
    if (!loadingElement) return;

    try {
      const progressBar = loadingElement.querySelector('.progress-bar');
      const progressText = loadingElement.querySelector('.progress-text');

      if (progressBar instanceof HTMLElement) {
        progressBar.style.width = `${Math.max(10, progress.percentage)}%`;
      }

      if (progressText) {
        if (progress.percentage >= 100) {
          progressText.textContent = 'Ready!';
        } else if (progress.percentage > 0) {
          progressText.textContent = `${progress.percentage}%`;
        }
      }
    } catch (error) {
      console.warn('Error updating progress:', error);
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Stop the game timer
    this.timer.stop();

    // Clean up input service
    if (this.inputService) {
      this.inputService.removeReceiver(this.mario);
    }

    // Clean up weather effects
    if (this.weatherService) {
      this.weatherService.cleanup();
    }

    // Clean up screen shake
    if (this.screenShakeService) {
      this.screenShakeService.cleanup();
    }

    // Clean up UI elements
    if (this.gameUI && this.gameUI.parentNode) {
      this.gameUI.remove();
    }

    if (this.debugPanel && this.debugPanel.parentNode) {
      this.debugPanel.remove();
    }

    if (this.pauseMenu && this.pauseMenu.parentNode) {
      this.pauseMenu.remove();
    }

    // Remove settings button if it exists
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton && settingsButton.parentNode) {
      settingsButton.remove();
    }

    // Remove any settings menu if open
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu && settingsMenu.parentNode) {
      settingsMenu.remove();
    }

    // Remove achievement notifications container
    const notificationsContainer = document.querySelector('.achievement-notifications');
    if (notificationsContainer && notificationsContainer.parentNode) {
      notificationsContainer.remove();
    }

    // Clear any interval timers
    if (this._weatherInterval) {
      clearInterval(this._weatherInterval);
      this._weatherInterval = null;
    }

    // Clear references
    this.mario = null;
    this.currentLevel = null;

    // For GC
    window.mario = null;
  }

  async loadLevel(name: string) {
    try {
      const loaderFactory = this.gameService.entityFactory;
      if (!loaderFactory) {
        throw new Error('Entity factory not initialized');
      }

      const loadLevel = await createLevelLoader(loaderFactory);
      const level = await LevelService.getLevel(name, loadLevel);

      // Remove loading screen for level
      this.clearAllLoadingIndicators();

      return level;
    } catch (error) {
      console.error('Failed to load level:', error);

      // Remove loading screen even on error
      this.clearAllLoadingIndicators();

      throw error;
    }
  }

  /**
   * Apply current difficulty settings to game entities and parameters
   */
  private applyDifficultySettings(): void {
    if (!this.mario || !this.currentLevel) {
      return;
    }

    const params = this.difficultyService.getDifficultyParams();

    // Apply jump height modifier if the player has a Jump trait
    const jump = this.mario.traits.get(Function('return function Jump(){}').constructor);
    if (jump && params.playerJumpHeight !== 1.0) {
      // Only set this once
      if (!jump.difficultyApplied) {
        jump.velocity = PLAYER_JUMP_VELOCITY * params.playerJumpHeight;
        jump.difficultyApplied = true;
      }
    }

    // Apply enemy speed modifier to all enemies
    // This would normally be handled by specific entity controllers in a larger implementation
  }

  /**
   * Set up achievement listeners
   */
  private setupAchievementListeners(): void {
    // Listen for achievement unlocks
    this.achievementService.addListener((achievement) => {
      // Show notification
      this.achievementUI.show({
        achievement,
        timestamp: Date.now(),
        displayed: false,
      });

      // Pause briefly for important achievements
      if (achievement.id === 'all_levels' || achievement.id === 'no_damage') {
        this.pause();
        setTimeout(() => this.resume(), 2000);
      }
    });
  }

  /**
   * Check for pending achievements and show notifications
   */
  private checkPendingAchievements(): void {
    const pendingNotifications = this.achievementService.getPendingNotifications();
    if (pendingNotifications.length > 0) {
      this.achievementUI.showBatch(pendingNotifications);
      this.achievementService.markNotificationsAsDisplayed(pendingNotifications);
    }
  }

  /**
   * Add random weather for demonstration
   */
  private addRandomWeather(): void {
    const weatherTypes = [
      WeatherType.CLEAR,
      WeatherType.RAIN,
      WeatherType.SNOW,
      WeatherType.FOG,
      WeatherType.WIND,
    ];

    // Start with clear weather
    this.weatherService.setWeather(WeatherType.CLEAR);

    // Change weather periodically
    this._weatherInterval = setInterval(() => {
      if (this._isPaused) return;

      const randomType = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
      const intensity = 0.3 + Math.random() * 0.7;
      const duration = 20000 + Math.random() * 30000;

      this.weatherService.setWeather(randomType, intensity, duration / 1000);
    }, 50000); // Change every 50 seconds
  }

  /**
   * Register a player death for difficulty adjustment
   */
  public registerPlayerDeath(): void {
    this.difficultyService.registerDeath();
    this.screenShakeService.playerDeath();
  }

  /**
   * Register level completion for difficulty adjustment and achievements
   */
  public registerLevelCompletion(levelName: string, timeTaken: number): void {
    this.difficultyService.registerLevelCompletion(timeTaken);

    // Unlock level-specific achievements
    if (levelName === '1-1') {
      this.achievementService.unlockAchievement('level_1_1');
    }

    // Check for speedrun achievement
    if (timeTaken < 100) {
      this.achievementService.unlockAchievement('speedrun');
    }
  }

  /**
   * Create a settings menu dialog for the game
   */
  public showSettingsMenu(): void {
    // Don't create multiple menus
    if (document.getElementById('settings-menu')) {
      return;
    }

    const wasRunning = !this._isPaused;
    if (wasRunning) {
      this.pause();
    }

    const menu = document.createElement('div');
    menu.id = 'settings-menu';
    menu.style.position = 'absolute';
    menu.style.top = '50%';
    menu.style.left = '50%';
    menu.style.transform = 'translate(-50%, -50%)';
    menu.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    menu.style.padding = '20px';
    menu.style.color = 'white';
    menu.style.borderRadius = '5px';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '300px';

    // Create title
    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.textAlign = 'center';
    title.style.marginTop = '0';
    menu.appendChild(title);

    // Weather section
    const weatherSection = document.createElement('div');
    weatherSection.style.marginBottom = '20px';

    const weatherTitle = document.createElement('h3');
    weatherTitle.textContent = 'Weather Effects';
    weatherTitle.style.marginBottom = '10px';
    weatherSection.appendChild(weatherTitle);

    // Weather type selector
    const weatherSelector = document.createElement('div');
    weatherSelector.style.display = 'flex';
    weatherSelector.style.justifyContent = 'space-between';
    weatherSelector.style.marginBottom = '10px';

    const weatherLabel = document.createElement('label');
    weatherLabel.textContent = 'Current Weather:';
    weatherSelector.appendChild(weatherLabel);

    const weatherSelect = document.createElement('select');
    const weatherTypes = [
      { value: 'clear', label: 'Clear' },
      { value: 'rain', label: 'Rain' },
      { value: 'snow', label: 'Snow' },
      { value: 'fog', label: 'Fog' },
      { value: 'wind', label: 'Wind' },
    ];

    weatherTypes.forEach((type) => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      weatherSelect.appendChild(option);
    });

    weatherSelect.addEventListener('change', () => {
      const selectedType = weatherSelect.value;
      switch (selectedType) {
        case 'clear':
          this.weatherService.setWeather(WeatherType.CLEAR, 0.7);
          break;
        case 'rain':
          this.weatherService.setWeather(WeatherType.RAIN, 0.7);
          break;
        case 'snow':
          this.weatherService.setWeather(WeatherType.SNOW, 0.7);
          break;
        case 'fog':
          this.weatherService.setWeather(WeatherType.FOG, 0.7);
          break;
        case 'wind':
          this.weatherService.setWeather(WeatherType.WIND, 0.7);
          break;
      }
    });

    weatherSelector.appendChild(weatherSelect);
    weatherSection.appendChild(weatherSelector);
    menu.appendChild(weatherSection);

    // Difficulty section
    const difficultySection = document.createElement('div');
    difficultySection.style.marginBottom = '20px';

    const difficultyTitle = document.createElement('h3');
    difficultyTitle.textContent = 'Difficulty';
    difficultyTitle.style.marginBottom = '10px';
    difficultySection.appendChild(difficultyTitle);

    // Difficulty selector
    const difficultySelector = document.createElement('div');
    difficultySelector.style.display = 'flex';
    difficultySelector.style.justifyContent = 'space-between';
    difficultySelector.style.marginBottom = '10px';

    const difficultyLabel = document.createElement('label');
    difficultyLabel.textContent = 'Game Difficulty:';
    difficultySelector.appendChild(difficultyLabel);

    const difficultySelect = document.createElement('select');
    const difficultyTypes = [
      { value: 0, label: 'Very Easy' },
      { value: 1, label: 'Easy' },
      { value: 2, label: 'Normal' },
      { value: 3, label: 'Hard' },
      { value: 4, label: 'Very Hard' },
    ];

    difficultyTypes.forEach((type) => {
      const option = document.createElement('option');
      option.value = type.value.toString();
      option.textContent = type.label;
      difficultySelect.appendChild(option);
    });

    // Set current difficulty
    difficultySelect.value = this.difficultyService.getDifficultyLevel().toString();

    difficultySelect.addEventListener('change', () => {
      const level = parseInt(difficultySelect.value, 10);
      this.difficultyService.setDifficultyLevel(level);

      // Reset difficulty-applied flags so they will be reapplied
      if (this.mario) {
        const jump = this.mario.traits.get(Function('return function Jump(){}').constructor);
        if (jump) {
          jump.difficultyApplied = false;
        }
      }
    });

    difficultySelector.appendChild(difficultySelect);
    difficultySection.appendChild(difficultySelector);

    // Auto-adjust toggle
    const autoAdjustContainer = document.createElement('div');
    autoAdjustContainer.style.display = 'flex';
    autoAdjustContainer.style.justifyContent = 'space-between';
    autoAdjustContainer.style.alignItems = 'center';

    const autoAdjustLabel = document.createElement('label');
    autoAdjustLabel.textContent = 'Dynamic Difficulty:';
    autoAdjustContainer.appendChild(autoAdjustLabel);

    const autoAdjustCheckbox = document.createElement('input');
    autoAdjustCheckbox.type = 'checkbox';
    autoAdjustCheckbox.checked = this.difficultyService.isAutoAdjustEnabled();

    autoAdjustCheckbox.addEventListener('change', () => {
      this.difficultyService.setAutoAdjust(autoAdjustCheckbox.checked);
    });

    autoAdjustContainer.appendChild(autoAdjustCheckbox);
    difficultySection.appendChild(autoAdjustContainer);
    menu.appendChild(difficultySection);

    // Screen shake section
    const shakeSection = document.createElement('div');
    shakeSection.style.marginBottom = '20px';

    const shakeTitle = document.createElement('h3');
    shakeTitle.textContent = 'Screen Effects';
    shakeTitle.style.marginBottom = '10px';
    shakeSection.appendChild(shakeTitle);

    // Screen shake toggle
    const shakeContainer = document.createElement('div');
    shakeContainer.style.display = 'flex';
    shakeContainer.style.justifyContent = 'space-between';
    shakeContainer.style.alignItems = 'center';
    shakeContainer.style.marginBottom = '10px';

    const shakeLabel = document.createElement('label');
    shakeLabel.textContent = 'Screen Shake:';
    shakeContainer.appendChild(shakeLabel);

    const shakeCheckbox = document.createElement('input');
    shakeCheckbox.type = 'checkbox';
    shakeCheckbox.checked = this.screenShakeService.isEnabled();

    shakeCheckbox.addEventListener('change', () => {
      this.screenShakeService.setEnabled(shakeCheckbox.checked);
    });

    shakeContainer.appendChild(shakeCheckbox);
    shakeSection.appendChild(shakeContainer);
    menu.appendChild(shakeSection);

    // Intensity slider
    const intensityContainer = document.createElement('div');
    intensityContainer.style.marginBottom = '10px';

    const intensityLabel = document.createElement('label');
    intensityLabel.textContent = 'Effect Intensity:';
    intensityLabel.style.display = 'block';
    intensityLabel.style.marginBottom = '5px';
    intensityContainer.appendChild(intensityLabel);

    const intensityControls = document.createElement('div');
    intensityControls.style.display = 'flex';
    intensityControls.style.alignItems = 'center';

    const intensitySlider = document.createElement('input');
    intensitySlider.type = 'range';
    intensitySlider.min = '0';
    intensitySlider.max = '2';
    intensitySlider.step = '0.1';
    intensitySlider.value = this.screenShakeService.getIntensityMultiplier().toString();
    intensitySlider.style.flex = '1';

    const intensityValue = document.createElement('span');
    intensityValue.textContent = intensitySlider.value;
    intensityValue.style.marginLeft = '10px';
    intensityValue.style.width = '30px';
    intensityValue.style.textAlign = 'center';

    intensitySlider.addEventListener('input', () => {
      const value = parseFloat(intensitySlider.value);
      this.screenShakeService.setIntensityMultiplier(value);
      intensityValue.textContent = value.toFixed(1);
    });

    intensityControls.appendChild(intensitySlider);
    intensityControls.appendChild(intensityValue);
    intensityContainer.appendChild(intensityControls);

    // Test button
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Effect';
    testButton.style.marginTop = '5px';
    testButton.style.padding = '5px 10px';
    testButton.style.width = '100%';

    testButton.addEventListener('click', () => {
      this.screenShakeService.mediumImpact();
    });

    intensityContainer.appendChild(testButton);
    shakeSection.appendChild(intensityContainer);
    menu.appendChild(shakeSection);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.padding = '10px';
    closeButton.style.width = '100%';
    closeButton.style.marginTop = '10px';

    closeButton.addEventListener('click', () => {
      menu.remove();
      if (wasRunning) {
        this.resume();
      }
    });

    menu.appendChild(closeButton);

    // Add menu to the body
    document.body.appendChild(menu);
  }
}
