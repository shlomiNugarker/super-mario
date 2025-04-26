import Trait from '../Trait.ts';
import Entity from '../Entity.ts';
import { LEVEL_TIMER_TOTAL, LEVEL_TIMER_HURRY, LEVEL_TIMER_DECREMENT_RATE } from '../config.ts';

const MARK = Symbol('level timer earmark');

export default class LevelTimer extends Trait {
  static EVENT_TIMER_HURRY = Symbol('timer hurry');
  static EVENT_TIMER_OK = Symbol('timer ok');

  totalTime: number;
  currentTime: number;
  hurryTime: number;
  hurryEmitted: boolean | null;

  constructor() {
    super();
    this.totalTime = LEVEL_TIMER_TOTAL;
    this.currentTime = this.totalTime;
    this.hurryTime = LEVEL_TIMER_HURRY;
    this.hurryEmitted = null;
  }

  reset(): void {
    this.currentTime = this.totalTime;
  }

  update(_entity: Entity, { deltaTime }: { deltaTime: number }, level: any): void {
    this.currentTime -= deltaTime * LEVEL_TIMER_DECREMENT_RATE;

    if (!level[MARK]) {
      this.hurryEmitted = null;
    }

    if (this.hurryEmitted !== true && this.currentTime < this.hurryTime) {
      level.events.emit(LevelTimer.EVENT_TIMER_HURRY);
      this.hurryEmitted = true;
    }
    if (this.hurryEmitted !== false && this.currentTime > this.hurryTime) {
      level.events.emit(LevelTimer.EVENT_TIMER_OK);
      this.hurryEmitted = false;
    }

    level[MARK] = true;
  }
}
