import { Camera } from "./debug";

type Layer = (context: CanvasRenderingContext2D, camera: Camera) => void;

export default class Compositor {
  private layers: Layer[];

  constructor() {
    this.layers = [];
  }

  draw(context: CanvasRenderingContext2D, camera: Camera): void {
    this.layers.forEach((layer) => {
      layer(context, camera);
    });
  }
}
