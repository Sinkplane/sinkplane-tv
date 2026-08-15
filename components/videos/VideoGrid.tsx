import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { VideoCard } from '@/components/videos/VideoCard';
import { useScale } from '@/hooks/useScale';
import { Video } from '@/types/video.interface';

interface VideoGridProps {
  videos: Video[];
  progressMap?: Record<string, number>;
}

export const VideoGrid = ({ videos, progressMap }: VideoGridProps) => {
  const styles = useVideoGridStyles();

  return (
    <ThemedView style={styles.gridContainer}>
      {videos.map(video => (
        <VideoCard key={video.id} video={video} progress={progressMap?.[video.id]} />
      ))}
    </ThemedView>
  );
};

const useVideoGridStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    gridContainer: {
      marginTop: 16 * scale,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12 * scale,
      alignItems: 'stretch',
    },
  });
};
