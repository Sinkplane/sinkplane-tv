import type { ReactElement } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { OnBufferData, OnVideoErrorData } from 'react-native-video';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { VideoPlayer } from '@/components/videos/VideoPlayer';
import { LIVESTREAM_ID, type LiveSource } from '@/hooks/live-stream-url';
import type { LivePlayerError } from '@/hooks/useLiveStream';

import { useLiveStyles } from './live-styles';

const DEFAULT_PLAYER_ERROR = 'The video could not be loaded.';

interface LivePlayerProps {
  readonly source: LiveSource;
  readonly paused: boolean;
  readonly loading: boolean;
  readonly error: LivePlayerError | null;
  readonly onLoad: () => void;
  readonly onBuffer: (event: OnBufferData) => void;
  readonly onError: (event: OnVideoErrorData) => void;
  readonly onRetry: () => void;
}

interface LivePlayerErrorProps {
  readonly error: LivePlayerError;
  readonly onRetry: () => void;
}

function playerErrorMessage(error: LivePlayerError): string {
  const message = [error.localizedDescription, error.errorString].find(
    (candidate) => candidate !== undefined && candidate !== '',
  );
  return message ?? DEFAULT_PLAYER_ERROR;
}

function LivePlayerErrorOverlay({ error, onRetry }: LivePlayerErrorProps) {
  const styles = useLiveStyles();
  return (
    <ThemedView style={[styles.offlineContainer, styles.playerErrorOverlay]}>
      <ThemedText type="subtitle">Video Player Error</ThemedText>
      <ThemedText style={styles.playerErrorText}>{playerErrorMessage(error)}</ThemedText>
      <Pressable style={[styles.refreshButton, styles.retryButton]} onPress={onRetry}>
        <ThemedText style={[styles.refreshButtonText, styles.retryButtonText]}>
          Try Again
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

export function LivePlayer({
  source,
  paused,
  loading,
  error,
  onLoad,
  onBuffer,
  onError,
  onRetry,
}: LivePlayerProps): ReactElement {
  const styles = useLiveStyles();
  return (
    <View style={styles.videoContainer}>
      {loading ? <ActivityIndicator testID="live-loading" size="large" color="#fff" /> : null}
      {error === null ? null : <LivePlayerErrorOverlay error={error} onRetry={onRetry} />}
      <VideoPlayer
        source={source}
        id={LIVESTREAM_ID}
        handleLoad={onLoad}
        handleBuffer={onBuffer}
        handleError={onError}
        paused={paused}
      />
    </View>
  );
}
