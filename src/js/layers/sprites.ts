import Camera from '../Camera';

export function createSpriteLayer(entities: Set<any> | any[], width = 64, height = 64) {
  const spriteBuffer = document.createElement('canvas');
  spriteBuffer.width = width;
  spriteBuffer.height = height;
  const spriteBufferContext = spriteBuffer.getContext('2d');

  if (!spriteBufferContext) {
    throw new Error('Failed to get 2D context for sprite buffer');
  }

  return function drawSpriteLayer(context: CanvasRenderingContext2D, camera: Camera) {
    entities.forEach((entity) => {
      if (!entity.draw) {
        return;
      }

      spriteBufferContext.clearRect(0, 0, width, height);

      entity.draw(spriteBufferContext);

      context.drawImage(
        spriteBuffer,
        Math.floor(entity.pos.x - camera.pos.x),
        Math.floor(entity.pos.y - camera.pos.y)
      );
    });
  };
}
