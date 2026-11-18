import type { CaptionTrack, ReactVideoSource } from 'react-native-video';
import {
  useGetVideoDelivery,
  useGetVideoPost,
  useGetVideoProgress,
  type VideoAttachment,
  type VideoDelivery,
  type VideoPost,
} from '@sinkplane/shared';

import { toCaptionTracks } from '@/constants/caption-tracks';
import { playbackHeaders, resumePoint, streamMetadata, streamUri } from '@/constants/video-stream';
import {
  type PlaybackPreferenceProps,
  usePlaybackPreferences,
} from '@/hooks/usePlaybackPreferences';

export interface PlaybackSession {
  readonly token: string | undefined;
  readonly tokenExpiration: string | undefined;
}

export interface ReadyPlayback {
  readonly status: 'ready';
  readonly source: ReactVideoSource;
  readonly captionTracks: CaptionTrack[];
  readonly initialSeek: number;
  readonly preferences: Omit<PlaybackPreferenceProps, 'ready'>;
}

export type VideoPlayback =
  ReadyPlayback | { readonly status: 'loading' } | { readonly status: 'failed' };

interface StreamState {
  readonly uri: string | undefined;
  readonly unplayable: boolean;
}

const firstAttachment = (post: VideoPost | undefined): VideoAttachment | undefined =>
  post?.videoAttachments[0];

const toStreamState = (delivery: VideoDelivery | undefined): StreamState => {
  if (delivery === undefined) {
    return { uri: undefined, unplayable: false };
  }
  const uri = streamUri(delivery);
  return { uri, unplayable: uri === undefined };
};

const useVideoData = (
  id: string,
  { token, tokenExpiration }: PlaybackSession,
): {
  post: VideoPost | undefined;
  uri: string | undefined;
  failed: boolean;
  initialSeek: number;
} => {
  const post = useGetVideoPost(token, tokenExpiration, id);
  const delivery = useGetVideoDelivery(token, tokenExpiration, firstAttachment(post.data)?.guid);
  const { data: savedProgress } = useGetVideoProgress(token, [id]);
  const stream = toStreamState(delivery.data);
  return {
    post: post.data,
    uri: stream.uri,
    failed: post.error !== null || delivery.error !== null || stream.unplayable,
    initialSeek: resumePoint(post.data?.progress, savedProgress),
  };
};

export const useVideoPlayback = (id: string, session: PlaybackSession): VideoPlayback => {
  const { post, uri, failed, initialSeek } = useVideoData(id, session);
  const headers = playbackHeaders(session.token);
  const captionTracks = toCaptionTracks(firstAttachment(post)?.textTracks, headers);
  const { ready, ...preferences } = usePlaybackPreferences(captionTracks);

  if (failed) {
    return { status: 'failed' };
  }
  if (post === undefined || uri === undefined || !ready) {
    return { status: 'loading' };
  }
  return {
    status: 'ready',
    source: { uri, headers, metadata: streamMetadata(post) },
    captionTracks,
    initialSeek,
    preferences,
  };
};
