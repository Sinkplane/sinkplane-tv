import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import VideoComponent, { OnBufferData, OnLoadData, OnVideoErrorData, ReactVideoSource } from 'react-native-video';

interface VideoPlayerProps {
  source: ReactVideoSource;
  handleLoad?: (e: OnLoadData) => void;
  handleBuffer?: (e: OnBufferData) => void;
  handleError: (e: OnVideoErrorData) => void;
  thumbnailUrl?: string;
}

export const VideoPlayer: FC<VideoPlayerProps> = ({ source, handleLoad, handleBuffer, handleError, thumbnailUrl }: VideoPlayerProps) => (
  <VideoComponent
    source={source}
    style={styles.video}
    resizeMode="cover"
    // rate={playerState.playbackRate}
    // muxOptions={muxData || undefined} // Pass mux options if available
    onLoad={handleLoad}
    onBuffer={handleBuffer}
    // onEnd={handleEnd}
    onError={handleError}
    // progressUpdateInterval={250}
    controls
    poster={{ source: { uri: thumbnailUrl } }}
    // posterResizeMode="contain"
  />
);

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
