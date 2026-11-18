import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { CreatorScrollView } from '@/components/home/CreatorScrollView';
import { loadMoreNearBottom } from '@/components/infinite-scroll';
import { presentOrUndefined } from '@/components/session-value';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FeedError, FeedLoadingMore, FeedSpinner } from '@/components/videos/FeedStatus';
import { VideoGrid } from '@/components/videos/VideoGrid';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import {
  type ContentHistoryEntry,
  useGetWatchHistoryInfinite,
  useSession,
} from '@sinkplane/shared';

interface HistoryEntriesProps {
  readonly entries: readonly ContentHistoryEntry[];
  readonly isFetchingNextPage: boolean;
}

function useHistoryScreenStyles() {
  const scale = useScale();
  return StyleSheet.create({
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACE.md * scale,
      marginBottom: SPACE.lg * scale,
      flexWrap: 'wrap',
    },
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACE.xl * scale,
      gap: SPACE.sm * scale,
    },
    loadingText: {
      marginTop: SPACE.sm * scale,
    },
  });
}

function HistoryEntries({ entries, isFetchingNextPage }: HistoryEntriesProps): ReactElement | null {
  const styles = useHistoryScreenStyles();
  if (entries.length === 0) {
    return null;
  }
  return (
    <>
      <VideoGrid
        videos={entries.map((entry) => entry.blogPost)}
        progressMap={Object.fromEntries(entries.map((entry) => [entry.contentId, entry.progress]))}
      />
      <FeedLoadingMore
        visible={isFetchingNextPage}
        label="Loading more history..."
        style={styles.centerContainer}
        textStyle={styles.loadingText}
      />
    </>
  );
}

function EmptyHistory({ visible }: { readonly visible: boolean }): ReactElement | null {
  const styles = useHistoryScreenStyles();
  if (!visible) {
    return null;
  }
  return (
    <ThemedView style={styles.centerContainer}>
      <ThemedText type="title">No watch history found</ThemedText>
      <ThemedText>Watch some videos and they will show up here</ThemedText>
    </ThemedView>
  );
}

export default function HistoryScreen(): ReactElement {
  const styles = useHistoryScreenStyles();
  const { creator, token, tokenExpiration } = useSession();
  const query = useGetWatchHistoryInfinite(
    presentOrUndefined(token),
    presentOrUndefined(tokenExpiration),
  );
  const entries = query.data?.pages.flat() ?? [];

  return (
    <CreatorScrollView
      creator={creator}
      onScroll={(event) => {
        loadMoreNearBottom(query, event);
      }}
    >
      <ThemedView>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Watch History</ThemedText>
        </ThemedView>
        <FeedSpinner visible={query.isLoading} style={styles.centerContainer} />
        <FeedError
          error={query.error}
          label="Error loading history"
          style={styles.centerContainer}
        />
        <HistoryEntries entries={entries} isFetchingNextPage={query.isFetchingNextPage} />
        <EmptyHistory visible={entries.length === 0 && !query.isLoading} />
      </ThemedView>
    </CreatorScrollView>
  );
}
