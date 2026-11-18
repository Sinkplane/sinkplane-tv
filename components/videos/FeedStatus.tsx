import type { ReactElement } from 'react';
import { ActivityIndicator, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface FeedSpinnerProps {
  readonly visible: boolean;
  readonly style: StyleProp<ViewStyle>;
}

interface FeedErrorProps {
  readonly error: Error | null;
  readonly label: string;
  readonly style: StyleProp<ViewStyle>;
}

interface FeedLoadingMoreProps {
  readonly visible: boolean;
  readonly label: string;
  readonly style: StyleProp<ViewStyle>;
  readonly textStyle: StyleProp<TextStyle>;
}

export function FeedSpinner({ visible, style }: FeedSpinnerProps): ReactElement | null {
  if (!visible) {
    return null;
  }
  return (
    <ThemedView style={style}>
      <ActivityIndicator size="large" />
    </ThemedView>
  );
}

export function FeedError({ error, label, style }: FeedErrorProps): ReactElement | null {
  if (error === null) {
    return null;
  }
  return (
    <ThemedView style={style}>
      <ThemedText>
        {label}: {error.message}
      </ThemedText>
    </ThemedView>
  );
}

export function FeedLoadingMore({
  visible,
  label,
  style,
  textStyle,
}: FeedLoadingMoreProps): ReactElement | null {
  if (!visible) {
    return null;
  }
  return (
    <ThemedView style={style}>
      <ActivityIndicator size="large" />
      <ThemedText style={textStyle}>{label}</ThemedText>
    </ThemedView>
  );
}
