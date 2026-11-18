import type * as ApiModule from './mock-floatplane-api';
import type * as NativeMocks from './native-mocks';
import type * as TestUtils from './test-utils';

const MOCK_TCP_SERVER_KEY = 'MockTcpServer';

export type Runtime = typeof TestUtils & {
  api: typeof ApiModule.api;
  secureStore: typeof NativeMocks.mockSecureStore;
  asyncStorage: typeof NativeMocks.mockAsyncStorage;
  tcp: typeof NativeMocks.mockTcpState;
  cookies: typeof NativeMocks.mockCookieState;
  videoState: typeof NativeMocks.mockVideoState;
  zeroconf: typeof NativeMocks.mockZeroconfState;
} & Readonly<Record<typeof MOCK_TCP_SERVER_KEY, typeof NativeMocks.MockTcpServer>>;

const loadInRegistrationOrder = (): {
  nativeMocks: typeof NativeMocks;
  apiModule: typeof ApiModule;
  utils: typeof TestUtils;
} => {
  const nativeMocks = jest.requireActual<typeof NativeMocks>('./native-mocks');
  const apiModule = jest.requireActual<typeof ApiModule>('./mock-floatplane-api');
  const utils = jest.requireActual<typeof TestUtils>('./test-utils');
  return { nativeMocks, apiModule, utils };
};

const readScreenLiveBecauseRenderReassignsIt = (
  runtime: Runtime,
  utils: typeof TestUtils,
): Runtime =>
  Object.defineProperty(runtime, 'screen', {
    get: () => utils.screen,
    enumerable: true,
    configurable: true,
  });

export function loadRuntime(): Runtime {
  jest.clearAllTimers();
  jest.resetModules();

  const { nativeMocks, apiModule, utils } = loadInRegistrationOrder();
  apiModule.api.reset();
  nativeMocks.resetNativeMockState();

  const runtime: Runtime = {
    ...utils,
    api: apiModule.api,
    secureStore: nativeMocks.mockSecureStore,
    asyncStorage: nativeMocks.mockAsyncStorage,
    tcp: nativeMocks.mockTcpState,
    cookies: nativeMocks.mockCookieState,
    videoState: nativeMocks.mockVideoState,
    zeroconf: nativeMocks.mockZeroconfState,
    [MOCK_TCP_SERVER_KEY]: nativeMocks.MockTcpServer,
  };
  return readScreenLiveBecauseRenderReassignsIt(runtime, utils);
}
