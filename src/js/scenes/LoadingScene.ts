import Scene from '../Scene';
import { GameContext } from '../../types/common';
import { LoadingProgress } from '../services/AssetService';

/**
 * Scene for displaying loading progress
 */
export default class LoadingScene extends Scene {
  private progress: LoadingProgress;
  private logoImage: HTMLImageElement | null;
  private backgroundColor: string;
  private textColor: string;
  private barColor: string;
  private barBackgroundColor: string;

  /**
   * Constructor
   * @param backgroundColor Background color
   * @param textColor Text color
   * @param barColor Progress bar color
   * @param barBackgroundColor Progress bar background color
   */
  constructor(
    backgroundColor = '#000000',
    textColor = '#ffffff',
    barColor = '#ff0000',
    barBackgroundColor = '#333333'
  ) {
    super();
    this.progress = { loaded: 0, total: 1, percentage: 0 };
    this.logoImage = null;
    this.backgroundColor = backgroundColor;
    this.textColor = textColor;
    this.barColor = barColor;
    this.barBackgroundColor = barBackgroundColor;
  }

  /**
   * Set the logo image
   * @param image Logo image
   */
  setLogo(image: HTMLImageElement): void {
    this.logoImage = image;
  }

  /**
   * Update the loading progress
   * @param progress Progress information
   */
  updateProgress(progress: LoadingProgress): void {
    this.progress = progress;

    if (progress.loaded === progress.total) {
      setTimeout(() => {
        this.complete();
      }, 500); // Allow time to see 100% before completing
    }
  }

  /**
   * Set the completion callback
   * @param callback Callback function
   */
  setOnComplete(callback: () => void): void {
    this.events.listen(Scene.EVENT_COMPLETE, callback);
  }

  /**
   * Draw the loading screen
   * @param gameContext Game context
   */
  override draw(gameContext: GameContext): void {
    const { videoContext } = gameContext;
    if (!videoContext) return;

    const { width, height } = videoContext.canvas;

    // Clear background
    videoContext.fillStyle = this.backgroundColor;
    videoContext.fillRect(0, 0, width, height);

    // Draw logo
    if (this.logoImage) {
      const logoWidth = Math.min(this.logoImage.width, width * 0.8);
      const logoHeight = logoWidth * (this.logoImage.height / this.logoImage.width);
      const logoX = (width - logoWidth) / 2;
      const logoY = height * 0.3 - logoHeight / 2;

      videoContext.drawImage(this.logoImage, logoX, logoY, logoWidth, logoHeight);
    }

    // Draw progress bar background
    const barWidth = width * 0.8;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.6;

    videoContext.fillStyle = this.barBackgroundColor;
    videoContext.fillRect(barX, barY, barWidth, barHeight);

    // Draw progress bar
    const progressWidth = barWidth * (this.progress.percentage / 100);
    videoContext.fillStyle = this.barColor;
    videoContext.fillRect(barX, barY, progressWidth, barHeight);

    // Draw progress text
    videoContext.fillStyle = this.textColor;
    videoContext.font = '16px Arial';
    videoContext.textAlign = 'center';

    const loadingText = `Loading... ${this.progress.percentage}%`;
    videoContext.fillText(loadingText, width / 2, barY + barHeight + 20);

    const assetsText = `${this.progress.loaded}/${this.progress.total} assets loaded`;
    videoContext.fillText(assetsText, width / 2, barY + barHeight + 40);
  }

  /**
   * Update the loading scene
   * @param _gameContext Game context (unused in loading scene but required by interface)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override update(_gameContext: GameContext): void {
    // Empty implementation - no animation or state updates needed during loading
  }
}
