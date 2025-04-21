import { loadJSON, loadImage } from '../loaders.ts';
import SpriteSheet from '../SpriteSheet.ts';
import { createAnim } from '../anim.ts';

interface TileSpec {
  name: string;
  index: [number, number];
}

interface FrameSpec {
  name: string;
  rect: [number, number, number, number];
}

interface AnimSpec {
  name: string;
  frames: string[];
  frameLen: number;
}

interface SheetSpec {
  imageURL: string;
  tileW: number;
  tileH: number;
  tiles?: TileSpec[];
  frames?: FrameSpec[];
  animations?: AnimSpec[];
}

export function loadSpriteSheet(name: string): Promise<SpriteSheet> {
  return loadJSON(`/sprites/${name}.json`)
    .then((sheetSpec: SheetSpec) => Promise.all([sheetSpec, loadImage(sheetSpec.imageURL)]))
    .then(([sheetSpec, image]) => {
      const sprites = new SpriteSheet(image, sheetSpec.tileW, sheetSpec.tileH);

      if (sheetSpec.tiles) {
        sheetSpec.tiles.forEach((tileSpec: TileSpec) => {
          sprites.defineTile(tileSpec.name, tileSpec.index[0], tileSpec.index[1]);
        });
      }

      if (sheetSpec.frames) {
        sheetSpec.frames.forEach((frameSpec: FrameSpec) => {
          sprites.define(
            frameSpec.name,
            frameSpec.rect[0],
            frameSpec.rect[1],
            frameSpec.rect[2],
            frameSpec.rect[3]
          );
        });
      }

      if (sheetSpec.animations) {
        sheetSpec.animations.forEach((animSpec: AnimSpec) => {
          const animation = createAnim(animSpec.frames, animSpec.frameLen);
          sprites.defineAnim(animSpec.name, animation);
        });
      }

      return sprites;
    });
}
