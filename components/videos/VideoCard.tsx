import { StyleSheet, Pressable, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { Video } from '@/types/video.interface';

interface VideoCardProps {
  video: Video;
}

export const VideoCard = ({ video }: VideoCardProps) => {
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
          <Image source={{ uri: video?.thumbnail?.path ?? '' }} style={styles.thumbnail} resizeMode="cover" />
          <ThemedView style={styles.content}>
            <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.title}>
              {video.title}
            </ThemedText>
            <ThemedText style={styles.channel} numberOfLines={1}>
              {video.channel.title}
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
    thumbnail: {
      width: '100%',
      aspectRatio: 16 / 9,
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
