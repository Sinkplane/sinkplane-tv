import type { ReactElement, ReactNode, Ref, useImperativeHandle } from 'react';
import type * as JsxRuntime from 'react/jsx-runtime';
import type * as ReactNativeModule from 'react-native';
import {
  mockAsyncStorage,
  mockCookieState,
  mockSecureStore,
  mockVideoState,
  mockZeroconfState,
  MockTcpServer,
  type MockTcpSocket,
  type MockVideoProps,
} from './native-mock-state';

export * from './native-mock-state';

interface MockVideoHandle {
  seek: (time: number) => void;
  presentFullscreenPlayer: () => void;
  dismissFullscreenPlayer: () => void;
  save: () => void;
  restoreUserInterfaceForPictureInPictureStop: () => Promise<boolean>;
}

const REANIMATED_LOG_LEVELS = ['Off', 'Error', 'Warn', 'Info', 'Debug', 'Verbose'];

function mockEsModule<T extends object>(exports: T): T {
  return Object.defineProperty(exports, '__esModule', { value: true });
}

function mockNativeVideoPlayer(): object {
  const react = jest.requireActual<{ useImperativeHandle: typeof useImperativeHandle }>('react');
  const { jsx } = jest.requireActual<typeof JsxRuntime>('react/jsx-runtime');
  const reactNative = jest.requireActual<typeof ReactNativeModule>('react-native');

  function MockVideo({
    ref,
    ...props
  }: MockVideoProps & { ref?: Ref<MockVideoHandle> }): ReactElement {
    mockVideoState.props = props;
    mockVideoState.mountCount += 1;
    react.useImperativeHandle(
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
    return jsx(reactNative.View, { testID: 'native-video-player' });
  }
  MockVideo.displayName = 'Video';

  return mockEsModule({ default: MockVideo });
}

function mockInMemoryAsyncStorage(): object {
  return mockEsModule({
    default: {
      getItem: jest.fn((key: string): Promise<string | null> =>
        Promise.resolve(mockAsyncStorage.items.get(key) ?? null),
      ),
      setItem: jest.fn((key: string, value: string): Promise<void> => {
        mockAsyncStorage.items.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string): Promise<void> => {
        mockAsyncStorage.items.delete(key);
        return Promise.resolve();
      }),
    },
  });
}

function mockInMemorySecureStore(): object {
  return {
    setItemAsync: jest.fn((key: string, value: string): Promise<void> => {
      mockSecureStore.items.set(key, value);
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string): Promise<string | null> =>
      Promise.resolve(mockSecureStore.items.get(key) ?? null),
    ),
    deleteItemAsync: jest.fn((key: string): Promise<void> => {
      mockSecureStore.items.delete(key);
      return Promise.resolve();
    }),
  };
}

function mockTcpSocketServer(): object {
  const createServer = (handler: (socket: MockTcpSocket) => void): MockTcpServer => {
    const server = new MockTcpServer();
    server.connectionHandler = handler;
    return server;
  };
  return mockEsModule({
    default: { createServer, createConnection: jest.fn() },
    createServer,
    createConnection: jest.fn(),
  });
}

function mockZeroconfPublisher(): object {
  class MockZeroconf {
    unpublishService = jest.fn();

    on(): this {
      return this;
    }

    publishService(
      ...service: [type: string, protocol: string, domain: string, name: string, port: number]
    ): void {
      const [, , , name, port] = service;
      mockZeroconfState.published.push(`${name}:${String(port)}`);
    }

    stop(): void {
      mockZeroconfState.stopped = true;
    }
  }
  return mockEsModule({ default: MockZeroconf });
}

function mockCookieManager(): object {
  const set = jest.fn((url: string, cookie: { name: string; value: string }): Promise<void> => {
    mockCookieState.cookies.set(cookie.name, { url, name: cookie.name, value: cookie.value });
    return Promise.resolve();
  });
  const clearAll = jest.fn((): Promise<void> => {
    mockCookieState.cookies.clear();
    return Promise.resolve();
  });
  return mockEsModule({ default: { set, clearAll }, set, clearAll });
}

function mockDeterministicCrypto(): object {
  let counter = 0;
  return {
    randomUUID: jest.fn((): string => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
    }),
    getRandomValues: jest.fn((values: Uint8Array): Uint8Array => {
      values.set(Uint8Array.from({ length: values.length }, (_, i) => i % 256));
      return values;
    }),
    getRandomBytes: jest.fn((byteCount: number): Promise<Uint8Array> =>
      Promise.resolve(new Uint8Array(byteCount)),
    ),
  };
}

