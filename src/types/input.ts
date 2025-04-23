/**
 * Input event names
 */
export const InputEventTypes = {
  PRESS: Symbol('press'),
  RELEASE: Symbol('release'),
  HOLD: Symbol('hold'),
};

/**
 * Input event data
 */
export interface InputEvent {
  name: symbol;
  type: symbol;
  [key: string]: unknown;
}

/**
 * Input receiver interface
 */
export interface InputReceiver {
  receive(inputEvent: InputEvent): void;
}

/**
 * Keyboard mapping
 */
export interface KeyMapping {
  [key: string]: string[];
}

/**
 * Keyboard state
 */
export interface KeyState {
  active: boolean;
  duration: number;
}

/**
 * Input handler
 */
export interface InputHandler {
  addMapping(code: string, callback: (keyState: KeyState) => void): void;
  addReceivers(...receivers: InputReceiver[]): void;
  removeReceivers(...receivers: InputReceiver[]): void;
  processInput(window: Window): void;
}
