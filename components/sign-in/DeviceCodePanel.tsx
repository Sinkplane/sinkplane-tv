import type { ReactElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import type { MountCallback } from '@/hooks/useMountCallback';
import type { DeviceSignInState } from '@/hooks/useDeviceSignIn';

const QR_CODE_SIZE = 300;

const styles = StyleSheet.create({
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
    width: QR_CODE_SIZE,
    height: QR_CODE_SIZE,
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
});

interface QrCodeProps {
  readonly signIn: DeviceSignInState;
}

interface DeviceCodePanelProps extends QrCodeProps {
  readonly attachExpiryRestart: MountCallback;
}

function QrCode({ signIn }: QrCodeProps): ReactElement {
  if (signIn.verificationUriComplete !== null && signIn.status === 'polling') {
    return (
      <View style={styles.qrCodeContainer}>
        <QRCode
          value={signIn.verificationUriComplete}
          size={QR_CODE_SIZE}
          backgroundColor="#FFFFFF"
          color="#000000"
        />
      </View>
    );
  }
  return (
    <View style={styles.qrCodePlaceholder}>
      <Text style={styles.placeholderText}>
        {signIn.status === 'requesting' ? 'Generating QR Code...' : 'No QR Code'}
      </Text>
    </View>
  );
}

export function DeviceCodePanel({
  signIn,
  attachExpiryRestart,
}: DeviceCodePanelProps): ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.header}>Sign In to Floatplane</Text>
      <Text style={styles.description}>
        Use your phone or another device to scan the QR code and authenticate.
      </Text>
      <QrCode signIn={signIn} />
      {signIn.userCode !== null && (
        <View style={styles.userCodeContainer}>
          <Text style={styles.userCodeLabel}>Your code:</Text>
          <Text style={styles.userCode}>{signIn.userCode}</Text>
        </View>
      )}
      {signIn.timeRemaining !== null && (
        <Text style={styles.timer}>Time Remaining: {signIn.timeRemaining}</Text>
      )}
      <Text
        ref={signIn.status === 'expired' ? attachExpiryRestart : null}
        style={styles.statusText}
      >
        {signIn.message}
      </Text>
    </View>
  );
}
