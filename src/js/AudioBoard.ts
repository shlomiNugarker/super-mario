/**
 * Options for playing audio
 */
interface AudioPlayOptions {
  /** Volume from 0 to 1 (default: 1) */
  volume?: number;

  /** Playback rate (default: 1) */
  rate?: number;

  /** Whether to loop the audio (default: false) */
  loop?: boolean;

  /** When to start playing in seconds (default: 0) */
  startTime?: number;

  /** Custom audio node to connect to instead of destination */
  destination?: AudioNode;
}

/**
 * Manages a collection of audio buffers and provides methods to play them
 */
export default class AudioBoard {
  /** Map of audio buffer names to their buffers */
  private buffers: Map<string, AudioBuffer>;

  /** Currently active audio sources */
  private activeSources: Map<string, AudioBufferSourceNode[]>;

  /** Optional master volume node */
  private masterVolume: GainNode | null = null;

  /**
   * Create a new audio board
   */
  constructor() {
    this.buffers = new Map();
    this.activeSources = new Map();
  }

  /**
   * Add an audio buffer to the board
   * @param name Identifier for the buffer
   * @param buffer The audio buffer
   */
  addAudio(name: string, buffer: AudioBuffer): void {
    this.buffers.set(name, buffer);
  }

  /**
   * Initialize the audio board with a context
   * @param context The audio context
   */
  init(context: AudioContext): void {
    // Create master volume if it doesn't exist
    if (!this.masterVolume) {
      this.masterVolume = context.createGain();
      this.masterVolume.connect(context.destination);
      this.masterVolume.gain.value = 1;
    }
  }

  /**
   * Set the master volume for all sounds
   * @param context The audio context
   * @param volume Volume from 0 to 1
   */
  setMasterVolume(context: AudioContext, volume: number): void {
    if (!this.masterVolume) {
      this.init(context);
    }

    if (this.masterVolume) {
      const safeVolume = Math.max(0, Math.min(1, volume));
      this.masterVolume.gain.value = safeVolume;
    }
  }

  /**
   * Get the master volume
   * @returns The current master volume or 1 if not initialized
   */
  getMasterVolume(): number {
    return this.masterVolume?.gain.value ?? 1;
  }

  /**
   * Play an audio buffer by name
   * @param name Name of the audio buffer to play
   * @param context Audio context to use
   * @param options Playback options
   * @returns The created audio source node or null if buffer not found
   */
  playAudio(
    name: string,
    context: AudioContext,
    options: AudioPlayOptions = {}
  ): AudioBufferSourceNode | null {
    const buffer = this.buffers.get(name);

    if (!buffer) {
      console.warn(`Audio buffer not found: ${name}`);
      return null;
    }

    // Ensure master volume is initialized
    if (!this.masterVolume) {
      this.init(context);
    }

    // Create source
    const source = context.createBufferSource();

    // Set buffer and playback options
    source.buffer = buffer;
    source.loop = options.loop ?? false;

    if (options.rate !== undefined) {
      source.playbackRate.value = options.rate;
    }

    // Create gain node for individual volume control
    const gainNode = context.createGain();
    gainNode.gain.value = options.volume ?? 1;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(options.destination ?? this.masterVolume ?? context.destination);

    // Start the source
    const startTime = options.startTime ?? 0;
    source.start(startTime);

    // Store active source for potential stopping later
    if (!this.activeSources.has(name)) {
      this.activeSources.set(name, []);
    }
    this.activeSources.get(name)!.push(source);

    // Clean up when source ends
    source.onended = () => {
      const sources = this.activeSources.get(name);
      if (sources) {
        const index = sources.indexOf(source);
        if (index !== -1) {
          sources.splice(index, 1);
        }

        if (sources.length === 0) {
          this.activeSources.delete(name);
        }
      }
    };

    return source;
  }

  /**
   * Stop all instances of a sound
   * @param name Name of the sound to stop
   */
  stopAudio(name: string): void {
    const sources = this.activeSources.get(name);
    if (sources) {
      sources.forEach((source) => {
        source.stop();
      });
      this.activeSources.delete(name);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.activeSources.forEach((sources) => {
      sources.forEach((source) => {
        source.stop();
      });
    });
    this.activeSources.clear();
  }

  /**
   * Check if a sound is currently playing
   * @param name Name of the sound
   * @returns True if the sound is playing
   */
  isPlaying(name: string): boolean {
    const sources = this.activeSources.get(name);
    return sources !== undefined && sources.length > 0;
  }

  /**
   * Check if an audio buffer exists
   * @param name Name of the buffer
   * @returns True if the buffer exists
   */
  hasAudio(name: string): boolean {
    return this.buffers.has(name);
  }

  /**
   * Get all available audio names
   * @returns Array of audio names
   */
  getAudioNames(): string[] {
    return Array.from(this.buffers.keys());
  }
}
