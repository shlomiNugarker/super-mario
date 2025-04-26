/**
 * Central game configuration - Main configuration source
 * All game constants should be defined here and imported by other modules
 */

// Canvas settings
export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 240;

// Physics settings
export const GRAVITY = 1500;
// גרירה נמוכה (1/5000) = מהירות גבוהה (ריצה)
export const LOW_FRICTION = 1 / 5000;
// גרירה גבוהה (1/1000) = מהירות נמוכה (הליכה)
export const HIGH_FRICTION = 1 / 1000;
// שמירה על השמות הישנים לתאימות עם קוד קיים
export const FRICTION = LOW_FRICTION;
export const FRICTION_FAST = HIGH_FRICTION;
export const DRAG_FACTOR = 1 / 5000;

// Player settings
export const PLAYER_JUMP_VELOCITY = 175;
export const PLAYER_JUMP_DURATION = 0.3;
export const PLAYER_JUMP_GRACE_PERIOD = 0.1;
export const PLAYER_ACCELERATION = 400;
export const PLAYER_DECELERATION = 300;
export const PLAYER_RUN_SPEED = 8000;
export const PLAYER_WALK_SPEED = 5000;
export const PLAYER_STARTING_LIVES = 3;
export const PLAYER_BOUNCE_SPEED = 400;
export const COIN_LIFE_THRESHOLD = 100;

// Enemy settings
export const PENDULUM_SPEED = 30;

// Camera settings
export const CAMERA_PLAYER_DISTANCE = 100;

// Level settings
export const SPAWNER_OFFSET = 64;
export const LEVEL_TIMER_TOTAL = 400;
export const LEVEL_TIMER_HURRY = 100;
export const LEVEL_TIMER_DECREMENT_RATE = 2.5;

// Time and frames
export const TARGET_FRAME_RATE = 60;

// Debug settings
export const DEBUG_COLLISIONS = false;
export const DEBUG_CAMERA = false;
export const DEBUG_JUMP = false;
export const DEBUG_PERFORMANCE = false;

// Audio settings
export const DEFAULT_MUSIC_VOLUME = 0.5;
export const DEFAULT_SFX_VOLUME = 0.8;

// Storage keys
export const SAVE_KEY = 'mario-save';
export const ACHIEVEMENTS_KEY = 'mario-achievements';
export const SETTINGS_KEY = 'mario-settings';

/**
 * Settings that can be adjusted at runtime
 */
export const RUNTIME_CONFIG = {
  musicEnabled: true,
  soundEnabled: true,
  debugEnabled: false,
  debugMode: false, // For compatibility with existing code
  frameRateCap: 60,
};

/**
 * Default volume levels
 */
export const VOLUME = {
  music: 0.3,
  effects: 0.5,
};

/**
 * Asset paths
 */
export const ASSET_PATHS = {
  sprites: '/sprites',
  audio: '/audio',
  levels: '/levels',
  patterns: '/sprites/patterns',
};
