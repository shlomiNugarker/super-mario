import { Vec2 } from './math.ts';
import AudioBoard from './AudioBoard.ts';
import BoundingBox from './BoundingBox.ts';
import EventBuffer from './EventBuffer.ts';
import Trait, { Entity as TraitEntity } from './Trait.ts';

export interface EntityLike {
  bounds: BoundingBox;
}

export const Align = {
  center(target: EntityLike, subject: EntityLike): void {
    subject.bounds.setCenter(target.bounds.getCenter());
  },

  bottom(target: EntityLike, subject: EntityLike): void {
    subject.bounds.bottom = target.bounds.bottom;
  },

  top(target: EntityLike, subject: EntityLike): void {
    subject.bounds.top = target.bounds.top;
  },

  left(target: EntityLike, subject: EntityLike): void {
    subject.bounds.left = target.bounds.left;
  },

  right(target: EntityLike, subject: EntityLike): void {
    subject.bounds.right = target.bounds.right;
  },
};

export const Sides = {
  TOP: Symbol('top'),
  BOTTOM: Symbol('bottom'),
  LEFT: Symbol('left'),
  RIGHT: Symbol('right'),
};

export default class Entity implements TraitEntity, EntityLike {
  id: string | null;
  audio: AudioBoard;
  events: EventBuffer;
  sounds: Set<string>;
  pos: Vec2;
  vel: Vec2;
  size: Vec2;
  offset: Vec2;
  bounds: BoundingBox;
  lifetime: number;
  traits: Map<Function, Trait>;

  constructor() {
    this.id = null;
    this.audio = new AudioBoard();
    this.events = new EventBuffer();
    this.sounds = new Set();

    this.pos = new Vec2(0, 0);
    this.vel = new Vec2(0, 0);
    this.size = new Vec2(0, 0);
    this.offset = new Vec2(0, 0);
    this.bounds = new BoundingBox(this.pos, this.size, this.offset);
    this.lifetime = 0;

    this.traits = new Map();
  }

  addTrait(trait: Trait): void {
    this.traits.set(trait.constructor, trait);
  }

  collides(candidate: Entity): void {
    this.traits.forEach((trait) => {
      trait.collides(this, candidate);
    });
  }

  obstruct(side: Symbol, match: any): void {
    this.traits.forEach((trait) => {
      trait.obstruct(this, side, match);
    });
  }

  finalize(): void {
    this.events.emit(Trait.EVENT_TASK, this);

    this.traits.forEach((trait) => {
      trait.finalize(this);
    });

    this.events.clear();
  }

  playSounds(audioBoard: AudioBoard, audioContext: AudioContext): void {
    this.sounds.forEach((name) => {
      audioBoard.playAudio(name, audioContext);
    });

    this.sounds.clear();
  }

  update(gameContext: any, level: any): void {
    this.traits.forEach((trait) => {
      trait.update(this, gameContext, level);
    });

    this.playSounds(this.audio, gameContext.audioContext);

    this.lifetime += gameContext.deltaTime;
  }
}
