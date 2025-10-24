import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import type { MuxOptions } from '@mux/mux-data-react-native-video';
import { AVPlayerManager, PlayerState } from '@/hooks/videos/AVPlayerManager';
import { PlayerOutputInternal } from './PlayerOutputInternal';

interface VideoMetadata {
  title: string;
  thumbnail?: string;
  creator?: string;
  description?: string;
}

interface VideoSource {
  getUrl: () => string;
  hasVideo: () => boolean;
}

interface VideoSourceOptions {
  metadata?: VideoMetadata;
  startTime?: number;
  muxData?: MuxOptions;
}

interface VideoPlayerProps {
  source: VideoSource;
  metadata?: VideoMetadata;
  startTime?: number;
  muxData?: MuxOptions;
  zoomFill?: boolean;
  style?: any;
  onLayout?: (event: any) => void;
  reportTimeUpdate?: (time: number) => void;
  reportSeekEnd?: (time: number) => void;
  reportPause?: (time: number) => void;
  renderControls?: (playerManager: AVPlayerManager, state: PlayerState) => React.ReactNode;
}

export interface VideoPlayerRef {
  getStateManager: () => AVPlayerManager;
  getState: () => PlayerState;
  play: () => void;
  pause: () => void;
  restart: () => void;
  stepBackward: (seconds?: number) => void;
  stepForward: (seconds?: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>((props, ref) => {
  const { source, metadata, startTime, muxData, zoomFill, style, onLayout, reportTimeUpdate, reportSeekEnd, reportPause, renderControls } =
    props;

  // Create player manager instance (memoized)
  const playerManager = useMemo(() => new AVPlayerManager(), []);

  // Track player state with useState
  const [playerState, setPlayerState] = useState<PlayerState>(playerManager.getState());

  // Track previous values for comparison
  const prevPositionRef = useRef<number>(playerState.position);
  const prevIsPausedRef = useRef<boolean>(playerState.isPaused);
  const prevIsScrubbingRef = useRef<boolean>(playerState.isScrubbing);

  // Subscribe to player state changes
  useEffect(() => {
    const unsubscribe = playerManager.subscribe(newState => {
      setPlayerState(newState);
    });

    return unsubscribe;
  }, [playerManager]);

  // Report time updates
  useEffect(() => {
    if (reportTimeUpdate && playerState.position !== prevPositionRef.current) {
      reportTimeUpdate(playerState.position);
      prevPositionRef.current = playerState.position;
    }
  }, [playerState.position, reportTimeUpdate]);

  // Report seek end
  useEffect(() => {
    const wasScrubbing = prevIsScrubbingRef.current;
    const isScrubbing = playerState.isScrubbing;

    if (reportSeekEnd && wasScrubbing && !isScrubbing) {
      reportSeekEnd(playerState.position);
    }

    prevIsScrubbingRef.current = isScrubbing;
  }, [playerState.isScrubbing, playerState.position, reportSeekEnd]);

  // Report pause
  useEffect(() => {
    const wasPaused = prevIsPausedRef.current;
    const isPaused = playerState.isPaused;

    if (reportPause && !wasPaused && isPaused) {
      reportPause(playerState.position);
    }

    prevIsPausedRef.current = isPaused;
  }, [playerState.isPaused, playerState.position, reportPause]);

  // Initialize source and metadata
  useEffect(() => {
    playerManager.setSource(source, {
      metadata,
      startTime,
      muxData,
    });
  }, [playerManager, source, metadata, startTime, muxData]);

  // Mount/unmount lifecycle
  useEffect(() => {
    playerManager.mount();
    return () => {
      playerManager.unmount();
    };
  }, [playerManager]);

  // Expose imperative methods
  useImperativeHandle(
    ref,
    () => ({
      getStateManager: () => playerManager,
      getState: () => playerManager.getState(),
      play: () => playerManager.play(),
      pause: () => playerManager.pause(),
      restart: () => playerManager.restart(),
      stepBackward: seconds => playerManager.stepBackward(seconds),
      stepForward: seconds => playerManager.stepForward(seconds),
    }),
    [playerManager],
  );

  // Show poster if no video or not ready
  const shouldShowPoster = !source.hasVideo() || !playerState.isReady;

  return (
    <View
      style={[styles.container, style]}
      onLayout={onLayout}
      accessible
      accessibilityLabel="Media player"
      accessibilityHint="Two finger tap to play/pause"
    >
      <PlayerOutputInternal playerManager={playerManager} playerState={playerState} resizeCover={zoomFill} />

      {shouldShowPoster && metadata?.thumbnail && (
        <Image source={{ uri: metadata.thumbnail }} style={styles.posterImage} resizeMode="contain" />
      )}

      {renderControls?.(playerManager, playerState)}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  posterImage: {
    ...StyleSheet.absoluteFillObject,
  },
});
