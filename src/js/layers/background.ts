import TileResolver from '../TileResolver.ts';

export function createBackgroundLayer(level: any, tiles: any, sprites: any) {
  const resolver = new TileResolver(tiles);

  const buffer = document.createElement('canvas');
  buffer.width = 256 + 16;
  buffer.height = 240;

  const context = buffer.getContext('2d');

  function redraw(startIndex: number, endIndex: number) {
    context!.clearRect(0, 0, buffer.width, buffer.height);

    for (let x = startIndex; x <= endIndex; ++x) {
      const col = tiles.grid[x];
      if (col) {
        col.forEach((tile: any, y: number) => {
          if (sprites.animations.has(tile.style)) {
            sprites.drawAnim(tile.style, context, x - startIndex, y, level.totalTime);
          } else {
            sprites.drawTile(tile.style, context, x - startIndex, y);
          }
        });
      }
    }
  }

  return function drawBackgroundLayer(context: any, camera: any) {
    const drawWidth = resolver.toIndex(camera.size.x);
    const drawFrom = resolver.toIndex(camera.pos.x);
    const drawTo = drawFrom + drawWidth;
    redraw(drawFrom, drawTo);

    context.drawImage(buffer, Math.floor(-camera.pos.x % 16), Math.floor(-camera.pos.y));
  };
}
