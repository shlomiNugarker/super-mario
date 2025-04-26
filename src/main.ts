import Game from './js/game';

// Store event listener references for cleanup
let keydownListener: ((e: KeyboardEvent) => void) | null = null;
let game: Game | null = null;

/**
 * Initialize the game
 */
const initGame = async (canvas: HTMLCanvasElement) => {
  try {
    // Create the game instance
    game = new Game(canvas);

    // Initialize the game
    await game.init();

    // Add event listeners for game controls
    addGameControlEventListeners(game);

    // Set up cleanup for when the game is unloaded
    setupCleanupHandlers();
  } catch (error) {
    console.error('Error initializing game:', error);
    showErrorMessage('Failed to initialize the game. Please try again.');
  }
};

/**
 * Add event listeners for game controls
 */
const addGameControlEventListeners = (game: Game) => {
  keydownListener = (e: KeyboardEvent) => {
    // Pause/resume with Escape key
    if (e.key === 'Escape') {
      if (game.isPaused) {
        game.resume();
      } else {
        game.pause();
      }
    }

    // Toggle music with M key
    if (e.key === 'm') {
      game.toggleMusic();
    }

    // Toggle sound effects with S key
    if (e.key === 's') {
      game.toggleSound();
    }

    // Toggle debug mode with D key
    if (e.key === 'd') {
      game.toggleDebug();
    }

    // Save game with F5 key
    if (e.key === 'F5') {
      e.preventDefault();
      game.saveGame();
    }

    // Load game with F9 key
    if (e.key === 'F9') {
      e.preventDefault();
      game.loadSavedGame();
    }
  };

  window.addEventListener('keydown', keydownListener);
};

/**
 * Set up cleanup handlers for when the game is unloaded
 */
const setupCleanupHandlers = () => {
  window.addEventListener('beforeunload', () => {
    if (keydownListener) {
      window.removeEventListener('keydown', keydownListener);
      keydownListener = null;
    }

    // Additional cleanup if needed
    if (game) {
      game.cleanup();
    }
  });
};

/**
 * Show an error message to the user
 */
const showErrorMessage = (message: string) => {
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  document.body.appendChild(errorElement);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorElement.classList.add('fade-out');
    setTimeout(() => errorElement.remove(), 1000);
  }, 5000);
};

/**
 * Create a start screen to begin the game
 */
