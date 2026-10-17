import { SplashScreen } from 'expo-router';
import { useSession } from '@sinkplane/shared';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
