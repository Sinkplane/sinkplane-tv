import { useMemo } from 'react';
import type { MuxOptions } from '@mux/mux-data-react-native-video';
import { createMuxConfig } from '@/constants/mux';

interface UseMuxDataOptions {
  videoId: string;
  videoTitle: string;
  videoSeries?: string;
  videoProducer?: string;
  userId?: string;
  customData?: Record<string, string | undefined>;
  envKey?: string;
}

export function useMuxData(options: UseMuxDataOptions): MuxOptions {
  const { videoId, videoTitle, videoSeries, videoProducer, userId, customData, envKey } = options;

  return useMemo(
    () =>
      createMuxConfig(videoId, videoTitle, {
        envKey,
        userId,
        videoSeries,
        videoProducer,
        customData,
      }),
    [videoId, videoTitle, videoSeries, videoProducer, userId, customData, envKey],
  );
}
