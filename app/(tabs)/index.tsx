import { Image, StyleSheet, NativeScrollEvent, NativeSyntheticEvent, Button } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { AssDass, Videos, VideoView } from '@/components/videos/Videos';
import { useScale } from '@/hooks/useScale';

import bg from '@/assets/images/bg.jpg';
import { useSession } from '@/hooks/authentication/auth.context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useState, useCallback, useRef } from 'react';

export default function HomeScreen() {
  const styles = useHomeScreenStyles();
  const { creator, token } = useSession();
  const [channel, setChannel] = useState(creator?.channels[0]);
  const [view, setView] = useState(VideoView.CARD);
  const [videOrder, setVideoOrder] = useState(AssDass.DESC);
  const fetchMoreRef = useRef<(() => void) | null>(null);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Calculate if we're near the bottom (within 1000 pixels)
    const paddingToBottom = 1000;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isNearBottom && fetchMoreRef.current) {
      fetchMoreRef.current();
    }
  }, []);

  const openChannelDrawer = () => {
    console.info('asdf');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image style={styles.headerImage} source={creator ? { uri: creator.cover.path } : bg} resizeMode="cover" />}
      onScroll={handleScroll}
    >
      <ThemedView>
        {creator && channel && token ? (
          <>
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title">{channel.title} Videos</ThemedText>
            </ThemedView>
            <Videos token={token} creatorId={creator.id} channel={channel} view={view} assDass={videOrder} onFetchMoreRef={fetchMoreRef} />
          </>
        ) : (
          <ThemedView style={styles.centerContainer}>
            <ThemedText type="title">You are not subscribed to any creators</ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const useHomeScreenStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8 * scale,
    },
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20 * scale,
    },
    headerImage: {
      height: 178 * scale,
      width: '100%',
      bottom: 0,
      left: 0,
      position: 'absolute',
    },
  });
};