const createStartScreen = () => {
  // Create start screen container
  const startScreen = document.createElement('div');
  startScreen.className = 'menu';

  // Create header area with logo
  const headerArea = document.createElement('div');
  headerArea.style.marginBottom = '25px';
  headerArea.style.position = 'relative';

  // Add game title
  const title = document.createElement('h1');
  title.textContent = 'SUPER MARIO';
  title.style.fontFamily = "'Press Start 2P', sans-serif";
  title.style.color = 'var(--mario-yellow)';
  title.style.fontSize = '22px';
  title.style.marginBottom = '10px';
  title.style.textShadow = '3px 3px 0 #e52521, -2px -2px 0 #4a7aff';
  title.style.letterSpacing = '2px';
  title.style.textAlign = 'center';
  headerArea.appendChild(title);

  // Add game subtitle
  const subtitle = document.createElement('div');
  subtitle.textContent = 'ADVENTURE';
  subtitle.style.fontFamily = "'Press Start 2P', sans-serif";
  subtitle.style.color = 'white';
  subtitle.style.fontSize = '14px';
  subtitle.style.marginBottom = '15px';
  subtitle.style.letterSpacing = '1px';
  subtitle.style.textAlign = 'center';
  headerArea.appendChild(subtitle);

  startScreen.appendChild(headerArea);

  // Add game image
  const imageContainer = document.createElement('div');
  imageContainer.style.position = 'relative';
  imageContainer.style.width = '100%';
  imageContainer.style.height = '160px';
  imageContainer.style.marginBottom = '25px';
  imageContainer.style.overflow = 'hidden';
  imageContainer.style.borderRadius = '8px';
  imageContainer.style.border = '3px solid rgba(255, 255, 255, 0.2)';
  imageContainer.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';

  const image = document.createElement('img');
  image.src = '/img/mario-start.png';
  image.alt = 'Super Mario';
  image.style.width = '100%';
  image.style.height = '100%';
  image.style.objectFit = 'cover';
  image.style.objectPosition = 'center';
  image.style.transition = 'transform 0.3s ease';

  // Add hover effect
  imageContainer.addEventListener('mouseenter', () => {
    image.style.transform = 'scale(1.05)';
  });

  imageContainer.addEventListener('mouseleave', () => {
    image.style.transform = 'scale(1)';
  });

  image.onerror = () => {
    // If image fails to load, provide a fallback background
    imageContainer.style.backgroundColor = 'var(--mario-blue)';
    imageContainer.style.display = 'flex';
    imageContainer.style.justifyContent = 'center';
    imageContainer.style.alignItems = 'center';

    const fallbackText = document.createElement('div');
    fallbackText.textContent = 'SUPER MARIO ADVENTURE';
    fallbackText.style.color = 'white';
    fallbackText.style.fontFamily = "'Press Start 2P', sans-serif";
    fallbackText.style.fontSize = '14px';
    fallbackText.style.textAlign = 'center';

    imageContainer.innerHTML = '';
    imageContainer.appendChild(fallbackText);
  };

  imageContainer.appendChild(image);
  startScreen.appendChild(imageContainer);

  // Add menu buttons
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.gap = '12px';
  buttonsContainer.style.marginBottom = '25px';

  // Start game button
  const startButton = document.createElement('button');
  startButton.className = 'menu-button';
  startButton.innerHTML = '<span style="margin-right: 10px">▶</span> START GAME';
  buttonsContainer.appendChild(startButton);

  // Select level button
  const selectLevelButton = document.createElement('button');
  selectLevelButton.className = 'menu-button';
  selectLevelButton.style.backgroundColor = 'var(--mario-green)';
  selectLevelButton.style.boxShadow = '0 4px 0 #1a8a1a';
  selectLevelButton.innerHTML = '<span style="margin-right: 10px">☰</span> SELECT LEVEL';

  selectLevelButton.addEventListener('click', () => {
    showLevelSelectionScreen(startScreen);
  });

  buttonsContainer.appendChild(selectLevelButton);

  // Continue game button (if save exists)
  const hasSavedGame = localStorage.getItem('mario-save') !== null;

  if (hasSavedGame) {
    const continueButton = document.createElement('button');
    continueButton.className = 'menu-button';
    continueButton.style.backgroundColor = 'var(--mario-blue)';
    continueButton.style.boxShadow = '0 4px 0 #2a5adf';
    continueButton.innerHTML = '<span style="margin-right: 10px">↻</span> CONTINUE';

    continueButton.addEventListener('click', () => {
      startScreen.remove();
      initGame(document.getElementById('screen') as HTMLCanvasElement);
      // The game will detect and load the saved game automatically
    });

    buttonsContainer.appendChild(continueButton);
  }

  startScreen.appendChild(buttonsContainer);

  // Add instructions
  const instructionsContainer = document.createElement('div');
  instructionsContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  instructionsContainer.style.padding = '15px';
  instructionsContainer.style.borderRadius = '8px';
  instructionsContainer.style.marginBottom = '15px';
  instructionsContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';

  const instructionsTitle = document.createElement('div');
  instructionsTitle.textContent = 'CONTROLS';
  instructionsTitle.style.fontFamily = "'Press Start 2P', sans-serif";
  instructionsTitle.style.color = 'var(--mario-yellow)';
  instructionsTitle.style.fontSize = '12px';
  instructionsTitle.style.marginBottom = '10px';
  instructionsTitle.style.textAlign = 'center';
  instructionsContainer.appendChild(instructionsTitle);

  const controlsList = document.createElement('div');
  controlsList.style.display = 'grid';
  controlsList.style.gridTemplateColumns = '1fr 1fr';
  controlsList.style.gap = '8px';
  controlsList.style.fontSize = '10px';
  controlsList.style.color = '#ddd';
  controlsList.style.textAlign = 'left';

  const controls = [
    { key: 'ARROWS / WASD', action: 'Move' },
    { key: 'SPACE / UP', action: 'Jump' },
    { key: 'SHIFT / DOWN', action: 'Run' },
    { key: 'ESC', action: 'Pause' },
    { key: 'M', action: 'Music' },
    { key: 'S', action: 'Sound' },
  ];

  controls.forEach((control) => {
    const keyElem = document.createElement('div');
    keyElem.textContent = control.key;
    keyElem.style.color = 'white';
    controlsList.appendChild(keyElem);

    const actionElem = document.createElement('div');
    actionElem.textContent = control.action;
    actionElem.style.color = '#aaa';
    controlsList.appendChild(actionElem);
  });

  instructionsContainer.appendChild(controlsList);
  startScreen.appendChild(instructionsContainer);

  // Add credits
  const credits = document.createElement('div');
  credits.style.fontSize = '8px';
  credits.style.color = 'rgba(255, 255, 255, 0.5)';
  credits.style.textAlign = 'center';
  credits.style.marginTop = '10px';
  credits.innerHTML = '© 2023 SUPER MARIO CLONE';
  startScreen.appendChild(credits);

  // Add animation effects
  document.body.appendChild(startScreen);

  // Add sliding animation
  startScreen.style.opacity = '0';
  startScreen.style.transform = 'translate(-50%, -55%)';
  startScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

  setTimeout(() => {
    startScreen.style.opacity = '1';
    startScreen.style.transform = 'translate(-50%, -50%)';
  }, 100);

  return { startScreen, startButton };
};

