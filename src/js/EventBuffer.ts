import { EventCallback } from '../types/common';

/**
 * Represents a buffered event with a name and arguments
 */
interface BufferedEvent {
  /** Event name (string or symbol) */
  name: string | symbol;

  /** Event arguments */
  args: unknown[];

  /** Optional timestamp when the event was created */
  timestamp?: number;
}

/**
 * Buffered event system that stores events for later processing
 * Useful for deferred event handling and event aggregation
 */
export default class EventBuffer {
  /** Array of buffered events */
  private events: BufferedEvent[];

  /** Optional event listeners map */
  private listeners: Map<string | symbol, EventCallback[]>;

  /** Whether to add timestamps to events */
  private timestampEvents: boolean;

  /**
   * Create a new event buffer
   * @param timestampEvents Whether to add timestamps to events (default: false)
   */
  constructor(timestampEvents = false) {
    this.events = [];
    this.listeners = new Map();
    this.timestampEvents = timestampEvents;
  }

  /**
   * Emit an event to be buffered
   * @param name Event name
   * @param args Event arguments
   */
  emit(name: string | symbol, ...args: unknown[]): void {
    const event: BufferedEvent = {
      name,
      args,
      ...(this.timestampEvents && { timestamp: performance.now() }),
    };
    this.events.push(event);

    // If there are immediate listeners, call them
    const callbacks = this.listeners.get(name);
    if (callbacks) {
      for (const callback of callbacks) {
        callback(...args);
      }
    }
  }

  /**
   * Process events with the given name
   * @param name Event name to process
   * @param callback Callback to execute for matching events
   */
  process(name: string | symbol, callback: EventCallback): void {
    for (const event of this.events) {
      if (event.name === name) {
        callback(...event.args);
      }
    }
  }

  /**
   * Add an event listener that will be called immediately when events are emitted
   * @param name Event name to listen for
   * @param callback Callback to execute when event is emitted
   */
  on(name: string | symbol, callback: EventCallback): void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name)!.push(callback);
  }

  /**
   * Remove an event listener
   * @param name Event name
   * @param callback Callback to remove
   * @returns True if the callback was removed
   */
  off(name: string | symbol, callback: EventCallback): boolean {
    const callbacks = this.listeners.get(name);
    if (!callbacks) {
      return false;
    }

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Check if the buffer has events with the given name
   * @param name Event name to check
   * @returns True if events with the name exist
   */
  has(name: string | symbol): boolean {
    return this.events.some((event) => event.name === name);
  }

  /**
   * Get the count of events with the given name
   * @param name Event name to count
   * @returns Number of events with the name
   */
  count(name: string | symbol): number {
    return this.events.filter((event) => event.name === name).length;
  }

  /**
   * Clear all buffered events
   */
  clear(): void {
    this.events.length = 0;
  }

  /**
   * Clear all events with the given name
   * @param name Event name to clear
   * @returns Number of events cleared
   */
  clearByName(name: string | symbol): number {
    const initialLength = this.events.length;
    this.events = this.events.filter((event) => event.name !== name);
    return initialLength - this.events.length;
  }

  /**
   * Get all buffered events
   * @returns Array of buffered events
   */
  getAllEvents(): BufferedEvent[] {
    return [...this.events];
  }
}
