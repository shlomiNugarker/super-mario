export interface Vector2 {
  set(x: number, y: number): void;
  x: number;
  y: number;
}

export interface Entity {
  vel: Vector2;
  pos: Vector2;
}

export interface Camera {
  pos: Vector2;
}

export function setupMouseControl(
  canvas: HTMLCanvasElement,
  entity: Entity,
  camera: Camera
): void {
  let lastEvent: MouseEvent | null = null;

  ["mousedown", "mousemove"].forEach((eventName) => {
    canvas.addEventListener(
      eventName as keyof HTMLElementEventMap,
      ((event: MouseEvent) => {
        if (event.buttons === 1) {
          entity.vel.set(0, 0);
          entity.pos.set(
            event.offsetX + camera.pos.x,
            event.offsetY + camera.pos.y
          );
        } else if (
          event.buttons === 2 &&
          lastEvent &&
          lastEvent.buttons === 2 &&
          lastEvent.type === "mousemove"
        ) {
          camera.pos.x -= event.offsetX - lastEvent.offsetX;
        }
        lastEvent = event;
      }) as EventListener
    );
  });

  canvas.addEventListener("contextmenu", ((event: MouseEvent) => {
    event.preventDefault();
  }) as EventListener);
}
