export function createCameraLayer(cameraToDraw: any) {
  return function drawCameraRect(context: CanvasRenderingContext2D, fromCamera: any) {
    context.strokeStyle = 'purple';
    context.beginPath();
    context.rect(
      cameraToDraw.pos.x - fromCamera.pos.x,
      cameraToDraw.pos.y - fromCamera.pos.y,
      cameraToDraw.size.x,
      cameraToDraw.size.y
    );
    context.stroke();
  };
}
