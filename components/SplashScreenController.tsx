import { SplashScreen } from 'expo-router';
import { useSession } from '@sinkplane/shared';

void SplashScreen.preventAutoHideAsync();

export function SplashScreenController(): null {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
