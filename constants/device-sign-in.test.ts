import type { TokenResponse, User } from '@sinkplane/shared';

import {
  countdownLabel,
  formatCountdown,
  isFailedStatus,
  statusMessage,
  toSignInParams,
} from '@/constants/device-sign-in';

jest.mock('@sinkplane/shared', () => ({}));

const user: User = {
  id: 'user-1',
  username: 'viewer',
  profileImage: { width: 1, height: 1, path: 'avatar.png', childImages: [] },
};

const token: TokenResponse = { accessToken: 'access', expiresIn: 3600 };

describe('device sign-in helpers', () => {
  it.each([
    ['error', true],
    ['expired', true],
    ['polling', false],
  ] as const)('treats %s as failed: %s', (status, failed) => {
    expect(isFailedStatus(status)).toBe(failed);
  });

  it.each([
    ['idle', null, ''],
    ['requesting', null, 'Requesting login code...'],
    ['polling', 'ignored', 'Scan the QR code to sign in on another device'],
    ['success', null, 'Login successful! Loading your profile...'],
    ['expired', null, 'Login code expired. Refreshing...'],
    ['expired', '', 'Login code expired. Refreshing...'],
    ['error', null, 'An error occurred. Please try again.'],
    ['error', 'Login failed: access_denied', 'Login failed: access_denied'],
  ] as const)('describes %s with error %p as %p', (status, errorMessage, expected) => {
    expect(statusMessage(status, errorMessage)).toBe(expected);
  });

  it.each([
    [0, '0:00'],
    [-5000, '0:00'],
    [59_999, '0:59'],
    [60_000, '1:00'],
    [605_000, '10:05'],
  ])('formats %d ms as %s', (remainingMs, expected) => {
    expect(formatCountdown(remainingMs)).toBe(expected);
  });

  it('only counts down while polling with a known expiry', () => {
    expect(countdownLabel('polling', 120_000, 60_000)).toBe('1:00');
    expect(countdownLabel('polling', null, 0)).toBeNull();
    expect(countdownLabel('expired', 120_000, 0)).toBeNull();
  });

  it('builds sign-in params with an expiry from now and an optional refresh token', () => {
    const now = Date.UTC(2026, 0, 1);

    expect(toSignInParams(token, user, now)).toEqual({
      token: 'access',
      user,
      tokenExpiration: '2026-01-01T01:00:00.000Z',
    });
    expect(toSignInParams({ ...token, refreshToken: 'refresh' }, user, now)).toEqual({
      token: 'access',
      user,
      tokenExpiration: '2026-01-01T01:00:00.000Z',
      refreshToken: 'refresh',
    });
  });
});
