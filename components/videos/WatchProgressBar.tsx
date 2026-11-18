import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { watchedFraction } from '@/components/videos/video-format';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';

interface WatchProgressBarProps {
  readonly progress: number | undefined;
  readonly duration: number;
  readonly testID?: string;
}

const staticStyles = StyleSheet.create({
  track: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bar: {
    height: '100%',
    width: '100%',
    backgroundColor: '#FF0000',
    transformOrigin: 'left',
  },
});

export function WatchProgressBar({
  progress,
  duration,
  testID,
}: WatchProgressBarProps): ReactElement | null {
  const scale = useScale();
  if (progress === undefined || progress <= 0) {
    return null;
  }
  return (
    <View style={[staticStyles.track, { height: SPACE.xs * scale }]}>
      <View
        testID={testID}
        style={[staticStyles.bar, { transform: [{ scaleX: watchedFraction(progress, duration) }] }]}
      />
    </View>
  );
}
