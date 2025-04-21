import Player from '../traits/Player.ts';
import Entity from '../Entity.ts';

interface TileMatch {
  tile: any;
  indexX: number;
  indexY: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface TileContext {
  entity: Entity;
  match: TileMatch;
  resolver: {
    matrix: {
      delete(x: number, y: number): void;
    };
  };
}

function handle({ entity, match, resolver }: TileContext): void {
  const player = entity.traits.get(Player) as Player;
  if (player) {
    player.addCoins(1);
    const grid = resolver.matrix;
    grid.delete(match.indexX, match.indexY);
  }
}

export const coin = [handle, handle];
