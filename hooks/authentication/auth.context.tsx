import { use, createContext, PropsWithChildren, useState, useEffect } from 'react';

import { Subscription } from '@/types/subscriptions.interface';
import { User } from '@/types/user.interface';
import { useStorageState } from '../storage/useStorageState';
import { Creator } from '@/types/creator-list.interface';
import { useGetSubscriptions } from './useGetSubscription';
import { useGetProfile } from './useGetProfile';
import { API_BASE_URL } from '@/constants/api';

interface SignInParams {
  token: string;
  user: User;
}

export interface AuthState {
  user?: User;
  subscriptions?: Subscription[];
  subscription?: Subscription;
  creators?: Creator[];
  creator?: Creator;
  token?: string | null;
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
  const [[tokenLoading, token], setToken] = useStorageState('token');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User>();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>();
  const [subscription, setSubscription] = useState<Subscription>();
  const [creators, setCreators] = useState<Creator[]>();
  const [creator, setCreator] = useState<Creator>();
  const { refetch: refetchSubscriptions } = useGetSubscriptions(token ?? undefined);
  const { refetch: refetchProfile } = useGetProfile(token ?? undefined);

  useEffect(() => {
    if (token && !tokenLoading) {
      const fetchData = async () => {
        try {
          // Fetch profile
          const profileResult = await refetchProfile();
          if (profileResult.error) {
            console.error('[Auth] Error fetching profile:', profileResult.error);
            // Invalid token - clear it
            setToken(undefined);
            return;
          }

          if (profileResult.data?.selfUser) {
            setUser(profileResult.data.selfUser);
          } else {
            console.error('[Auth] No user data in profile result');
          }

          // Fetch subscriptions
          const subscriptionsResult = await refetchSubscriptions();
          if (subscriptionsResult.error) {
            console.error('[Auth] Error fetching subscriptions:', subscriptionsResult.error);
            // Invalid token - clear it
            setToken(undefined);
            return;
          }

          if (subscriptionsResult.data && Array.isArray(subscriptionsResult.data)) {
            setSubscriptions(subscriptionsResult.data);
            if (subscriptionsResult.data.length) setSubscription(subscriptionsResult.data[0]);

            // Fetch creators for the subscriptions
            const creatorIds = subscriptionsResult.data.map(sub => sub.creator);
            if (creatorIds.length > 0) {
              const params = new URLSearchParams();
              creatorIds.forEach((id, index) => params.append(`ids[${index}]`, id));

              try {
                const response = await fetch(`${API_BASE_URL}/api/v3/creator/list?${params.toString()}`, {
                  method: 'GET',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json',
                    Cookie: `sails.sid=${token}`,
                  },
                });

                if (response.ok) {
                  const creatorData = await response.json();
                  setCreators(creatorData);
                  if (creatorData.length) setCreator(creatorData[0]);
                } else {
                  console.error('[Auth] Failed to fetch creators:', response.status);
                }
              } catch (error) {
                console.error('[Auth] Error fetching creators:', error);
              }
            }
          } else {
            console.error('[Auth] No subscriptions data in result or data is not an array:', subscriptionsResult.data);
          }
        } catch (error) {
          console.error('[Auth] Error fetching user data:', error);
          // Clear token on error
          setToken(undefined);
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
  }, [token, tokenLoading, refetchProfile, refetchSubscriptions]);

  const signIn = async ({ token: t, user: u }: SignInParams) => {
    // Perform sign-in logic here
    setToken(t);
    setUser(u);

    // Fetch subscriptions
    const { data } = await refetchSubscriptions();
    if (data) {
      setSubscriptions(data);
      if (data.length) setSubscription(data[0]);
    }
  };
  const signOut = () => {
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
        user,
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
