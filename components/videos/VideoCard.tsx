import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { formatDuration, formatLikes } from '@/components/videos/video-format';
import { WatchProgressBar } from '@/components/videos/WatchProgressBar';
import { BORDER_WIDTH, FONT_SIZE, ICON_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { type Video } from '@sinkplane/shared';

interface VideoCardProps {
  readonly video: Video;
  readonly progress?: number | undefined;
}

const CARD_WIDTH = '23.5%';
const THUMBNAIL_SIZE = { width: 16, height: 9 };
const OVERLAY_PADDING = { horizontal: 6, vertical: 3 };
const SHADOW = { radius: 6, focusedRadius: 8 };

const staticStyles = StyleSheet.create({
  container: { width: CARD_WIDTH },
  shadow: { shadowColor: '#000', shadowOpacity: 0.3, elevation: 6, flex: 1 },
  shadowFocused: { shadowOpacity: 0.5, elevation: 10 },
  card: { overflow: 'hidden', borderColor: 'transparent', flex: 1 },
  cardFocused: { borderColor: '#007AFF' },
  thumbnailContainer: { position: 'relative', width: '100%' },
  thumbnail: { width: '100%', aspectRatio: THUMBNAIL_SIZE.width / THUMBNAIL_SIZE.height },
  overlayContainer: { position: 'absolute', flexDirection: 'column' },
  overlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1 },
});

function useVideoCardStyles(): ReturnType<typeof createScaledStyles> {
  return createScaledStyles(useScale());
}

function createScaledStyles(scale: number) {
  return StyleSheet.create({
    shadow: {
      borderRadius: RADIUS.md * scale,
      shadowOffset: { width: 0, height: SPACE.xs * scale },
      shadowRadius: SHADOW.radius * scale,
    },
    shadowFocused: { shadowRadius: SHADOW.focusedRadius * scale },
    card: { borderRadius: RADIUS.md * scale, borderWidth: BORDER_WIDTH.thick * scale },
    overlayContainer: { bottom: SPACE.sm * scale, right: SPACE.sm * scale, gap: SPACE.xs * scale },
    overlayItem: {
      borderRadius: RADIUS.sm * scale,
      paddingHorizontal: OVERLAY_PADDING.horizontal * scale,
      paddingVertical: OVERLAY_PADDING.vertical * scale,
      gap: SPACE.xs * scale,
    },
    overlayText: { fontSize: FONT_SIZE.caption * scale },
    content: { padding: SPACE.md * scale },
    title: { marginBottom: SPACE.xs * scale },
  });
}

function CardOverlay({ video }: { readonly video: Video }): ReactElement {
  const scale = useScale();
  const styles = useVideoCardStyles();
  const itemStyle = [staticStyles.overlayItem, styles.overlayItem];
  const textStyle = [staticStyles.overlayText, styles.overlayText];
  return (
    <View style={[staticStyles.overlayContainer, styles.overlayContainer]}>
      <View style={itemStyle}>
        <Ionicons name="heart" size={ICON_SIZE.sm * scale} color="#fff" />
        <ThemedText style={textStyle}>{formatLikes(video.likes)}</ThemedText>
      </View>
      <View style={itemStyle}>
        <Ionicons name="time" size={ICON_SIZE.sm * scale} color="#fff" />
        <ThemedText style={textStyle}>{formatDuration(video.metadata.videoDuration)}</ThemedText>
      </View>
    </View>
  );
}

function CardThumbnail({ video, progress }: VideoCardProps): ReactElement {
  return (
    <View style={staticStyles.thumbnailContainer}>
      <Image
        source={{ uri: video.thumbnail.path }}
        style={staticStyles.thumbnail}
        resizeMode="cover"
      />
      <WatchProgressBar
        progress={progress}
        duration={video.metadata.videoDuration}
        testID={`video-progress-${video.id}`}
      />
      <CardOverlay video={video} />
    </View>
  );
}

export function VideoCard({ video, progress }: VideoCardProps): ReactElement {
  const styles = useVideoCardStyles();
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  return (
    <Pressable
      testID={`video-card-${video.id}`}
      onPress={() => {
        router.push(`/video/${video.id}`);
      }}
      onFocus={() => {
        setIsFocused(true);
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
      style={staticStyles.container}
    >
      <ThemedView
        style={[
          staticStyles.shadow,
          styles.shadow,
          isFocused && [staticStyles.shadowFocused, styles.shadowFocused],
        ]}
      >
        <ThemedView style={[staticStyles.card, styles.card, isFocused && staticStyles.cardFocused]}>
          <CardThumbnail video={video} progress={progress} />
          <ThemedView style={[staticStyles.content, styles.content]}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.title}>
              {video.title}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}
