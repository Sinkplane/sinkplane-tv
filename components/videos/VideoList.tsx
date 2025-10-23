import { StyleSheet, Pressable, Image, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { Video } from '@/types/video.interface';
import { useThemeColor } from '@/hooks/useThemeColor';

interface VideoListItemProps {
  video: Video;
  onPress?: (video: Video) => void;
}

export const VideoListItem = ({ video, onPress }: VideoListItemProps) => {
  const styles = useVideoListItemStyles();
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const iconColor = useThemeColor({}, 'text');

  const handlePress = () => {
    if (onPress) {
      onPress(video);
    } else {
      router.push(`/video/${video.id}`);
    }
  };

  // Strip HTML tags from description
  const stripHtml = (html: string) =>
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();

  // Format duration from seconds to MM:SS or HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format likes count (e.g., 1.2K, 3.4M)
  const formatLikes = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <Pressable onPress={handlePress} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} style={styles.container}>
      <View style={[styles.shadow, isFocused && styles.shadowFocused]}>
        <View style={[styles.card, isFocused && styles.cardFocused]}>
          <Image source={{ uri: video?.thumbnail?.path ?? '' }} style={styles.thumbnail} resizeMode="cover" />
          <ThemedView style={styles.textColumn}>
            <ThemedView style={styles.titleRow}>
              <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
                {video.title}
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={styles.separator}>
                {' | '}
              </ThemedText>
              <ThemedText numberOfLines={1} style={styles.channel}>
                {video.channel.title}
              </ThemedText>
            </ThemedView>
            <ThemedText numberOfLines={4} style={styles.description}>
              {stripHtml(video.text)}
            </ThemedText>
            <ThemedView style={styles.metadataRow}>
              <ThemedView style={styles.metadataItem}>
                <Ionicons name="time-outline" size={16} color={iconColor} />
                <ThemedText style={styles.metadataText}>
                  {formatDuration(video.metadata.videoDuration)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.metadataItem}>
                <Ionicons name="heart-outline" size={16} color={iconColor} />
                <ThemedText style={styles.metadataText}>{formatLikes(video.likes)}</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        </View>
      </View>
    </Pressable>
  );
};

const useVideoListItemStyles = function () {
  const scale = useScale();
  const backgroundColor = useThemeColor({ light: undefined, dark: undefined }, 'background');
  return StyleSheet.create({
    container: {
      marginBottom: 15,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4 * scale,
    },
    title: {
      flex: 0,
      flexShrink: 1,
    },
    separator: {
      flexShrink: 0,
      paddingHorizontal: 4,
    },
    description: {
      fontSize: 16,
      marginTop: 4 * scale,
      flexShrink: 1,
      lineHeight: 25,
    },
    thumbnail: {
      height: '100%',
      aspectRatio: 16 / 9,
      flexShrink: 0,
    },
    textColumn: {
      marginLeft: 15,
      flexDirection: 'column',
      justifyContent: 'center',
      flex: 1,
      paddingRight: 15,
      paddingVertical: 10,
    },
    card: {
      borderRadius: 8 * scale,
      borderWidth: 3 * scale,
      borderColor: 'transparent',
      flex: 1,
      maxHeight: 256,
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor,
    },
    shadow: {
      borderRadius: 8 * scale,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4 * scale,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6 * scale,
      elevation: 6,
      flex: 1,
    },
    shadowFocused: {
      shadowOpacity: 0.5,
      shadowRadius: 8 * scale,
      elevation: 10,
    },
    cardFocused: {
      borderColor: '#007AFF',
      shadowOpacity: 0.4,
      shadowRadius: 4 * scale,
      elevation: 8,
    },
    channel: {
      opacity: 0.7,
      flexShrink: 0,
    },
    metadataRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginTop: 8 * scale,
      gap: 12 * scale,
    },
    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4 * scale,
    },
    metadataText: {
      fontSize: 12,
      opacity: 0.8,
    },
  });
};
