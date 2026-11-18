import type { ReactElement } from 'react';
import { View } from 'react-native';

import { alertLaunchError } from '@/components/videos/launch-error';

const alertOnAttach = (node: View | null): void => {
  if (node !== null) {
    alertLaunchError();
  }
};

export const PlaybackErrorAlert = (): ReactElement => (
  <View testID="video-launch-error" ref={alertOnAttach} />
);
