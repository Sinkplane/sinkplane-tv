import type { ReactElement } from 'react';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useColorScheme,
  SessionProvider,
  useSession,
  ThemeProvider as AppThemeProvider,
} from '@sinkplane/shared';

import { SplashScreenController } from '@/components/SplashScreenController';

const QUERY_RETRIES = 2;

void SplashScreen.preventAutoHideAsync();

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRIES,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout(): ReactElement {
  return (
    <AppThemeProvider>
      <RootNavigation />
    </AppThemeProvider>
  );
}

function RootNavigation(): ReactElement {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SessionProvider>
          <SplashScreenController />
          <RootNavigator />
        </SessionProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootNavigator(): ReactElement {
  const { token } = useSession();
  const signedIn = (token ?? '').length > 0;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
