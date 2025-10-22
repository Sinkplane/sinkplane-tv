import { SplashScreen } from 'expo-router';
import { useSession } from '@/hooks/authentication/auth.context';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
