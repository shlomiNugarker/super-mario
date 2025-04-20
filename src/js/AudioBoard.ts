export default class AudioBoard {
  private buffers: Map<string, AudioBuffer>;

  constructor() {
    this.buffers = new Map();
  }

  addAudio(name: string, buffer: AudioBuffer): void {
    this.buffers.set(name, buffer);
  }

  playAudio(name: string, context: AudioContext): void {
    const source = context.createBufferSource();
    source.connect(context.destination);
    const buffer = this.buffers.get(name);
    if (buffer) {
      source.buffer = buffer;
      source.start(0);
    } else {
      console.warn(`Audio buffer not found: ${name}`);
    }
  }
}
