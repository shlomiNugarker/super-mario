import { Listener, EventCallback } from '../types/common';

/**
 * Event emitter for handling event-based communication
 */
export default class EventEmitter {
  private listeners: Listener[];

  constructor() {
    this.listeners = [];
  }

  /**
   * Listen for an event
   * @param name Event name (string or symbol)
   * @param callback Callback function
   */
  listen(name: string | symbol, callback: EventCallback): void {
    const listener: Listener = { name, callback, count: Infinity };
    this.listeners.push(listener);
  }

  /**
   * Emit an event
   * @param name Event name (string or symbol)
   * @param args Arguments to pass to the callback
   */
  emit(name: string | symbol, ...args: unknown[]): void {
    this.listeners.forEach((listener) => {
      if (listener.name === name) {
        listener.callback(...args);
      }
    });
  }

  /**
   * Process an event with a callback
   * Used by the Trait class
   * @param name Event name
   * @param callback Callback to process
   */
  process(_name: string | symbol, callback: EventCallback): void {
    callback();
  }
}
