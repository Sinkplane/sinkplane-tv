/**
 * Global setup for the E2E integration suite.
 * Runs after the test framework is installed, before each test file.
 *
 * Per-test module resets and state initialization live in
 * `helpers/runtime.ts` (loadRuntime) — see the explanation there.
 */

// RNTL registers an afterEach auto-cleanup hook when first imported. Tests
// import it lazily (per-test module reset), which would nest that hook inside
// a running test. Disable auto-cleanup; the afterEach below does it manually.
process.env.RNTL_SKIP_AUTO_CLEANUP = 'true';

afterEach(async () => {
  // RNTL v14's cleanup/unmount is async; require it from the *current*
  // registry (before the next test resets modules) and await it so a
  // lingering unmount act-scope cannot swallow the next test's render.
  const rnTestingLibrary = jest.requireActual('@testing-library/react-native') as typeof import('@testing-library/react-native');
  await rnTestingLibrary.cleanup();
  await Promise.resolve();
});

// The app is chatty (auth + TV server logging); keep failure output readable.
// error/warn stay visible to surface real problems — except the expected
// "Failed to set polyfill. fetch is not configurable." noise caused by our
// non-configurable fetch mock (see helpers/mock-floatplane-api.ts).
const rawConsoleError = console.error;
jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Failed to set polyfill')) return;
  rawConsoleError(...(args as Parameters<typeof console.error>));
});
jest.spyOn(console, 'info').mockImplementation(() => undefined);
jest.spyOn(console, 'log').mockImplementation(() => undefined);
