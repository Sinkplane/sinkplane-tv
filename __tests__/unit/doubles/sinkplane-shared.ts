import type { AuthState } from '@sinkplane/shared';

export { Colors } from '@sinkplane/shared/constants/colors';

const noop = (): void => undefined;

export const sessionDouble: { current: Partial<AuthState> } = { current: {} };

export const themeDouble = { toggleColorScheme: jest.fn() };

export const useSession = jest.fn((): Partial<AuthState> => ({
  signOut: noop,
  setCreator: noop,
  setSubscription: noop,
  ...sessionDouble.current,
}));

export const useTheme = jest.fn(() => themeDouble);

export const useColorScheme = jest.fn((): 'light' | 'dark' => 'light');

export const useThemeColor = jest.fn(
  (_props: object, colorName: string): string => `color:${colorName}`,
);
