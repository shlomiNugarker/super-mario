import { Listener, GameContext, MatchTile, EventCallback } from '../types/common';
import { ITraitEntity } from '../types/entity';
import Level from './Level';

export interface EventEmitter {
  process(name: symbol | string, callback: EventCallback): void;
}

/**
 * Base trait class that all entity traits extend
 */
export default class Trait {
  static EVENT_TASK = Symbol('task');
  protected listeners: Listener[];

  constructor() {
    this.listeners = [];
  }

  /**
   * Listen for an event
   * @param name Event name
   * @param callback Callback to execute
   * @param count Number of times to execute callback (default: Infinity)
   */
  listen(name: symbol | string, callback: EventCallback, count = Infinity): void {
    const listener: Listener = { name, callback, count };
    this.listeners.push(listener);
  }

  /**
   * Process listeners and clean up ones that have executed their max count
   * @param entity Entity to process listeners for
   */
  finalize(entity: ITraitEntity): void {
    this.listeners = this.listeners.filter((listener) => {
      entity.events.process(listener.name, listener.callback);
      return --listener.count;
    });
  }

  /**
   * Queue a task to be executed once
   * @param task Task to execute
   */
  queue(task: EventCallback): void {
    this.listen(Trait.EVENT_TASK, task, 1);
  }

  /**
   * Handle collision with another entity
   * @param us Our entity
   * @param them Other entity
   * @virtual
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collides(us: ITraitEntity, them: ITraitEntity): void {
    // Method implementation to be provided in subclasses
  }

  /**
   * Handle obstruction from tiles
   * @param entity Entity that was obstructed
   * @param side Side of obstruction
   * @param match Matching tile
   * @virtual
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  obstruct(entity: ITraitEntity, side: symbol, match: MatchTile): void {
    // Method implementation to be provided in subclasses
  }

  /**
   * Update trait state
   * @param entity Entity with this trait
   * @param gameContext Game context
   * @param level Level
   * @virtual
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(entity: ITraitEntity, gameContext: GameContext, level: Level): void {
    // Method implementation to be provided in subclasses
  }
}
