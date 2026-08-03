import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VideoCard } from '@/components/videos/VideoCard';
import { useScale } from '@/hooks/useScale';
import { useGetRelatedVideos } from '@/hooks/videos/useGetRelatedVideos';

interface RelatedVideosGridProps {
  videoId: string;
  token?: string;
  tokenExpiration?: string;
  onReplay?: () => void;
}

export const RelatedVideosGrid = ({ videoId, token, tokenExpiration, onReplay }: RelatedVideosGridProps) => {
  const scale = useScale();
  const styles = useStyles();

  const { data: relatedVideos, isLoading, error } = useGetRelatedVideos(token, tokenExpiration, videoId);

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Up Next
          </ThemedText>
          {onReplay && (
            <Pressable
              onPress={onReplay}
              hasTVPreferredFocus
              style={({ focused }) => [styles.replayButton, focused && styles.replayButtonFocused]}>
              {({ focused }) => (
                <>
                  <Ionicons name="refresh" size={18 * scale} color={focused ? '#000' : '#fff'} />
                  <ThemedText
                    lightColor={focused ? '#000' : '#fff'}
                    darkColor={focused ? '#000' : '#fff'}
                    style={styles.replayText}>
                    Replay
                  </ThemedText>
                </>
              )}
            </Pressable>
          )}
        </ThemedView>

        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" />
          </View>
        )}

        {error && (
          <View style={styles.centerState}>
            <ThemedText>Couldn't load related videos.</ThemedText>
          </View>
        )}

        {relatedVideos && relatedVideos.length > 0 && (
          <View style={styles.grid}>
            {relatedVideos.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </View>
        )}

        {relatedVideos && relatedVideos.length === 0 && !isLoading && (
          <View style={styles.centerState}>
            <ThemedText>No related videos found.</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const useStyles = () => {
  const scale = useScale();
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      zIndex: 50,
    },
    scrollContent: {
      padding: 24 * scale,
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16 * scale,
      backgroundColor: 'transparent',
    },
    headerTitle: {
      fontSize: 28 * scale,
    },
    replayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
      paddingHorizontal: 20 * scale,
      paddingVertical: 12 * scale,
      borderRadius: 8 * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 2 * scale,
      borderColor: 'transparent',
    },
    replayButtonFocused: {
      backgroundColor: '#fff',
      borderColor: '#007AFF',
    },
    replayText: {
      fontSize: 16 * scale,
      fontWeight: '600',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12 * scale,
      alignItems: 'stretch',
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60 * scale,
    },
  });
};
