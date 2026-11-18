import type { ReactElement } from 'react';
import { ActivityIndicator, Image, Pressable } from 'react-native';

import bg from '@/assets/images/bg.jpg';
import { ParallaxScrollView } from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { LiveCreator, LiveStatusState } from '@/hooks/useLiveStream';

import { useLiveStyles } from './live-styles';

type SubscribedCreator = NonNullable<LiveCreator>;

const HEADER_BACKGROUND = { light: '#A1CEDC', dark: '#1D3D47' };

interface LiveStatusProps {
  readonly creator: LiveCreator;
  readonly status: LiveStatusState;
  readonly onRefresh: () => void;
}

interface CreatorLiveStatusProps {
  readonly creator: SubscribedCreator;
  readonly status: LiveStatusState;
  readonly onRefresh: () => void;
}

interface LiveStatusMessageProps {
  readonly creator: SubscribedCreator;
  readonly status: LiveStatusState;
}

function LiveStatusMessage({ creator, status }: LiveStatusMessageProps) {
  const styles = useLiveStyles();
  if (status.isNotLive) {
    return (
      <ThemedView style={styles.offlineContainer}>
        <ThemedText type="subtitle">{`${creator.title} is not live right now.`}</ThemedText>
      </ThemedView>
    );
  }
  if (status.errorMessage !== undefined) {
    return (
      <ThemedView style={[styles.offlineContainer, styles.statusError]}>
        <ThemedText type="subtitle">Error checking stream status</ThemedText>
        <ThemedText>{status.errorMessage}</ThemedText>
      </ThemedView>
    );
  }
  if (creator.liveStream === undefined) {
    return null;
  }
  return (
    <ThemedView style={styles.offlineContainer}>
      <ThemedText type="subtitle">Stream Offline</ThemedText>
      <ThemedText>{creator.liveStream.offline.title}</ThemedText>
    </ThemedView>
  );
}

function CreatorLiveStatus({ creator, status, onRefresh }: CreatorLiveStatusProps) {
  const styles = useLiveStyles();
  return (
    <ThemedView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{creator.title}</ThemedText>
        {status.isChecking ? (
          <ActivityIndicator size="small" color="#fff" style={styles.checkingSpinner} />
        ) : null}
      </ThemedView>
      <LiveStatusMessage creator={creator} status={status} />
      <Pressable style={styles.refreshButton} onPress={onRefresh} disabled={status.isFetching}>
        <ThemedText style={styles.refreshButtonText}>
          {status.isFetching ? '🔄 Checking...' : '🔄 Refresh Stream Status'}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export function LiveStatus({ creator, status, onRefresh }: LiveStatusProps): ReactElement {
  const styles = useLiveStyles();
  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BACKGROUND}
      headerImage={
        <Image
          style={styles.headerImage}
          source={creator === undefined ? bg : { uri: creator.cover.path }}
          resizeMode="cover"
        />
      }
    >
      {creator === undefined ? (
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">You are not subscribed to any creators</ThemedText>
        </ThemedView>
      ) : (
        <CreatorLiveStatus creator={creator} status={status} onRefresh={onRefresh} />
      )}
    </ParallaxScrollView>
  );
}
