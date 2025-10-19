import { use, createContext, PropsWithChildren } from 'react';

import { ISubscription } from './subscriptions.interface';
import { IUser } from './user.interface';
import { useStorageState } from '../storage/use-storage-state.hook';

interface SignInParams {
  token: string;
  user: IUser;
  subscriptions: ISubscription[];
}

export interface AuthState {
  user?: IUser;
  subscriptions?: ISubscription[];
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

  return (
    <AuthContext
      value={{
        signIn: ({ token: t, user: u, subscriptions: s }) => {
          // Perform sign-in logic here
          setToken(t);
          setUser(JSON.stringify(u));
          setSubscriptions(JSON.stringify(s));
        },
        signOut: () => {
          setToken(null);
          setUser(null);
          setSubscriptions(null);
        },
        token,
        user: user ? JSON.parse(user) : undefined,
        subscriptions: subscriptions ? JSON.parse(subscriptions) : undefined,
        isLoading,
      }}
    >
      {children}
    </AuthContext>
  );
}