function mockQrCodeAsText(): object {
  const { jsx } = jest.requireActual<typeof JsxRuntime>('react/jsx-runtime');
  const reactNative = jest.requireActual<typeof ReactNativeModule>('react-native');
  function MockQrCode({ value }: { value?: string }): ReactElement {
    return jsx(reactNative.Text, { testID: 'qr-code', children: value ?? '' });
  }
  return mockEsModule({ default: MockQrCode });
}

function mockModalRenderedInlineSoPressesCommit(): object {
  const { jsx } = jest.requireActual<typeof JsxRuntime>('react/jsx-runtime');
  const reactNative = jest.requireActual<typeof ReactNativeModule>('react-native');
  function MockModal({
    visible,
    children,
    ...props
  }: {
    visible?: boolean;
    children?: ReactNode;
  }): ReactElement | null {
    return visible === true ? jsx(reactNative.View, { ...props, children }) : null;
  }
  MockModal.displayName = 'Modal';
  return mockEsModule({ default: MockModal });
}

function mockNativeTabsWithJsTabLayout(): object {
  return jest.requireActual<object>('@/layouts/TabLayout.web');
}

function mockWorkletsWithJsMockSoReanimatedMockLoads(): unknown {
  return jest.requireActual('react-native-worklets/lib/module/mock.js');
}

function patchReanimatedMockWithLoggerConfig(): void {
  const reanimatedMockModule = jest.requireActual<Record<string, unknown>>(
    'react-native-reanimated/mock',
  );
  reanimatedMockModule['ReanimatedLogLevel'] = Object.fromEntries(
    REANIMATED_LOG_LEVELS.map((name, level) => [name, level]),
  );
  reanimatedMockModule['configureReanimatedLogger'] = () => undefined;
}

jest.mock('react-native-video', () => mockNativeVideoPlayer());
jest.mock('@react-native-async-storage/async-storage', () => mockInMemoryAsyncStorage());
jest.mock('expo-secure-store', () => mockInMemorySecureStore());
jest.mock('react-native-tcp-socket', () => mockTcpSocketServer());
jest.mock('react-native-zeroconf', () => mockZeroconfPublisher());
jest.mock('@preeternal/react-native-cookie-manager', () => mockCookieManager());
jest.mock('expo-crypto', () => mockDeterministicCrypto());
jest.mock('expo-device', () => ({
  deviceName: 'Sinkplane Test TV',
  isDevice: true,
  brand: 'apple',
  modelName: 'Apple TV (Test)',
}));
jest.mock('expo-network', () => ({
  getIpAddressAsync: jest.fn((): Promise<string> => Promise.resolve('192.0.2.42')),
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true, type: 'WIFI' }),
  ),
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
  hide: jest.fn(),
  setOptions: jest.fn(() => Promise.resolve()),
}));
jest.mock('react-native-qrcode-svg', () => mockQrCodeAsText());
jest.mock('react-native/Libraries/Modal/Modal', () => mockModalRenderedInlineSoPressesCommit());
jest.mock('@/layouts/TabLayout', () => mockNativeTabsWithJsTabLayout());
jest.mock('react-native-worklets', () => mockWorkletsWithJsMockSoReanimatedMockLoads());

patchReanimatedMockWithLoggerConfig();
