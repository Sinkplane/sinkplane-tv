import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { formatDuration, formatLikes, stripHtml } from '@/components/videos/video-format';
import { WatchProgressBar } from '@/components/videos/WatchProgressBar';
import { BORDER_WIDTH, RADIUS, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { type Video, useThemeColor } from '@sinkplane/shared';

interface VideoListItemProps {
  readonly video: Video;
  readonly progress: number | undefined;
}

const THUMBNAIL_SIZE = { width: 16, height: 9 };
const THUMBNAIL_ASPECT_RATIO = THUMBNAIL_SIZE.width / THUMBNAIL_SIZE.height;
const METADATA_ICON_SIZE = 16;
const SHADOW = { radius: 6, focusedRadius: 8, cardFocusedRadius: 4 };
const DESCRIPTION_LINES = 4;
const TITLE_LINES = 2;

const staticStyles = StyleSheet.create({
  container: { marginBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { flex: 0, flexShrink: 1 },
  separator: { flexShrink: 0, paddingHorizontal: 4 },
  description: { fontSize: 16, flexShrink: 1, lineHeight: 25 },
  thumbnail: { height: '100%', aspectRatio: THUMBNAIL_ASPECT_RATIO, flexShrink: 0 },
  thumbnailContainer: { position: 'relative', height: '100%', aspectRatio: THUMBNAIL_ASPECT_RATIO },
  textColumn: {
    marginLeft: 15,
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    paddingRight: 15,
    paddingVertical: 10,
  },
  card: {
    borderColor: 'transparent',
    flex: 1,
    maxHeight: 256,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  shadow: { shadowColor: '#000', shadowOpacity: 0.3, elevation: 6, flex: 1 },
  shadowFocused: { shadowOpacity: 0.5, elevation: 10 },
  cardFocused: { borderColor: '#007AFF', shadowOpacity: 0.4, elevation: 8 },
  channel: { opacity: 0.7, flexShrink: 0 },
  metadataRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  metadataItem: { flexDirection: 'row', alignItems: 'center' },
  metadataText: { fontSize: 12, opacity: 0.8 },
});

function createScaledStyles(scale: number, backgroundColor: string) {
  return StyleSheet.create({
    titleRow: { marginBottom: SPACE.xs * scale },
    description: { marginTop: SPACE.xs * scale },
    card: {
      borderRadius: RADIUS.md * scale,
      borderWidth: BORDER_WIDTH.thick * scale,
      backgroundColor,
    },
    shadow: {
      borderRadius: RADIUS.md * scale,
      shadowOffset: { width: 0, height: SPACE.xs * scale },
      shadowRadius: SHADOW.radius * scale,
    },
    shadowFocused: { shadowRadius: SHADOW.focusedRadius * scale },
    cardFocused: { shadowRadius: SHADOW.cardFocusedRadius * scale },
    metadataRow: { marginTop: SPACE.sm * scale, gap: SPACE.md * scale },
    metadataItem: { gap: SPACE.xs * scale },
  });
}

function useVideoListItemStyles(): ReturnType<typeof createScaledStyles> {
  return createScaledStyles(useScale(), useThemeColor({}, 'background'));
}

function ListItemMetadata({ video }: { readonly video: Video }): ReactElement {
  const styles = useVideoListItemStyles();
  const iconColor = useThemeColor({}, 'text');
  const itemStyle = [staticStyles.metadataItem, styles.metadataItem];
  return (
    <ThemedView style={[staticStyles.metadataRow, styles.metadataRow]}>
      <ThemedView style={itemStyle}>
        <Ionicons name="time-outline" size={METADATA_ICON_SIZE} color={iconColor} />
        <ThemedText style={staticStyles.metadataText}>
          {formatDuration(video.metadata.videoDuration)}
        </ThemedText>
      </ThemedView>
      <ThemedView style={itemStyle}>
        <Ionicons name="heart-outline" size={METADATA_ICON_SIZE} color={iconColor} />
        <ThemedText style={staticStyles.metadataText}>{formatLikes(video.likes)}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function ListItemDetails({ video }: { readonly video: Video }): ReactElement {
  const styles = useVideoListItemStyles();
  return (
    <ThemedView style={staticStyles.textColumn}>
      <ThemedView style={[staticStyles.titleRow, styles.titleRow]}>
        <ThemedText type="defaultSemiBold" numberOfLines={TITLE_LINES} style={staticStyles.title}>
          {video.title}
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={staticStyles.separator}>
          {' | '}
        </ThemedText>
        <ThemedText numberOfLines={1} style={staticStyles.channel}>
          {video.channel.title}
        </ThemedText>
      </ThemedView>
      <ThemedText
        numberOfLines={DESCRIPTION_LINES}
        style={[staticStyles.description, styles.description]}
      >
        {stripHtml(video.text)}
      </ThemedText>
      <ListItemMetadata video={video} />
    </ThemedView>
  );
}

function ListItemThumbnail({ video, progress }: VideoListItemProps): ReactElement {
  return (
    <View style={staticStyles.thumbnailContainer}>
      <Image
        source={{ uri: video.thumbnail.path }}
        style={staticStyles.thumbnail}
        resizeMode="cover"
      />
      <WatchProgressBar progress={progress} duration={video.metadata.videoDuration} />
    </View>
  );
}

export function VideoListItem({ video, progress }: VideoListItemProps): ReactElement {
  const styles = useVideoListItemStyles();
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const focusedCard = [staticStyles.cardFocused, styles.cardFocused];

  return (
    <Pressable
      testID={`video-list-item-${video.id}`}
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
      <View
        style={[
          staticStyles.shadow,
          styles.shadow,
          isFocused && [staticStyles.shadowFocused, styles.shadowFocused],
        ]}
      >
        <View style={[staticStyles.card, styles.card, isFocused && focusedCard]}>
          <ListItemThumbnail video={video} progress={progress} />
          <ListItemDetails video={video} />
        </View>
      </View>
    </Pressable>
  );
}
