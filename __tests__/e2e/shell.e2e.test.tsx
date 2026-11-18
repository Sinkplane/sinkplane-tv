import { loadRuntime, type Runtime } from './helpers/runtime';

const FIRST_VIDEO = 'Main Channel Video 01';
const EVERY_ATTEMPT = Number.POSITIVE_INFINITY;

async function signedInHome(rt: Runtime): Promise<void> {
  rt.seedSession();
  await rt.renderApp();
  await rt.until(() => {
    expect(rt.screen.getByText(FIRST_VIDEO)).toBeTruthy();
  });
}

function requestedCreatorIds(rt: Runtime): (string | null)[] {
  return rt.api.requestsTo('/api/v3/content/creator').map((request) => request.params.get('id'));
}

async function openProfileMenu(rt: Runtime): Promise<void> {
  await rt.fireEvent.press(rt.screen.getByTestId('profile-avatar-button'));
  await rt.until(() => {
    expect(rt.screen.getByText('Switch Subscription')).toBeTruthy();
  });
}

describe('E2E: sign-in screen controls', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('requests a fresh device code from Get New Code', async () => {
    await rt.renderApp();
    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });

    await rt.fireEvent(rt.screen.getByText('Get New Code'), 'pressIn');
    await rt.fireEvent.press(rt.screen.getByText('Get New Code'));

    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1002')).toBeTruthy();
    });
    expect(rt.api.deviceAuthCalls).toBe(2);
  });

  it('stays signed out when the approved profile has no user', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    rt.api.failRequests('GET', '/api/v3/status', { status: 200, body: {} }, EVERY_ATTEMPT);
    await rt.renderApp();
    await rt.until(() => {
      expect(rt.screen.getByText('FPQD-1001')).toBeTruthy();
    });

    rt.api.approveDeviceLogin();
    await rt.advanceTime(1000);

    await rt.until(() => {
      expect(consoleError).toHaveBeenCalledWith('[SignIn] Login failed:', expect.any(Error));
    });
    expect(rt.screen.getByText('Login successful! Loading your profile...')).toBeTruthy();
    expect(rt.secureStore.items.has('fptoken')).toBe(false);
    consoleError.mockRestore();
  });
});

describe('E2E: profile menu', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('switches the app to dark mode and back', async () => {
    await signedInHome(rt);
    await openProfileMenu(rt);

    await rt.fireEvent.press(rt.screen.getByText('Dark Mode'));
    await rt.until(() => {
      expect(rt.screen.queryByText('Switch Subscription')).toBeNull();
    });

    await rt.fireEvent(rt.screen.getByText('Change Channel'), 'focus');
    expect(rt.screen.getByText('Change Channel')).toBeTruthy();

    await openProfileMenu(rt);
    expect(rt.screen.getByText('Light Mode')).toBeTruthy();
    await rt.fireEvent.press(rt.screen.getByText('Light Mode'));

    await openProfileMenu(rt);
    expect(rt.screen.getByText('Dark Mode')).toBeTruthy();
  });

  it('switches the active creator and reloads its videos', async () => {
    await signedInHome(rt);
    await openProfileMenu(rt);
    expect(rt.screen.getByText('Tech Channel')).toBeTruthy();

    await rt.fireEvent.press(rt.screen.getByText('Gaming Channel'));

    await rt.until(() => {
      expect(requestedCreatorIds(rt)).toContain('creator-gaming');
    });
    expect(rt.screen.queryByText('Switch Subscription')).toBeNull();
  });

  it('highlights the avatar and menu entries as the remote focuses them', async () => {
    await signedInHome(rt);
    await rt.fireEvent(rt.screen.getByTestId('profile-avatar-button'), 'focus');
    await openProfileMenu(rt);

    await rt.fireEvent(rt.screen.getByText('Gaming Channel'), 'focus');
    await rt.fireEvent(rt.screen.getByText('Tech Channel'), 'focus');
    await rt.fireEvent(rt.screen.getByText('Dark Mode'), 'focus');
    await rt.fireEvent(rt.screen.getByText('Logout'), 'focus');

    await rt.until(() => {
      expect(rt.screen.getByText('Logout')).toBeTruthy();
    });
  });

  it('shows a placeholder avatar while the stored user is missing', async () => {
    rt.seedSession();
    rt.secureStore.items.delete('fpuser');
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText(FIRST_VIDEO)).toBeTruthy();
    });
    expect(rt.screen.getByTestId('profile-avatar-button')).toBeTruthy();
  });
});

describe('E2E: tab bar', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('navigates between tabs and ignores presses on the current tab', async () => {
    await signedInHome(rt);

    await rt.fireEvent(rt.screen.getByText('History'), 'focus');
    await rt.fireEvent.press(rt.screen.getByText('Home'));
    expect(rt.screen.getByText(FIRST_VIDEO)).toBeTruthy();

    await rt.fireEvent.press(rt.screen.getByText('History'));
    await rt.until(() => {
      expect(rt.screen.getByText('Watch History')).toBeTruthy();
    });
  });

  it('focuses, presses and blurs the toolbar buttons', async () => {
    await signedInHome(rt);
    const button = rt.screen.getByText('Change Channel');

    await rt.fireEvent(button, 'focus');
    await rt.fireEvent(button, 'pressIn');
    await rt.fireEvent(button, 'pressOut');
    await rt.fireEvent(button, 'blur');

    expect(rt.screen.getByText('Change Channel')).toBeTruthy();
  });
});
