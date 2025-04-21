import Player from './traits/Player.ts';
import LevelTimer from './traits/LevelTimer.ts';
import Entity from './Entity.ts';

export function makePlayer(entity: Entity, name: string): void {
  const player = new Player();
  player.name = 'MARIO';
  entity.addTrait(player);

  const timer = new LevelTimer();
  entity.addTrait(timer);
}

export function resetPlayer(entity: Entity, worldName: string): void {
  const timer = entity.traits.get(LevelTimer);
  if (timer) {
    (timer as LevelTimer).reset();
  }

  const player = entity.traits.get(Player);
  if (player) {
    (player as Player).world = worldName;
  }
}

export function bootstrapPlayer(entity: Entity, level: any): void {
  const timer = entity.traits.get(LevelTimer);
  if (timer) {
    (timer as LevelTimer).hurryEmitted = null;
  }

  entity.pos.copy(level.checkpoints[0]);
  level.entities.add(entity);
}

export function* findPlayers(entities: Iterable<Entity>): Generator<Entity> {
  for (const entity of entities) {
    if (entity.traits.has(Player)) {
      yield entity;
    }
  }
}
