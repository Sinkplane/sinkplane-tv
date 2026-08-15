import { Image, StyleSheet, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useCallback, useRef, useEffect, useMemo } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VideoGrid } from '@/components/videos/VideoGrid';
import { useScale } from '@/hooks/useScale';
import { useSession } from '@/hooks/authentication/auth.context';
import { useGetWatchHistoryInfinite } from '@/hooks/videos/useGetWatchHistory';

import bg from '@/assets/images/bg.jpg';

export default function HistoryScreen() {
  const styles = useHistoryScreenStyles();
  const { creator, token, tokenExpiration } = useSession();
  const fetchMoreRef = useRef<(() => void) | null>(null);
  const isLoadingMoreRef = useRef(false);

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetWatchHistoryInfinite(
    token ?? undefined,
    tokenExpiration ?? undefined,
  );

  const entries = useMemo(() => data?.pages.flatMap(page => page) ?? [], [data?.pages]);

  const videos = useMemo(() => entries.map(entry => entry.blogPost), [entries]);

  const progressMap = useMemo(
    () => Object.fromEntries(entries.map(entry => [entry.contentId, entry.progress])),
    [entries],
  );

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Calculate if we're near the bottom (within 1000 pixels)
    const paddingToBottom = 1000;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isNearBottom && fetchMoreRef.current) {
      fetchMoreRef.current();
    }
  }, []);

  useEffect(() => {
    fetchMoreRef.current = () => {
      if (hasNextPage && !isFetchingNextPage && !isLoadingMoreRef.current) {
        isLoadingMoreRef.current = true;
        fetchNextPage().finally(() => {
          isLoadingMoreRef.current = false;
        });
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image style={styles.headerImage} source={creator ? { uri: creator.cover.path } : bg} resizeMode="cover" />}
      onScroll={handleScroll}
    >
      <ThemedView>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Watch History</ThemedText>
        </ThemedView>

        {isLoading && (
          <ThemedView style={styles.centerContainer}>
            <ActivityIndicator size="large" />
          </ThemedView>
        )}

        {error && (
          <ThemedView style={styles.centerContainer}>
            <ThemedText>Error loading history: {error.message}</ThemedText>
          </ThemedView>
        )}

        {videos.length > 0 && (
          <>
            <VideoGrid videos={videos} progressMap={progressMap} />

            {isFetchingNextPage && (
              <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" />
                <ThemedText style={styles.loadingText}>Loading more history...</ThemedText>
              </ThemedView>
            )}
          </>
        )}

        {videos.length === 0 && !isLoading && (
          <ThemedView style={styles.centerContainer}>
            <ThemedText type="title">No watch history found</ThemedText>
            <ThemedText>Watch some videos and they will show up here</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const useHistoryScreenStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12 * scale,
      marginBottom: 16 * scale,
      flexWrap: 'wrap',
    },
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20 * scale,
      gap: 8 * scale,
    },
    loadingText: {
      marginTop: 8 * scale,
    },
    headerImage: {
      height: 178 * scale,
      width: '100%',
      bottom: 0,
      left: 0,
      position: 'absolute',
    },
  });
};
