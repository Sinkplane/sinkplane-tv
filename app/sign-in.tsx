import type { ReactElement } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import bg from '@/assets/images/bg.jpg';
import { DeviceCodePanel } from '@/components/sign-in/DeviceCodePanel';
import { SignInInstructions } from '@/components/sign-in/SignInInstructions';
import { useDeviceSignIn } from '@/hooks/useDeviceSignIn';

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
  divider: {
    width: 2,
    height: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 30,
  },
});

export default function SignIn(): ReactElement {
  const { attachFlow, attachExpiryRestart, ...signIn } = useDeviceSignIn();

  return (
    <ImageBackground source={bg} style={styles.container} resizeMode="cover">
      <View ref={attachFlow} style={styles.container}>
        <View style={styles.contentContainer}>
          <DeviceCodePanel signIn={signIn} attachExpiryRestart={attachExpiryRestart} />
          <View style={styles.divider} />
          <SignInInstructions signIn={signIn} />
        </View>
      </View>
    </ImageBackground>
  );
}
