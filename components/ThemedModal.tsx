import { Modal, StyleSheet, Pressable, FlatList, View } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useScale } from '@/hooks/useScale';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ThemedModalProps<T> {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function ThemedModal<T>({ visible, onClose, title, data, renderItem, keyExtractor }: ThemedModalProps<T>) {
  const styles = useThemedModalStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ThemedView style={styles.modalContent}>
            <ThemedView style={styles.header}>
              <ThemedText type="title" style={styles.headerTitle}>
                {title}
              </ThemedText>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </Pressable>
            </ThemedView>
            <FlatList
              data={data}
              renderItem={({ item }) => renderItem(item)}
              keyExtractor={keyExtractor}
              style={styles.listView}
              contentContainerStyle={styles.listContent}
            />
          </ThemedView>
        </View>
      </View>
    </Modal>
  );
}

const useThemedModalStyles = function () {
  const scale = useScale();
  const colorScheme = useColorScheme();

  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '80%',
      maxWidth: 600 * scale,
      maxHeight: '80%',
    },
    modalContent: {
      borderRadius: 12 * scale,
      padding: 24 * scale,
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
      marginBottom: 20 * scale,
      borderBottomWidth: 1,
      borderBottomColor: Colors[colorScheme ?? 'light'].tint + '40',
      paddingBottom: 12 * scale,
    },
    headerTitle: {
      flex: 1,
    },
    closeButton: {
      padding: 8 * scale,
      marginLeft: 16 * scale,
    },
    closeButtonText: {
      fontSize: 24 * scale,
      fontWeight: 'bold',
    },
    listView: {
      maxHeight: 400 * scale,
    },
    listContent: {
      paddingBottom: 12 * scale,
    },
  });
};
