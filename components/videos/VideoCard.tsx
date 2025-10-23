import { StyleSheet, Pressable, Image, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { Video } from '@/types/video.interface';

interface VideoCardProps {
  video: Video;
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const formatLikes = (likes: number): string => {
  if (likes >= 1000000) {
    return `${(likes / 1000000).toFixed(1)}M`;
  }
  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(1)}K`;
  }
  return likes.toString();
};

export const VideoCard = ({ video }: VideoCardProps) => {
  const scale = useScale();
  const styles = useVideoCardStyles();
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handlePress = () => {
    router.push(`/video/${video.id}`);
  };

  return (
    <Pressable onPress={handlePress} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} style={styles.container}>
      <ThemedView style={[styles.shadow, isFocused && styles.shadowFocused]}>
        <ThemedView style={[styles.card, isFocused && styles.cardFocused]}>
          <View style={styles.thumbnailContainer}>
            <Image source={{ uri: video?.thumbnail?.path ?? '' }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.overlayContainer}>
              <View style={styles.overlayItem}>
                <Ionicons name="heart" size={14 * scale} color="#fff" />
                <ThemedText style={styles.overlayText}>{formatLikes(video.likes)}</ThemedText>
              </View>
              <View style={styles.overlayItem}>
                <Ionicons name="time" size={14 * scale} color="#fff" />
                <ThemedText style={styles.overlayText}>{formatDuration(video.metadata.videoDuration)}</ThemedText>
              </View>
            </View>
          </View>
          <ThemedView style={styles.content}>
            <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.title}>
              {video.title}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
};

const useVideoCardStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    container: {
      width: '23.5%', // 4 columns with gap spacing
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
    card: {
      borderRadius: 8 * scale,
      overflow: 'hidden',
      borderWidth: 3 * scale,
      borderColor: 'transparent',
      flex: 1,
    },
    cardFocused: {
      borderColor: '#007AFF',
    },
    thumbnailContainer: {
      position: 'relative',
      width: '100%',
    },
    thumbnail: {
      width: '100%',
      aspectRatio: 16 / 9,
    },
    overlayContainer: {
      position: 'absolute',
      bottom: 8 * scale,
      right: 8 * scale,
      flexDirection: 'column',
      gap: 4 * scale,
    },
    overlayItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 4 * scale,
      paddingHorizontal: 6 * scale,
      paddingVertical: 3 * scale,
      gap: 4 * scale,
    },
    overlayText: {
      color: '#fff',
      fontSize: 12 * scale,
      fontWeight: '600',
    },
    content: {
      padding: 12 * scale,
      flex: 1,
    },
    title: {
      marginBottom: 4 * scale,
    },
    channel: {
      marginTop: 4 * scale,
      opacity: 0.7,
      fontSize: 12 * scale,
    },
  });
};
