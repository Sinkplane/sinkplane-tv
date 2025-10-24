import { StyleSheet, ScrollView, ActivityIndicator, View, Text, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useScale } from '@/hooks/useScale';
import { MuxVideoPlayer } from '@/components/videos/MuxVideoPlayer';
import { useGetVideoPost } from '@/hooks/videos/useGetVideoPost';
import { useGetVideoDelivery } from '@/hooks/videos/useGetVideoDelivery';
import { useSession } from '@/hooks/authentication/auth.context';
import { useEffect, useState } from 'react';
import { VideoDelivery } from '@/types/video-delivery.interface';

// eslint-disable-next-line complexity
export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useVideoDetailStyles();
  const { token, user } = useSession();
  const [streamUrl, setStreamUrl] = useState<string>();
  // Fetch video post details
  const { data: videoPost, isLoading: isLoadingPost, error: postError } = useGetVideoPost(token ?? undefined, id);
  // Fetch video delivery/stream URL
  const {
    data: videoDelivery,
    isLoading: isLoadingDelivery,
    error: deliveryError,
  } = useGetVideoDelivery(token ?? undefined, videoPost?.videoAttachments?.[0]?.guid ?? undefined);
  const [streamError, setStreamError] = useState('');

  const isLoading = isLoadingPost || isLoadingDelivery || !streamUrl;
  const error = postError || deliveryError;

  const handleStreamUrl = (data: VideoDelivery) => {
    if (!data) return;
    const group = (data.groups ?? [undefined])[0];
    const origin = (group?.origins ?? [undefined])[0];
    const variants = (group.variants ?? []).filter(v => v.enabled === undefined || v.enabled !== false);
    const variant = variants[variants.length - 1]; // get highest quality variant for now, will get device resolution later and match.
    if (!origin || !variant) {
      return setStreamError('API Error, please restart your app.');
    }
    const url = `${origin.url}${variant.url}`;
    setStreamUrl(url);
  };

  useEffect(() => {
    if (videoDelivery) handleStreamUrl(videoDelivery);
  }, [videoDelivery]);

  // Don't show loading screen, proceed to render with loading state

  if (!isLoading && error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Error loading video: {error?.message}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.fullScreen}>
          {/* Video Title at the top */}
          {videoPost?.title && (
            <View style={styles.titleContainer}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {videoPost.title}
              </Text>
            </View>
          )}

          {/* Video Player or Thumbnail */}
          <View style={styles.videoContainer}>
            {videoPost && streamUrl && user ? (
              <MuxVideoPlayer
                videoUrl={streamUrl}
                videoId={videoPost.id}
                videoTitle={videoPost.title}
                thumbnail={videoPost.thumbnail?.path}
                userId={user?.id}
                creatorName={videoPost.creator?.title}
                seriesName={videoPost.channel?.title}
              />
            ) : (
              <>
                {/* Show thumbnail while loading */}
                {videoPost?.thumbnail?.path && (
                  <Image
                    source={{ uri: videoPost.thumbnail.path }}
                    style={styles.thumbnailImage}
                    resizeMode="contain"
                  />
                )}
                {/* Loading indicator overlay */}
                {isLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loadingText}>Loading video...</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Error message */}
          {(error || streamError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {streamError || error?.message || 'Error loading video'}
              </Text>
              <Text style={styles.errorHint}>
                This may be a temporary issue. Try refreshing or check your connection.
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const useVideoDetailStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    fullScreen: {
      flex: 1,
      backgroundColor: '#000000',
    },
    titleContainer: {
      position: 'absolute',
      top: 20 * scale,
      left: 20 * scale,
      right: 20 * scale,
      zIndex: 10,
    },
    videoTitle: {
      fontSize: 24 * scale,
      fontWeight: '600',
      color: '#ffffff',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    videoContainer: {
      flex: 1,
      backgroundColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 10 * scale,
      color: '#ffffff',
      fontSize: 16 * scale,
    },
    errorContainer: {
      position: 'absolute',
      bottom: 50 * scale,
      left: 20 * scale,
      right: 20 * scale,
      backgroundColor: 'rgba(255, 0, 0, 0.9)',
      padding: 15 * scale,
      borderRadius: 8 * scale,
    },
    errorText: {
      color: '#ffffff',
      fontSize: 14 * scale,
      textAlign: 'center',
      fontWeight: '600',
    },
    errorHint: {
      color: '#ffffff',
      fontSize: 12 * scale,
      textAlign: 'center',
      marginTop: 8 * scale,
      opacity: 0.8,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20 * scale,
      backgroundColor: '#000000',
    },
    content: {
      padding: 20 * scale,
    },
    videoId: {
      marginTop: 10 * scale,
      marginBottom: 20 * scale,
      opacity: 0.7,
    },
    section: {
      marginTop: 20 * scale,
      marginBottom: 20 * scale,
    },
    placeholder: {
      marginTop: 10 * scale,
      padding: 40 * scale,
      borderRadius: 8 * scale,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#666',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
