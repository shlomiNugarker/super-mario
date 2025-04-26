import Player from './traits/Player.ts';
import LevelTimer from './traits/LevelTimer.ts';
import Entity from './Entity.ts';
import Level from './Level.ts';

/**
 * Adds player-related traits to an entity
 * @param entity The entity to make into a player
 * @param name The player's name
 */
export function makePlayer(entity: Entity, name: string): void {
  const player = new Player();
  player.name = name;
  entity.addTrait(player);

  const timer = new LevelTimer();
  entity.addTrait(timer);
}

/**
 * Resets a player entity for a new world
 * @param entity The player entity to reset
 * @param worldName The name of the world
 */
export function resetPlayer(entity: Entity, worldName: string): void {
  const timer = entity.getTrait(LevelTimer);
  if (timer) {
    timer.reset();
  }

  const player = entity.getTrait(Player);
  if (player) {
    player.world = worldName;
  }
}

/**
 * Places a player entity at the level checkpoint and adds it to the level
 * @param entity The player entity
 * @param level The game level
 */
export function bootstrapPlayer(entity: Entity, level: Level): void {
  const timer = entity.getTrait(LevelTimer);
  if (timer) {
    timer.hurryEmitted = null;
  }

  if (level.checkpoints && level.checkpoints.length > 0) {
    entity.pos.copy(level.checkpoints[0]);
    level.entities.add(entity);
  }
}

/**
 * Finds all entities that have the Player trait
 * @param entities Iterable of entities to search through
 * @returns Generator yielding player entities
 */
export function* findPlayers(entities: Iterable<Entity>): Generator<Entity> {
  for (const entity of entities) {
    if (entity.traits.has(Player)) {
      yield entity;
    }
  }
}
