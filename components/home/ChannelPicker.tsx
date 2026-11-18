import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedButton } from '@/components/ThemedButton';
import { ThemedModal } from '@/components/ThemedModal';
import { BORDER_WIDTH, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { useThemeColor } from '@sinkplane/shared';
import { type Channel } from '@sinkplane/shared/types/creator-list.interface';

interface ChannelPickerProps {
  readonly visible: boolean;
  readonly channels: Channel[];
  readonly selectedId: string;
  readonly onSelect: (channel: Channel) => void;
  readonly onClose: () => void;
}

function useChannelPickerStyles() {
  const scale = useScale();
  const tintColor = useThemeColor({}, 'tint');
  return StyleSheet.create({
    channelItem: {
      marginBottom: SPACE.md * scale,
      width: '100%',
    },
    selectedChannel: {
      borderWidth: BORDER_WIDTH.thin * scale,
      borderColor: tintColor,
    },
  });
}

export function ChannelPicker({
  visible,
  channels,
  selectedId,
  onSelect,
  onClose,
}: ChannelPickerProps): ReactElement {
  const styles = useChannelPickerStyles();
  return (
    <ThemedModal
      visible={visible}
      onClose={onClose}
      title="Select Channel"
      data={channels}
      keyExtractor={(channel) => channel.id}
      renderItem={(channel) => (
        <ThemedButton
          onPress={() => {
            onSelect(channel);
          }}
          title={channel.title}
          style={[styles.channelItem, channel.id === selectedId && styles.selectedChannel]}
        />
      )}
    />
  );
}
