import {
  type AssDass,
  useGetVideoProgress,
  useGetVideosInfinite,
  type Video,
} from '@sinkplane/shared';

import type { PagedQuery } from '@/components/infinite-scroll';

const PAGE_SIZE = 20;

export interface VideoFeedSource {
  readonly token: string;
  readonly tokenExpiration: string | undefined;
  readonly creatorId: string;
  readonly channelId: string;
  readonly sort: AssDass;
}

export interface VideoFeed {
  readonly videos: readonly Video[];
  readonly progressMap: Readonly<Partial<Record<string, number>>>;
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly isFetchingNextPage: boolean;
  readonly query: PagedQuery;
}

export function useVideoFeed(source: VideoFeedSource): VideoFeed {
  const query = useGetVideosInfinite(source.token, source.tokenExpiration, {
    id: source.creatorId,
    channel: source.channelId,
    limit: PAGE_SIZE,
    sort: source.sort,
  });
  const videos = query.data?.pages.flat() ?? [];
  const { data: progress = [] } = useGetVideoProgress(
    source.token,
    videos.map((video) => video.id),
  );
  return {
    videos,
    progressMap: Object.fromEntries(progress.map((entry) => [entry.id, entry.progress])),
    isLoading: query.isLoading,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    query,
  };
}
