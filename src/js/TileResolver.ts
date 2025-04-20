import { Matrix } from "./math";

interface TileMatch {
  tile: any;
  indexX: number;
  indexY: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export default class TileResolver {
  matrix: Matrix<any>;
  tileSize: number;

  constructor(matrix: Matrix<any>, tileSize: number = 16) {
    this.matrix = matrix;
    this.tileSize = tileSize;
  }

  toIndex(pos: number): number {
    return Math.floor(pos / this.tileSize);
  }

  toIndexRange(pos1: number, pos2: number): number[] {
    const pMax = Math.ceil(pos2 / this.tileSize) * this.tileSize;
    const range: number[] = [];
    let pos = pos1;
    do {
      range.push(this.toIndex(pos));
      pos += this.tileSize;
    } while (pos < pMax);
    return range;
  }

  getByIndex(indexX: number, indexY: number): TileMatch | undefined {
    const tile = this.matrix.get(indexX, indexY);
    if (tile) {
      const x1 = indexX * this.tileSize;
      const x2 = x1 + this.tileSize;
      const y1 = indexY * this.tileSize;
      const y2 = y1 + this.tileSize;
      return {
        tile,
        indexX,
        indexY,
        x1,
        x2,
        y1,
        y2,
      };
    }
    return undefined;
  }

  searchByPosition(posX: number, posY: number): TileMatch | undefined {
    return this.getByIndex(this.toIndex(posX), this.toIndex(posY));
  }

  searchByRange(x1: number, x2: number, y1: number, y2: number): TileMatch[] {
    const matches: TileMatch[] = [];
    this.toIndexRange(x1, x2).forEach((indexX) => {
      this.toIndexRange(y1, y2).forEach((indexY) => {
        const match = this.getByIndex(indexX, indexY);
        if (match) {
          matches.push(match);
        }
      });
    });
    return matches;
  }
}
