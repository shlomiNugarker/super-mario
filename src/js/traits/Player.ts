import Trait from "../Trait.ts";
import Stomper from "./Stomper.ts";

const COIN_LIFE_THRESHOLD = 100;

export default class Player extends Trait {
  name: string;
  world: string;
  coins: number;
  lives: number;
  score: number;

  constructor() {
    super();
    this.name = "UNNAMED";
    this.world = "UNKNOWN";
    this.coins = 0;
    this.lives = 3;
    this.score = 0;

    this.listen(Stomper.EVENT_STOMP, () => {
      this.score += 100;
      console.log("Score", this.score);
    });
  }

  addCoins(count: number): void {
    this.coins += count;
    this.queue((entity: any) => entity.sounds.add("coin"));
    while (this.coins >= COIN_LIFE_THRESHOLD) {
      this.addLives(1);
      this.coins -= COIN_LIFE_THRESHOLD;
    }
  }

  addLives(count: number): void {
    this.lives += count;
  }
}
