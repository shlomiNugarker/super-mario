export default class MusicPlayer {
  private tracks: Map<string, HTMLAudioElement>;

  constructor() {
    this.tracks = new Map();
  }

  addTrack(name: string, url: string): void {
    const audio = new Audio();
    audio.loop = true;
    audio.src = url;
    this.tracks.set(name, audio);
  }

  playTrack(name: string): HTMLAudioElement {
    this.pauseAll();
    const audio = this.tracks.get(name);
    if (!audio) {
      throw new Error(`Track "${name}" not found`);
    }
    audio.play();
    return audio;
  }

  pauseAll(): void {
    for (const audio of this.tracks.values()) {
      audio.pause();
    }
  }
}