/**
 * Show level selection screen
 */
const showLevelSelectionScreen = (startScreen: HTMLElement) => {
  // Hide start screen temporarily
  startScreen.style.opacity = '0';
  startScreen.style.transform = 'translate(-50%, -55%)';

  // Create level selection screen
  const levelScreen = document.createElement('div');
  levelScreen.className = 'menu';
  levelScreen.style.opacity = '0';
  levelScreen.style.transform = 'translate(-50%, -45%)';
  levelScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

  // Add header
  const headerArea = document.createElement('div');
  headerArea.style.marginBottom = '20px';

  const title = document.createElement('h1');
  title.textContent = 'SELECT LEVEL';
  title.style.fontFamily = "'Press Start 2P', sans-serif";
  title.style.color = 'var(--mario-yellow)';
  title.style.fontSize = '18px';
  title.style.textShadow = '2px 2px 0 #e52521, -1px -1px 0 #4a7aff';
  title.style.letterSpacing = '2px';
  title.style.textAlign = 'center';
  headerArea.appendChild(title);
  levelScreen.appendChild(headerArea);

  // Create scrollable level container
  const levelContainer = document.createElement('div');
  levelContainer.style.maxHeight = '250px';
  levelContainer.style.overflowY = 'auto';
  levelContainer.style.marginBottom = '20px';
  levelContainer.style.padding = '10px';
  levelContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  levelContainer.style.borderRadius = '8px';
  levelContainer.style.border = '1px solid rgba(255, 255, 255, 0.1)';

  // Get all unique level names (excluding debug levels)
  const levelNames = [
    '1-1',
    '1-2',
    '1-3',
    '1-4',
    '2-1',
    '2-2',
    '2-3',
    '2-4',
    '3-1',
    '5-3',
    '7-2',
    '7-3',
    'coin-clouds-1',
    'coin-room-1',
    'coin-room-2',
    'coin-room-3',
    'coin-room-4',
    'coin-room-5',
    'debug-coin',
    'debug-flag',
    'debug-level',
    'debug-pipe',
    'debug-progression',
    'uw-entrance',
    'uw-exit',
  ];

  // Create a grid of level buttons
  const levelsGrid = document.createElement('div');
  levelsGrid.style.display = 'grid';
  levelsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  levelsGrid.style.gap = '10px';

  // Create level buttons
  levelNames.forEach((levelName) => {
    const levelButton = document.createElement('button');
    levelButton.className = 'level-button';
    levelButton.textContent = levelName;
    levelButton.style.fontFamily = "'Press Start 2P', sans-serif";
    levelButton.style.color = 'white';
    levelButton.style.fontSize = '12px';
    levelButton.style.padding = '12px 5px';
    levelButton.style.backgroundColor = 'var(--mario-blue)';
    levelButton.style.border = 'none';
    levelButton.style.borderRadius = '4px';
    levelButton.style.cursor = 'pointer';
    levelButton.style.boxShadow = '0 4px 0 #2a5adf';
    levelButton.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';

    // Add hover and active effects
    levelButton.addEventListener('mouseenter', () => {
      levelButton.style.transform = 'translateY(-2px)';
      levelButton.style.boxShadow = '0 6px 0 #2a5adf';
    });

    levelButton.addEventListener('mouseleave', () => {
      levelButton.style.transform = 'translateY(0)';
      levelButton.style.boxShadow = '0 4px 0 #2a5adf';
    });

    levelButton.addEventListener('click', () => {
      // Remove the level screen
      levelScreen.style.opacity = '0';
      levelScreen.style.transform = 'translate(-50%, -45%)';

      // Wait for animation to complete
      setTimeout(() => {
        levelScreen.remove();
        startScreen.remove();

        // Get the canvas element
        const canvas = document.getElementById('screen') as HTMLCanvasElement;

        // Initialize the game with the selected level
        initGameWithLevel(canvas, levelName);
      }, 500);
    });

    levelsGrid.appendChild(levelButton);
  });

  levelContainer.appendChild(levelsGrid);
  levelScreen.appendChild(levelContainer);

  // Back button
  const backButton = document.createElement('button');
  backButton.className = 'menu-button';
  backButton.style.marginTop = '5px';
  backButton.innerHTML = '<span style="margin-right: 10px">↩</span> BACK';
  backButton.style.backgroundColor = '#666';
  backButton.style.boxShadow = '0 4px 0 #444';

  backButton.addEventListener('click', () => {
    // Hide level screen
    levelScreen.style.opacity = '0';
    levelScreen.style.transform = 'translate(-50%, -45%)';

    // Show start screen
    startScreen.style.opacity = '1';
    startScreen.style.transform = 'translate(-50%, -50%)';

    // Remove level screen after animation
    setTimeout(() => {
      levelScreen.remove();
    }, 500);
  });

  levelScreen.appendChild(backButton);

  // Add to body
  document.body.appendChild(levelScreen);

  // Trigger animation
  setTimeout(() => {
    levelScreen.style.opacity = '1';
    levelScreen.style.transform = 'translate(-50%, -50%)';
  }, 100);
};

