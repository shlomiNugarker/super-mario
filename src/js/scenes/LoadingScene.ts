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
  private loadingText: string;
  private fadeInAlpha: number = 0;
  private showShinyEffect: boolean = true;
  private levelName: string;
  lastUpdate: number = 0;
  private cloudPositions: { x: number; y: number; speed: number; size: number }[] = [];
  private bouncingMario: { y: number; velocity: number; x: number } = { y: 0, velocity: -2, x: 0 };

  /**
   * Constructor
   * @param backgroundColor Background color
   * @param textColor Text color
   * @param barColor Progress bar color
   * @param barBackgroundColor Progress bar background color
   * @param levelName Level name to display
   */
  constructor(
    backgroundColor = '#0f3460',
    textColor = '#ffffff',
    barColor = '#e52521',
    barBackgroundColor = '#333333',
    levelName = 'WORLD 1-1'
  ) {
    super();
    this.progress = { loaded: 0, total: 1, percentage: 0 };
    this.logoImage = null;
    this.backgroundColor = backgroundColor;
    this.textColor = textColor;
    this.barColor = barColor;
    this.barBackgroundColor = barBackgroundColor;
    this.loadingText = 'LOADING...';
    this.levelName = levelName;

    // Initialize cloud positions
    this.initClouds();

    // Fade in effect
    this.fadeIn();
  }

  /**
   * Initialize cloud positions for background
   */
  private initClouds(): void {
    for (let i = 0; i < 5; i++) {
      this.cloudPositions.push({
        x: Math.random() * 300 - 50,
        y: 30 + Math.random() * 100,
        speed: 0.2 + Math.random() * 0.3,
        size: 30 + Math.random() * 20,
      });
    }
  }

  /**
   * Start fade in animation
   */
  private fadeIn(): void {
    this.fadeInAlpha = 0;

    const fadeInterval = setInterval(() => {
      this.fadeInAlpha += 0.05;
      if (this.fadeInAlpha >= 1) {
        this.fadeInAlpha = 1;
        clearInterval(fadeInterval);
      }
    }, 50);
  }

  /**
   * Set the logo image
   * @param image Logo image
   */
  setLogo(image: HTMLImageElement): void {
    this.logoImage = image;
  }

  /**
   * Set the level name
   * @param name Level name
   */
  setLevelName(name: string): void {
    this.levelName = name;
  }

  /**
   * Update the loading progress
   * @param progress Progress information
   */
  updateProgress(progress: LoadingProgress): void {
    this.progress = progress;

    if (progress.loaded === progress.total) {
      // Fade out
      const fadeInterval = setInterval(() => {
        this.fadeInAlpha -= 0.05;
        if (this.fadeInAlpha <= 0) {
          this.fadeInAlpha = 0;
          clearInterval(fadeInterval);
          // Complete the loading scene after fade out
          setTimeout(() => this.complete(), 100);
        }
      }, 50);
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
   * Draw a cloud shape
   * @param ctx Canvas context
   * @param x X position
   * @param y Y position
   * @param size Size of the cloud
   */
  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw simple Mario character
   * @param ctx Canvas context
   * @param x X position
   * @param y Y position
   * @param size Size of Mario
   */
  private drawMario(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // This is a simple representation of Mario using basic shapes
    ctx.save();

    // Red cap and shirt
    ctx.fillStyle = '#e52521';
    ctx.fillRect(x - size * 0.5, y - size, size, size * 0.4);
    ctx.fillRect(x - size * 0.4, y - size * 0.2, size * 0.8, size * 0.3);

    // Blue overalls
    ctx.fillStyle = '#4a7aff';
    ctx.fillRect(x - size * 0.4, y + size * 0.1, size * 0.8, size * 0.5);
    ctx.fillRect(x - size * 0.4, y + size * 0.6, size * 0.2, size * 0.4);
    ctx.fillRect(x + size * 0.2, y + size * 0.6, size * 0.2, size * 0.4);

    // Face
    ctx.fillStyle = '#ffd699';
    ctx.fillRect(x - size * 0.3, y - size * 0.6, size * 0.6, size * 0.4);

    // Eyes
    ctx.fillStyle = 'black';
    ctx.fillRect(x + size * 0.05, y - size * 0.5, size * 0.1, size * 0.1);

    // Mustache
    ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.1);

    // Hands
    ctx.fillStyle = '#ffd699';
    ctx.fillRect(x - size * 0.5, y, size * 0.1, size * 0.1);
    ctx.fillRect(x + size * 0.4, y, size * 0.1, size * 0.1);

    ctx.restore();
  }

  /**
   * Draw the loading screen
   * @param gameContext Game context
   */
  override draw(gameContext: GameContext): void {
    const { videoContext } = gameContext;
    if (!videoContext) return;

    const { width, height } = videoContext.canvas;
    const now = performance.now();

    // Update bouncing Mario
    this.bouncingMario.y += this.bouncingMario.velocity;
    this.bouncingMario.velocity += 0.1;

    if (this.bouncingMario.y > 15) {
      this.bouncingMario.y = 15;
      this.bouncingMario.velocity = -2.5;
    }

    // Update cloud positions
    this.cloudPositions.forEach((cloud) => {
      cloud.x += cloud.speed;
      if (cloud.x > width + 50) {
        cloud.x = -50;
        cloud.y = 30 + Math.random() * 100;
      }
    });

    // Apply fade in/out effect
    videoContext.globalAlpha = this.fadeInAlpha;

    // Create gradient background
    const gradient = videoContext.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, this.backgroundColor);
    videoContext.fillStyle = gradient;
    videoContext.fillRect(0, 0, width, height);

    // Draw clouds in background
    this.cloudPositions.forEach((cloud) => {
      this.drawCloud(videoContext, cloud.x, cloud.y, cloud.size);
    });

    // Draw ground
    videoContext.fillStyle = '#43b047';
    videoContext.fillRect(0, height - 30, width, 30);

    // Draw ground details
    videoContext.fillStyle = '#388e3c';
    for (let i = 0; i < width; i += 20) {
      videoContext.fillRect(i, height - 30, 10, 5);
    }

    // Draw logo
    if (this.logoImage) {
      const logoWidth = Math.min(this.logoImage.width, width * 0.7);
      const logoHeight = logoWidth * (this.logoImage.height / this.logoImage.width);
      const logoX = (width - logoWidth) / 2;
      const logoY = height * 0.25 - logoHeight / 2;

      videoContext.drawImage(this.logoImage, logoX, logoY, logoWidth, logoHeight);
    } else {
      // Draw title text if no logo
      videoContext.fillStyle = '#e52521';
      videoContext.font = '24px "Press Start 2P"';
      videoContext.textAlign = 'center';
      videoContext.textBaseline = 'middle';
      videoContext.fillText('SUPER MARIO', width / 2, height * 0.25);
    }

    // Draw level name
    videoContext.fillStyle = 'white';
    videoContext.font = '14px "Press Start 2P"';
    videoContext.textAlign = 'center';
    videoContext.fillText(this.levelName, width / 2, height * 0.4);

    // Draw progress bar background with rounded corners
    const barWidth = width * 0.7;
    const barHeight = 15;
    const barX = (width - barWidth) / 2;
    const barY = height * 0.6;
    const cornerRadius = 7;

    videoContext.fillStyle = this.barBackgroundColor;
    this.roundedRect(videoContext, barX, barY, barWidth, barHeight, cornerRadius);

    // Draw progress bar with rounded corners
    const progressWidth = barWidth * (this.progress.percentage / 100);

    if (progressWidth > 0) {
      videoContext.fillStyle = this.barColor;
      this.roundedRect(videoContext, barX, barY, progressWidth, barHeight, cornerRadius);

      // Draw shiny effect on the progress bar
      if (this.showShinyEffect) {
        const gradient = videoContext.createLinearGradient(barX, barY, barX + progressWidth, barY);

        const time = (now % 2000) / 2000;
        const position = time * (1 + 0.2); // Allow the shine to go slightly off the bar

        gradient.addColorStop(Math.max(0, position - 0.2), 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(Math.min(1, position), 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(Math.min(1, position + 0.2), 'rgba(255, 255, 255, 0)');

        videoContext.fillStyle = gradient;
        this.roundedRect(videoContext, barX, barY, progressWidth, barHeight, cornerRadius);
      }
    }

    // Draw bouncing Mario next to the progress bar
    const marioX = barX + progressWidth;
    const marioY = barY - this.bouncingMario.y;

    // Only draw if progress bar has moved
    if (progressWidth > 10) {
      this.drawMario(videoContext, marioX, marioY, 10);
    }

    // Draw progress text
    videoContext.fillStyle = this.textColor;
    videoContext.font = '10px "Press Start 2P"';
    videoContext.textAlign = 'center';

    const loadingText = `${this.loadingText} ${this.progress.percentage}%`;
    videoContext.fillText(loadingText, width / 2, barY + barHeight + 20);

    const assetsText = `${this.progress.loaded}/${this.progress.total} ASSETS LOADED`;
    videoContext.fillText(assetsText, width / 2, barY + barHeight + 40);

    // Reset global alpha
    videoContext.globalAlpha = 1;
  }

  /**
   * Draw a rectangle with rounded corners
   * @param ctx Canvas context
   * @param x X position
   * @param y Y position
   * @param width Width
   * @param height Height
   * @param radius Corner radius
   */
  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Update the loading scene
   */
  override update(): void {
    // Calculate delta time since last update
    const now = performance.now();
    this.lastUpdate = now;

    // Any animation updates can go here if needed
  }
}
