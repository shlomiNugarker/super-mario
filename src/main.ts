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
  startScreen.style.textAlign = 'center';

  // Add game title
  const title = document.createElement('h1');
  title.textContent = 'Super Mario';
  title.style.fontFamily = 'Arial, sans-serif';
  title.style.color = 'white';
  title.style.fontSize = '28px';
  title.style.marginBottom = '20px';
  startScreen.appendChild(title);

  // Add game image
  const image = document.createElement('img');
  image.src = '/img/mario-start.png';
  image.alt = 'Super Mario';
  image.style.width = '200px';
  image.style.marginBottom = '20px';
  image.onerror = () => {
    // If image fails to load, remove it
    image.style.display = 'none';
  };
  startScreen.appendChild(image);

  // Add start button
  const startButton = document.createElement('button');
  startButton.className = 'menu-button';
  startButton.textContent = 'Start Game';
  startButton.style.fontSize = '18px';
  startButton.style.padding = '10px 30px';
  startButton.style.margin = '10px auto';
  startButton.style.display = 'block';
  startScreen.appendChild(startButton);

  // Add instructions
  const instructions = document.createElement('div');
  instructions.style.marginTop = '20px';
  instructions.style.fontSize = '14px';
  instructions.style.color = '#ddd';
  instructions.innerHTML = `
    <p>Controls:</p>
    <p>Arrows/WASD: Move</p>
    <p>Space/Up: Jump</p>
    <p>Shift/Down: Run</p>
    <p>Escape: Pause</p>
  `;
  startScreen.appendChild(instructions);

  // Add credits
  const credits = document.createElement('div');
  credits.style.marginTop = '20px';
  credits.style.fontSize = '12px';
  credits.style.color = '#999';
  credits.textContent = 'Super Mario Clone';
  startScreen.appendChild(credits);

  // Add the screen to the body
  document.body.appendChild(startScreen);

  return { startScreen, startButton };
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
    // Remove the start screen
    startScreen.remove();

    // Initialize the game
    initGame(canvas);
  });
};

// Start the application
start();
