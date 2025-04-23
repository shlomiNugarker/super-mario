const PRESSED = 1;
const RELEASED = 0;

type KeyState = typeof PRESSED | typeof RELEASED;
type KeyCallback = (keyState: KeyState) => void;

export default class KeyboardState {
  private keyStates: Map<string, KeyState>;
  private keyMap: Map<string, KeyCallback>;
  private blocked: boolean;

  constructor() {
    // Holds the current state of a given key
    this.keyStates = new Map();

    // Holds the callback functions for a key code
    this.keyMap = new Map();

    // Used to block input when needed
    this.blocked = false;
  }

  addMapping(code: string, callback: KeyCallback): void {
    this.keyMap.set(code, callback);
  }

  handleEvent(event: KeyboardEvent): void {
    if (this.blocked) {
      return;
    }

    const { code } = event;

    if (!this.keyMap.has(code)) {
      // Did not have key mapped.
      return;
    }

    event.preventDefault();

    const keyState = event.type === 'keydown' ? PRESSED : RELEASED;

    if (this.keyStates.get(code) === keyState) {
      return;
    }

    this.keyStates.set(code, keyState);
    console.log(`Key ${code} ${keyState === PRESSED ? 'pressed' : 'released'}`);

    const callback = this.keyMap.get(code);
    if (callback) {
      callback(keyState);
    }
  }

  listenTo(window: Window): void {
    ['keydown', 'keyup'].forEach((eventName) => {
      window.addEventListener(eventName, (event) => {
        this.handleEvent(event as KeyboardEvent);
      });
    });

    // Also clear key states when the window loses focus
    window.addEventListener('blur', () => {
      this.resetAllKeys();
    });
  }

  // Reset all key states to RELEASED
  resetAllKeys(): void {
    const keys = [...this.keyStates.keys()];
    keys.forEach((code) => {
      if (this.keyStates.get(code) === PRESSED) {
        this.keyStates.set(code, RELEASED);
        const callback = this.keyMap.get(code);
        if (callback) {
          callback(RELEASED);
        }
      }
    });
  }

  // Block input processing
  block(): void {
    this.blocked = true;
  }

  // Unblock input processing
  unblock(): void {
    this.blocked = false;
  }
}
