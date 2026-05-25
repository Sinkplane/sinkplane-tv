import React, { FC } from 'react';
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
}

export const VideoPlayer: FC<VideoPlayerProps> = ({
  source,
  handleLoad,
  handleBuffer,
  handleError,
  thumbnailUrl,
  paused,
  title,
}: VideoPlayerProps) => {
  const onVideoError = (e: OnVideoErrorData) => {
    console.error(`[VideoPlayer] Error playing ${title || 'video'}:`, e.error);
    handleError(e);
  };

  return (
    <VideoComponent
      source={source}
      style={styles.video}
      resizeMode="cover"
      paused={paused}
      onLoad={handleLoad}
      onBuffer={handleBuffer}
      onError={onVideoError}
      controls
      poster={{ source: { uri: thumbnailUrl } }}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
