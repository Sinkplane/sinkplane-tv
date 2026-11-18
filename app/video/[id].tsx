import { type ReactElement, type RefObject, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSession } from '@sinkplane/shared';

import { alertLaunchError } from '@/components/videos/launch-error';
import { PlaybackErrorAlert } from '@/components/videos/PlaybackErrorAlert';
import { RelatedVideosGrid } from '@/components/videos/RelatedVideosGrid';
import { VideoPlayer, type VideoPlayerController } from '@/components/videos/VideoPlayer';
import {
  type PlaybackSession,
  type ReadyPlayback,
  type VideoPlayback,
  useVideoPlayback,
} from '@/hooks/useVideoPlayback';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    position: 'absolute',
    zIndex: 1,
  },
});

const useScreenPlayback = (): {
  id: string;
  session: PlaybackSession;
  playback: VideoPlayback;
} => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, tokenExpiration } = useSession();
  const session = { token: token ?? undefined, tokenExpiration: tokenExpiration ?? undefined };
  return { id, session, playback: useVideoPlayback(id, session) };
};

interface PlayerStageProps {
  readonly id: string;
  readonly session: PlaybackSession;
  readonly playback: ReadyPlayback;
  readonly controllerRef: RefObject<VideoPlayerController | null>;
  readonly onLoadingChange: (loading: boolean) => void;
  readonly onEndedChange: (ended: boolean) => void;
}

const PlayerStage = ({
  id,
  session,
  playback,
  controllerRef,
  onLoadingChange,
  onEndedChange,
}: PlayerStageProps): ReactElement => (
  <VideoPlayer
    id={id}
    token={session.token}
    source={playback.source}
    controllerRef={controllerRef}
    handleLoad={() => {
      onLoadingChange(false);
    }}
    handleBuffer={({ isBuffering }) => {
      onLoadingChange(isBuffering);
    }}
    handleError={alertLaunchError}
    handleEnd={() => {
      onEndedChange(true);
    }}
    initialSeek={playback.initialSeek}
    captionTracks={playback.captionTracks}
    {...playback.preferences}
  />
);

export default function VideoDetailScreen(): ReactElement {
  const { id, session, playback } = useScreenPlayback();
  const controllerRef = useRef<VideoPlayerController>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {(playback.status !== 'ready' || videoLoading) && (
          <ActivityIndicator testID="video-loading" style={styles.loader} size="large" />
        )}
        {playback.status === 'ready' && (
          <PlayerStage
            id={id}
            session={session}
            playback={playback}
            controllerRef={controllerRef}
            onLoadingChange={setVideoLoading}
            onEndedChange={setHasEnded}
          />
        )}
        {hasEnded && (
          <RelatedVideosGrid
            videoId={id}
            token={session.token}
            tokenExpiration={session.tokenExpiration}
            onReplay={() => {
              setHasEnded(false);
              setVideoLoading(false);
              controllerRef.current?.replay();
            }}
          />
        )}
        {playback.status === 'failed' && <PlaybackErrorAlert />}
      </View>
    </>
  );
}
