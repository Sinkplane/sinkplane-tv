import { use, createContext, PropsWithChildren, useState, useEffect } from 'react';
import CookieManager from '@react-native-cookies/cookies';

import { Subscription } from '@/types/subscriptions.interface';
import { User } from '@/types/user.interface';
import { useStorageState } from '../storage/useStorageState';
import { Creator } from '@/types/creator-list.interface';
import { fetchSubscriptions } from './useGetSubscription';
import { fetchCreatorList } from './useGetCreatorList';

interface SignInParams {
  token: string;
  user: User;
  tokenExpiration?: Date | string;
}

export interface AuthState {
  user?: User;
  subscriptions?: Subscription[];
  subscription?: Subscription;
  creators?: Creator[];
  creator?: Creator;
  token?: string | null;
  tokenExpiration?: string | null;
  signIn: (params: SignInParams) => void;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({
  signIn: _ => null,
  signOut: () => null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[tokenLoading, token], setToken] = useStorageState('fptoken');
  const [[tokenExpirationLoading, tokenExpiration], setTokenExpiration] = useStorageState('fptokenExpiration');
  const [[userLoading, user], setUser] = useStorageState('fpuser');
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>();
  const [subscription, setSubscription] = useState<Subscription>();
  const [creators, setCreators] = useState<Creator[]>();
  const [creator, setCreator] = useState<Creator>();

  const handleFetchErr = (err?: Error | unknown) => {
    console.error('[Auth] Error during data fetch:', err);
    setToken(undefined);
    setUser(undefined);
    return err;
  };

  const fetchSubscriptionCreators = async (t: string, te?: string) => {
    // Fetch subscriptions`
    const subscriptionsResult = await fetchSubscriptions(t, te);
    if (!subscriptionsResult || subscriptionsResult.length === 0) return handleFetchErr('No subscriptions found');

    setSubscriptions(subscriptionsResult);
    setSubscription(subscriptionsResult[0]);
    // Fetch creators for the subscriptions
    const creatorIds = subscriptionsResult.map(sub => sub.creator);
    const creatorsListResult = await fetchCreatorList(t, te, creatorIds);
    if (!creatorsListResult || creatorsListResult.length === 0) {
      return handleFetchErr('No creators found');
    }

    setCreators(creatorsListResult);
    setCreator(creatorsListResult[0]);
  };

  useEffect(() => {
    if (token && !tokenLoading && !userLoading && !tokenExpirationLoading) {
      const fetchData = async () => {
        console.info('[Auth] Starting to fetch data...');
        try {
          // Restore cookie to CookieManager on app startup
          await CookieManager.set('https://www.floatplane.com', {
            name: 'sails.sid',
            value: token,
            domain: '.floatplane.com',
            path: '/',
            expires: tokenExpiration || undefined,
            secure: true,
            httpOnly: true,
          });
          console.info('[Auth] Cookie restored to CookieManager');

          await fetchSubscriptionCreators(token, tokenExpiration || undefined);
        } catch (error) {
          handleFetchErr(error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else if (!token && !tokenLoading) {
      setUser(undefined);
      setSubscriptions(undefined);
      setSubscription(undefined);
      setCreators(undefined);
      setCreator(undefined);
      setIsLoading(false);
    } else {
      console.info('[Auth] Waiting for token to load...');
    }
  }, [token, tokenLoading, setToken]);

  const signIn = async ({ token: t, user: u, tokenExpiration: tE }: SignInParams) => {
    try {
      console.info('[Auth] Signing in user:', u);

      // The token is the actual cookie value (not the full cookie object)
      // The companion app parses the cookie object and sends us the value
      // The tokenExpiration is the cookie's expires field
      setToken(t);
      setUser(JSON.stringify(u));
      setTokenExpiration(tE && typeof tE === 'string' ? tE : tE instanceof Date ? tE.toISOString() : undefined);

      // Fetch subscriptions using the cookie value
      const safeExpiration = tE && typeof tE === 'string' ? tE : tE instanceof Date ? tE.toISOString() : undefined;
      await fetchSubscriptionCreators(t, safeExpiration);
      setIsLoading(false);
    } catch (error) {
      console.error('[Auth] Error during sign-in:', error);
      handleFetchErr(error);
    }
  };
  const signOut = async () => {
    // Clear cookies from CookieManager
    try {
      await CookieManager.clearAll();
      console.info('[Auth] Cleared all cookies from CookieManager');
    } catch (error) {
      console.error('[Auth] Error clearing cookies:', error);
    }
    
    setToken(undefined);
    setUser(undefined);
    setSubscriptions(undefined);
    setCreators(undefined);
    setCreator(undefined);
  };

  return (
    <AuthContext
      value={{
        signIn,
        signOut,
        token,
        tokenExpiration,
        user: user ? JSON.parse(user) : undefined,
        subscriptions,
        subscription,
        creators,
        creator,
        isLoading,
      }}
    >
      {children}
    </AuthContext>
  );
}
