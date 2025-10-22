import { StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const styles = useVideoDetailStyles();

  // TODO: Fetch video details using the id
  // For now, just display the video ID

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title">Video Details</ThemedText>
        <ThemedText style={styles.videoId}>Video ID: {id}</ThemedText>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Video Player</ThemedText>
          <ThemedView style={styles.placeholder}>
            <ThemedText>Video player will go here</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Description</ThemedText>
          <ThemedText>Video description and metadata will be displayed here.</ThemedText>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const useVideoDetailStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: 20 * scale,
    },
    videoId: {
      marginTop: 10 * scale,
      marginBottom: 20 * scale,
      opacity: 0.7,
    },
    section: {
      marginTop: 20 * scale,
      marginBottom: 20 * scale,
    },
    placeholder: {
      marginTop: 10 * scale,
      padding: 40 * scale,
      borderRadius: 8 * scale,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#666',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
