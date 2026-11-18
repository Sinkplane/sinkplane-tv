import { useFocusEffect, useIsFocused } from 'expo-router';
import { useState } from 'react';
import { Platform, ToastAndroid } from 'react-native';
import type { OnBufferData, OnVideoErrorData } from 'react-native-video';
import { useGetVideoDelivery, useSession, type VideoDelivery } from '@sinkplane/shared';

import { createLiveStreamTimers } from './live-stream-timers';
import { isSameStream, LIVESTREAM_ID, liveStreamUri, type LiveSource } from './live-stream-url';

const PLAYER_NOT_FOUND_CODE = -1100;
const LIVESTREAM_ERROR_TOAST = 'Error loading livestream. Please try again';

export type LiveCreator = ReturnType<typeof useSession>['creator'];
export type LivePlayerError = OnVideoErrorData['error'];

export interface LiveStatusState {
  readonly isChecking: boolean;
  readonly isFetching: boolean;
  readonly isNotLive: boolean;
  readonly errorMessage: string | undefined;
}

export interface LiveStream {
  readonly creator: LiveCreator;
  readonly source: LiveSource | null;
  readonly paused: boolean;
  readonly videoLoading: boolean;
  readonly playerError: LivePlayerError | null;
  readonly status: LiveStatusState;
  readonly onLoad: () => void;
  readonly onBuffer: (event: OnBufferData) => void;
  readonly onError: (event: OnVideoErrorData) => void;
  readonly refresh: () => void;
}

interface PlayerErrorState {
  readonly error: LivePlayerError;
  readonly delivery: VideoDelivery | undefined;
}

function liveStreamId(creator: LiveCreator): string {
  const id = creator?.liveStream?.id;
  return id === undefined || id === '' ? LIVESTREAM_ID : id;
}

function isPlayerNotFound(error: LivePlayerError | null): boolean {
  if (error === null) {
    return false;
  }
  return (
    error.code === PLAYER_NOT_FOUND_CODE ||
    (error.localizedDescription?.includes('not found') ?? false)
  );
}

function showLivestreamErrorToast(): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(LIVESTREAM_ERROR_TOAST, ToastAndroid.SHORT);
  }
}

function useFocusedLiveDelivery() {
  const isFocused = useIsFocused();
  const { creator, token, tokenExpiration } = useSession();
  const query = useGetVideoDelivery(
    isFocused ? (token ?? undefined) : undefined,
    isFocused ? (tokenExpiration ?? undefined) : undefined,
    liveStreamId(creator),
    true,
  );
  return { isFocused, creator, query };
}

function useStableSource(delivery: VideoDelivery | undefined): LiveSource | null {
  const [source, setSource] = useState<LiveSource | null>(null);
  const uri = delivery === undefined ? undefined : liveStreamUri(delivery);
  if (uri !== undefined && (source === null || !isSameStream(source.uri, uri))) {
    setSource({ uri });
  }
  return source;
}

function usePlayerError(delivery: VideoDelivery | undefined) {
  const [state, setState] = useState<PlayerErrorState | null>(null);
  if (state !== null && state.delivery !== delivery) {
    setState(null);
  }
  const report = (error: LivePlayerError): void => {
    setState({ error, delivery });
  };
  return { playerError: state?.error ?? null, report };
}

interface DeliveryStatus {
  readonly error: Error | null;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
}

function liveStatus(delivery: DeliveryStatus, playerNotFound: boolean): LiveStatusState {
  return {
    isChecking: delivery.isLoading || delivery.isFetching,
    isFetching: delivery.isFetching,
    isNotLive: (delivery.error?.message.includes('404') ?? false) || playerNotFound,
    errorMessage: delivery.error?.message,
  };
}

function usePlayerEvents(refetch: () => Promise<unknown>, delivery: VideoDelivery | undefined) {
  const [timers] = useState(() =>
    createLiveStreamTimers(() => {
      void refetch();
    }),
  );
  useFocusEffect(timers.whileFocused);
  const { playerError, report } = usePlayerError(delivery);
  const [videoLoading, setVideoLoading] = useState(true);
  return {
    playerError,
    videoLoading,
    onLoad: (): void => {
      setVideoLoading(false);
    },
    onBuffer: (event: OnBufferData): void => {
      setVideoLoading(event.isBuffering);
    },
    onError: (event: OnVideoErrorData): void => {
      report(event.error);
      setVideoLoading(false);
      showLivestreamErrorToast();
      timers.retrySoon();
    },
  };
}

export function useLiveStream(): LiveStream {
  const { isFocused, creator, query } = useFocusedLiveDelivery();
  const { data: delivery, refetch } = query;
  const source = useStableSource(delivery);
  const events = usePlayerEvents(refetch, delivery);
  const playerNotFound = isPlayerNotFound(events.playerError);
  const isLive = delivery !== undefined && query.error === null;

  return {
    ...events,
    creator,
    source: isLive && !playerNotFound ? source : null,
    paused: !isFocused,
    status: liveStatus(query, playerNotFound),
    refresh: () => {
      void refetch();
    },
  };
}
