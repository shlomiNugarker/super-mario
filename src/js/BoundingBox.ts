import { Vec2 } from './math.ts';

/**
 * Bounding box for collision detection and positioning
 * Represents a rectangular area with position, size, and offset
 */
export default class BoundingBox {
  /** Position vector (usually the entity position) */
  pos: Vec2;

  /** Size vector (width, height) */
  size: Vec2;

  /** Offset vector from position */
  offset: Vec2;

  /**
   * Create a new bounding box
   * @param pos Position vector
   * @param size Size vector (width, height)
   * @param offset Offset vector from position
   */
  constructor(pos: Vec2, size: Vec2, offset: Vec2) {
    this.pos = pos;
    this.size = size;
    this.offset = offset;
  }

  /**
   * Check if this bounding box overlaps another
   * @param box The bounding box to check against
   * @returns True if the boxes overlap
   */
  overlaps(box: BoundingBox): boolean {
    return (
      this.bottom > box.top &&
      this.top < box.bottom &&
      this.left < box.right &&
      this.right > box.left
    );
  }

  /**
   * Check if a point is inside this bounding box
   * @param x X coordinate
   * @param y Y coordinate
   * @returns True if the point is inside the box
   */
  containsPoint(x: number, y: number): boolean {
    return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom;
  }

  /**
   * Get the center of the bounding box
   * @returns A new Vec2 with the center coordinates
   */
  getCenter(): Vec2 {
    return new Vec2(this.meridian, this.equator);
  }

  /**
   * Set the center of the bounding box
   * @param vec2 Vector with new center coordinates
   */
  setCenter(vec2: Vec2): void {
    this.meridian = vec2.x;
    this.equator = vec2.y;
  }

  /**
   * Get the width of the bounding box
   * @returns The width
   */
  get width(): number {
    return this.size.x;
  }

  /**
   * Get the height of the bounding box
   * @returns The height
   */
  get height(): number {
    return this.size.y;
  }

  /**
   * Calculate the area of the bounding box
   * @returns The area (width * height)
   */
  get area(): number {
    return this.width * this.height;
  }

  /**
   * Get the horizontal center of the bounding box
   */
  get meridian(): number {
    return this.pos.x + this.offset.x + this.size.x / 2;
  }

  /**
   * Set the horizontal center of the bounding box
   */
  set meridian(c: number) {
    this.pos.x = c - (this.size.x / 2 + this.offset.x);
  }

  /**
   * Get the vertical center of the bounding box
   */
  get equator(): number {
    return this.pos.y + this.offset.y + this.size.y / 2;
  }

  /**
   * Set the vertical center of the bounding box
   */
  set equator(c: number) {
    this.pos.y = c - (this.size.y / 2 + this.offset.y);
  }

  /**
   * Get the bottom edge of the bounding box
   */
  get bottom(): number {
    return this.pos.y + this.size.y + this.offset.y;
  }

  /**
   * Set the bottom edge of the bounding box
   */
  set bottom(y: number) {
    this.pos.y = y - (this.size.y + this.offset.y);
  }

  /**
   * Get the top edge of the bounding box
   */
  get top(): number {
    return this.pos.y + this.offset.y;
  }

  /**
   * Set the top edge of the bounding box
   */
  set top(y: number) {
    this.pos.y = y - this.offset.y;
  }

  /**
   * Get the left edge of the bounding box
   */
  get left(): number {
    return this.pos.x + this.offset.x;
  }

  /**
   * Set the left edge of the bounding box
   */
  set left(x: number) {
    this.pos.x = x - this.offset.x;
  }

  /**
   * Get the right edge of the bounding box
   */
  get right(): number {
    return this.pos.x + this.size.x + this.offset.x;
  }

  /**
   * Set the right edge of the bounding box
   */
  set right(x: number) {
    this.pos.x = x - (this.size.x + this.offset.x);
  }

  /**
   * Check if this bounding box fully contains another
   * @param box The bounding box to check
   * @returns True if this box fully contains the other box
   */
  contains(box: BoundingBox): boolean {
    return (
      box.left >= this.left &&
      box.right <= this.right &&
      box.top >= this.top &&
      box.bottom <= this.bottom
    );
  }

  /**
   * Create a clone of this bounding box
   * @returns A new BoundingBox with the same properties
   */
  clone(): BoundingBox {
    return new BoundingBox(this.pos.clone(), this.size.clone(), this.offset.clone());
  }

  /**
   * Update the bounding box size
   * @param width New width
   * @param height New height
   */
  setSize(width: number, height: number): void {
    this.size.set(width, height);
  }

  /**
   * Update the bounding box offset
   * @param x New x offset
   * @param y New y offset
   */
  setOffset(x: number, y: number): void {
    this.offset.set(x, y);
  }
}
