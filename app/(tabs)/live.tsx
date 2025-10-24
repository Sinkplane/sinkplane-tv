import { StyleSheet, Image, ActivityIndicator, Alert, View } from 'react-native';
import { useEffect, useState } from 'react';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { useSession } from '@/hooks/authentication/auth.context';
import { useGetVideoDelivery } from '@/hooks/videos/useGetVideoDelivery';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoDelivery } from '@/types/video-delivery.interface';

import bg from '@/assets/images/bg.jpg';

// eslint-disable-next-line complexity
export default function FocusDemoScreen() {
  const styles = useFocusDemoScreenStyles();
  const { creator, token } = useSession();
  const [streamUrl, setStreamUrl] = useState<{ uri: string; headers: Record<string, string> }>({
    uri: '',
    headers: { Cookie: `sails.sid=${token}` },
  });
  const [videoLoading, setIsVideoLoading] = useState(true);

  const isLive = creator?.liveStream && !creator.liveStream.offline;
  const livestreamId = creator?.liveStream?.id;

  // Fetch livestream delivery URL
  const { data: videoDelivery, error: deliveryError } = useGetVideoDelivery(
    token ?? undefined,
    livestreamId ?? undefined,
    true, // live parameter
  );

  const handleStreamUrl = (data: VideoDelivery) => {
    if (!data) return;
    const group = (data.groups ?? [undefined])[0];
    const origin = (group?.origins ?? [undefined])[0];
    const variants = (group?.variants ?? []).filter(v => v.enabled === undefined || v.enabled !== false);
    const variant = variants[0]; // For live streams, use the first variant (typically "live-abr")
    if (!origin || !variant) {
      return handleError(new Error('API Error, please reload'));
    }
    // Remove trailing slash from origin and leading slash from variant to avoid double slashes
    const originUrl = origin.url.endsWith('/') ? origin.url.slice(0, -1) : origin.url;
    const variantUrl = variant.url.startsWith('/') ? variant.url : '/' + variant.url;
    const url = `${originUrl}${variantUrl}`;
    setStreamUrl({ ...streamUrl, uri: url });
  };

  useEffect(() => {
    if (deliveryError) handleError(deliveryError);
    if (videoDelivery) handleStreamUrl(videoDelivery);
  }, [videoDelivery, deliveryError]);

  const handleError = (err: Error | unknown) => {
    console.error(err);
    Alert.alert('Error loading livestream. Please try again');
  };

  const handleLoad = () => {
    setIsVideoLoading(false);
  };

  // If there's a live stream, show the player
  if (isLive && livestreamId) {
    return (
      <View style={styles.videoContainer}>
        {videoLoading && <ActivityIndicator />}
        {videoDelivery && streamUrl.uri !== '' && (
          <VideoPlayer
            source={streamUrl}
            handleLoad={handleLoad}
            handleBuffer={handleLoad}
            handleError={e => {
              handleError(e.error);
            }}
          />
        )}
      </View>
    );
  }

  // Otherwise show the creator info or no subscription message
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image style={styles.headerImage} source={creator ? { uri: creator.cover.path } : bg} resizeMode="cover" />}
    >
      {creator && (
        <ThemedView>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">{creator.title}</ThemedText>
          </ThemedView>
          {creator.liveStream?.offline && (
            <ThemedView style={styles.offlineContainer}>
              <ThemedText type="subtitle">Stream Offline</ThemedText>
              <ThemedText>{creator.liveStream.offline.title}</ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
      {!creator && (
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">You are not subscribed to any creators</ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const useFocusDemoScreenStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    headerImage: {
      color: '#808080',
      bottom: -45 * scale,
      left: 0,
      position: 'absolute',
    },
    titleContainer: {
      flexDirection: 'row',
      gap: 8 * scale,
    },
    videoContainer: {
      flex: 1,
      backgroundColor: '#000',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    offlineContainer: {
      marginTop: 16 * scale,
      padding: 16 * scale,
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      borderRadius: 8 * scale,
    },
  });
};
