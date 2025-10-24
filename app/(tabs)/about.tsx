import { Image, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useScale } from '@/hooks/useScale';
import { useSession } from '@/hooks/authentication/auth.context';
import bg from '@/assets/images/bg.jpg';

export default function ExploreScreen() {
  const styles = useExploreScreenStyles();
  const { creator } = useSession();
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<Image style={styles.headerImage} source={creator ? { uri: creator.cover.path } : bg} resizeMode="cover" />}
    >
      {creator && (
        <ThemedView>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">{creator.about.replace('# ', '')}</ThemedText>
          </ThemedView>
          <ThemedText>{creator.description}</ThemedText>
        </ThemedView>
      )}
      {!creator && (
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">You are not subscribed to any creators</ThemedText>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}

const useExploreScreenStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    headerImage: {
      color: '#808080',
      bottom: -90 * scale,
      left: -35 * scale,
      position: 'absolute',
    },
    titleContainer: {
      flexDirection: 'row',
      gap: 8 * scale,
    },
  });
};
