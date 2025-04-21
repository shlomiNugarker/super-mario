import { loadGoombaBrown, loadGoombaBlue } from './entities/Goomba.ts';
import { loadKoopaGreen, loadKoopaBlue } from './entities/Koopa.ts';
import { loadPiranhaPlant } from './entities/PiranhaPlant.ts';
import { loadBullet } from './entities/Bullet.ts';
import { loadCannon } from './entities/Cannon.ts';
import { loadBrickShrapnel } from './entities/BrickShrapnel.ts';
import { loadPipePortal } from './entities/PipePortal.js';
import { loadFlagPole } from './entities/FlagPole.ts';
import { loadMario } from './entities/Mario.ts';

// Define entity type interfaces
interface Entity {
  lifetime: number;
  [key: string]: any;
}

type EntityFactory = () => Entity;
type EntityFactories = Record<string, EntityFactory>;

function createPool(size: number) {
  const pool: Entity[] = [];

  return function createPooledFactory(factory: EntityFactory): EntityFactory {
    for (let i = 0; i < size; i++) {
      pool.push(factory());
    }

    let count = 0;
    return function pooledFactory(): Entity {
      const entity = pool[count++ % pool.length];
      entity.lifetime = 0;
      return entity;
    };
  };
}

export async function loadEntities(audioContext: AudioContext): Promise<EntityFactories> {
  const entityFactories: EntityFactories = {};

  function setup(loader: (context: AudioContext) => Promise<EntityFactory>) {
    return loader(audioContext);
  }

  function addAs(name: string) {
    return function addFactory(factory: EntityFactory): void {
      entityFactories[name] = factory;
    };
  }

  await Promise.all([
    setup(loadMario).then(addAs('mario')),
    setup(loadPiranhaPlant).then(addAs('piranha-plant')),
    setup(loadGoombaBrown).then(addAs('goomba-brown')),
    setup(loadGoombaBlue).then(addAs('goomba-blue')),
    setup(loadKoopaGreen).then(addAs('koopa-green')),
    setup(loadKoopaBlue).then(addAs('koopa-blue')),
    setup(loadBullet).then(addAs('bullet')),
    setup(loadCannon).then(addAs('cannon')),
    setup(loadPipePortal).then(addAs('pipe-portal')),
    setup(loadFlagPole).then(addAs('flag-pole')),
    setup(loadBrickShrapnel).then(createPool(8)).then(addAs('brickShrapnel')),
  ]);

  return entityFactories;
}
