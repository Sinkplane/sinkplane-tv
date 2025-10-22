import { StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { Video } from '@/types/video.interface';

interface VideoListItemProps {
  video: Video;
  onPress?: (video: Video) => void;
}

export const VideoListItem = ({ video, onPress }: VideoListItemProps) => {
  const styles = useVideoListItemStyles();
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress(video);
    } else {
      router.push(`/video/${video.id}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <ThemedView style={[styles.card, isFocused && styles.cardFocused]}>
        <ThemedText type="defaultSemiBold" numberOfLines={2}>
          {video.title}
        </ThemedText>
        <ThemedText style={styles.channel} numberOfLines={1}>
          {video.channel.title}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
};

const useVideoListItemStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    card: {
      padding: 16 * scale,
      marginBottom: 12 * scale,
      borderRadius: 8 * scale,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2 * scale,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62 * scale,
      elevation: 4,
      borderWidth: 3 * scale,
      borderColor: 'transparent',
    },
    cardFocused: {
      borderColor: '#007AFF',
      shadowOpacity: 0.4,
      shadowRadius: 4 * scale,
      elevation: 8,
    },
    channel: {
      marginTop: 4 * scale,
      opacity: 0.7,
    },
  });
};
