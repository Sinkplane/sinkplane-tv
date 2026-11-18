import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FeedError, FeedLoadingMore, FeedSpinner } from '@/components/videos/FeedStatus';
import type { VideoFeed } from '@/components/videos/useVideoFeed';
import { VideoGrid } from '@/components/videos/VideoGrid';
import { VideoListItem } from '@/components/videos/VideoList';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';

export type VideoView = 'card' | 'list';

interface VideosProps {
  readonly feed: VideoFeed;
  readonly view: VideoView;
}

function useVideosStyles() {
  const scale = useScale();
  return StyleSheet.create({
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACE.xl * scale,
    },
    videosContainer: {
      marginTop: SPACE.lg * scale,
    },
    loadingText: {
      marginTop: SPACE.sm * scale,
    },
  });
}

function VideoResults({ feed, view }: VideosProps): ReactElement {
  const styles = useVideosStyles();
  if (view === 'card') {
    return <VideoGrid videos={feed.videos} progressMap={feed.progressMap} />;
  }
  return (
    <ThemedView style={styles.videosContainer}>
      {feed.videos.map((video) => (
        <VideoListItem key={video.id} video={video} progress={feed.progressMap[video.id]} />
      ))}
    </ThemedView>
  );
}

function NoVideos({
  style,
}: {
  readonly style: ReturnType<typeof useVideosStyles>['centerContainer'];
}): ReactElement {
  return (
    <ThemedView style={style}>
      <ThemedText>No videos found</ThemedText>
    </ThemedView>
  );
}

export function Videos({ feed, view }: VideosProps): ReactElement {
  const styles = useVideosStyles();
  const hasVideos = feed.videos.length > 0;

  return (
    <ThemedView>
      <FeedSpinner visible={feed.isLoading} style={styles.centerContainer} />
      <FeedError error={feed.error} label="Error loading videos" style={styles.centerContainer} />
      {hasVideos && <VideoResults feed={feed} view={view} />}
      <FeedLoadingMore
        visible={hasVideos && feed.isFetchingNextPage}
        label="Loading more videos..."
        style={styles.centerContainer}
        textStyle={styles.loadingText}
      />
      {!hasVideos && !feed.isLoading && <NoVideos style={styles.centerContainer} />}
    </ThemedView>
  );
}
