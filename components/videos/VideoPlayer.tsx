import React, { FC, useRef } from 'react';
import { StyleSheet } from 'react-native';
import VideoComponent, { OnBufferData, OnLoadData, OnVideoErrorData, ReactVideoSource } from 'react-native-video';

interface VideoPlayerProps {
  source: ReactVideoSource;
  handleLoad?: (e: OnLoadData) => void;
  handleBuffer?: (e: OnBufferData) => void;
  handleError: (e: OnVideoErrorData) => void;
  thumbnailUrl?: string;
  paused?: boolean;
  title?: string;
  initialSeek?: number;
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  source,
  handleLoad,
  handleBuffer,
  handleError,
  thumbnailUrl,
  paused = false,
  title,
  initialSeek,
}: VideoPlayerProps) => {
  const videoRef = useRef<VideoComponent>(null);
  const hasSeekedRef = useRef(false);

  const onVideoError = (e: OnVideoErrorData) => {
    console.error(`[VideoPlayer] Error playing ${title || 'video'}:`, e.error);
    handleError(e);
  };

  const onVideoLoad = (data: OnLoadData) => {
    if (initialSeek && initialSeek > 0 && !hasSeekedRef.current) {
      console.info(`[VideoPlayer] Initial seek to: ${initialSeek}s`);
      videoRef.current?.seek(initialSeek);
      hasSeekedRef.current = true;
    }
    if (handleLoad) {
      handleLoad(data);
    }
  };

  return (
    <VideoComponent
      ref={videoRef}
      source={source}
      style={styles.video}
      resizeMode="cover"
      paused={paused}
      onLoad={onVideoLoad}
      onBuffer={handleBuffer}
      onError={onVideoError}
      controls
      poster={{ source: { uri: thumbnailUrl } }}
      playInBackground={false}
      playWhenInactive={false}
      ignoreSilentSwitch="ignore"
    />
  );
};

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
