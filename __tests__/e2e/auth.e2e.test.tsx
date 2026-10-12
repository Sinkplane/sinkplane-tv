/**
 * E2E: Login / authentication flows.
 *
 * Covers the OIDC device-code sign-in (the primary TV login path), its error
 * and expiry branches, session persistence across an app restart, and sign-out.
 */

import { loadRuntime, Runtime } from './helpers/runtime';

describe('E2E: login (OIDC device flow)', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('starts the device flow, shows the code + QR and completes login', async () => {
    await rt.renderApp();

    // The flow starts on mount: device-auth request → user code + QR rendered.
    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });
    expect(rt.screen.getByTestId('qr-code').props.children).toBe('https://www.floatplane.com/link?code=FPQD-1001');
    expect(rt.screen.getByText('Scan the QR code to sign in on another device')).toBeTruthy();
    expect(rt.api.deviceAuthCalls).toBe(1);

    // "Approve" the login on the other device; next poll exchanges the code.
    rt.api.approveDeviceLogin();
    await rt.advanceTime(1000);

    // Profile → subscriptions → creators → signed in home screen.
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
    });
    expect(rt.screen.queryByText('Sign In to Floatplane')).toBeNull();
    expect(rt.secureStore.items.get('fptoken')).toBe(JSON.stringify(rt.api.accessToken));
  });

  it('counts down the code expiration time', async () => {
    rt.api.deviceExpiresInSeconds = 120;
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });

    await rt.advanceTime(60000);
    await rt.until(() => {
      expect(rt.screen.getByText('Time Remaining: 1:00')).toBeTruthy();
    });
  });

  it('expires the code, tells the user and auto-restarts the flow', async () => {
    rt.api.deviceExpiresInSeconds = 3;
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });

    await rt.advanceTime(3000);
    await rt.until(() => {
      expect(rt.screen.getByText('Login code expired. Please try again.')).toBeTruthy();
    });

    // Auto-restart after 2s issues a brand new code.
    await rt.advanceTime(2100);
    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1002')).toBeTruthy();
    });
    expect(rt.api.deviceAuthCalls).toBe(2);
  });

  it('surfaces device-auth failures and recovers via Try Again', async () => {
    rt.api.deviceAuthFailure = { status: 500, body: 'backend exploded' };
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText(/Failed to start device login: 500/)).toBeTruthy();
    });
    expect(rt.screen.getByText('Try Again')).toBeTruthy();

    rt.api.deviceAuthFailure = null;
    rt.fireEvent.press(rt.screen.getByText('Try Again'));

    // The retry issues a brand-new device request with a new code.
    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1002')).toBeTruthy();
    });
    expect(rt.api.deviceAuthCalls).toBe(2);
  });

  it('shows an expired message when the token endpoint reports expired_token', async () => {
    rt.api.deviceTokenError = 'expired_token';
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });

    await rt.advanceTime(1000);
    await rt.until(() => {
      expect(rt.screen.getByText('Login code expired. Please try again.')).toBeTruthy();
    });
    expect(rt.screen.getByText('Try Again')).toBeTruthy();
  });

  it('stays on sign-in when the profile cannot be fetched after approval', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    // Persistent failure: the profile query auto-fetches, handleLogin
    // refetches, and react-query retries — every attempt must see the 500.
    rt.api.failRequests('GET', '/api/v3/status', { status: 500, body: { message: 'nope' } }, Number.POSITIVE_INFINITY);

    await rt.renderApp();
    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });

    rt.api.approveDeviceLogin();
    await rt.advanceTime(1000);

    // Login bailed out after the token exchange — still signed out.
    await rt.until(() => {
      expect(consoleError).toHaveBeenCalledWith('[SignIn] Login failed:', expect.any(Error));
    });
    await rt.until(() => {
      expect(rt.screen.getByText('Sign In to Floatplane')).toBeTruthy();
    });
    expect(rt.secureStore.items.has('fptoken')).toBe(false);
    consoleError.mockRestore();
  });
});

describe('E2E: session persistence and sign-out', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('boots into the app when a session was stored previously', async () => {
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
    });
    // The signed-out branch is not rendered at all.
    expect(rt.screen.queryByText('Sign In to Floatplane')).toBeNull();
  });

  it('signs the user out from the profile menu and wipes the session', async () => {
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
    });

    rt.fireEvent.press(rt.screen.getByTestId('profile-avatar-button'));
    await rt.until(() => {
      expect(rt.screen.getByText('Logout')).toBeTruthy();
    });
    rt.fireEvent.press(rt.screen.getByText('Logout'));

    await rt.until(() => {
      expect(rt.screen.getByText('Sign In to Floatplane')).toBeTruthy();
    });
    expect(rt.secureStore.items.has('fptoken')).toBe(false);
    expect(rt.secureStore.items.has('fpuser')).toBe(false);
    expect(rt.secureStore.items.has('fprefreshToken')).toBe(false);
  });

  it('signs the user out when the account has no subscriptions', async () => {
    rt.api.subscriptions = [];
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('Sign In to Floatplane')).toBeTruthy();
    });
    expect(rt.secureStore.items.has('fptoken')).toBe(false);
  });
});
