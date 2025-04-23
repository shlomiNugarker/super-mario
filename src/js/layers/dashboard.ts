import Player from '../traits/Player.ts';
import LevelTimer from '../traits/LevelTimer.ts';
import Entity from '../Entity.ts';

interface Font {
  size: number;
  print(text: string, context: CanvasRenderingContext2D, x: number, y: number): void;
}

export function createDashboardLayer(font: Font, entity: Entity) {
  const LINE1 = font.size * 2;
  const LINE2 = font.size * 3;

  return function drawDashboard(context: CanvasRenderingContext2D) {
    const playerTrait = entity.traits.get(Player) as Player;
    const timerTrait = entity.traits.get(LevelTimer) as LevelTimer;

    font.print(playerTrait.name, context, 24, LINE1);
    font.print(playerTrait.score.toString().padStart(6, '0'), context, 24, LINE2);

    font.print('×' + playerTrait.coins.toString().padStart(2, '0'), context, 96, LINE2);

    font.print('WORLD', context, 144, LINE1);
    font.print(playerTrait.world, context, 152, LINE2);

    font.print('TIME', context, 200, LINE1);
    font.print(timerTrait.currentTime.toFixed().toString().padStart(3, '0'), context, 208, LINE2);
  };
}
