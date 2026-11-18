import type { ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FONT_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { usePalette } from '@/hooks/usePalette';
import { useScale } from '@/hooks/useScale';

const MODAL_MAX_WIDTH = 600;
const LIST_MAX_HEIGHT = 400;
const DIVIDER_ALPHA = '40';

interface ThemedModalProps<T> {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly data: readonly T[];
  readonly renderItem: (item: T) => ReactElement | null;
  readonly keyExtractor: (item: T) => string;
}

const staticStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
});

function useThemedModalStyles() {
  const scale = useScale();
  const palette = usePalette();
  return StyleSheet.create({
    modalContainer: { width: '80%', maxWidth: MODAL_MAX_WIDTH * scale, maxHeight: '80%' },
    modalContent: { borderRadius: RADIUS.lg * scale, padding: SPACE.xxl * scale },
    header: {
      marginBottom: SPACE.xl * scale,
      borderBottomColor: `${palette.tint}${DIVIDER_ALPHA}`,
      paddingBottom: SPACE.md * scale,
    },
    closeButton: { padding: SPACE.sm * scale, marginLeft: SPACE.lg * scale },
    closeButtonText: { fontSize: FONT_SIZE.heading * scale },
    listView: { maxHeight: LIST_MAX_HEIGHT * scale },
  });
}

export function ThemedModal<T>({
  visible,
  onClose,
  title,
  data,
  renderItem,
  keyExtractor,
}: ThemedModalProps<T>): ReactElement {
  const styles = useThemedModalStyles();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={staticStyles.overlay}>
        <View style={styles.modalContainer}>
          <ThemedView style={[staticStyles.modalContent, styles.modalContent]}>
            <ThemedView style={[staticStyles.header, styles.header]}>
              <ThemedText type="title" style={staticStyles.headerTitle}>
                {title}
              </ThemedText>
              <Pressable onPress={onClose} style={styles.closeButton} testID="modal-close-button">
                <ThemedText style={[staticStyles.closeButtonText, styles.closeButtonText]}>
                  ✕
                </ThemedText>
              </Pressable>
            </ThemedView>
            <View style={styles.listView}>
              {data.map((item) => (
                <View key={keyExtractor(item)}>{renderItem(item)}</View>
              ))}
            </View>
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}
