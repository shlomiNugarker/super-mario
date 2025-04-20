interface BufferedEvent {
  name: string;
  args: any[];
}

export default class EventBuffer {
  private events: BufferedEvent[];

  constructor() {
    this.events = [];
  }

  emit(name: string, ...args: any[]): void {
    const event: BufferedEvent = { name, args };
    this.events.push(event);
  }

  process(name: string, callback: (...args: any[]) => void): void {
    this.events.forEach((event) => {
      if (event.name === name) {
        callback(...event.args);
      }
    });
  }

  clear(): void {
    this.events.length = 0;
  }
}