/**
 * Initialize the game with a specific level
 */
const initGameWithLevel = async (canvas: HTMLCanvasElement, levelName: string) => {
  try {
    // Create the game instance
    game = new Game(canvas);

    // Initialize the game
    await game.init();

    // Add event listeners for game controls
    addGameControlEventListeners(game);

    // Set up cleanup for when the game is unloaded
    setupCleanupHandlers();

    // Load the specified level
    await game.loadLevel(levelName);
  } catch (error) {
    console.error('Error initializing game:', error);
    showErrorMessage('Failed to initialize the game. Please try again.');
  }
};

/**
 * Start the game application
 */
const start = () => {
  // Get the canvas element
  const canvas = document.getElementById('screen') as HTMLCanvasElement;

  if (!canvas) {
    showErrorMessage('Canvas element not found!');
    return;
  }

  // Create and show start screen
  const { startScreen, startButton } = createStartScreen();

  // Set up start button click handler
  startButton.addEventListener('click', () => {
    // Add fade-out animation
    startScreen.style.opacity = '0';
    startScreen.style.transform = 'translate(-50%, -45%)';

    // Wait for animation to complete
    setTimeout(() => {
      // Remove the start screen
      startScreen.remove();

      // Initialize the game with the default level
      initGameWithLevel(canvas, '1-1');
    }, 500);
  });
};

// Start the application
start();
