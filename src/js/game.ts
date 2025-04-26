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
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEBUG_COLLISIONS,
  PLAYER_JUMP_VELOCITY,
  TARGET_FRAME_RATE,
} from './config.ts';
import Pipe from './traits/Pipe.ts';
import { connectEntity } from './traits/Pipe.ts';
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
    this.timer = new Timer(1 / TARGET_FRAME_RATE);
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
   * Create a pause menu
   */
  private createPauseMenu(): void {
    // Check if menu already exists
    if (this.pauseMenu) {
      return;
    }

    // Create menu container
    this.pauseMenu = document.createElement('div');
    this.pauseMenu.className = 'menu';

    // Add blur effect
    this.canvas.style.transition = 'filter 0.3s ease';
    this.canvas.style.filter = 'blur(5px) brightness(0.7)';

    // Create header
    const header = document.createElement('div');
    header.style.marginBottom = '25px';

    const title = document.createElement('h2');
    title.textContent = 'GAME PAUSED';
    title.style.color = 'var(--mario-yellow)';
    title.style.fontFamily = "'Press Start 2P', sans-serif";
    title.style.textAlign = 'center';
    title.style.fontSize = '18px';
    title.style.marginBottom = '10px';
    title.style.textShadow = '2px 2px 0 rgba(0, 0, 0, 0.5)';
    header.appendChild(title);

    this.pauseMenu.appendChild(header);

    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.display = 'flex';
    buttonsContainer.style.flexDirection = 'column';
    buttonsContainer.style.gap = '10px';
    buttonsContainer.style.marginBottom = '20px';

    // Resume button
    const resumeButton = document.createElement('button');
    resumeButton.className = 'menu-button';
    resumeButton.innerHTML = '<span style="margin-right: 10px">▶</span> Resume Game';
    resumeButton.addEventListener('click', () => this.resume());
    buttonsContainer.appendChild(resumeButton);

    // Restart button
    const restartButton = document.createElement('button');
    restartButton.className = 'menu-button';
    restartButton.style.backgroundColor = 'var(--mario-blue)';
    restartButton.style.boxShadow = '0 4px 0 #2a5adf';
    restartButton.innerHTML = '<span style="margin-right: 10px">↻</span> Restart Level';
    restartButton.addEventListener('click', () => this.restartLevel());
    buttonsContainer.appendChild(restartButton);

    // Save button
    const saveButton = document.createElement('button');
    saveButton.className = 'menu-button';
    saveButton.style.backgroundColor = 'var(--mario-green)';
    saveButton.style.boxShadow = '0 4px 0 #2e8534';
    saveButton.innerHTML = '<span style="margin-right: 10px">💾</span> Save Game';
    saveButton.addEventListener('click', () => {
      this.saveGame();

      // Show save confirmation
      const saveConfirm = document.createElement('div');
      saveConfirm.textContent = 'Game Saved!';
      saveConfirm.className = 'game-notification';
      document.body.appendChild(saveConfirm);

      // Animate notification
      setTimeout(() => {
        saveConfirm.classList.add('visible');

        setTimeout(() => {
          saveConfirm.classList.remove('visible');
          setTimeout(() => saveConfirm.remove(), 300);
        }, 2000);
      }, 10);
    });
    buttonsContainer.appendChild(saveButton);

    this.pauseMenu.appendChild(buttonsContainer);

    // Settings section
    const settingsContainer = document.createElement('div');
    settingsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    settingsContainer.style.padding = '15px';
    settingsContainer.style.borderRadius = '8px';
    settingsContainer.style.marginBottom = '20px';

    const settingsTitle = document.createElement('div');
    settingsTitle.textContent = 'SETTINGS';
    settingsTitle.style.color = 'var(--mario-yellow)';
    settingsTitle.style.fontFamily = "'Press Start 2P', sans-serif";
    settingsTitle.style.textAlign = 'center';
    settingsTitle.style.fontSize = '12px';
    settingsTitle.style.marginBottom = '10px';
    settingsContainer.appendChild(settingsTitle);

    // Toggle buttons container
    const togglesContainer = document.createElement('div');
    togglesContainer.style.display = 'grid';
    togglesContainer.style.gridTemplateColumns = '1fr auto';
    togglesContainer.style.gap = '10px';
    togglesContainer.style.alignItems = 'center';

    // Music toggle
    const musicLabel = document.createElement('div');
    musicLabel.textContent = 'Music';
    musicLabel.style.color = 'white';
    musicLabel.style.fontSize = '12px';
    togglesContainer.appendChild(musicLabel);

    const musicToggle = document.createElement('button');
    musicToggle.className = 'menu-button';
    musicToggle.style.padding = '8px 15px';
    musicToggle.style.fontSize = '10px';
    musicToggle.style.margin = '0';
    musicToggle.textContent = this.gameService.isMusicEnabled() ? 'ON' : 'OFF';
    musicToggle.style.backgroundColor = this.gameService.isMusicEnabled()
      ? 'var(--mario-green)'
      : '#777';
    musicToggle.style.boxShadow = this.gameService.isMusicEnabled()
      ? '0 3px 0 #2e8534'
      : '0 3px 0 #555';

    musicToggle.addEventListener('click', () => {
      this.toggleMusic();
      musicToggle.textContent = this.gameService.isMusicEnabled() ? 'ON' : 'OFF';
      musicToggle.style.backgroundColor = this.gameService.isMusicEnabled()
        ? 'var(--mario-green)'
        : '#777';
      musicToggle.style.boxShadow = this.gameService.isMusicEnabled()
        ? '0 3px 0 #2e8534'
        : '0 3px 0 #555';
    });

    togglesContainer.appendChild(musicToggle);

    // Sound toggle
    const soundLabel = document.createElement('div');
    soundLabel.textContent = 'Sound FX';
    soundLabel.style.color = 'white';
    soundLabel.style.fontSize = '12px';
    togglesContainer.appendChild(soundLabel);

    const soundToggle = document.createElement('button');
    soundToggle.className = 'menu-button';
    soundToggle.style.padding = '8px 15px';
    soundToggle.style.fontSize = '10px';
    soundToggle.style.margin = '0';
    soundToggle.textContent = this.gameService.isSoundEnabled() ? 'ON' : 'OFF';
    soundToggle.style.backgroundColor = this.gameService.isSoundEnabled()
      ? 'var(--mario-green)'
      : '#777';
    soundToggle.style.boxShadow = this.gameService.isSoundEnabled()
      ? '0 3px 0 #2e8534'
      : '0 3px 0 #555';

    soundToggle.addEventListener('click', () => {
      this.toggleSound();
      soundToggle.textContent = this.gameService.isSoundEnabled() ? 'ON' : 'OFF';
      soundToggle.style.backgroundColor = this.gameService.isSoundEnabled()
        ? 'var(--mario-green)'
        : '#777';
      soundToggle.style.boxShadow = this.gameService.isSoundEnabled()
        ? '0 3px 0 #2e8534'
        : '0 3px 0 #555';
    });

    togglesContainer.appendChild(soundToggle);

    // Debug toggle
    const debugLabel = document.createElement('div');
    debugLabel.textContent = 'Debug Mode';
    debugLabel.style.color = 'white';
    debugLabel.style.fontSize = '12px';
    togglesContainer.appendChild(debugLabel);

    const debugToggle = document.createElement('button');
    debugToggle.className = 'menu-button';
    debugToggle.style.padding = '8px 15px';
    debugToggle.style.fontSize = '10px';
    debugToggle.style.margin = '0';
    debugToggle.textContent = this.debugService.isEnabled() ? 'ON' : 'OFF';
    debugToggle.style.backgroundColor = this.debugService.isEnabled()
      ? 'var(--mario-green)'
      : '#777';
    debugToggle.style.boxShadow = this.debugService.isEnabled()
      ? '0 3px 0 #2e8534'
      : '0 3px 0 #555';

    debugToggle.addEventListener('click', () => {
      this.toggleDebug();
      debugToggle.textContent = this.debugService.isEnabled() ? 'ON' : 'OFF';
      debugToggle.style.backgroundColor = this.debugService.isEnabled()
        ? 'var(--mario-green)'
        : '#777';
      debugToggle.style.boxShadow = this.debugService.isEnabled()
        ? '0 3px 0 #2e8534'
        : '0 3px 0 #555';
    });

    togglesContainer.appendChild(debugToggle);

    settingsContainer.appendChild(togglesContainer);
    this.pauseMenu.appendChild(settingsContainer);

    // Controls reminder
    const controlsReminder = document.createElement('div');
    controlsReminder.style.fontSize = '10px';
    controlsReminder.style.color = 'rgba(255, 255, 255, 0.7)';
    controlsReminder.style.textAlign = 'center';
    controlsReminder.textContent = 'Press ESC to resume';
    this.pauseMenu.appendChild(controlsReminder);

    // Add the menu to the body
    document.body.appendChild(this.pauseMenu);

    // Add entry animation
    if (this.pauseMenu) {
      this.pauseMenu.style.opacity = '0';
      this.pauseMenu.style.transform = 'translate(-50%, -55%)';

      setTimeout(() => {
        if (this.pauseMenu) {
          this.pauseMenu.style.opacity = '1';
          this.pauseMenu.style.transform = 'translate(-50%, -50%)';
        }
      }, 10);
    }
  }

  /**
   * Hide the pause menu
   */
  private hidePauseMenu(): void {
    if (!this.pauseMenu) {
      return;
    }

    // Add exit animation
    this.pauseMenu.style.opacity = '0';
    this.pauseMenu.style.transform = 'translate(-50%, -45%)';

    // Remove blur effect
    if (this.canvas) {
      this.canvas.style.filter = '';
    }

    // Store a reference to the menu element
    const menu = this.pauseMenu;
    this.pauseMenu = null;

    // Wait for animation to complete before removing
    setTimeout(() => {
      if (menu && menu.parentNode) {
        menu.remove();
      }
    }, 300);
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

      // Start the world with the selected level
      await this.startWorld(name, loadLevel);

      // Remove loading screen for level
      this.clearAllLoadingIndicators();

      return this.currentLevel;
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
}
