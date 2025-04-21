import { loadJSON } from '../loaders.ts';
import MusicPlayer from '../MusicPlayer.ts';

interface MusicTrack {
  url: string;
}

interface MusicSheet {
  [trackName: string]: MusicTrack;
}

export function loadMusicSheet(name: string): Promise<MusicPlayer> {
  return loadJSON(`/music/${name}.json`).then((musicSheet: MusicSheet) => {
    const musicPlayer = new MusicPlayer();
    for (const [name, track] of Object.entries(musicSheet)) {
      musicPlayer.addTrack(name, track.url);
    }
    return musicPlayer;
  });
}
