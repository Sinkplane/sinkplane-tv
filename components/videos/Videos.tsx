import { StyleSheet, ActivityIndicator } from 'react-native';
import { useRef, useEffect, type RefObject } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VideoCard } from '@/components/videos/VideoCard';
import { useScale } from '@/hooks/useScale';
import { useGetVideosInfinite } from '@/hooks/videos/useGetVideos';
import { Channel } from '@/types/creator-list.interface';
import { VideoListItem } from './VideoList';

interface VideosProps {
  channel: Channel;
  token: string;
  creatorId: string;
  view: VideoView;
  sort: AssDass;
  onFetchMoreRef?: RefObject<(() => void) | null>;
}

export enum AssDass {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum VideoView {
  CARD,
  LIST,
}

export const Videos = ({ token, creatorId, channel, view, onFetchMoreRef, sort }: VideosProps) => {
  const styles = useVideosStyles();
  const isLoadingMoreRef = useRef(false);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetVideosInfinite(token, {
    id: creatorId,
    channel: channel.id,
    limit: 20,
    sort,
  });

  // Expose the fetch more function to the parent via ref
  useEffect(() => {
    if (onFetchMoreRef) {
      onFetchMoreRef.current = () => {
        if (hasNextPage && !isFetchingNextPage && !isLoadingMoreRef.current) {
          isLoadingMoreRef.current = true;
          fetchNextPage().finally(() => {
            isLoadingMoreRef.current = false;
          });
        }
      };
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, onFetchMoreRef]);

  // Flatten all pages into a single array of videos
  const videos = data?.pages.flatMap(page => page) ?? [];

  return (
    <ThemedView>
      {isLoading && (
        <ThemedView style={styles.centerContainer}>
          <ActivityIndicator size="large" />
        </ThemedView>
      )}

      {error && (
        <ThemedView style={styles.centerContainer}>
          <ThemedText>Error loading videos: {error.message}</ThemedText>
        </ThemedView>
      )}

      {videos && videos.length > 0 && (
        <>
          <ThemedView style={view === VideoView.CARD ? styles.gridContainer : styles.videosContainer}>
            {videos.map(video =>
              view === VideoView.CARD ? <VideoCard key={video.id} video={video} /> : <VideoListItem key={video.id} video={video} />,
            )}
          </ThemedView>

          {isFetchingNextPage && (
            <ThemedView style={styles.centerContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={styles.loadingText}>Loading more videos...</ThemedText>
            </ThemedView>
          )}
        </>
      )}

      {videos && videos.length === 0 && !isLoading && (
        <ThemedView style={styles.centerContainer}>
          <ThemedText>No videos found</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
};

const useVideosStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20 * scale,
    },
    videosContainer: {
      marginTop: 16 * scale,
    },
    gridContainer: {
      marginTop: 16 * scale,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12 * scale,
      alignItems: 'stretch',
    },
    loadingText: {
      marginTop: 8 * scale,
    },
  });
};
