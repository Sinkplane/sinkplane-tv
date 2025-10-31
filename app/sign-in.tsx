import { Alert, Pressable, TextInput, View, Text, StyleSheet, Image, ImageBackground } from 'react-native';

import { useSession } from '@/hooks/authentication/auth.context';
import { useState } from 'react';
import { Colors } from '@/constants/colors';
import { useGetProfile } from '@/hooks/authentication/useGetProfile';

import qrCode from '@/assets/images/qrcode.png';
import bg from '@/assets/images/bg.jpg';

export default function SignIn() {
  const { signIn } = useSession();
  const [token, setToken] = useState(process.env.EXPO_PUBLIC_DEFAULT_AUTH_TOKEN || '');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { refetch: refetchProfile } = useGetProfile(token ?? undefined);

  const reset = () => {
    setToken('');
  };

  const handleLogin = async () => {
    if (!token) return;

    setIsLoggingIn(true);
    try {
      // Fetch profile first to validate token
      const profileResult = await refetchProfile();

      console.info('Profile Result:', profileResult.data);

      if (profileResult.error) {
        throw new Error('Invalid token or failed to fetch profile');
      }

      if (!profileResult.data?.selfUser) {
        throw new Error('No user data returned from profile');
      }

      // Sign in with token and user data - auth context will handle the rest
      signIn({
        token,
        user: profileResult.data.selfUser,
      });
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Please check your token and try again.');
      reset();
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <ImageBackground source={bg} style={styles.container} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {/* Token Login Section */}
          <View style={styles.section}>
            <Text style={styles.header}>Sign In to Floatplane</Text>
            <Text style={styles.description}>Please enter your authentication token to continue.</Text>
            <TextInput
              style={styles.input}
              placeholder="Authentication Token"
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              secureTextEntry
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                (token === '' || isLoggingIn) && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={token === '' || isLoggingIn}
            >
              <Text style={styles.buttonText}>{isLoggingIn ? 'Logging in...' : 'Login'}</Text>
            </Pressable>
          </View>

          {/* Vertical Divider */}
          <View style={styles.divider} />

          {/* QR Code Section */}
          <View style={styles.section}>
            <Image source={qrCode} style={styles.qrCode} resizeMode="contain" />
            <Text style={styles.qrText}>
              Scan the QR code to download the Sinkplane Sidekick app and login without an authentication token.
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    flexDirection: 'row',
    maxWidth: 800,
    width: '100%',
    alignItems: 'center',
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#fff',
  },
  description: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 800,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  divider: {
    width: 1,
    height: 300,
    backgroundColor: '#ccc',
    marginHorizontal: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    maxWidth: 300,
    fontWeight: 800,
  },
  button: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: Colors.light.link,
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
