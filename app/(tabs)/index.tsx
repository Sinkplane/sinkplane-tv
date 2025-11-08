import { Image, StyleSheet, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { AssDass, Videos, VideoView } from '@/components/videos/Videos';
import { useScale } from '@/hooks/useScale';

import bg from '@/assets/images/bg.jpg';
import { useSession } from '@/hooks/authentication/auth.context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedModal } from '@/components/ThemedModal';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Channel } from '@/types/creator-list.interface';

export default function HomeScreen() {
  const styles = useHomeScreenStyles();
  const { creator, token, tokenExpiration } = useSession();
  const [channel, setChannel] = useState(creator?.channels[0]);
  const [view, setView] = useState(VideoView.CARD);
  const [videOrder, setVideoOrder] = useState(AssDass.DESC);
  const [isChannelModalVisible, setIsChannelModalVisible] = useState(false);
  const fetchMoreRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (creator) {
      setChannel(creator.channels[0]);
    }
  }, [creator]);

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
    setIsChannelModalVisible(true);
  };

  const handleChannelSelect = (selectedChannel: Channel) => {
    setChannel(selectedChannel);
    setIsChannelModalVisible(false);
  };
  const switchNewestOldest = () => {
    setVideoOrder(videOrder === AssDass.ASC ? AssDass.DESC : AssDass.ASC);
  };
  const switchView = () => {
    setView(view === VideoView.CARD ? VideoView.LIST : VideoView.CARD);
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
              <ThemedButton onPress={openChannelDrawer} title="Change Channel" />
              <ThemedButton onPress={switchView} title={`${view === VideoView.CARD ? 'List' : 'Card'} View`} />
              <ThemedButton onPress={switchNewestOldest} title={`${videOrder === AssDass.ASC ? 'Oldest' : 'Newest'} Videos`} />
              <ThemedText type="title" style={styles.title}>
                {channel.title} Videos
              </ThemedText>
            </ThemedView>
            <Videos
              token={token}
              tokenExpiration={tokenExpiration ?? undefined}
              creatorId={creator.id}
              channel={channel}
              view={view}
              sort={videOrder}
              onFetchMoreRef={fetchMoreRef}
            />

            <ThemedModal
              visible={isChannelModalVisible}
              onClose={() => setIsChannelModalVisible(false)}
              title="Select Channel"
              data={creator.channels}
              keyExtractor={ch => ch.id}
              renderItem={ch => (
                <ThemedButton
                  onPress={() => handleChannelSelect(ch)}
                  title={ch.title}
                  style={[styles.channelItem, ch.id === channel.id && styles.selectedChannel]}
                />
              )}
            />
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
    title: {
      textAlign: 'right',
      flexGrow: 1,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12 * scale,
      marginBottom: 16 * scale,
      flexWrap: 'wrap',
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
    channelItem: {
      marginBottom: 12 * scale,
      width: '100%',
    },
    selectedChannel: {
      borderWidth: 2 * scale,
      borderColor: '#007AFF',
    },
  });
};
