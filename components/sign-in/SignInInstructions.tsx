import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@sinkplane/shared';

import { isFailedStatus } from '@/constants/device-sign-in';
import type { DeviceSignInState } from '@/hooks/useDeviceSignIn';

const STEPS = [
  "1. Scan the QR code with your phone's camera",
  '2. Or visit floatplane.com/link on another device',
  '3. Enter the code shown on this screen',
  '4. Complete the login on the other device',
];

const styles = StyleSheet.create({
  section: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: 'center',
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

interface SignInInstructionsProps {
  readonly signIn: DeviceSignInState;
}

export function SignInInstructions({ signIn }: SignInInstructionsProps): ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.instructionsHeader}>How to Sign In</Text>
      <View style={styles.stepsContainer}>
        {STEPS.map((step) => (
          <Text key={step} style={styles.step}>
            {step}
          </Text>
        ))}
      </View>
      {isFailedStatus(signIn.status) && (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={signIn.restart}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      )}
      {signIn.status === 'polling' && (
        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
          onPress={signIn.requestNewCode}
        >
          <Text style={styles.cancelButtonText}>Get New Code</Text>
        </Pressable>
      )}
    </View>
  );
}
