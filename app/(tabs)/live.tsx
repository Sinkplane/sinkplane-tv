import { StyleSheet, Image, ActivityIndicator, View, Pressable } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ToastAndroid, Platform } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { useSession } from '@/hooks/authentication/auth.context';
import { useGetVideoDelivery } from '@/hooks/videos/useGetVideoDelivery';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { VideoDelivery } from '@/types/video-delivery.interface';

import bg from '@/assets/images/bg.jpg';

const LIVESTREAM_ID = '5c13f3c006f1be15e08e05c0';

// eslint-disable-next-line complexity
export default function FocusDemoScreen() {
  const styles = useFocusDemoScreenStyles();
  const { creator, token } = useSession();
  const [streamUrl, setStreamUrl] = useState<{ uri: string; headers: Record<string, string> } | null>(null);
  const [videoLoading, setIsVideoLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isPaused, setIsPaused] = useState(true); // Start paused
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if livestream is actually live by fetching video delivery
  // Only fetch when the tab is focused
  const {
    data: videoDelivery,
    error: deliveryError,
    refetch: refetchVideoDelivery,
  } = useGetVideoDelivery(
    isFocused ? token ?? undefined : undefined,
    LIVESTREAM_ID,
    true, // live parameter
  );

  // Stream is live if we successfully get video delivery data
  const isLive = !!videoDelivery && !deliveryError;

  // Poll for livestream status every 60 seconds, but only when focused
  useEffect(() => {
    if (!isFocused) return;

    const interval = setInterval(() => {
      refetchVideoDelivery();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [refetchVideoDelivery, isFocused]);

  // Pause playback when navigating away from this tab
  useFocusEffect(
    React.useCallback(() => {
      // Tab is focused - resume playback
      setIsFocused(true);
      setIsPaused(false);

      return () => {
        // Tab is losing focus - pause playback
        setIsFocused(false);
        setIsPaused(true);
      };
    }, []),
  );

  const handleStreamUrl = (data: VideoDelivery) => {
    if (!data || !token) return;
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
    setStreamUrl({ uri: url, headers: { Cookie: `sails.sid=${token}` } });
  };

  useEffect(() => {
    if (deliveryError) handleError(deliveryError);
    if (videoDelivery) handleStreamUrl(videoDelivery);
  }, [videoDelivery, deliveryError]);

  const handleError = (err: Error | unknown) => {
    console.error(err);
    
    // Clear any existing toast timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Show toast message
    if (Platform.OS === 'android') {
      ToastAndroid.show('Error loading livestream. Please try again', ToastAndroid.SHORT);
    } else {
      // For iOS/tvOS, we'll just log it since native toast isn't available
      console.warn('Error loading livestream. Please try again');
    }

    // Auto-dismiss after 3 seconds (for platforms that need manual dismissal)
    toastTimeoutRef.current = setTimeout(() => {
      toastTimeoutRef.current = null;
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleLoad = () => {
    setIsVideoLoading(false);
  };

  const handleRefresh = () => {
    refetchVideoDelivery();
  };

  // If there's a live stream, show the player
  if (isLive && streamUrl && streamUrl.uri) {
    return (
      <View style={styles.videoContainer}>
        {videoLoading && <ActivityIndicator />}
        <VideoPlayer
          source={streamUrl}
          handleLoad={handleLoad}
          handleBuffer={handleLoad}
          handleError={e => {
            handleError(e.error);
          }}
          paused={isPaused}
        />
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
          <Pressable style={styles.refreshButton} onPress={handleRefresh}>
            <ThemedText style={styles.refreshButtonText}>🔄 Refresh Stream Status</ThemedText>
          </Pressable>
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
    refreshButton: {
      marginTop: 16 * scale,
      padding: 12 * scale,
      backgroundColor: 'rgba(0, 122, 255, 0.8)',
      borderRadius: 8 * scale,
      alignItems: 'center',
    },
    refreshButtonText: {
      fontSize: 16 * scale,
      fontWeight: 'bold',
    },
  });
};
