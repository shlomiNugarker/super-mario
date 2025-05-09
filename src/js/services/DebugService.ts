import { RUNTIME_CONFIG } from '../config';

/**
 * Service for debugging the game
 */
export default class DebugService {
  private static instance: DebugService;
  private debugElements: Map<string, HTMLElement>;
  private container: HTMLElement | null;
  private debugValues: Map<string, any>;

  private constructor() {
    this.debugElements = new Map();
    this.debugValues = new Map();
    this.container = null;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DebugService {
    if (!DebugService.instance) {
      DebugService.instance = new DebugService();
    }
    return DebugService.instance;
  }

  /**
   * Initialize the debug service
   */
  public init(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.top = '10px';
    this.container.style.right = '10px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.container.style.color = 'white';
    this.container.style.padding = '10px';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '12px';
    this.container.style.zIndex = '1000';
    this.container.style.display = RUNTIME_CONFIG.debugEnabled ? 'block' : 'none';

    document.body.appendChild(this.container);
  }

  /**
   * Set a debug value
   * @param key Debug key
   * @param value Debug value
   */
  public set(key: string, value: any): void {
    if (!this.container) this.init();
    if (!RUNTIME_CONFIG.debugEnabled) return;

    // Store the value
    this.debugValues.set(key, value);

    let element = this.debugElements.get(key);
    if (!element) {
      element = document.createElement('div');
      element.dataset.key = key;
      this.container?.appendChild(element);
      this.debugElements.set(key, element);
    }

    element.textContent = `${key}: ${value}`;
  }

  /**
   * Toggle debug mode
   */
  public toggle(): void {
    RUNTIME_CONFIG.debugEnabled = !RUNTIME_CONFIG.debugEnabled;
    if (this.container) {
      this.container.style.display = RUNTIME_CONFIG.debugEnabled ? 'block' : 'none';
    }
  }

  /**
   * Clear all debug values
   */
  public clear(): void {
    this.debugElements.clear();
    this.debugValues.clear();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Check if debug mode is enabled
   * @returns True if debug mode is enabled
   */
  public isEnabled(): boolean {
    return RUNTIME_CONFIG.debugEnabled;
  }

  /**
   * Get all debug values
   * @returns Map of all debug values
   */
  public getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    this.debugValues.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
