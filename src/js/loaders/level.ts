import { Matrix, Vec2 } from '../math.ts';
import Entity from '../Entity.ts';
import Trait from '../Trait.ts';
import LevelTimer from '../traits/LevelTimer.ts';
import Trigger from '../traits/Trigger.ts';
import Level from '../Level.ts';
import { createSpriteLayer } from '../layers/sprites.ts';
import { createBackgroundLayer } from '../layers/background.ts';
import { loadMusicSheet } from './music.ts';
import { loadSpriteSheet } from './sprite.ts';
import { loadJSON } from '../loaders.ts';

function createSpawner() {
  class Spawner extends Trait {
    entities: Entity[];
    offsetX: number;

    constructor() {
      super();
      this.entities = [];
      this.offsetX = 64;
    }

    addEntity(entity: Entity): void {
      this.entities.push(entity);
      this.entities.sort((a: Entity, b: Entity) => (a.pos.x < b.pos.x ? -1 : 1));
    }

    update(entity: Entity, gameContext: any, level: Level): void {
      const cameraMaxX = level.camera.pos.x + level.camera.size.x + this.offsetX;
      while (this.entities[0]) {
        if (cameraMaxX > this.entities[0].pos.x) {
          level.entities.add(this.entities.shift()!);
        } else {
          break;
        }
      }
    }
  }

  return new Spawner();
}

function loadPattern(name: string): Promise<any> {
  return loadJSON(`/sprites/patterns/${name}.json`);
}

function setupBehavior(level: Level): void {
  (level as any).events.listen(LevelTimer.EVENT_TIMER_OK as unknown as string, () => {
    level.music.playTheme();
  });
  (level as any).events.listen(LevelTimer.EVENT_TIMER_HURRY as unknown as string, () => {
    level.music.playHurryTheme();
  });
}

function setupBackgrounds(levelSpec: any, level: Level, patterns: Record<string, any>): void {
  levelSpec.layers.forEach((layer: any) => {
    const grid = createGrid(layer.tiles, patterns);
    level.tileCollider.addGrid(grid);
  });
}

function setupCamera(level: Level): void {
  let maxX = 0;
  let maxTileSize = 0;
  for (const resolver of level.tileCollider.resolvers) {
    if (resolver.tileSize > maxTileSize) {
      maxTileSize = resolver.tileSize;
    }
    resolver.matrix.forEach((tile: any, x: number, y: number) => {
      if (x > maxX) {
        maxX = x;
      }
    });
  }
  level.camera.max.x = (maxX + 1) * maxTileSize;
}

function setupCheckpoints(levelSpec: any, level: Level): void {
  if (!levelSpec.checkpoints) {
    level.checkpoints.push(new Vec2(0, 0));
    return;
  }

  levelSpec.checkpoints.forEach(([x, y]: any) => {
    level.checkpoints.push(new Vec2(x, y));
  });
}

function setupEntities(levelSpec: any, level: Level, entityFactory: any): void {
  const spawner = createSpawner();
  levelSpec.entities.forEach(({ id, name, pos: [x, y], props }: any) => {
    const createEntity = entityFactory[name];
    if (!createEntity) {
      throw new Error(`No entity ${name}`);
    }

    const entity = createEntity(props);
    entity.pos.set(x, y);

    if (id) {
      entity.id = id;
      level.entities.add(entity);
    } else {
      spawner.addEntity(entity);
    }
  });

  const entityProxy = new Entity();
  entityProxy.addTrait(spawner);
  level.entities.add(entityProxy);
}

function setupTriggers(levelSpec: any, level: Level): void {
  if (!levelSpec.triggers) {
    return;
  }

  for (const triggerSpec of levelSpec.triggers) {
    const trigger = new Trigger();

    trigger.conditions.push((entity: any, touches: any, gc: any, level: any) => {
      (level as any).events.emit(
        Level.EVENT_TRIGGER as unknown as string,
        triggerSpec,
        entity,
        touches
      );
    });

    const entity = new Entity();
    entity.addTrait(trigger);
    entity.size.set(64, 64);
    entity.pos.set(triggerSpec.pos[0], triggerSpec.pos[1]);
    level.entities.add(entity);
  }
}

