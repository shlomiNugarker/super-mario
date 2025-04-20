export class Matrix<T> {
  grid: Array<Array<T>>;

  constructor() {
    this.grid = [];
  }

  forEach(callback: (value: T, x: number, y: number) => void): void {
    this.grid.forEach((column, x) => {
      column.forEach((value, y) => {
        callback(value, x, y);
      });
    });
  }

  delete(x: number, y: number): void {
    const col = this.grid[x];
    if (col) {
      delete col[y];
    }
  }

  get(x: number, y: number): T | undefined {
    const col = this.grid[x];
    if (col) {
      return col[y];
    }
    return undefined;
  }

  set(x: number, y: number, value: T): void {
    if (!this.grid[x]) {
      this.grid[x] = [];
    }

    this.grid[x][y] = value;
  }
}

export class Vec2 {
  x!: number;
  y!: number;

  constructor(x: number, y: number) {
    this.set(x, y);
  }

  copy(vec2: Vec2): void {
    this.x = vec2.x;
    this.y = vec2.y;
  }

  equals(vec2: Vec2): boolean {
    return this.x === vec2.x && this.y === vec2.y;
  }

  distance(v: Vec2): number {
    const dx = this.x - v.x,
      dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  set(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }
}

export function clamp(value: number, min: number, max: number): number {
  if (value > max) {
    return max;
  }
  if (value < min) {
    return min;
  }
  return value;
}

export const Direction: Record<string, Vec2> = {
  UP: new Vec2(0, -1),
  DOWN: new Vec2(0, 1),
  RIGHT: new Vec2(1, 0),
  LEFT: new Vec2(-1, 0),
};
