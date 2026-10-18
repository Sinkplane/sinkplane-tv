/**
 * Native module mocks for the E2E integration suite.
 *
 * Every mock here is a *controllable* stand-in: tests can drive events
 * (playback progress, TCP messages, storage contents) and inspect what the
 * app did (seeks, socket writes, cookies set).
 *
 * This module must be imported before any app module so the `jest.mock`
 * factories (hoisted by babel-jest) register first.
 */

/* eslint-disable max-classes-per-file -- socket/server fakes are naturally class-shaped */

/* eslint-disable @typescript-eslint/no-require-imports */

// ---------------------------------------------------------------------------
// Shared mock state (the `mock` prefix is required by babel-plugin-jest-hoist)
// ---------------------------------------------------------------------------

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
  onError?: (e: { error: { code?: string; domain?: string; message?: string } }) => void;
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

export const mockZeroconfState = { published: [] as string[], stopped: false };

// ---------------------------------------------------------------------------
// react-native-video
// ---------------------------------------------------------------------------

jest.mock('react-native-video', () => {
  const React = jest.requireActual('react');
  const reactNative = jest.requireActual('react-native');

  const MockVideo = React.forwardRef((props: MockVideoProps, ref: { current: unknown }) => {
    mockVideoState.props = props;
    mockVideoState.mountCount += 1;
    React.useImperativeHandle(
      ref,
      () => ({
        seek: (time: number) => {
          mockVideoState.seeks.push(time);
        },
        presentFullscreenPlayer: () => undefined,
        dismissFullscreenPlayer: () => undefined,
        save: () => undefined,
        restoreUserInterfaceForPictureInPictureStop: () => Promise.resolve(true),
      }),
      [],
    );
    return React.createElement(reactNative.View, { testID: 'native-video-player' });
  });
  MockVideo.displayName = 'Video';

  return { __esModule: true, default: MockVideo };
});

// ---------------------------------------------------------------------------
// AsyncStorage (in-memory, seedable)
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string): Promise<string | null> => mockAsyncStorage.items.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string): Promise<void> => {
      mockAsyncStorage.items.set(key, value);
    }),
    removeItem: jest.fn(async (key: string): Promise<void> => {
      mockAsyncStorage.items.delete(key);
    }),
  },
}));

// ---------------------------------------------------------------------------
// expo-secure-store (in-memory, seedable)
// ---------------------------------------------------------------------------

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async (key: string, value: string): Promise<void> => {
    mockSecureStore.items.set(key, value);
  }),
  getItemAsync: jest.fn(async (key: string): Promise<string | null> => mockSecureStore.items.get(key) ?? null),
  deleteItemAsync: jest.fn(async (key: string): Promise<void> => {
    mockSecureStore.items.delete(key);
  }),
}));

// ---------------------------------------------------------------------------
// react-native-tcp-socket (controllable fake server + sockets)
// ---------------------------------------------------------------------------

type SocketHandler = (data: Buffer) => void;

export class MockTcpSocket {
  writes: string[] = [];
  destroyed = false;
  private handlers: Record<string, (...args: unknown[]) => void> = {};

  on(event: string, callback: (...args: unknown[]) => void): MockTcpSocket {
    this.handlers[event] = callback;
    return this;
  }

  write(data: string): void {
    this.writes.push(data);
  }

  destroy(): void {
    this.destroyed = true;
  }

  /** Test helper: simulate the companion app sending a JSON message. */
  emitData(message: unknown): void {
    const handler = this.handlers.data as SocketHandler | undefined;
    if (handler) {
      handler(Buffer.from(JSON.stringify(message)));
    }
  }

  /** Test helper: simulate the socket closing. */
  emitClose(): void {
    const handler = this.handlers.close as (() => void) | undefined;
    if (handler) handler();
  }
}

export class MockTcpServer {
  listening = false;
  port = 0;
  closed = false;
  connectionHandler: ((socket: MockTcpSocket) => void) | null = null;

  listen(options: { port?: number; host?: string }, callback?: () => void): MockTcpServer {
    this.listening = true;
    this.port = options.port ?? 0;
    mockTcpState.servers.push(this);
    if (callback) callback();
    return this;
  }

  close(): void {
    this.closed = true;
    this.listening = false;
  }

  /** Test helper: simulate a companion app connecting; returns its socket. */
  simulateConnection(): MockTcpSocket {
    const socket = new MockTcpSocket();
    mockTcpState.sockets.push(socket);
    if (this.connectionHandler) this.connectionHandler(socket);
    return socket;
  }
}

jest.mock('react-native-tcp-socket', () => {
  const createServer = (handler: (socket: MockTcpSocket) => void): MockTcpServer => {
    const server = new MockTcpServer();
    server.connectionHandler = handler;
    return server;
  };

  return {
    __esModule: true,
    default: { createServer, createConnection: jest.fn() },
    createServer,
    createConnection: jest.fn(),
  };
});

// ---------------------------------------------------------------------------
// react-native-zeroconf
// ---------------------------------------------------------------------------

