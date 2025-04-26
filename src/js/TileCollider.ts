import TileResolver from './TileResolver.ts';
import { brick } from './tiles/brick.ts';
import { coin } from './tiles/coin.ts';
import { ground } from './tiles/ground.ts';
import { Matrix } from './math.ts';
import Entity from './Entity.ts';

interface MatchTile {
  tile: {
    behavior: string;
  };
  indexX: number;
  indexY: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface TileCollisionContext {
  entity: Entity;
  match: MatchTile;
  resolver: TileResolver;
  gameContext: GameContext;
  level: Level;
}

interface GameContext {
  audioContext: AudioContext;
  deltaTime: number;
  entityFactory: any;
}

interface Level {
  entities: {
    add(entity: Entity): void;
    delete(entity: Entity): void;
  };
}

type HandlerFunction = (context: TileCollisionContext) => void;

const handlers: Record<string, HandlerFunction[]> = {
  brick,
  coin,
  ground,
};

export default class TileCollider {
  resolvers: TileResolver[];

  constructor() {
    this.resolvers = [];
  }

  addGrid(tileMatrix: Matrix<any>) {
    this.resolvers.push(new TileResolver(tileMatrix));
  }

  checkX(entity: Entity, gameContext: GameContext, level: Level) {
    let x: number;
    if (entity.vel.x > 0) {
      x = entity.bounds.right;
    } else if (entity.vel.x < 0) {
      x = entity.bounds.left;
    } else {
      return;
    }

    for (const resolver of this.resolvers) {
      const matches = resolver.searchByRange(x, x, entity.bounds.top, entity.bounds.bottom);

      matches.forEach((match) => {
        this.handle(0, entity, match as MatchTile, resolver, gameContext, level);
      });
    }
  }

  checkY(entity: Entity, gameContext: GameContext, level: Level) {
    let y: number;
    if (entity.vel.y > 0) {
      y = entity.bounds.bottom;
    } else if (entity.vel.y < 0) {
      y = entity.bounds.top;
    } else {
      return;
    }

    for (const resolver of this.resolvers) {
      const matches = resolver.searchByRange(entity.bounds.left, entity.bounds.right, y, y);

      matches.forEach((match) => {
        this.handle(1, entity, match as MatchTile, resolver, gameContext, level);
      });
    }
  }

  handle(
    index: number,
    entity: Entity,
    match: MatchTile,
    resolver: TileResolver,
    gameContext: GameContext,
    level: Level
  ) {
    const tileCollisionContext: TileCollisionContext = {
      entity,
      match,
      resolver,
      gameContext,
      level,
    };

    const handler = handlers[match.tile.behavior];
    if (handler) {
      handler[index](tileCollisionContext);
    }
  }
}
