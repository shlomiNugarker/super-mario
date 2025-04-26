import { loadGoombaBrown, loadGoombaBlue } from './entities/Goomba.ts';
import { loadKoopaGreen, loadKoopaBlue } from './entities/Koopa.ts';
import { loadPiranhaPlant } from './entities/PiranhaPlant.ts';
import { loadBullet } from './entities/Bullet.ts';
import { loadCannon } from './entities/Cannon.ts';
import { loadBrickShrapnel } from './entities/BrickShrapnel.ts';
import { loadPipePortal } from './entities/PipePortal.ts';
import { loadFlagPole } from './entities/FlagPole.ts';
import { loadMario } from './entities/Mario.ts';
import { EntityFactories } from '../types/common';
import Entity from './Entity.ts';

// Local version of EntityFactory that works with our Entity type
type EntityFactory = (props?: Record<string, any>) => Entity;

/**
 * Create an entity pool for efficiency
 * @param size Pool size
 * @returns Factory function that reuses entities
 */
function createPool(size: number) {
  const pool: Entity[] = [];

  return function createPooledFactory(factory: EntityFactory): EntityFactory {
    for (let i = 0; i < size; i++) {
      pool.push(factory());
    }

    let count = 0;
    return function pooledFactory(props?: Record<string, any>): Entity {
      const entity = pool[count++ % pool.length];
      entity.lifetime = 0;

      // Apply any props that were passed
      if (props) {
        Object.entries(props).forEach(([key, value]) => {
          // @ts-expect-error - Dynamic property assignment
          entity[key] = value;
        });
      }

      return entity;
    };
  };
}

/**
 * Load all entity factories
 * @param audioContext Audio context
 * @returns Promise<EntityFactories>
 */
export async function loadEntities(audioContext: AudioContext): Promise<EntityFactories> {
  // Initialize with required properties to satisfy TypeScript
  const entityFactories: Partial<EntityFactories> = {
    mario: undefined as any,
    goomba: undefined as any,
    koopa: undefined as any,
    piranha: undefined as any,
    flagpole: undefined as any,
    bullet: undefined as any,
    cannon: undefined as any,
  };

  // Wrapper for entity loaders
  function setup(loader: (context: AudioContext) => Promise<any>): Promise<EntityFactory> {
    return loader(audioContext).then((factory) => {
      // Convert any entity factory to a standard EntityFactory
      return ((props?: Record<string, any>) => {
        try {
          return factory(props);
        } catch (err) {
          console.error('Entity factory error:', err);
          throw err;
        }
      }) as EntityFactory;
    });
  }

  function addAs(name: string) {
    return function addFactory(factory: EntityFactory): void {
      entityFactories[name] = factory as any;
    };
  }

  await Promise.all([
    setup(loadMario).then(addAs('mario')),
    setup(loadPiranhaPlant).then(addAs('piranha')),
    setup(loadGoombaBrown).then(addAs('goomba-brown')),
    setup(loadGoombaBlue).then(addAs('goomba-blue')),
    setup(loadKoopaGreen).then(addAs('koopa-green')),
    setup(loadKoopaBlue).then(addAs('koopa-blue')),
    setup(loadBullet).then(addAs('bullet')),
    setup(loadCannon).then(addAs('cannon')),
    setup(loadPipePortal).then(addAs('pipe-portal')),
    setup(loadFlagPole).then(addAs('flagpole')),
    setup(loadBrickShrapnel).then(createPool(8)).then(addAs('brickShrapnel')),
  ]);

  return entityFactories as EntityFactories;
}
