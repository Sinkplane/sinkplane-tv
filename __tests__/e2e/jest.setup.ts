import type * as RnTestingLibrary from '@testing-library/react-native';

const EXPECTED_FETCH_POLYFILL_NOISE = 'Failed to set polyfill';

function disableRntlAutoCleanupBecauseTestsImportItPerTest(): void {
  process.env['RNTL_SKIP_AUTO_CLEANUP'] = 'true';
}

async function cleanupRenderFromCurrentModuleRegistry(): Promise<void> {
  const rnTestingLibrary = jest.requireActual<typeof RnTestingLibrary>(
    '@testing-library/react-native',
  );
  await rnTestingLibrary.cleanup();
  await Promise.resolve();
}

const isExpectedFetchPolyfillNoise = (args: readonly unknown[]): boolean =>
  typeof args[0] === 'string' && args[0].includes(EXPECTED_FETCH_POLYFILL_NOISE);

function silenceChattyLogsButKeepRealErrors(): void {
  const rawConsoleError = globalThis.console.error.bind(globalThis.console);
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!isExpectedFetchPolyfillNoise(args)) {
      rawConsoleError(...args);
    }
  });
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
}

disableRntlAutoCleanupBecauseTestsImportItPerTest();
afterEach(cleanupRenderFromCurrentModuleRegistry);
silenceChattyLogsButKeepRealErrors();
