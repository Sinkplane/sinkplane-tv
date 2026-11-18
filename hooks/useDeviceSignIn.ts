import { type OIDCStatus, useOIDCDeviceFlow } from '@sinkplane/shared';

import { countdownLabel, statusMessage } from '@/constants/device-sign-in';
import { useCompleteDeviceSignIn } from '@/hooks/useCompleteDeviceSignIn';
import { type MountCallback, useMountCallback } from '@/hooks/useMountCallback';
import { useNow } from '@/hooks/useNow';

const RESTART_DELAY_MS = 2000;

export interface DeviceSignInState {
  readonly status: OIDCStatus;
  readonly userCode: string | null;
  readonly verificationUriComplete: string | null;
  readonly timeRemaining: string | null;
  readonly message: string;
  readonly restart: () => void;
  readonly requestNewCode: () => void;
}

export interface DeviceSignIn extends DeviceSignInState {
  readonly attachFlow: MountCallback;
  readonly attachExpiryRestart: MountCallback;
}

export function useDeviceSignIn(): DeviceSignIn {
  const flow = useOIDCDeviceFlow();
  const now = useNow();
  useCompleteDeviceSignIn(flow.tokenResponse);

  const restart = (): void => {
    void flow.startFlow();
  };
  const attachFlow = useMountCallback(() => {
    void flow.startFlow();
    return flow.cancel;
  });
  const attachExpiryRestart = useMountCallback(() => {
    const timer = setTimeout(restart, RESTART_DELAY_MS);
    return () => {
      clearTimeout(timer);
    };
  });

  return {
    status: flow.status,
    userCode: flow.userCode,
    verificationUriComplete: flow.verificationUriComplete,
    timeRemaining: countdownLabel(flow.status, flow.expiresAt, now),
    message: statusMessage(flow.status, flow.errorMessage),
    attachFlow,
    attachExpiryRestart,
    restart,
    requestNewCode: () => {
      flow.cancel();
      restart();
    },
  };
}
