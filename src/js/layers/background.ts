import TileResolver from '../TileResolver.ts';
import { Matrix } from '../math';
import SpriteSheet from '../SpriteSheet';

export function createBackgroundLayer(
  level: any,
  tiles: Matrix<any>,
  sprites: SpriteSheet
): (context: CanvasRenderingContext2D, camera: any) => void {
  const resolver = new TileResolver(tiles);

  const buffer = document.createElement('canvas');
  buffer.width = 256 + 16;
  buffer.height = 240;

  const bufferContext = buffer.getContext('2d');
  if (!bufferContext) {
    throw new Error('Failed to get 2D context for background buffer');
  }

  // After this point, bufferContext is guaranteed to be non-null
  const ctx = bufferContext;

  function redraw(startIndex: number, endIndex: number): void {
    ctx.clearRect(0, 0, buffer.width, buffer.height);

    for (let x = startIndex; x <= endIndex; ++x) {
      const col = tiles.grid[x];
      if (col) {
        col.forEach((tile: any, y: number) => {
          try {
            sprites.drawTile(tile.style, ctx, x - startIndex, y);
          } catch {
            // If drawTile fails, try drawAnim as fallback
            sprites.drawAnim(tile.style, ctx, x - startIndex, y, level.totalTime);
          }
        });
      }
    }
  }

  return function drawBackgroundLayer(context: CanvasRenderingContext2D, camera: any): void {
    const drawWidth = resolver.toIndex(camera.size.x);
    const drawFrom = resolver.toIndex(camera.pos.x);
    const drawTo = drawFrom + drawWidth;
    redraw(drawFrom, drawTo);

    context.drawImage(buffer, Math.floor(-camera.pos.x % 16), Math.floor(-camera.pos.y));
  };
}
