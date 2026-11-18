import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { VideoCard } from '@/components/videos/VideoCard';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { type Video } from '@sinkplane/shared';

interface VideoGridProps {
  readonly videos: readonly Video[];
  readonly progressMap: Readonly<Partial<Record<string, number>>>;
}

function useVideoGridStyles() {
  const scale = useScale();
  return StyleSheet.create({
    gridContainer: {
      marginTop: SPACE.lg * scale,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACE.md * scale,
      alignItems: 'stretch',
    },
  });
}

export function VideoGrid({ videos, progressMap }: VideoGridProps): ReactElement {
  const styles = useVideoGridStyles();

  return (
    <ThemedView style={styles.gridContainer}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} progress={progressMap[video.id]} />
      ))}
    </ThemedView>
  );
}
