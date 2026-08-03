import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { useGetVideoPost } from '@/hooks/videos/useGetVideoPost';
import { useGetVideoDelivery } from '@/hooks/videos/useGetVideoDelivery';
import { useSession } from '@/hooks/authentication/auth.context';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { VideoDelivery } from '@/types/video-delivery.interface';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { RelatedVideosGrid } from '@/components/videos/RelatedVideosGrid';
import { useGetVideoProgress } from '@/hooks/videos/useGetVideoProgress';

// eslint-disable-next-line complexity
export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, tokenExpiration } = useSession();
  const [streamUrl, setStreamUrl] = useState<{ uri: string; headers?: Record<string, string> }>({
    uri: '',
  });
  const [videoLoading, setVideoLoading] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [replayToken, setReplayToken] = useState(0);

  // Fetch video post details
  const { data: videoPost, error: postError } = useGetVideoPost(token ?? undefined, tokenExpiration ?? undefined, id);

  // Fetch video delivery/stream URL
  const { data: videoDelivery, error: deliveryError } = useGetVideoDelivery(
    token ?? undefined,
    tokenExpiration ?? undefined,
    videoPost?.videoAttachments?.[0]?.guid ?? undefined,
  );

  // Fallback: Fetch progress from the batch endpoint
  const videoIds = useMemo(() => (id ? [id] : []), [id]);
  const { data: batchProgressData } = useGetVideoProgress(token ?? undefined, videoIds);

  // Determine initial seek time
  const initialProgress = useMemo(() => {
    // 1. Check videoPost root
    if (videoPost?.progress && videoPost.progress > 0) {
      return videoPost.progress;
    }

    // 2. Check batch endpoint (treating as seconds)
    if (batchProgressData && batchProgressData.length > 0) {
      return batchProgressData[0].progress;
    }

    return 0;
  }, [videoPost, batchProgressData]);

  const error = postError || deliveryError;

  const handleStreamUrl = useCallback((data: VideoDelivery) => {
    if (!data) return;
    const group = (data.groups ?? [undefined])[0];
    const origin = (group?.origins ?? [undefined])[0];
    const variants = (group.variants ?? []).filter(v => {
      const isEnabled = v.enabled === undefined || v.enabled !== false;
      const hasUrl = v.url && v.url !== '';
      const isDenied = v.meta?.common?.access?.deniedReason;
      return isEnabled && hasUrl && !isDenied;
    });

    const variant = variants[variants.length - 1];

    if (!origin || !variant) {
      return handleError(new Error('No playable video variants found.'));
    }

    const originUrl = origin.url.endsWith('/') ? origin.url.slice(0, -1) : origin.url;
    const variantUrl = variant.url.startsWith('/') ? variant.url : '/' + variant.url;
    const url = `${originUrl}${variantUrl}`;

    const headers: Record<string, string> = {
      'User-Agent': 'SinkplaneTV/1.0 (AppleTV; iOS)',
    };

    if (token) {
      if (token.startsWith('ey')) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers.Cookie = `sails.sid=${token}`;
      }
    }

    setStreamUrl({ uri: url, headers });
  }, [token]);

  useEffect(() => {
    if (error) handleError(error);
    if (videoDelivery) handleStreamUrl(videoDelivery);
  }, [videoDelivery, error, handleStreamUrl]);

  const handleError = (err: Error | unknown) => {
    console.error(err);
    Alert.alert('Error', 'Error launching video. Please try again');
  };

  const handleLoad = () => {
    setVideoLoading(false);
  };

  const handleBuffer = (data: { isBuffering: boolean }) => {
    setVideoLoading(data.isBuffering);
  };

  const styles = useVideoDetailStyles();

  const isReady = videoPost && videoDelivery && streamUrl.uri !== '';

  const handleEnd = useCallback(() => {
    setHasEnded(true);
  }, []);

  const handleReplay = useCallback(() => {
    setHasEnded(false);
    setVideoLoading(false);
    setReplayToken(t => t + 1);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {(!isReady || videoLoading) && <ActivityIndicator style={styles.loader} size="large" />}
        {isReady && (
          <VideoPlayer
            id={id}
            token={token ?? undefined}
            source={streamUrl}
            handleLoad={handleLoad}
            handleBuffer={handleBuffer}
            handleError={e => handleError(e.error)}
            handleEnd={handleEnd}
            title={videoPost.title}
            initialSeek={initialProgress}
            replayToken={replayToken}
          />
        )}
        {hasEnded && id && (
          <RelatedVideosGrid
            videoId={id}
            token={token ?? undefined}
            tokenExpiration={tokenExpiration ?? undefined}
            onReplay={handleReplay}
          />
        )}
      </View>
    </>
  );
}

const useVideoDetailStyles = function () {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loader: {
      position: 'absolute',
      zIndex: 1,
    },
  });
};
