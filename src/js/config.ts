/**
 * Central game configuration
 */

// Canvas settings
export const CANVAS_WIDTH = 256;
export const CANVAS_HEIGHT = 240;

// Physics settings
export const GRAVITY = 1500;
export const FRICTION = 1 / 5000;
export const FRICTION_FAST = 1 / 1000;

// Player settings
export const PLAYER_JUMP_VELOCITY = 175;
export const PLAYER_JUMP_DURATION = 0.3;
export const PLAYER_JUMP_GRACE_PERIOD = 0.1;
export const PLAYER_ACCELERATION = 400;
export const PLAYER_DECELERATION = 300;

// Camera settings
export const CAMERA_PLAYER_DISTANCE = 100;

// Level settings
export const SPAWNER_OFFSET = 64;

// Debug settings
export const DEBUG_COLLISIONS = false;
export const DEBUG_CAMERA = false;
export const DEBUG_JUMP = false;

/**
 * Settings that can be adjusted at runtime
 */
export const RUNTIME_CONFIG = {
  musicEnabled: true,
  soundEnabled: true,
  debugEnabled: false,
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
