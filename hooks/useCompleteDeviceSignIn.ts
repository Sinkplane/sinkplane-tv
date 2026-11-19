import { skipToken, useQuery } from '@tanstack/react-query';
import { fetchProfile, useSession, type TokenResponse, type User } from '@sinkplane/shared';

import { type SignInParams, toSignInParams } from '@/constants/device-sign-in';
import { logError } from '@/constants/log';

const LOGIN_RETRIES = 2;

function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'id' in value;
}

function reportLoginFailure(error: unknown): false {
  logError('[SignIn] Login failed:', error);
  return false;
}

async function completeSignIn(
  tokenResponse: TokenResponse,
  signIn: (params: SignInParams) => void,
): Promise<string> {
  const profile = await fetchProfile(tokenResponse.accessToken);
  const user: unknown = profile.selfUser;
  if (!isUser(user)) {
    throw new Error('No user data returned from profile');
  }
  signIn(toSignInParams(tokenResponse, user, Date.now()));
  return user.id;
}

export function useCompleteDeviceSignIn(tokenResponse: TokenResponse | null): boolean {
  const { signIn } = useSession();
  const { isError } = useQuery({
    queryKey: ['device-sign-in', tokenResponse?.accessToken],
    queryFn: tokenResponse === null ? skipToken : () => completeSignIn(tokenResponse, signIn),
    gcTime: 0,
    retry: (failureCount, error) => failureCount < LOGIN_RETRIES || reportLoginFailure(error),
  });
  return isError;
}
