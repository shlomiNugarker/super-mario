type AudioPlayer = {
  playTrack(trackName: string): {
    playbackRate: number;
    loop: boolean;
    addEventListener(event: string, listener: () => void, options?: { once: boolean }): void;
  };
  pauseAll(): void;
};

export default class MusicController<T extends AudioPlayer> {
  private player: T | null;

  constructor() {
    this.player = null;
  }

  setPlayer(player: T) {
    this.player = player;
  }

  playTheme(speed: number = 1) {
    if (!this.player) return;

    const audio = this.player.playTrack('main');
    audio.playbackRate = speed;
  }

  playHurryTheme() {
    if (!this.player) return;

    const audio = this.player.playTrack('hurry');
    audio.loop = false;
    audio.addEventListener(
      'ended',
      () => {
        this.playTheme(1.3);
      },
      { once: true }
    );
  }

  pause() {
    if (!this.player) return;

    this.player.pauseAll();
  }
}
