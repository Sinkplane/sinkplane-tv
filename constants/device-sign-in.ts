import type { AuthState, OIDCStatus, TokenResponse, User } from '@sinkplane/shared';

export type SignInParams = Parameters<AuthState['signIn']>[0];

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;
const SECONDS_DIGITS = 2;

const STATUS_MESSAGES: Record<OIDCStatus, string> = {
  idle: '',
  requesting: 'Requesting login code...',
  polling: 'Scan the QR code to sign in on another device',
  success: 'Login successful! Loading your profile...',
  expired: 'Login code expired. Refreshing...',
  error: 'An error occurred. Please try again.',
};

export const PROFILE_LOAD_ERROR = "Couldn't load your Floatplane profile. Please try again.";

export function isFailedStatus(status: OIDCStatus): boolean {
  return status === 'error' || status === 'expired';
}

export function statusMessage(status: OIDCStatus, errorMessage: string | null): string {
  if (isFailedStatus(status) && errorMessage !== null && errorMessage !== '') {
    return errorMessage;
  }
  return STATUS_MESSAGES[status];
}

export function formatCountdown(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs);
  const minutes = Math.floor(clamped / MS_PER_MINUTE);
  const seconds = Math.floor((clamped % MS_PER_MINUTE) / MS_PER_SECOND);
  return `${String(minutes)}:${String(seconds).padStart(SECONDS_DIGITS, '0')}`;
}

export function countdownLabel(
  status: OIDCStatus,
  expiresAt: number | null,
  now: number,
): string | null {
  if (status !== 'polling' || expiresAt === null) {
    return null;
  }
  return formatCountdown(expiresAt - now);
}

export function toSignInParams(
  tokenResponse: TokenResponse,
  user: User,
  now: number,
): SignInParams {
  const tokenExpiration = new Date(now + tokenResponse.expiresIn * MS_PER_SECOND).toISOString();
  const base = { token: tokenResponse.accessToken, user, tokenExpiration };
  return tokenResponse.refreshToken === undefined
    ? base
    : { ...base, refreshToken: tokenResponse.refreshToken };
}
