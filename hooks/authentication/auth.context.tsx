import { use, createContext, PropsWithChildren } from 'react';

import { Subscription } from '@/types/subscriptions.interface';
import { User } from '@/types/user.interface';
import { useStorageState } from '../storage/useStorageState';
import { Creator } from '@/types/creator-list.interface';

interface SignInParams {
  token: string;
  user: User;
  subscriptions: Subscription[];
  channels: Creator[];
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
  const [[isLoading, token], setToken] = useStorageState('token');
  const [[, user], setUser] = useStorageState('user');
  const [[, subscriptions], setSubscriptions] = useStorageState('subscriptions');
  const [[, subscription], setSubscription] = useStorageState('subscription');
  const [[, creators], setCreators] = useStorageState('creators');
  const [[, creator], setCreator] = useStorageState('creator');

  return (
    <AuthContext
      value={{
        signIn: ({ token: t, user: u, subscriptions: s, channels: c }) => {
          // Perform sign-in logic here
          setToken(t);
          setUser(JSON.stringify(u));
          setSubscriptions(JSON.stringify(s));
          if (s.length) setSubscription(JSON.stringify(s[0]));
          setCreators(JSON.stringify(c));
          if (c.length) setCreator(JSON.stringify(c[0]));
        },
        signOut: () => {
          setToken(null);
          setUser(null);
          setSubscriptions(null);
        },
        token,
        user: user ? JSON.parse(user) : undefined,
        subscriptions: subscriptions ? JSON.parse(subscriptions) : undefined,
        subscription: subscription ? JSON.parse(subscription) : undefined,
        creators: creators ? JSON.parse(creators) : undefined,
        creator: creator ? JSON.parse(creator) : undefined,
        isLoading,
      }}
    >
      {children}
    </AuthContext>
  );
}
