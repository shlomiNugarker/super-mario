/**
 * Game constants used across the application
 */

// Canvas dimensions
export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 240;

// Debug settings
export const DEBUG_COLLISIONS = false;
export const DEBUG_CAMERA = false;
export const DEBUG_PERFORMANCE = false;

// Player settings
export const PLAYER_JUMP_VELOCITY = -175;
export const PLAYER_RUN_SPEED = 8000;
export const PLAYER_WALK_SPEED = 5000;

// Physics settings
export const GRAVITY = 1500;
export const FRICTION = 1 / 7;

// Audio settings
export const DEFAULT_MUSIC_VOLUME = 0.5;
export const DEFAULT_SFX_VOLUME = 0.8;

// Game settings
export const SAVE_KEY = 'mario-save';
export const ACHIEVEMENTS_KEY = 'mario-achievements';
export const SETTINGS_KEY = 'mario-settings';

// Runtime configuration (can be changed at runtime)
export const RUNTIME_CONFIG = {
  musicEnabled: true,
  soundEnabled: true,
  debugMode: false,
};
