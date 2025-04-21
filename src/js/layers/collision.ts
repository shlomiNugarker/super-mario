import Entity from '../Entity.ts';
import Camera from '../Camera.ts';
import TileResolver from '../TileResolver.ts';
import Level from '../Level.ts';

function createEntityLayer(entities: Set<Entity>): any {
  return function drawBoundingBox(context: CanvasRenderingContext2D, camera: Camera): void {
    context.strokeStyle = 'red';
    entities.forEach((entity) => {
      context.beginPath();
      context.rect(
        entity.bounds.left - camera.pos.x,
        entity.bounds.top - camera.pos.y,
        entity.size.x,
        entity.size.y
      );
      context.stroke();
    });
  };
}

interface TilePosition {
  x: number;
  y: number;
}

function createTileCandidateLayer(tileResolver: TileResolver): any {
  const resolvedTiles: TilePosition[] = [];

  const tileSize = tileResolver.tileSize;

  const getByIndexOriginal = tileResolver.getByIndex;
  tileResolver.getByIndex = function getByIndexFake(x: number, y: number) {
    resolvedTiles.push({ x, y });
    return getByIndexOriginal.call(tileResolver, x, y);
  };

  return function drawTileCandidates(context: CanvasRenderingContext2D, camera: Camera): void {
    context.strokeStyle = 'blue';
    resolvedTiles.forEach(({ x, y }) => {
      context.beginPath();
      context.rect(x * tileSize - camera.pos.x, y * tileSize - camera.pos.y, tileSize, tileSize);
      context.stroke();
    });

    resolvedTiles.length = 0;
  };
}

export function createCollisionLayer(level: Level): any {
  const drawTileCandidates = level.tileCollider.resolvers.map(createTileCandidateLayer);
  const drawBoundingBoxes = createEntityLayer(level.entities);

  return function drawCollision(context: CanvasRenderingContext2D, camera: Camera): void {
    drawTileCandidates.forEach((draw: any) => draw(context, camera));
    drawBoundingBoxes(context, camera);
  };
}
