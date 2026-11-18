import type { PropsWithChildren, ReactElement } from 'react';
import { Image, StyleSheet } from 'react-native';

import bg from '@/assets/images/bg.jpg';
import type { ScrollEvent } from '@/components/infinite-scroll';
import { ParallaxScrollView } from '@/components/ParallaxScrollView';
import { useScale } from '@/hooks/useScale';
import { type Creator } from '@sinkplane/shared/types/creator-list.interface';

type CreatorScrollViewProps = PropsWithChildren<{
  creator: Creator | undefined;
  onScroll?: ((event: ScrollEvent) => void) | undefined;
}>;

const HEADER_BACKGROUND = { light: '#A1CEDC', dark: '#1D3D47' };
const HEADER_IMAGE_HEIGHT = 178;

function useHeaderImageStyles() {
  const scale = useScale();
  return StyleSheet.create({
    headerImage: {
      height: HEADER_IMAGE_HEIGHT * scale,
      width: '100%',
      bottom: 0,
      left: 0,
      position: 'absolute',
    },
  });
}

export function CreatorScrollView({
  creator,
  onScroll,
  children,
}: CreatorScrollViewProps): ReactElement {
  const styles = useHeaderImageStyles();
  return (
    <ParallaxScrollView
      headerBackgroundColor={HEADER_BACKGROUND}
      headerImage={
        <Image
          style={styles.headerImage}
          source={creator === undefined ? bg : { uri: creator.cover.path }}
          resizeMode="cover"
        />
      }
      onScroll={onScroll}
    >
      {children}
    </ParallaxScrollView>
  );
}
