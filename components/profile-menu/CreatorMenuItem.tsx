import type { ReactElement } from 'react';
import { Image, Text, View } from 'react-native';
import { useThemeColor } from '@sinkplane/shared';
import type { Creator } from '@sinkplane/shared/types/creator-list.interface';

import { MenuItem } from '@/components/profile-menu/MenuItem';
import {
  type ProfileMenuStyles,
  staticMenuStyles,
} from '@/components/profile-menu/profile-menu-styles';

interface CreatorMenuItemProps {
  readonly creator: Creator;
  readonly isActive: boolean;
  readonly isFirst: boolean;
  readonly styles: ProfileMenuStyles;
  readonly onSelect: (creator: Creator) => void;
}

export function CreatorMenuItem({
  creator,
  isActive,
  isFirst,
  styles,
  onSelect,
}: CreatorMenuItemProps): ReactElement {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <MenuItem
      hasTVPreferredFocus={isFirst}
      onPress={() => {
        onSelect(creator);
      }}
      style={[styles.menuItem, isActive && styles.activeMenuItem]}
    >
      {(focused) => (
        <View style={[staticMenuStyles.creatorItem, styles.creatorItem]}>
          <Image source={{ uri: creator.icon.path }} style={styles.creatorIcon} />
          <Text
            style={[
              staticMenuStyles.menuItemTextNormal,
              styles.menuItemText,
              focused && { color: backgroundColor },
              isActive && staticMenuStyles.activeMenuItemText,
            ]}
          >
            {creator.title}
          </Text>
        </View>
      )}
    </MenuItem>
  );
}
