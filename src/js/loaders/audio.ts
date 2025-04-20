import AudioBoard from "../AudioBoard.ts";
import { loadJSON } from "../loaders.js";

export function loadAudioBoard(
  name: string,
  audioContext: AudioContext
): Promise<AudioBoard> {
  const loadAudio = createAudioLoader(audioContext);
  return loadJSON(`/sounds/${name}.json`).then(
    (audioSheet: { fx: Record<string, { url: string }> }) => {
      const audioBoard = new AudioBoard();
      const fx = audioSheet.fx;
      return Promise.all(
        Object.keys(fx).map((name) => {
          return loadAudio(fx[name].url).then((buffer) => {
            audioBoard.addAudio(name, buffer);
          });
        })
      ).then(() => {
        return audioBoard;
      });
    }
  );
}

export function createAudioLoader(context: AudioContext) {
  return function loadAudio(url: string): Promise<AudioBuffer> {
    return fetch(url)
      .then((response) => {
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => {
        return context.decodeAudioData(arrayBuffer);
      });
  };
}
