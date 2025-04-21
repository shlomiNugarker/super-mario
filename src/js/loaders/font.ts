import { loadImage } from '../loaders.ts';
import SpriteSheet from '../SpriteSheet.ts';

const CHARS = ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ©!-×.';

class Font {
  private sprites: SpriteSheet;
  private size: number;

  constructor(sprites: SpriteSheet, size: number) {
    this.sprites = sprites;
    this.size = size;
  }

  print(text: string, context: CanvasRenderingContext2D, x: number, y: number): void {
    [...text.toUpperCase()].forEach((char, pos) => {
      this.sprites.draw(char, context, x + pos * this.size, y);
    });
  }
}

export function loadFont(): Promise<Font> {
  return loadImage('./img/font.png').then((image) => {
    const fontSprite = new SpriteSheet(image, 8, 8);

    const size = 8;
    const rowLen = image.width;
    for (const [index, char] of [...CHARS].entries()) {
      const x = (index * size) % rowLen;
      const y = Math.floor((index * size) / rowLen) * size;
      fontSprite.define(char, x, y, size, size);
    }

    return new Font(fontSprite, size);
  });
}
