import React, { FC, useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import VideoComponent, {
  OnBufferData,
  OnLoadData,
  OnVideoErrorData,
  ReactVideoSource
} from 'react-native-video';
import { useUpdateVideoProgress, updateVideoProgress } from '@/hooks/videos/useUpdateVideoProgress';

interface VideoPlayerProps {
  source: ReactVideoSource;
  id: string;
  token?: string;
  handleLoad?: (e: OnLoadData) => void;
  handleBuffer?: (e: OnBufferData) => void;
  handleError: (e: OnVideoErrorData) => void;
  handleEnd?: () => void;
  thumbnailUrl?: string;
  paused?: boolean;
  title?: string;
  initialSeek?: number;
  replayToken?: number;
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  source,
  id,
  token,
  handleLoad,
  handleBuffer,
  handleError,
  handleEnd,
  thumbnailUrl,
  paused = false,
  title,
  initialSeek,
  replayToken,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoComponent>(null);
  const hasSeekedRef = useRef(false);
  const [isInitialSeeking, setIsInitialSeeking] = useState(!!initialSeek && initialSeek > 0);
  const [isReplaying, setIsReplaying] = useState(false);
  const currentTimeRef = useRef(initialSeek || 0);
  const lastSavedProgressRef = useRef(initialSeek || 0);
  const { mutate: updateProgressMutation } = useUpdateVideoProgress(token);

  const saveProgress = useCallback((time: number, force = false) => {
    if (!token) return;

    const progress = Math.floor(time);
    const diff = Math.abs(progress - lastSavedProgressRef.current);

    // Periodically save (every 15s) or force save (every 2s on pause/unmount)
    if (progress > 0 && (force ? diff >= 2 : diff >= 15)) {
      updateProgressMutation({ id, progress });
      lastSavedProgressRef.current = progress;
    }
  }, [id, token, updateProgressMutation]);

  // Handle pause
  useEffect(() => {
    if (paused && !isInitialSeeking) {
      saveProgress(currentTimeRef.current, true);
    }
  }, [paused, isInitialSeeking, saveProgress]);

  // Handle unmount
  useEffect(() => () => {
    const finalProgress = Math.floor(currentTimeRef.current);
    // If we haven't saved this progress yet, do a final fire-and-forget call
    if (token && finalProgress > 0 && Math.abs(finalProgress - lastSavedProgressRef.current) >= 2) {
      updateVideoProgress(token, { id, progress: finalProgress }).catch(err => {
        // eslint-disable-next-line no-console
        console.error('[VideoPlayer] Failed to save final progress on unmount:', err);
      });
    }
  }, [id, token]);

  // Handle replay request from parent
  useEffect(() => {
    if (replayToken === undefined) return;
    if (videoRef.current) {
      videoRef.current.seek(0);
      currentTimeRef.current = 0;
      lastSavedProgressRef.current = 0;
      setIsReplaying(true);
    }
  }, [replayToken]);

  const onVideoError = (e: OnVideoErrorData) => {
    console.error(`[VideoPlayer] Error playing ${title || 'video'}:`, e.error);
    handleError(e);
  };

  const performInitialSeek = () => {
    const seekValue = Number(initialSeek);
    if (seekValue > 0 && !hasSeekedRef.current) {
      if (videoRef.current) {
        videoRef.current.seek(seekValue);
        hasSeekedRef.current = true;
      }
    }
  };

  const onVideoLoad = (data: OnLoadData) => {
    performInitialSeek();
    if (handleLoad) {
      handleLoad(data);
    }
  };

  const onReadyForDisplay = () => {
    performInitialSeek();
  };

  const onProgress = (data: { currentTime: number }) => {
    currentTimeRef.current = data.currentTime;

    // Clear replaying flag once playback resumes from the start
    if (isReplaying && data.currentTime > 0) {
      setIsReplaying(false);
    }

    // If we are in the initial seeking phase
    if (isInitialSeeking && initialSeek && initialSeek > 0) {
      // Check if we have arrived at or past our target (allowing 1s margin)
      if (data.currentTime >= initialSeek - 1) {
        setIsInitialSeeking(false);
      } else if (hasSeekedRef.current && data.currentTime < 2) {
        // If we already seeked but progress is still at the beginning, retry
        performInitialSeek();
      }
    }

    // Periodically save progress while playing
    if (!isInitialSeeking && !paused) {
      saveProgress(data.currentTime);
    }
  };


  const onBuffer = (data: OnBufferData) => {
    if (handleBuffer) {
      handleBuffer(data);
    }
  };

  return (
    <View style={styles.container}>
      <VideoComponent
        ref={videoRef}
        source={source}
        style={styles.video}
        resizeMode="cover"
        paused={paused || isInitialSeeking}
        onLoad={onVideoLoad}
        onReadyForDisplay={onReadyForDisplay}
        onBuffer={onBuffer}
        onProgress={onProgress}
        onError={onVideoError}
        onEnd={handleEnd}
        controls
        poster={{ source: { uri: thumbnailUrl } }}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        preventsDisplaySleepDuringVideoPlayback
      />

      {isInitialSeeking && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
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
    ...StyleSheet.absoluteFillObject,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
