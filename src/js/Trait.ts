export interface Listener {
  name: symbol | string;
  callback: Function;
  count: number;
}

export interface Entity {
  events: {
    process(name: symbol | string, callback: Function): void;
  };
}

export default class Trait {
  static EVENT_TASK = Symbol('task');
  protected listeners: Listener[];

  constructor() {
    this.listeners = [];
  }

  listen(name: symbol | string, callback: Function, count = Infinity) {
    const listener: Listener = { name, callback, count };
    this.listeners.push(listener);
  }

  finalize(entity: Entity) {
    this.listeners = this.listeners.filter((listener) => {
      entity.events.process(listener.name, listener.callback);
      return --listener.count;
    });
  }

  queue(task: Function) {
    this.listen(Trait.EVENT_TASK, task, 1);
  }

  collides(us: Entity, them: Entity) {
    // Method implementation to be provided in subclasses
  }

  obstruct(entity: Entity, side: symbol, match: any) {
    // Method implementation to be provided in subclasses
  }

  update(entity: Entity, gameContext: any, level: any) {
    // Method implementation to be provided in subclasses
  }
}
