/**
 * Game constants used across the application
 *
 * NOTE: This file is maintained for backward compatibility.
 * New code should import constants directly from '../config.ts'
 */

// Import all constants from the main config file
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  FRICTION,
  PLAYER_JUMP_VELOCITY,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
  DEBUG_COLLISIONS,
  DEBUG_CAMERA,
  DEBUG_PERFORMANCE,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  SAVE_KEY,
  ACHIEVEMENTS_KEY,
  SETTINGS_KEY,
  RUNTIME_CONFIG,
} from '../config.ts';

// Re-export all constants for backward compatibility
export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  FRICTION,
  PLAYER_JUMP_VELOCITY,
  PLAYER_RUN_SPEED,
  PLAYER_WALK_SPEED,
  DEBUG_COLLISIONS,
  DEBUG_CAMERA,
  DEBUG_PERFORMANCE,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  SAVE_KEY,
  ACHIEVEMENTS_KEY,
  SETTINGS_KEY,
  RUNTIME_CONFIG,
};
