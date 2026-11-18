import { type ReactElement, type Ref, useImperativeHandle } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import VideoComponent, {
  type OnBufferData,
  type OnLoadData,
  type OnVideoErrorData,
  type ReactVideoProps,
  type ReactVideoSource,
} from 'react-native-video';

import { PLAYBACK_SPEEDS } from '@/constants/video';
import type { Seekable } from '@/hooks/progress-tracker';
import { useVideoProgress } from '@/hooks/useVideoProgress';

export interface VideoPlayerController {
  readonly replay: () => void;
}

type PlaybackOptionProps = Pick<
  ReactVideoProps,
  | 'captionTracks'
  | 'selectedCaptionTrackId'
  | 'onCaptionTrackChange'
  | 'rate'
  | 'onPlaybackRateChange'
>;

interface VideoPlayerProps extends PlaybackOptionProps {
  readonly source: ReactVideoSource;
  readonly id: string;
  readonly token?: string | undefined;
  readonly handleLoad?: (e: OnLoadData) => void;
  readonly handleBuffer?: (e: OnBufferData) => void;
  readonly handleError: (e: OnVideoErrorData) => void;
  readonly handleEnd?: () => void;
  readonly paused?: boolean;
  readonly initialSeek?: number;
  readonly controllerRef?: Ref<VideoPlayerController>;
}

const NATIVE_PLAYER_OPTIONS = {
  resizeMode: 'cover',
  controls: true,
  playbackSpeeds: PLAYBACK_SPEEDS,
  playInBackground: false,
  playWhenInactive: false,
  ignoreSilentSwitch: 'ignore',
  preventsDisplaySleepDuringVideoPlayback: true,
} as const satisfies Partial<ReactVideoProps>;

const ignoreEvent = (): void => undefined;

const ResumeOverlay = (): ReactElement => (
  <View testID="video-resume-overlay" style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#fff" />
  </View>
);

interface NativePlayer {
  readonly attachVideo: (video: Seekable | null) => void;
  readonly attachContainer: (node: object | null) => (() => void) | undefined;
  readonly isInitialSeeking: boolean;
  readonly videoProps: ReactVideoProps;
}

const useNativePlayer = ({
  source,
  id,
  token,
  handleLoad,
  handleBuffer = ignoreEvent,
  handleError,
  handleEnd = ignoreEvent,
  paused = false,
  initialSeek = 0,
  controllerRef,
  ...playbackOptions
}: VideoPlayerProps): NativePlayer => {
  const { attachVideo, attachContainer, isInitialSeeking, seekToResumePoint, replay, ...handlers } =
    useVideoProgress({ id, token, initialSeek, paused });
  useImperativeHandle(controllerRef, () => ({ replay }));

  return {
    attachVideo,
    attachContainer,
    isInitialSeeking,
    videoProps: {
      ...NATIVE_PLAYER_OPTIONS,
      ...playbackOptions,
      ...handlers,
      source,
      paused: paused || isInitialSeeking,
      onLoad: (data) => {
        seekToResumePoint();
        handleLoad?.(data);
      },
      onReadyForDisplay: seekToResumePoint,
      onBuffer: handleBuffer,
      onError: handleError,
      onEnd: handleEnd,
    },
  };
};

export const VideoPlayer = (props: VideoPlayerProps): ReactElement => {
  const { attachVideo, attachContainer, isInitialSeeking, videoProps } = useNativePlayer(props);
  return (
    <View ref={attachContainer} style={styles.container}>
      <VideoComponent {...videoProps} ref={attachVideo} style={styles.video} />
      {isInitialSeeking && <ResumeOverlay />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFill,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
