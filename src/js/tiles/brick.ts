import { Vec2 } from '../math.ts';
import { Sides } from '../Entity.ts';
import Player from '../traits/Player.ts';
import Entity from '../Entity.ts';

interface Level {
  entities: {
    add(entity: Entity): void;
    delete(entity: Entity): void;
  };
}

interface TileContext {
  entity: Entity;
  match: any;
  resolver?: {
    matrix: {
      delete(x: number, y: number): void;
    };
  };
  gameContext?: any;
  level?: Level;
}

function centerEntity(entity: Entity, pos: Vec2): void {
  entity.pos.x = pos.x - entity.size.x / 2;
  entity.pos.y = pos.y - entity.size.y / 2;
}

function getMatchCenter(match: any): Vec2 {
  return new Vec2(match.x1 + (match.x2 - match.x1) / 2, match.y1 + (match.y2 - match.y1) / 2);
}

function addShrapnel(level: Level, gameContext: any, match: any): void {
  const center = getMatchCenter(match);

  const bricks: Entity[] = [];
  for (let i = 0; i < 4; i++) {
    const brick = gameContext.entityFactory.brickShrapnel();
    centerEntity(brick, center);
    level.entities.add(brick);
    bricks.push(brick);
  }

  const spreadH = 60;
  const spreadV = 400;
  bricks[0].sounds.add('break');
  bricks[0].vel.set(-spreadH, -spreadV * 1.2);
  bricks[1].vel.set(-spreadH, -spreadV);
  bricks[2].vel.set(spreadH, -spreadV * 1.2);
  bricks[3].vel.set(spreadH, -spreadV);
}

function handleX({ entity, match }: TileContext): void {
  if (entity.vel.x > 0) {
    if (entity.bounds.right > match.x1) {
      entity.obstruct(Sides.RIGHT, match);
    }
  } else if (entity.vel.x < 0) {
    if (entity.bounds.left < match.x2) {
      entity.obstruct(Sides.LEFT, match);
    }
  }
}

function handleY({ entity, match, resolver, gameContext, level }: TileContext): void {
  if (entity.vel.y > 0) {
    if (entity.bounds.bottom > match.y1) {
      entity.obstruct(Sides.BOTTOM, match);
    }
  } else if (entity.vel.y < 0) {
    if (entity.traits.has(Player)) {
      const grid = resolver!.matrix;
      grid.delete(match.indexX, match.indexY);
      addShrapnel(level!, gameContext!, match);
    }

    if (entity.bounds.top < match.y2) {
      entity.obstruct(Sides.TOP, match);
    }
  }
}

export const brick = [handleX, handleY];
