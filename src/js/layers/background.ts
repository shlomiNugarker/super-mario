import TileResolver from '../TileResolver.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config.ts';
import Level from '../Level.ts';
import { Matrix } from '../math.ts';
import { SpriteSheet } from '../../types/common.ts';
import { Tile } from '../../types/level.ts';
import Camera from '../Camera.ts';

export function createBackgroundLayer(level: Level, tiles: Matrix<Tile>, sprites: SpriteSheet) {
  const resolver = new TileResolver(tiles);

  const buffer = document.createElement('canvas');
  buffer.width = CANVAS_WIDTH + 16;
  buffer.height = CANVAS_HEIGHT;

  const context = buffer.getContext('2d');

  function redraw(startIndex: number, endIndex: number) {
    context!.clearRect(0, 0, buffer.width, buffer.height);

    for (let x = startIndex; x <= endIndex; ++x) {
      const col = tiles.grid[x];
      if (col) {
        col.forEach((tile: Tile, y: number) => {
          const animName = tile.style;
          if (
            sprites.animations &&
            typeof sprites.animations.get === 'function' &&
            sprites.animations.get(animName)
          ) {
            sprites.drawAnim(animName, context!, x - startIndex, y, level.totalTime);
          } else {
            sprites.drawTile(tile.style, context!, x - startIndex, y);
          }
        });
      }
    }
  }

  return function drawBackgroundLayer(context: CanvasRenderingContext2D, camera: Camera) {
    const drawWidth = resolver.toIndex(camera.size.x);
    const drawFrom = resolver.toIndex(camera.pos.x);
    const drawTo = drawFrom + drawWidth;
    redraw(drawFrom, drawTo);

    context.drawImage(buffer, Math.floor(-camera.pos.x % 16), Math.floor(-camera.pos.y));
  };
}