export function createLevelLoader(entityFactory: any) {
  return function loadLevel(name: string): Promise<Level> {
    return loadJSON(`/levels/${name}.json`)
      .then((levelSpec: any) =>
        Promise.all([
          levelSpec,
          loadSpriteSheet(levelSpec.spriteSheet),
          loadMusicSheet(levelSpec.musicSheet),
          loadPattern(levelSpec.patternSheet),
        ])
      )
      .then(([levelSpec, backgroundSprites, musicPlayer, patterns]) => {
        const level = new Level();
        level.name = name;
        level.music.setPlayer(musicPlayer);

        setupBackgrounds(levelSpec, level, patterns);
        setupEntities(levelSpec, level, entityFactory);
        setupTriggers(levelSpec, level);
        setupCheckpoints(levelSpec, level);

        setupBehavior(level);
        setupCamera(level);

        for (const resolver of level.tileCollider.resolvers) {
          const backgroundLayer = createBackgroundLayer(level, resolver.matrix, backgroundSprites);
          // @ts-expect-error - We know this is accessing protected/private properties
          level.comp.layers.push(backgroundLayer);
        }

        const spriteLayer = createSpriteLayer(level.entities);
        // @ts-expect-error - We know this is accessing protected/private properties
        level.comp.layers.splice(level.comp.layers.length - 1, 0, spriteLayer);

        return level;
      });
  };
}

function createGrid(tiles: any[], patterns: Record<string, any>): Matrix<any> {
  const grid = new Matrix<any>();

  for (const { tile, x, y } of expandTiles(tiles, patterns)) {
    grid.set(x, y, tile);
  }

  return grid;
}

function* expandSpan(
  xStart: number,
  xLen: number,
  yStart: number,
  yLen: number
): Generator<{ x: number; y: number }> {
  const xEnd = xStart + xLen;
  const yEnd = yStart + yLen;
  for (let x = xStart; x < xEnd; ++x) {
    for (let y = yStart; y < yEnd; ++y) {
      yield { x, y };
    }
  }
}

function expandRange(range: number[]): Generator<{ x: number; y: number }> {
  if (range.length === 4) {
    const [xStart, xLen, yStart, yLen] = range;
    return expandSpan(xStart, xLen, yStart, yLen);
  } else if (range.length === 3) {
    const [xStart, xLen, yStart] = range;
    return expandSpan(xStart, xLen, yStart, 1);
  } else if (range.length === 2) {
    const [xStart, yStart] = range;
    return expandSpan(xStart, 1, yStart, 1);
  }
  throw new Error(`Invalid range: ${range}`);
}

function* expandRanges(ranges: number[][]): Generator<{ x: number; y: number }> {
  for (const range of ranges) {
    const result = expandRange(range);
    if (result) {
      yield* result;
    }
  }
}

interface ExpandedTile {
  tile: any;
  x: number;
  y: number;
}

function* expandTiles(tiles: any[], patterns: Record<string, any>): Generator<ExpandedTile> {
  function* walkTiles(tiles: any[], offsetX: number, offsetY: number): Generator<ExpandedTile> {
    for (const tile of tiles) {
      for (const { x, y } of expandRanges(tile.ranges)) {
        const derivedX = x + offsetX;
        const derivedY = y + offsetY;

        if (tile.pattern) {
          if (patterns[tile.pattern]) {
            const tiles = patterns[tile.pattern].tiles;
            yield* walkTiles(tiles, derivedX, derivedY);
          } else {
            console.warn(`Pattern "${tile.pattern}" not found in patterns:`, patterns);
          }
        } else {
          yield {
            tile,
            x: derivedX,
            y: derivedY,
          };
        }
      }
    }
  }

  yield* walkTiles(tiles, 0, 0);
}
