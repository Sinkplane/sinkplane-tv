import { Alert, Button, Text, TextInput, View, ActivityIndicator } from 'react-native';

import { useSession } from '@/hooks/authentication/auth.context';
import { useGetCaptchaInfo } from '@/hooks/authentication/use-get-capcha-info.hook';
import TurnstileWebView from '@/components/authentication/TurnstileWebview';
import { useState } from 'react';

export default function SignIn() {
  const { signIn } = useSession();
  const { data: captchaInfo, isLoading: isCaptchaLoading, error: captchaError } = useGetCaptchaInfo();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const reset = () => {
    setIsVerified(false);
    setUsername('');
    setPassword('');
    setToken('');
  };

  const handleLogin = async () => {
    if (!isVerified || !token) {
      Alert.alert('Error', 'Please complete the CAPTCHA verification');
      return;
    }

    try {
      console.info(username, password, token);
      //   const response = await authStore.login({
      //     username,
      //     password,
      //     captchaToken: turnstileManager.token,
      //     rememberMe: true,
      //   });
      //   if (response.success) {
      //     // Navigate to main app
      //     navigation.navigate('Main');
      //   } else if (response.needs2FA) {
      //     // Navigate to 2FA screen
      //     navigation.navigate('TwoFactorAuth');
      //   }
    } catch (error) {
      Alert.alert('Login Failed');
      // Reset the Turnstile challenge on failure
      reset();
    }
  };

  if (isCaptchaLoading) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading captcha...</Text>
      </View>
    );
  }

  if (captchaError || !captchaInfo) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading captcha. Please try again.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />

      <TurnstileWebView
        siteKey={captchaInfo.siteKey}
        theme="light"
        onSuccess={captchaToken => {
          setToken(captchaToken);
          setIsVerified(true);
        }}
        onError={() => {
          Alert.alert('Error', 'Captcha verification failed');
          reset();
        }}
        onExpire={() => {
          setIsVerified(false);
          setToken('');
        }}
        onTimeout={() => {
          Alert.alert('Error', 'Captcha verification timed out');
          reset();
        }}
      />

      <Button title="Login" onPress={handleLogin} disabled={!isVerified} />
    </View>
  );
}
