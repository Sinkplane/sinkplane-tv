/**
 * Infrastructure smoke test: boots the real app with a seeded session and
 * asserts the home screen renders videos from the mock API.
 * If this passes, every other E2E suite can trust the harness.
 */

import { loadRuntime, Runtime } from './helpers/runtime';

describe('E2E smoke', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('boots the app signed-in and renders the home video list', async () => {
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
    });

    expect(rt.screen.getByText('Main Channel Videos')).toBeTruthy();
    expect(rt.screen.getByText('Change Channel')).toBeTruthy();
  });
});
