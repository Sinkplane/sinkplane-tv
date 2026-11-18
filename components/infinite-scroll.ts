import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const NEAR_BOTTOM_DISTANCE = 1000;

export type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export interface PagedQuery {
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly fetchNextPage: (options: { cancelRefetch: boolean }) => Promise<unknown>;
}

function isNearBottom(event: ScrollEvent): boolean {
  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - NEAR_BOTTOM_DISTANCE;
}

export function loadMoreNearBottom(query: PagedQuery, event: ScrollEvent): void {
  if (isNearBottom(event) && query.hasNextPage && !query.isFetchingNextPage) {
    void query.fetchNextPage({ cancelRefetch: false });
  }
}
