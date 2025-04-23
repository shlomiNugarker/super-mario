/**
 * Generic matrix class for 2D grid data
 */
export class Matrix<T> {
  grid: Array<Array<T>>;

  constructor() {
    this.grid = [];
  }

  /**
   * Execute a callback for each element in the matrix
   * @param callback Function to execute for each element
   */
  forEach(callback: (value: T, x: number, y: number) => void): void {
    this.grid.forEach((column, x) => {
      column.forEach((value, y) => {
        callback(value, x, y);
      });
    });
  }

  /**
   * Delete an element at specified coordinates
   * @param x X coordinate
   * @param y Y coordinate
   */
  delete(x: number, y: number): void {
    const col = this.grid[x];
    if (col) {
      delete col[y];
    }
  }

  /**
   * Get an element at specified coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns The element or undefined if not found
   */
  get(x: number, y: number): T | undefined {
    const col = this.grid[x];
    if (col) {
      return col[y];
    }
    return undefined;
  }

  /**
   * Set an element at specified coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @param value The value to set
   */
  set(x: number, y: number, value: T): void {
    if (!this.grid[x]) {
      this.grid[x] = [];
    }

    this.grid[x][y] = value;
  }

  /**
   * Check if the matrix has an element at specified coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns True if an element exists at the coordinates
   */
  has(x: number, y: number): boolean {
    const col = this.grid[x];
    return col !== undefined && col[y] !== undefined;
  }

  /**
   * Get the width of the matrix (maximum x index + 1)
   */
  get width(): number {
    return this.grid.length;
  }

  /**
   * Get the height of the matrix (maximum y index + 1 across all columns)
   */
  get height(): number {
    let maxHeight = 0;
    this.grid.forEach((column) => {
      const columnHeight = column.length;
      if (columnHeight > maxHeight) {
        maxHeight = columnHeight;
      }
    });
    return maxHeight;
  }
}

/**
 * 2D Vector class
 */
export class Vec2 {
  x!: number;
  y!: number;

  constructor(x: number, y: number) {
    this.set(x, y);
  }

  /**
   * Copy values from another vector
   * @param vec2 Vector to copy from
   * @returns This vector for chaining
   */
  copy(vec2: Vec2): Vec2 {
    this.x = vec2.x;
    this.y = vec2.y;
    return this;
  }

  /**
   * Check if this vector equals another vector
   * @param vec2 Vector to compare with
   * @returns True if vectors are equal
   */
  equals(vec2: Vec2): boolean {
    return this.x === vec2.x && this.y === vec2.y;
  }

  /**
   * Calculate distance to another vector
   * @param v Vector to calculate distance to
   * @returns The distance
   */
  distance(v: Vec2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Set the vector coordinates
   * @param x X coordinate
   * @param y Y coordinate
   * @returns This vector for chaining
   */
  set(x: number, y: number): Vec2 {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Add another vector to this vector
   * @param v Vector to add
   * @returns This vector for chaining
   */
  add(v: Vec2): Vec2 {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * Subtract another vector from this vector
   * @param v Vector to subtract
   * @returns This vector for chaining
   */
  subtract(v: Vec2): Vec2 {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * Multiply this vector by a scalar
   * @param n Scalar to multiply by
   * @returns This vector for chaining
   */
  scale(n: number): Vec2 {
    this.x *= n;
    this.y *= n;
    return this;
  }

  /**
   * Calculate the length (magnitude) of this vector
   * @returns The length
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalize this vector (make it unit length)
   * @returns This vector for chaining
   */
  normalize(): Vec2 {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  /**
   * Create a new vector that is a copy of this one
   * @returns A new vector with the same coordinates
   */
  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }
}

/**
 * Clamp a value between a minimum and maximum
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  if (value > max) {
    return max;
  }
  if (value < min) {
    return min;
  }
  return value;
}

/**
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value
 * @param t Interpolation factor (0-1)
 * @returns The interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Directional vectors
 */
export const Direction: Record<string, Readonly<Vec2>> = Object.freeze({
  UP: Object.freeze(new Vec2(0, -1)),
  DOWN: Object.freeze(new Vec2(0, 1)),
  RIGHT: Object.freeze(new Vec2(1, 0)),
  LEFT: Object.freeze(new Vec2(-1, 0)),
});
