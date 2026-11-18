import { StyleSheet } from 'react-native';

import { FONT_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';

const HEADER_IMAGE_OFFSET = -45;
const ERROR_BUTTON_GAP = 10;
const SPINNER_GAP = 10;

const FIXED_STYLES = StyleSheet.create({
  checkingSpinner: {
    marginLeft: SPINNER_GAP,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusError: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
  },
  playerErrorOverlay: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  playerErrorText: {
    color: '#fff',
  },
  retryButton: {
    marginTop: ERROR_BUTTON_GAP,
    backgroundColor: '#fff',
  },
  retryButtonText: {
    color: '#000',
  },
});

function scaledStyles(scale: number) {
  return StyleSheet.create({
    headerImage: {
      color: '#808080',
      bottom: HEADER_IMAGE_OFFSET * scale,
      left: 0,
      position: 'absolute',
    },
    titleContainer: {
      flexDirection: 'row',
      gap: SPACE.sm * scale,
    },
    offlineContainer: {
      marginTop: SPACE.lg * scale,
      padding: SPACE.lg * scale,
      backgroundColor: 'rgba(255, 0, 0, 0.1)',
      borderRadius: RADIUS.md * scale,
    },
    refreshButton: {
      marginTop: SPACE.lg * scale,
      padding: SPACE.md * scale,
      backgroundColor: 'rgba(0, 122, 255, 0.8)',
      borderRadius: RADIUS.md * scale,
      alignItems: 'center',
    },
    refreshButtonText: {
      fontSize: FONT_SIZE.body * scale,
      fontWeight: 'bold',
    },
  });
}

type LiveStyles = typeof FIXED_STYLES & ReturnType<typeof scaledStyles>;

export function useLiveStyles(): LiveStyles {
  return { ...FIXED_STYLES, ...scaledStyles(useScale()) };
}
