import { Pressable, View, Text, StyleSheet, ImageBackground } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useSession } from '@/hooks/authentication/auth.context';
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/colors';
import { useGetProfile } from '@/hooks/authentication/useGetProfile';
import { useOIDCDeviceFlow } from '@/hooks/authentication/useOIDCDeviceFlow';

import bg from '@/assets/images/bg.jpg';

export default function SignIn() {
  const { signIn } = useSession();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { status, startFlow, cancel, userCode, verificationUriComplete, expiresAt, errorMessage, tokenResponse } = useOIDCDeviceFlow();
  const [timeRemaining, setTimeRemaining] = useState('');

  const { refetch: refetchProfile } = useGetProfile(tokenResponse?.accessToken ?? undefined);

  // Auto-start the OIDC device flow on mount
  useEffect(() => {
    startFlow();
    return () => {
      cancel();
    };
  }, [startFlow, cancel]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || status !== 'polling') {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, status]);

  // Handle OIDC success - fetch profile and sign in
  useEffect(() => {
    if (status !== 'success' || !tokenResponse || isLoggingIn) return;

    const handleLogin = async () => {
      setIsLoggingIn(true);
      try {
        const profileResult = await refetchProfile();

        if (profileResult.error) {
          throw new Error('Failed to fetch profile with the provided token');
        }

        if (!profileResult.data?.selfUser) {
          throw new Error('No user data returned from profile');
        }

        const tokenExpiration = new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString();

        signIn({
          token: tokenResponse.accessToken,
          user: profileResult.data.selfUser,
          tokenExpiration,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[SignIn] Login failed:', error);
      } finally {
        setIsLoggingIn(false);
      }
    };

    handleLogin();
  }, [status, tokenResponse, isLoggingIn, refetchProfile, signIn]);

  // Auto-restart on expiration
  useEffect(() => {
    if (status === 'expired') {
      const timer = setTimeout(() => {
        startFlow();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, startFlow]);

  const getStatusMessage = () => {
    switch (status) {
      case 'requesting':
        return 'Requesting login code...';
      case 'polling':
        return 'Scan the QR code to sign in on another device';
      case 'success':
        return 'Login successful! Loading your profile...';
      case 'expired':
        return errorMessage || 'Login code expired. Refreshing...';
      case 'error':
        return errorMessage || 'An error occurred. Please try again.';
      default:
        return '';
    }
  };

  return (
    <ImageBackground source={bg} style={styles.container} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {/* QR Code Section */}
          <View style={styles.section}>
            <Text style={styles.header}>Sign In to Floatplane</Text>
            <Text style={styles.description}>Use your phone or another device to scan the QR code and authenticate.</Text>

            {/* QR Code */}
            {verificationUriComplete && status === 'polling' ? (
              <View style={styles.qrCodeContainer}>
                <QRCode value={verificationUriComplete} size={300} backgroundColor="#FFFFFF" color="#000000" />
              </View>
            ) : (
              <View style={styles.qrCodePlaceholder}>
                <Text style={styles.placeholderText}>{status === 'requesting' ? 'Generating QR Code...' : 'No QR Code'}</Text>
              </View>
            )}

            {/* User Code Display */}
            {userCode && (
              <View style={styles.userCodeContainer}>
                <Text style={styles.userCodeLabel}>Your code:</Text>
                <Text style={styles.userCode}>{userCode}</Text>
              </View>
            )}

            {/* Timer */}
            {timeRemaining ? <Text style={styles.timer}>Time Remaining: {timeRemaining}</Text> : null}

            {/* Status */}
            <Text style={styles.statusText}>{getStatusMessage()}</Text>
          </View>

          {/* Vertical Divider */}
          <View style={styles.divider} />

          {/* Instructions Section */}
          <View style={styles.section}>
            <Text style={styles.instructionsHeader}>How to Sign In</Text>
            <View style={styles.stepsContainer}>
              <Text style={styles.step}>1. Scan the QR code with your phone's camera</Text>
              <Text style={styles.step}>2. Or visit floatplane.com/link on another device</Text>
              <Text style={styles.step}>3. Enter the code shown on this screen</Text>
              <Text style={styles.step}>4. Complete the login on the other device</Text>
            </View>

            {/* Retry Button */}
            {(status === 'error' || status === 'expired') && (
              <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={startFlow}>
                <Text style={styles.buttonText}>Try Again</Text>
              </Pressable>
            )}

            {/* Cancel Button during polling */}
            {status === 'polling' && (
              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
                onPress={() => {
                  cancel();
                  startFlow();
                }}
              >
                <Text style={styles.cancelButtonText}>Get New Code</Text>
              </Pressable>
            )}
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
    padding: 40,
  },
  contentContainer: {
    flexDirection: 'row',
    maxWidth: 1000,
    width: '100%',
    alignItems: 'center',
  },
  section: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  header: {
    fontSize: 44,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#fff',
  },
  description: {
    fontSize: 22,
    marginBottom: 30,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '800',
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  qrCodePlaceholder: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
  userCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  userCodeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 22,
    marginRight: 12,
  },
  userCode: {
    color: '#fff',
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  timer: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  divider: {
    width: 2,
    height: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 30,
  },
  instructionsHeader: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#fff',
  },
  stepsContainer: {
    marginBottom: 30,
  },
  step: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 18,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonPressed: {
    borderColor: '#fff',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
});
