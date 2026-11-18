import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/ThemedButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import type { VideoView } from '@/components/videos/Videos';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { AssDass } from '@sinkplane/shared';

interface HomeToolbarProps {
  readonly channelTitle: string;
  readonly view: VideoView;
  readonly sort: AssDass;
  readonly onOpenChannels: () => void;
  readonly onToggleView: () => void;
  readonly onToggleSort: () => void;
}

function useHomeToolbarStyles() {
  const scale = useScale();
  return StyleSheet.create({
    title: {
      textAlign: 'right',
      flexGrow: 1,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACE.md * scale,
      marginBottom: SPACE.lg * scale,
      flexWrap: 'wrap',
    },
  });
}

export function HomeToolbar({
  channelTitle,
  view,
  sort,
  onOpenChannels,
  onToggleView,
  onToggleSort,
}: HomeToolbarProps): ReactElement {
  const styles = useHomeToolbarStyles();
  return (
    <ThemedView style={styles.titleContainer}>
      <ThemedButton onPress={onOpenChannels} title="Change Channel" />
      <ThemedButton onPress={onToggleView} title={view === 'card' ? 'List View' : 'Card View'} />
      <ThemedButton
        onPress={onToggleSort}
        title={sort === AssDass.ASC ? 'Oldest Videos' : 'Newest Videos'}
      />
      <ThemedText type="title" style={styles.title}>
        {channelTitle} Videos
      </ThemedText>
    </ThemedView>
  );
}
