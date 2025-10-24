import type { MuxOptions } from '@mux/mux-data-react-native-video';

export enum PlayerEvent {
  Seek = 'seek',
  Step = 'step',
  Restarted = 'restarted',
  StateChanged = 'stateChanged',
}

export interface PlayerState {
  position: number;
  duration: number;
  isPaused: boolean;
  isFinished: boolean;
  isBuffering: boolean;
  isScrubbing: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  isReady: boolean;
}

export interface VideoMetadata {
  title: string;
  thumbnail?: string;
  creator?: string;
  description?: string;
}

export interface VideoSource {
  getUrl: () => string;
  hasVideo: () => boolean;
}

export interface VideoSourceOptions {
  metadata?: VideoMetadata;
  startTime?: number;
  muxData?: MuxOptions;
}

type StateListener = (state: PlayerState) => void;
type EventListener = (event: PlayerEvent, data?: unknown) => void;

export class AVPlayerManager {
  private static readonly DEFAULT_STEP_TIME = 10; // seconds

  private state: PlayerState = {
    position: 0,
    duration: 0,
    isPaused: true,
    isFinished: false,
    isBuffering: false,
    isScrubbing: false,
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    isReady: false,
  };

  private stateListeners: Set<StateListener> = new Set();
  private eventListeners: Map<PlayerEvent, Set<EventListener>> = new Map();

  private _sourceUrl: string | null = null;
  private _metadata: VideoMetadata | null = null;

  // Subscribe to state changes
  subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // Subscribe to specific events
  on(event: PlayerEvent, listener: EventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  // Get current state (immutable)
  getState(): Readonly<PlayerState> {
    return { ...this.state };
  }

  // Private method to update state and notify listeners
  private updateState(updates: Partial<PlayerState>): void {
    const hasChanges = Object.keys(updates).some(key => this.state[key as keyof PlayerState] !== updates[key as keyof PlayerState]);

    if (!hasChanges) return;

    this.state = { ...this.state, ...updates };
    this.notifyStateListeners();
  }

  private notifyStateListeners(): void {
    const currentState = this.getState();
    this.stateListeners.forEach(listener => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  private emit(event: PlayerEvent, data?: unknown): void {
    this.eventListeners.get(event)?.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // Getters for convenience
  get isPaused(): boolean {
    return this.state.isPaused;
  }

  get isFinished(): boolean {
    return this.state.isFinished;
  }

  get isBuffering(): boolean {
    return this.state.isBuffering;
  }

  get isScrubbing(): boolean {
    return this.state.isScrubbing;
  }

  get playbackRate(): number {
    return this.state.playbackRate;
  }

  get duration(): number {
    return this.state.duration;
  }

  get position(): number {
    return this.state.position;
  }

  get isReady(): boolean {
    return this.state.isReady;
  }

  get volume(): number {
    return this.state.volume;
  }

  get isMuted(): boolean {
    return this.state.isMuted;
  }

  get sourceUrl(): string | null {
    return this._sourceUrl;
  }

  get metadata(): VideoMetadata | null {
    return this._metadata;
  }

  // Playback control methods
  setRate(rate: number): void {
    this.updateState({ playbackRate: rate });
  }

  play(): void {
    if (this.state.isPaused) {
      this.updateState({ isPaused: false });
    }
  }

  pause(): void {
    if (!this.state.isPaused) {
      this.updateState({ isPaused: true });
    }
  }

  restart(): void {
    this.updateState({
      position: 0,
      isFinished: false,
      isPaused: false,
    });
    this.emit(PlayerEvent.Restarted);
  }

  seek(time: number): void {
    if (!Number.isFinite(time)) {
      return;
    }
    this.handleTimeSkip(time);
    this.emit(PlayerEvent.Seek, time);
  }

  step(seconds: number): void {
    if (!Number.isFinite(seconds)) {
      return;
    }
    const newPosition = this.state.position + seconds;
    const delta = this.handleTimeSkip(newPosition);
    this.emit(PlayerEvent.Seek, this.state.position);
    this.emit(PlayerEvent.Step, delta);
  }

  stepForward(seconds?: number): void {
    this.step(seconds ?? AVPlayerManager.DEFAULT_STEP_TIME);
  }

  stepBackward(seconds?: number): void {
    this.step(-(seconds ?? AVPlayerManager.DEFAULT_STEP_TIME));
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.updateState({ volume: clampedVolume });
  }

  setMute(muted: boolean): void {
    this.updateState({ isMuted: muted });
  }

  setScrubbing(scrubbing: boolean): void {
    this.updateState({ isScrubbing: scrubbing });
  }

  // Video event handlers
  onVideoDuration(duration: number): void {
    this.updateState({
      duration,
      isReady: true,
    });
  }

  onVideoTime(currentTime: number, playableDuration?: number): void {
    if (!this.state.isScrubbing) {
      this.updateState({ position: currentTime });
    }
  }

  onVideoBuffering(isBuffering: boolean): void {
    this.updateState({ isBuffering });
  }

  onVideoEnded(): void {
    this.updateState({
      isFinished: true,
      isPaused: true,
    });
  }

  onVideoError(error: unknown): void {
    console.error('Video playback error:', error);
    // Handle error (could pause, show error state, etc.)
  }

  onVideoLostAudioFocus(): void {
    this.pause();
  }

  onVideoNoisy(): void {
    this.pause();
  }

  // Internal helper methods
  private handleTimeSkip(targetTime: number): number {
    const isAtEnd = targetTime >= this.state.duration;

    const updates: Partial<PlayerState> = {
      isFinished: isAtEnd,
    };

    if (this.state.isFinished && !isAtEnd) {
      updates.isFinished = false;
      updates.isPaused = false;
    }

    const clampedTime = Math.max(0, Math.min(targetTime, this.state.duration));
    const delta = clampedTime - this.state.position;
    updates.position = clampedTime;

    this.updateState(updates);
    return delta;
  }

  private _muxData: MuxOptions | null = null;

  get muxData(): MuxOptions | null {
    return this._muxData;
  }

  setSource(source: VideoSource, options: VideoSourceOptions): void {
    const url = source.getUrl();
    
    console.log('[AVPlayerManager] setSource called with URL:', url);
    
    this._sourceUrl = url;
    this._metadata = options.metadata || null;
    this._muxData = options.muxData || null;

    // Force a state update to trigger re-render of components
    this.updateState({
      position: options.startTime ?? 0,
      isReady: false,
      isPaused: true,
      isFinished: false,
      // Add a dummy property change to ensure update
    });
    
    // Notify listeners explicitly since source isn't part of state
    this.notifyStateListeners();
  }

  mount(): void {
    // Mount lifecycle - setup media session, etc.
  }

  unmount(): void {
    // Cleanup listeners
    this.stateListeners.clear();
    this.eventListeners.clear();
  }
}
