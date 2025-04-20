interface Listener {
  name: string;
  callback: (...args: any[]) => void;
}

export default class EventEmitter {
  private listeners: Listener[];

  constructor() {
    this.listeners = [];
  }

  listen(name: string, callback: (...args: any[]) => void): void {
    const listener: Listener = { name, callback };
    this.listeners.push(listener);
  }

  emit(name: string, ...args: any[]): void {
    this.listeners.forEach((listener) => {
      if (listener.name === name) {
        listener.callback(...args);
      }
    });
  }
}
