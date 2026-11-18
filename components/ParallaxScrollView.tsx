import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  type AnimatedRef,
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated';

import type { ScrollEvent } from '@/components/infinite-scroll';
import { ThemedView } from '@/components/ThemedView';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { useColorScheme } from '@sinkplane/shared';

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
  onScroll?: ((event: ScrollEvent) => void) | undefined;
}>;

const HEADER_HEIGHT = 125;
const SCROLL_EVENT_THROTTLE_MS = 16;
const OVERSCROLL_TRANSLATE_RATE = 0.5;
const PARALLAX_RATE = 0.75;
const OVERSCROLL_ZOOM = 2;

function useParallaxScrollViewStyles() {
  const scale = useScale();
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      height: HEADER_HEIGHT * scale,
      overflow: 'hidden',
    },
    content: {
      flex: 1,
      padding: SPACE.xxxl * scale,
      gap: SPACE.lg * scale,
      overflow: 'hidden',
    },
  });
}

function useParallaxHeaderStyle(scrollRef: AnimatedRef<Animated.ScrollView>) {
  const scrollOffset = useScrollOffset(scrollRef);
  const headerHeight = HEADER_HEIGHT * useScale();
  return useAnimatedStyle(() => {
    const range = [-headerHeight, 0, headerHeight];
    return {
      transform: [
        {
          translateY: interpolate(scrollOffset.value, range, [
            -headerHeight * OVERSCROLL_TRANSLATE_RATE,
            0,
            headerHeight * PARALLAX_RATE,
          ]),
        },
        { scale: interpolate(scrollOffset.value, range, [OVERSCROLL_ZOOM, 1, 1]) },
      ],
    };
  });
}

export function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
  onScroll,
}: Props): ReactElement {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const headerAnimatedStyle = useParallaxHeaderStyle(scrollRef);
  const styles = useParallaxScrollViewStyles();

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        testID="parallax-scroll-view"
        scrollEventThrottle={SCROLL_EVENT_THROTTLE_MS}
        onScroll={onScroll}
      >
        <Animated.View
          style={[
            styles.header,
            { backgroundColor: headerBackgroundColor[colorScheme] },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}
