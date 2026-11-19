import { loadRuntime, type Runtime } from './helpers/runtime';

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

  it('boots signed-in and signed-out without a LAN-exposed TV companion server', async () => {
    rt.seedSession();
    await rt.renderApp();
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
    });
    expect(rt.tcp.servers).toHaveLength(0);
    expect(rt.zeroconf.published).toHaveLength(0);

    const signedOut = loadRuntime();
    await signedOut.renderApp();
    await signedOut.until(() => {
      expect(signedOut.screen.getByText('FPQD-1001')).toBeTruthy();
    });
    expect(signedOut.tcp.servers).toHaveLength(0);
    expect(signedOut.zeroconf.published).toHaveLength(0);
  });
});
