/* eslint-disable camelcase */
import type { MuxOptions } from '@mux/mux-data-react-native-video';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import Crypto from 'expo-crypto';

/**
 * Mux environment keys for different environments
 */
export const MUX_ENV_KEYS = {
  development: 'hbktgrc3ge3rvlqcgqkscjhev',
  staging: '25af1b6c365eca27602b70e4f',
  production: 'nec3rvkvti2k1hfvvvr65h2cs',
} as const;

/**
 * Create Mux configuration
 */
export function createMuxConfig(
  videoId: string,
  videoTitle: string,
  options?: {
    envKey?: string;
    userId?: string;
    videoSeries?: string;
    videoProducer?: string;
    customData?: Record<string, string | undefined>;
  },
): MuxOptions {
  const { envKey = __DEV__ ? MUX_ENV_KEYS.development : MUX_ENV_KEYS.production, userId, videoSeries, videoProducer } = options || {};

  return {
    // Required: Application name (required by @mux/mux-data-react-native-video)
    application_name: Constants.expoConfig?.name || 'Sinkplane-TV',
    application_version: Constants.expoConfig?.version || '1.0.0',

    // Required: Your Mux environment key (in data object for react-native)
    data: {
      env_key: envKey,
      video_id: videoId,
      video_title: videoTitle,
      video_series: videoSeries,
      video_producer: videoProducer,
    },

    // Player metadata
    player_name: 'React Native Video Player',
    player_version: '1.0.0',
    player_init_time: Date.now(),

    // Video metadata
    video_id: videoId,
    video_title: videoTitle,
    video_series: videoSeries,
    video_producer: videoProducer,
    video_stream_type: 'on-demand',

    // Viewer metadata
    viewer_user_id: userId,
    viewer_application_name: Constants.expoConfig?.name || 'Sinkplane-TV',
    viewer_application_version: Constants.expoConfig?.version || '1.0.0',
    viewer_device_name: Device.deviceName || Device.modelName || Crypto.randomUUID(),
    viewer_device_category: 'tv',
    viewer_os_family: Platform.OS === 'ios' ? 'iOS' : 'Android',
    viewer_os_version: Device.osVersion || 'Unknown',

    // Debug mode in development
    debug: __DEV__,
  };
}
