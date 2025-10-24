import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import Video, { VideoRef, OnLoadData, OnProgressData, OnBufferData } from 'react-native-video';
import withMux from '@mux/mux-data-react-native-video';
import { AVPlayerManager, PlayerState, PlayerEvent } from '@/hooks/videos/AVPlayerManager';

interface PlayerOutputInternalProps {
  playerManager: AVPlayerManager;
  playerState: PlayerState;
  resizeCover?: boolean;
}

// Create MuxVideo component by wrapping Video with Mux monitoring
const MuxVideo = withMux(Video);

export const PlayerOutputInternal: React.FC<PlayerOutputInternalProps> = ({ playerManager, playerState, resizeCover = false }) => {
  const videoRef = useRef<VideoRef>(null);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Get current values directly from playerManager
  const sourceUrl = playerManager.sourceUrl;
  const muxData = playerManager.muxData;
  
  console.log('[PlayerOutputInternal] Rendering with sourceUrl:', sourceUrl);

  // Initialize Mux monitoring
  useEffect(() => {
    const muxData = playerManager.muxData;

    if (muxData && videoRef.current) {
      // The MuxData monitoring is handled through the muxOptions prop
      // which is passed directly to the Video component
      // No manual attachment needed with @mux/mux-data-react-native-video
    }

    return () => {
      // Cleanup is handled automatically by the Video component
    };
  }, [playerManager.muxData]);

  // Handle external seek requests
  useEffect(() => {
    const handleSeek = (event: PlayerEvent, data?: unknown) => {
      if (event === PlayerEvent.Seek && typeof data === 'number' && videoRef.current) {
        if (seekTimeoutRef.current) {
          clearTimeout(seekTimeoutRef.current);
        }

        seekTimeoutRef.current = setTimeout(() => {
          videoRef.current?.seek(data);
        }, 50);
      }
    };

    const unsubscribe = playerManager.on(PlayerEvent.Seek, handleSeek);
    return () => {
      unsubscribe();
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, [playerManager]);

  const handleLoad = (data: OnLoadData) => {
    console.log('[PlayerOutputInternal] Video loaded, duration:', data.duration);
    playerManager.onVideoDuration(data.duration);
  };

  const handleProgress = (data: OnProgressData) => {
    playerManager.onVideoTime(data.currentTime, data.playableDuration);
  };

  const handleBuffer = (data: OnBufferData) => {
    playerManager.onVideoBuffering(data.isBuffering);
  };

  const handleEnd = () => {
    playerManager.onVideoEnded();
  };

  const handleError = (error: any) => {
    console.error('[PlayerOutputInternal] Video error:', error);
    playerManager.onVideoError(error);
  };

  const handleAudioFocusChanged = (event: { hasAudioFocus: boolean }) => {
    if (!event.hasAudioFocus) {
      playerManager.onVideoLostAudioFocus();
    }
  };

  const handleAudioBecomingNoisy = () => {
    playerManager.onVideoNoisy();
  };

  // Don't render video component if there's no source URL
  if (!sourceUrl) {
    console.log('[PlayerOutputInternal] No source URL, returning null');
    return null;
  }

  // Determine which component to use based on muxData availability
  const VideoComponent = muxData ? MuxVideo : Video;
  
  console.log('[PlayerOutputInternal] Rendering video with:', {
    sourceUrl,
    hasMuxData: !!muxData,
    isPaused: playerState.isPaused,
  });

  return (
    <VideoComponent
      ref={videoRef}
      source={{ uri: sourceUrl }}
      style={styles.video}
      resizeMode={resizeCover ? 'cover' : 'contain'}
      paused={playerState.isPaused}
      rate={playerState.playbackRate}
      volume={playerState.isMuted ? 0 : playerState.volume}
      muxOptions={muxData || undefined} // Pass mux options if available
      onLoad={handleLoad}
      onProgress={handleProgress}
      onBuffer={handleBuffer}
      onEnd={handleEnd}
      onError={handleError}
      onAudioFocusChanged={handleAudioFocusChanged}
      onAudioBecomingNoisy={handleAudioBecomingNoisy}
      playInBackground={false}
      playWhenInactive={false}
      ignoreSilentSwitch="ignore"
      progressUpdateInterval={250}
      controls={false}
      poster=""
      posterResizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
