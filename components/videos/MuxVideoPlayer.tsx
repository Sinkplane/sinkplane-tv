import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useMuxData } from '@/hooks/videos/useMuxData';
import { VideoControls } from './VideoControls';

import { VideoPlayer } from './VideoPlayer';

interface MuxVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  videoTitle: string;
  thumbnail?: string;
  userId?: string;
  creatorName?: string;
  seriesName?: string;
}

export const MuxVideoPlayer: React.FC<MuxVideoPlayerProps> = ({
  videoUrl,
  videoId,
  videoTitle,
  thumbnail,
  userId,
  creatorName,
  seriesName,
}) => {
  // Use the Mux hook to generate configuration
  const muxConfig = useMuxData({
    videoId,
    videoTitle,
    videoProducer: creatorName,
    videoSeries: seriesName,
    userId,
    customData: {
      custom1: creatorName,
      custom2: seriesName,
    },
  });

  const source = useMemo(
    () => ({
      getUrl: () => videoUrl,
      hasVideo: () => true,
    }),
    [videoUrl],
  );
  
  console.log('[MuxVideoPlayer] Source created:', { videoUrl, sourceGetUrl: source.getUrl() });

  return (
    <VideoPlayer
      source={source}
      metadata={{
        title: videoTitle,
        thumbnail,
        creator: creatorName,
      }}
      muxData={muxConfig}
      style={styles.player}
      renderControls={(playerManager, playerState) => (
        <VideoControls playerManager={playerManager} playerState={playerState} />
      )}
    />
  );
};

const styles = StyleSheet.create({
  player: {
    flex: 1,
  },
});
