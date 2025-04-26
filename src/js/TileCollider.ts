import TileResolver from './TileResolver.ts';
import { brick } from './tiles/brick.ts';
import { coin } from './tiles/coin.ts';
import { ground } from './tiles/ground.ts';
import { Matrix } from './math.ts';
import Entity from './Entity.ts';
import Level from './Level.ts';
import { GameContext, MatchTile } from '../types/common';

// Size of spatial grid cells
const CELL_SIZE = 64; // Must be larger than typical entity size

/**
 * Spatial grid for efficient collision detection
 */
class SpatialGrid {
  private grid: Map<string, Set<Entity>> = new Map();
  private cellSize: number;

  constructor(cellSize: number = CELL_SIZE) {
    this.cellSize = cellSize;
  }

  /**
   * Generate a key for the grid cell at the given position
   */
  private toKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Add an entity to the grid
   */
  add(entity: Entity): void {
    // Get all cells the entity overlaps with
    const x1 = entity.bounds.left;
    const y1 = entity.bounds.top;
    const x2 = entity.bounds.right;
    const y2 = entity.bounds.bottom;

    const startCellX = Math.floor(x1 / this.cellSize);
    const startCellY = Math.floor(y1 / this.cellSize);
    const endCellX = Math.floor(x2 / this.cellSize);
    const endCellY = Math.floor(y2 / this.cellSize);

    // Add entity to all cells it overlaps
    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, new Set());
        }
        this.grid.get(key)?.add(entity);
      }
    }
  }

  /**
   * Get all entities in the cells that overlap with the given region
   */
  getEntitiesInRegion(left: number, top: number, right: number, bottom: number): Set<Entity> {
    const result = new Set<Entity>();

    const startCellX = Math.floor(left / this.cellSize);
    const startCellY = Math.floor(top / this.cellSize);
    const endCellX = Math.floor(right / this.cellSize);
    const endCellY = Math.floor(bottom / this.cellSize);

    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellEntities = this.grid.get(key);
        if (cellEntities) {
          cellEntities.forEach((entity) => result.add(entity));
        }
      }
    }

    return result;
  }

  /**
   * Clear the grid
   */
  clear(): void {
    this.grid.clear();
  }
}

/**
 * Context for tile collision handling
 */
interface TileCollisionContext {
  entity: Entity;
  match: MatchTile;
  resolver: TileResolver;
  gameContext: GameContext;
  level: Level;
}

/**
 * Type for tile collision handler function
 */
type HandlerFunction = (context: TileCollisionContext) => void;

// Collision handlers for different tile types
const handlers: Record<string, HandlerFunction[]> = {
  brick,
  coin,
  ground,
};

/**
 * TileCollider class handles collision detection and resolution between entities and tiles
 */
export default class TileCollider {
  resolvers: TileResolver[];
  spatialGrid: SpatialGrid;
  debug: boolean = false;

  constructor() {
    this.resolvers = [];
    this.spatialGrid = new SpatialGrid();
  }

  /**
   * Add a tile matrix to the collider
   */
  addGrid(tileMatrix: Matrix<any>) {
    this.resolvers.push(new TileResolver(tileMatrix));
  }

  /**
   * Enable or disable debug mode
   */
  setDebug(debug: boolean): void {
    this.debug = debug;
  }

  /**
   * Check for horizontal collisions
   */
  checkX(entity: Entity, gameContext: GameContext, level: Level) {
    let x: number;
    if (entity.vel.x > 0) {
      x = entity.bounds.right;
    } else if (entity.vel.x < 0) {
      x = entity.bounds.left;
    } else {
      return;
    }

    // Performance optimization: Only check relevant area
    const checkMargin = 2; // Check a bit more than needed to ensure we don't miss anything
    const y1 = entity.bounds.top;
    const y2 = entity.bounds.bottom;

    // Only check tiles in the path of the entity's movement
    const checkDistance = Math.abs(entity.vel.x) * gameContext.deltaTime + checkMargin;

    for (const resolver of this.resolvers) {
      let xToCheck: number;
      if (entity.vel.x > 0) {
        xToCheck = entity.bounds.right + checkDistance;
      } else {
        xToCheck = entity.bounds.left - checkDistance;
      }

      const matches = resolver.searchByRange(Math.min(x, xToCheck), Math.max(x, xToCheck), y1, y2);

      if (this.debug && matches.length > 0) {
        console.log('X collision candidates:', matches.length);
      }

      matches.forEach((match) => {
        this.handle(0, entity, match as MatchTile, resolver, gameContext, level);
      });
    }
  }

  /**
   * Check for vertical collisions
   */
  checkY(entity: Entity, gameContext: GameContext, level: Level) {
    let y: number;
    if (entity.vel.y > 0) {
      y = entity.bounds.bottom;
    } else if (entity.vel.y < 0) {
      y = entity.bounds.top;
    } else {
      return;
    }

    // Performance optimization: Only check relevant area
    const checkMargin = 2;
    const x1 = entity.bounds.left;
    const x2 = entity.bounds.right;

    // Only check tiles in the path of the entity's movement
    const checkDistance = Math.abs(entity.vel.y) * gameContext.deltaTime + checkMargin;

    for (const resolver of this.resolvers) {
      let yToCheck: number;
      if (entity.vel.y > 0) {
        yToCheck = entity.bounds.bottom + checkDistance;
      } else {
        yToCheck = entity.bounds.top - checkDistance;
      }

      const matches = resolver.searchByRange(x1, x2, Math.min(y, yToCheck), Math.max(y, yToCheck));

      if (this.debug && matches.length > 0) {
        console.log('Y collision candidates:', matches.length);
      }

      matches.forEach((match) => {
        this.handle(1, entity, match as MatchTile, resolver, gameContext, level);
      });
    }
  }

  /**
   * Handle collision between an entity and a tile
   */
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

    const behavior = match.tile.behavior;
    const handler = behavior ? handlers[behavior] : undefined;

    if (handler && Array.isArray(handler) && handler[index]) {
      handler[index](tileCollisionContext);
    }
  }

  /**
   * Update spatial grid for entity collision detection
   * @param entities Entities to add to the grid
   */
  updateSpatialGrid(entities: Set<Entity>): void {
    this.spatialGrid.clear();
    entities.forEach((entity) => {
      this.spatialGrid.add(entity);
    });
  }

  /**
   * Get entities that might collide with a given entity
   * @param entity Entity to check against
   * @returns Set of potentially colliding entities
   */
  getPotentialColliders(entity: Entity): Set<Entity> {
    const margin = 16; // Extra margin to catch fast-moving entities
    const result = this.spatialGrid.getEntitiesInRegion(
      entity.bounds.left - margin,
      entity.bounds.top - margin,
      entity.bounds.right + margin,
      entity.bounds.bottom + margin
    );

    // Remove the entity itself from the result
    result.delete(entity);

    return result;
  }
}
