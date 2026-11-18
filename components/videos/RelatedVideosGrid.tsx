import type { ReactElement } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGetRelatedVideos, type Video } from '@sinkplane/shared';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VideoCard } from '@/components/videos/VideoCard';
import { BORDER_WIDTH, FONT_SIZE, ICON_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';

const EMPTY_STATE_PADDING = 60;
const FOCUSED_COLOR = '#000';
const IDLE_COLOR = '#fff';

interface RelatedVideosGridProps {
  readonly videoId: string;
  readonly token: string | undefined;
  readonly tokenExpiration: string | undefined;
  readonly onReplay: () => void;
}

interface RelatedVideosState {
  readonly videos: Video[] | undefined;
  readonly isLoading: boolean;
  readonly failed: boolean;
}

const createStyles = (scale: number) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      zIndex: 50,
    },
    scrollContent: {
      padding: SPACE.xxl * scale,
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACE.lg * scale,
      backgroundColor: 'transparent',
    },
    headerTitle: {
      fontSize: FONT_SIZE.display * scale,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACE.md * scale,
      alignItems: 'stretch',
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: EMPTY_STATE_PADDING * scale,
    },
  });

const createReplayStyles = (scale: number) =>
  StyleSheet.create({
    replayButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACE.sm * scale,
      paddingHorizontal: SPACE.xl * scale,
      paddingVertical: SPACE.md * scale,
      borderRadius: RADIUS.md * scale,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: BORDER_WIDTH.thin * scale,
      borderColor: 'transparent',
    },
    replayButtonFocused: {
      backgroundColor: '#fff',
      borderColor: '#007AFF',
    },
    replayText: {
      fontSize: FONT_SIZE.body * scale,
      fontWeight: '600',
    },
  });

const useStyles = (): ReturnType<typeof createStyles> => createStyles(useScale());

const ReplayButton = ({ onReplay }: { readonly onReplay: () => void }): ReactElement => {
  const scale = useScale();
  const styles = createReplayStyles(scale);
  return (
    <Pressable
      onPress={onReplay}
      hasTVPreferredFocus
      style={({ focused }) => [styles.replayButton, focused && styles.replayButtonFocused]}
    >
      {({ focused }) => {
        const color = focused ? FOCUSED_COLOR : IDLE_COLOR;
        return (
          <>
            <Ionicons name="refresh" size={ICON_SIZE.md * scale} color={color} />
            <ThemedText lightColor={color} darkColor={color} style={styles.replayText}>
              Replay
            </ThemedText>
          </>
        );
      }}
    </Pressable>
  );
};

const CenteredState = ({ children }: { readonly children: ReactElement }): ReactElement => {
  const styles = useStyles();
  return <View style={styles.centerState}>{children}</View>;
};

const RelatedVideosBody = ({
  videos,
  isLoading,
  failed,
}: RelatedVideosState): ReactElement | null => {
  const styles = useStyles();
  if (isLoading) {
    return (
      <CenteredState>
        <ActivityIndicator size="large" />
      </CenteredState>
    );
  }
  if (failed) {
    return (
      <CenteredState>
        <ThemedText>Couldn&apos;t load related videos.</ThemedText>
      </CenteredState>
    );
  }
  if (videos === undefined) {
    return null;
  }
  if (videos.length === 0) {
    return (
      <CenteredState>
        <ThemedText>No related videos found.</ThemedText>
      </CenteredState>
    );
  }
  return (
    <View style={styles.grid}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </View>
  );
};

export const RelatedVideosGrid = ({
  videoId,
  token,
  tokenExpiration,
  onReplay,
}: RelatedVideosGridProps): ReactElement => {
  const styles = useStyles();
  const { data, isLoading, error } = useGetRelatedVideos(token, tokenExpiration, videoId);

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Up Next
          </ThemedText>
          <ReplayButton onReplay={onReplay} />
        </ThemedView>
        <RelatedVideosBody videos={data} isLoading={isLoading} failed={error !== null} />
      </ScrollView>
    </View>
  );
};
