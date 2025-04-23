export default class SpriteSheet {
  private image: HTMLImageElement;
  private width: number;
  private height: number;
  protected tiles: Map<string, HTMLCanvasElement[]>;
  private animations: Map<string, (distance: number) => string>;

  constructor(image: HTMLImageElement, width: number, height: number) {
    this.image = image;
    this.width = width;
    this.height = height;
    this.tiles = new Map();
    this.animations = new Map();
  }

  defineAnim(name: string, animation: (distance: number) => string): void {
    this.animations.set(name, animation);
  }

  define(name: string, x: number, y: number, width: number, height: number): void {
    const buffers = [false, true].map((flip) => {
      const buffer = document.createElement('canvas');
      buffer.width = width;
      buffer.height = height;

      const context = buffer.getContext('2d');

      if (context && flip) {
        context.scale(-1, 1);
        context.translate(-width, 0);
      }

      if (context) {
        context.drawImage(this.image, x, y, width, height, 0, 0, width, height);
      }

      return buffer;
    });

    this.tiles.set(name, buffers);
  }

  defineTile(name: string, x: number, y: number): void {
    this.define(name, x * this.width, y * this.height, this.width, this.height);
  }

  draw(
    name: string,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    flip: boolean = false
  ): void {
    const buffer = this.tiles.get(name)?.[flip ? 1 : 0];
    if (buffer) {
      context.drawImage(buffer, x, y);
    } else {
      console.warn(`Sprite '${name}' not found`);
    }
  }

  drawAnim(
    name: string,
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    distance: number
  ): void {
    const animation = this.animations.get(name);
    if (animation) {
      this.drawTile(animation(distance), context, x, y);
    } else {
      console.warn(`Animation '${name}' not found`);
    }
  }

  drawTile(name: string, context: CanvasRenderingContext2D, x: number, y: number): void {
    this.draw(name, context, x * this.width, y * this.height);
  }

  /**
   * Check if a sprite with the given name exists
   */
  has(name: string): boolean {
    return this.tiles.has(name);
  }
}