jest.mock('react-native-zeroconf', () => {
  class MockZeroconf {
    on(): MockZeroconf {
      return this;
    }

    publishService(_type: string, _proto: string, _domain: string, name: string, port: number): void {
      mockZeroconfState.published.push(`${name}:${port}`);
    }

    unpublishService(_name: string): void {
      // no-op
    }

    stop(): void {
      mockZeroconfState.stopped = true;
    }
  }

  return { __esModule: true, default: MockZeroconf };
});

// ---------------------------------------------------------------------------
// @preeternal/react-native-cookie-manager
// ---------------------------------------------------------------------------

jest.mock('@preeternal/react-native-cookie-manager', () => {
  const set = jest.fn(async (url: string, cookie: { name: string; value: string }): Promise<void> => {
    mockCookieState.cookies.set(cookie.name, { url, name: cookie.name, value: cookie.value });
  });
  const clearAll = jest.fn(async (): Promise<void> => {
    mockCookieState.cookies.clear();
  });
  return { __esModule: true, default: { set, clearAll }, set, clearAll };
});

// ---------------------------------------------------------------------------
// expo-crypto (deterministic UUIDs)
// ---------------------------------------------------------------------------

jest.mock('expo-crypto', () => {
  let counter = 0;
  return {
    randomUUID: jest.fn((): string => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
    }),
    getRandomValues: jest.fn((values: Uint8Array): Uint8Array => {
      for (let i = 0; i < values.length; i += 1) {
        values[i] = i % 256;
      }
      return values;
    }),
    getRandomBytes: jest.fn(async (byteCount: number): Promise<Uint8Array> => new Uint8Array(byteCount)),
  };
});

// ---------------------------------------------------------------------------
// expo-device
// ---------------------------------------------------------------------------

jest.mock('expo-device', () => ({
  deviceName: 'Sinkplane Test TV',
  isDevice: true,
  brand: 'apple',
  modelName: 'Apple TV (Test)',
  DeviceType: { UNKNOWN: 0, PHONE: 1, TABLET: 2, DESKTOP: 3, TV: 4 },
}));

// ---------------------------------------------------------------------------
// expo-network
// ---------------------------------------------------------------------------

jest.mock('expo-network', () => ({
  getIpAddressAsync: jest.fn(async (): Promise<string> => '192.168.1.42'),
  getNetworkStateAsync: jest.fn(async () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'WIFI',
  })),
}));

// ---------------------------------------------------------------------------
// expo-splash-screen
// ---------------------------------------------------------------------------

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
  hide: jest.fn(),
  setOptions: jest.fn(async () => undefined),
}));

// ---------------------------------------------------------------------------
// react-native-qrcode-svg (render the encoded value as text so it is assertable)
// ---------------------------------------------------------------------------

jest.mock('react-native-qrcode-svg', () => ({
  __esModule: true,
  default: ({ value }: { value?: string }) => {
    const React = jest.requireActual('react');
    const reactNative = jest.requireActual('react-native');
    return React.createElement(reactNative.Text, { testID: 'qr-code' }, value ?? '');
  },
}));

// ---------------------------------------------------------------------------
// react-native Modal — render inline instead of through the native modal
// host. The test renderer never commits the native modal portal, which makes
// presses inside modals (channel drawer, profile menu) silently drop their
// state updates. Inline rendering keeps the same visible/children contract.
// ---------------------------------------------------------------------------

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = jest.requireActual('react');
  const reactNative = jest.requireActual('react-native');
  const MockModal = ({ visible, children, ...props }: { visible?: boolean; children?: React.ReactNode }) =>
    visible ? React.createElement(reactNative.View, props, children) : null;
  MockModal.displayName = 'Modal';
  return { __esModule: true, default: MockModal };
});

// ---------------------------------------------------------------------------
// layouts/TabLayout → use the pure-JS web tab layout.
// `expo-router/unstable-native-tabs` renders a real native UITabBar which
// cannot render inside Jest; the web layout keeps the same routes + screens.
// ---------------------------------------------------------------------------

jest.mock('@/layouts/TabLayout', () => ({
  __esModule: true,
  default: jest.requireActual('@/layouts/TabLayout.web').default,
}));

// ---------------------------------------------------------------------------
// react-native-worklets + react-native-reanimated
//
// reanimated v4's official mock (`react-native-reanimated/mock`) pulls in the
// real library, which loads react-native-worklets' native module proxy and
// crashes in Jest ("Cannot read properties of undefined (reading
// 'loadUnpackers')"). Registering worklets' own JS mock first fixes the chain.
// expo-router's testing library later registers the reanimated mock and
// returns that exact module object — so the ReanimatedLogLevel /
// configureReanimatedLogger additions below (used by app/_layout.tsx) survive
// regardless of which jest.mock factory wins the registration race.
// ---------------------------------------------------------------------------

jest.mock('react-native-worklets', () => jest.requireActual('react-native-worklets/lib/module/mock.js'));

const reanimatedMockModule = jest.requireActual('react-native-reanimated/mock') as Record<string, unknown>;
reanimatedMockModule.ReanimatedLogLevel = { Off: 0, Error: 1, Warn: 2, Info: 3, Debug: 4, Verbose: 5 };
reanimatedMockModule.configureReanimatedLogger = () => undefined;
