/**
 * Per-test runtime facade.
 *
 * The app holds module-level singletons that must be pristine for every test
 * (expo-router's global router store, the QueryClient in app/_layout, the
 * auth apiClient callback registry, …). `jest.resetModules()` gives each test
 * a fresh module registry; this helper then re-requires the app-facing
 * helpers from that fresh registry and returns them as one object.
 *
 * Everything (screen, fireEvent, renderApp, …) is sourced through the same
 * import chain so tests never touch a parallel module instance.
 *
 * Tests use it like:
 *   const rt = loadRuntime();
 *   await rt.renderApp();
 *   rt.until(() => rt.screen.getByText('…'));
 */

type TestUtils = typeof import('./test-utils');
type ApiModule = typeof import('./mock-floatplane-api');
type NativeMocks = typeof import('./native-mocks');

export type Runtime = TestUtils & {
  api: ApiModule['api'];
  secureStore: NativeMocks['mockSecureStore'];
  asyncStorage: NativeMocks['mockAsyncStorage'];
  tcp: NativeMocks['mockTcpState'];
  cookies: NativeMocks['mockCookieState'];
  videoState: NativeMocks['mockVideoState'];
  zeroconf: NativeMocks['mockZeroconfState'];
  MockTcpServer: NativeMocks['MockTcpServer'];
};

export function loadRuntime(): Runtime {
  jest.clearAllTimers();
  jest.resetModules();

  // Order matters:
  //  1. native-mocks registers jest.mock factories and patches the official
  //     reanimated mock (expo-router's testing library later re-registers its
  //     own factory over ours, but returns the same module object).
  //  2. mock-floatplane-api installs the non-configurable global.fetch mock.
  //  3. test-utils pulls in expo-router/testing-library — the single instance
  //     every helper (screen/fireEvent/renderApp) shares.
  const nativeMocks = jest.requireActual('./native-mocks') as NativeMocks;
  const apiModule = jest.requireActual('./mock-floatplane-api') as ApiModule;
  const utils = jest.requireActual('./test-utils') as TestUtils;

  // Fresh instances → reset their state so each test starts clean.
  apiModule.api.reset();
  nativeMocks.mockSecureStore.items.clear();
  nativeMocks.mockAsyncStorage.items.clear();
  nativeMocks.mockVideoState.props = null;
  nativeMocks.mockVideoState.seeks = [];
  nativeMocks.mockVideoState.mountCount = 0;
  nativeMocks.mockCookieState.cookies.clear();
  nativeMocks.mockTcpState.servers.length = 0;
  nativeMocks.mockTcpState.sockets.length = 0;
  nativeMocks.mockZeroconfState.published.length = 0;
  nativeMocks.mockZeroconfState.stopped = false;

  const runtime: Runtime = {
    ...utils,
    api: apiModule.api,
    secureStore: nativeMocks.mockSecureStore,
    asyncStorage: nativeMocks.mockAsyncStorage,
    tcp: nativeMocks.mockTcpState,
    cookies: nativeMocks.mockCookieState,
    videoState: nativeMocks.mockVideoState,
    zeroconf: nativeMocks.mockZeroconfState,
    MockTcpServer: nativeMocks.MockTcpServer,
  };
  // `screen` is replaced by RNTL on every render (setRenderResult reassigns
  // the module export), so it must be read live. A getter inside the object
  // literal would be collapsed by babel's Object.assign downleveling —
  // defineProperty keeps it a real accessor.
  Object.defineProperty(runtime, 'screen', {
    get: () => utils.screen,
    enumerable: true,
    configurable: true,
  });
  return runtime;
}
