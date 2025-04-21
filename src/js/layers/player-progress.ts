import { findPlayers } from '../player.js';
import Player from '../traits/Player.ts';
import Entity from '../Entity.ts';
import Level from '../Level.ts';

function getPlayer(entities: Iterable<Entity>): Entity | undefined {
  for (const entity of findPlayers(entities)) {
    return entity;
  }
}

export function createPlayerProgressLayer(font: any, level: Level) {
  const size = font.size;

  const spriteBuffer = document.createElement('canvas');
  spriteBuffer.width = 32;
  spriteBuffer.height = 32;
  const spriteBufferContext = spriteBuffer.getContext('2d');

  return function drawPlayerProgress(context: CanvasRenderingContext2D) {
    const entity = getPlayer(level.entities);
    if (!entity) return;

    const player = entity.traits.get(Player) as Player;
    if (!player) return;

    font.print('WORLD ' + level.name, context, size * 12, size * 12);
    font.print('×' + player.lives.toString().padStart(3, ' '), context, size * 16, size * 16);

    if (spriteBufferContext) {
      spriteBufferContext.clearRect(0, 0, spriteBuffer.width, spriteBuffer.height);
      (entity as any).draw?.(spriteBufferContext);
      context.drawImage(spriteBuffer, size * 13, size * 15);
    }
  };
}
