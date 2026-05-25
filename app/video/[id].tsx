import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { useGetVideoPost } from '@/hooks/videos/useGetVideoPost';
import { useGetVideoDelivery } from '@/hooks/videos/useGetVideoDelivery';
import { useSession } from '@/hooks/authentication/auth.context';
import { useEffect, useState } from 'react';
import { VideoDelivery } from '@/types/video-delivery.interface';
import { VideoPlayer } from '@/components/videos/VideoPlayer';

// eslint-disable-next-line complexity
export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, tokenExpiration } = useSession();
  const [streamUrl, setStreamUrl] = useState<{ uri: string; headers?: Record<string, string> }>({
    uri: '',
  });
  const [videoLoading, setIsVideoLoading] = useState(true);

  // Fetch video post details
  const { data: videoPost, error: postError } = useGetVideoPost(token ?? undefined, tokenExpiration ?? undefined, id);
  // Fetch video delivery/stream URL
  const { data: videoDelivery, error: deliveryError } = useGetVideoDelivery(
    token ?? undefined,
    tokenExpiration ?? undefined,
    videoPost?.videoAttachments?.[0]?.guid ?? undefined,
  );

  const error = postError || deliveryError;

  const handleStreamUrl = (data: VideoDelivery) => {
    if (!data) return;
    const group = (data.groups ?? [undefined])[0];
    const origin = (group?.origins ?? [undefined])[0];
    // Filter variants: must be enabled, have a non-empty URL, and not be explicitly denied in metadata
    const variants = (group.variants ?? []).filter(v => {
      const isEnabled = v.enabled === undefined || v.enabled !== false;
      const hasUrl = v.url && v.url !== '';
      const isDenied = v.meta?.common?.access?.deniedReason;
      return isEnabled && hasUrl && !isDenied;
    });

    const variant = variants[variants.length - 1]; // get highest quality variant for now

    if (!origin || !variant) {
      return handleError(new Error('No playable video variants found. You may lack permission for this content.'));
    }

    // Remove trailing slash from origin and leading slash from variant to avoid double slashes
    const originUrl = origin.url.endsWith('/') ? origin.url.slice(0, -1) : origin.url;
    const variantUrl = variant.url.startsWith('/') ? variant.url : '/' + variant.url;
    const url = `${originUrl}${variantUrl}`;

    console.info(`[VideoDetail] Selected quality: ${variant.label || variant.name} - ${url.split('?')[0]}`);

    // Pass both Authorization and Cookie headers to the video player
    // This ensures that the CDN can authenticate the request regardless of whether it expects a JWT or a session cookie
    const headers: Record<string, string> = {
      'User-Agent': 'SinkplaneTV/1.0 (AppleTV; iOS)', // Use a consistent User-Agent
    };

    if (token) {
      // If it looks like a JWT (starts with ey), use Bearer. Otherwise, it's likely a sails.sid cookie.
      if (token.startsWith('ey')) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers.Cookie = `sails.sid=${token}`;
      }
    }

    setStreamUrl({ uri: url, headers });
  };

  useEffect(() => {
    if (error) handleError(error);
    if (videoDelivery) handleStreamUrl(videoDelivery);
  }, [videoDelivery, error]);

  const handleError = (err: Error | unknown) => {
    console.error(err);
    Alert.alert('Error launching video. Please go back and try again');
  };
  const handleLoad = () => {
    setIsVideoLoading(!videoLoading);
  };

  const styles = useVideoDetailStyles();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {videoLoading && <ActivityIndicator />}
        {videoPost && videoDelivery && streamUrl.uri !== '' && (
          <VideoPlayer
            source={streamUrl}
            handleLoad={handleLoad}
            handleBuffer={handleLoad}
            handleError={e => {
              handleError(e.error);
            }}
            title={videoPost.title}
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
  });
};
