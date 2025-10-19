import { use, Dispatch, createContext, PropsWithChildren } from 'react';

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
  isLoading: false
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

  return (
    <AuthContext
      value={{
        signIn: ({ token, user, subscriptions }) => {
          // Perform sign-in logic here
          setToken(token);
        },
        signOut: () => {
          setToken(null);
        },
        token,
        isLoading
      }}
    >
      {children}
    </AuthContext>
  );
}
