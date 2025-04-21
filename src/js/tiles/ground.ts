import { Sides } from '../Entity.ts';
import BoundingBox from '../BoundingBox.ts';

interface MatchTile {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface EntityWithBoundsAndVel {
  bounds: BoundingBox;
  vel: {
    x: number;
    y: number;
  };
  obstruct(side: symbol, match: MatchTile): void;
}

function handleX({ entity, match }: { entity: EntityWithBoundsAndVel; match: MatchTile }): void {
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

function handleY({ entity, match }: { entity: EntityWithBoundsAndVel; match: MatchTile }): void {
  if (entity.vel.y > 0) {
    if (entity.bounds.bottom > match.y1) {
      entity.obstruct(Sides.BOTTOM, match);
    }
  } else if (entity.vel.y < 0) {
    if (entity.bounds.top < match.y2) {
      entity.obstruct(Sides.TOP, match);
    }
  }
}

export const ground = [handleX, handleY];
