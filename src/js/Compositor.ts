import { Camera } from './debug.ts';

/**
 * Function type for a layer draw function
 */
export type Layer = (context: CanvasRenderingContext2D, camera: Camera) => void;

/**
 * Compositor class for managing and drawing layers
 */
export default class Compositor {
  public layers: Layer[];

  constructor() {
    this.layers = [];
  }

  /**
   * Draw all layers
   * @param context Canvas context
   * @param camera Camera
   */
  draw(context: CanvasRenderingContext2D, camera: Camera): void {
    this.layers.forEach((layer) => {
      layer(context, camera);
    });
  }
}
