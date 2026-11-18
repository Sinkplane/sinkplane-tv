import type { OnVideoErrorData } from 'react-native-video';

export interface MockVideoProps {
  source?: {
    uri: string;
    headers?: Record<string, string>;
    metadata?: { title?: string; subtitle?: string; description?: string; imageUri?: string };
  };
  paused?: boolean;
  controls?: boolean;
  playbackSpeeds?: number[];
  captionTracks?: {
    id: string;
    uri: string;
    language?: string;
    subtitle?: string;
    headers?: Record<string, string>;
  }[];
  selectedCaptionTrackId?: string;
  onCaptionTrackChange?: (e: { trackId?: string }) => void;
  rate?: number;
  onPlaybackRateChange?: (e: { playbackRate: number; selectedPlaybackRate?: number }) => void;
  resizeMode?: string;
  poster?: unknown;
  playInBackground?: boolean;
  playWhenInactive?: boolean;
  ignoreSilentSwitch?: string;
  preventsDisplaySleepDuringVideoPlayback?: boolean;
  style?: unknown;
  onLoad?: (data: { duration: number; currentTime: number }) => void;
  onReadyForDisplay?: () => void;
  onBuffer?: (data: { isBuffering: boolean }) => void;
  onProgress?: (data: { currentTime: number; playableDuration?: number }) => void;
  onPlaybackStateChanged?: (data: { isPlaying: boolean; isSeeking: boolean }) => void;
  onError?: (e: OnVideoErrorData) => void;
  onEnd?: () => void;
}

export interface MockVideoState {
  props: MockVideoProps | null;
  seeks: number[];
  mountCount: number;
}

export const mockVideoState: MockVideoState = { props: null, seeks: [], mountCount: 0 };

export const mockSecureStore = { items: new Map<string, string>() };

export const mockAsyncStorage = { items: new Map<string, string>() };

export interface MockTcpSocketState {
  servers: MockTcpServer[];
  sockets: MockTcpSocket[];
}

export const mockTcpState: MockTcpSocketState = { servers: [], sockets: [] };

export const mockCookieState = {
  cookies: new Map<string, { url: string; name: string; value: string }>(),
};

export const mockZeroconfState: { published: string[]; stopped: boolean } = {
  published: [],
  stopped: false,
};

type SocketListener = (...args: unknown[]) => void;

export class MockTcpSocket {
  writes: string[] = [];
  destroyed = false;
  private readonly handlers = new Map<string, SocketListener>();

  on(event: string, callback: SocketListener): this {
    this.handlers.set(event, callback);
    return this;
  }

  write(data: string): void {
    this.writes.push(data);
  }

  destroy(): void {
    this.destroyed = true;
  }

  emitData(message: unknown): void {
    this.handlers.get('data')?.(Buffer.from(JSON.stringify(message)));
  }

  emitClose(): void {
    this.handlers.get('close')?.();
  }
}

export class MockTcpServer {
  listening = false;
  port = 0;
  closed = false;
  connectionHandler: ((socket: MockTcpSocket) => void) | null = null;

  listen(options: { port?: number; host?: string }, callback?: () => void): this {
    this.listening = true;
    this.port = options.port ?? 0;
    mockTcpState.servers.push(this);
    callback?.();
    return this;
  }

  close(): void {
    this.closed = true;
    this.listening = false;
  }

  simulateConnection(): MockTcpSocket {
    const socket = new MockTcpSocket();
    mockTcpState.sockets.push(socket);
    this.connectionHandler?.(socket);
    return socket;
  }
}

export function resetNativeMockState(): void {
  mockSecureStore.items.clear();
  mockAsyncStorage.items.clear();
  mockVideoState.props = null;
  mockVideoState.seeks = [];
  mockVideoState.mountCount = 0;
  mockCookieState.cookies.clear();
  mockTcpState.servers.length = 0;
  mockTcpState.sockets.length = 0;
  mockZeroconfState.published.length = 0;
  mockZeroconfState.stopped = false;
}
