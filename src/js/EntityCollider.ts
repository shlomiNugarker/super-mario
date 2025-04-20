interface Bounds {
  overlaps(bounds: Bounds): boolean;
}

interface Entity {
  bounds: Bounds;
  collides(entity: Entity): void;
}

export default class EntityCollider {
  private entities: Entity[];

  constructor(entities: Entity[]) {
    this.entities = entities;
  }

  check(subject: Entity): void {
    this.entities.forEach((candidate) => {
      if (subject === candidate) {
        return;
      }

      if (subject.bounds.overlaps(candidate.bounds)) {
        subject.collides(candidate);
      }
    });
  }
}
