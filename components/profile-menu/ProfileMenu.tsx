import type { ReactElement } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSession, useTheme, useThemeColor } from '@sinkplane/shared';
import type { Creator } from '@sinkplane/shared/types/creator-list.interface';

import { CreatorMenuItem } from '@/components/profile-menu/CreatorMenuItem';
import { MenuItem } from '@/components/profile-menu/MenuItem';
import {
  type ProfileMenuStyles,
  staticMenuStyles,
  useProfileMenuStyles,
} from '@/components/profile-menu/profile-menu-styles';
import { ICON_SIZE } from '@/constants/layout';
import { useIsDarkMode } from '@/hooks/usePalette';
import { useScale } from '@/hooks/useScale';

interface ProfileMenuProps {
  readonly onClose: () => void;
}

interface MenuSectionProps extends ProfileMenuProps {
  readonly styles: ProfileMenuStyles;
}

function CreatorList({ onClose, styles }: MenuSectionProps): ReactElement {
  const {
    creators,
    creator: currentCreator,
    subscriptions,
    setCreator,
    setSubscription,
  } = useSession();

  const switchCreator = (creator: Creator): void => {
    const subscription = (subscriptions ?? []).find((sub) => sub.creator === creator.id);
    if (subscription !== undefined) {
      setSubscription(subscription);
      setCreator(creator);
    }
    onClose();
  };

  return (
    <>
      {(creators ?? []).map((creator, index) => (
        <CreatorMenuItem
          key={creator.id}
          creator={creator}
          isActive={currentCreator?.id === creator.id}
          isFirst={index === 0}
          styles={styles}
          onSelect={switchCreator}
        />
      ))}
    </>
  );
}

function ThemeToggle({ onClose, styles }: MenuSectionProps): ReactElement {
  const { toggleColorScheme } = useTheme();
  const isDarkMode = useIsDarkMode();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const scale = useScale();

  return (
    <MenuItem
      onPress={() => {
        toggleColorScheme();
        onClose();
      }}
      style={styles.menuItem}
    >
      {(focused) => (
        <View style={[staticMenuStyles.creatorItem, styles.creatorItem]}>
          <Ionicons
            size={ICON_SIZE.lg * scale}
            name={isDarkMode ? 'sunny' : 'moon'}
            color={focused ? backgroundColor : tintColor}
          />
          <Text
            style={[
              staticMenuStyles.menuItemTextNormal,
              styles.menuItemText,
              focused && { color: backgroundColor },
            ]}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </View>
      )}
    </MenuItem>
  );
}

function LogoutItem({ onClose, styles }: MenuSectionProps): ReactElement {
  const { signOut } = useSession();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <MenuItem
      onPress={() => {
        onClose();
        signOut();
        router.replace('/sign-in');
      }}
      style={styles.menuItem}
    >
      {(focused) => (
        <Text
          style={[
            styles.menuItemText,
            staticMenuStyles.menuItemLogoutText,
            focused && { color: backgroundColor },
          ]}
        >
          Logout
        </Text>
      )}
    </MenuItem>
  );
}

export function ProfileMenu({ onClose }: ProfileMenuProps): ReactElement {
  const styles = useProfileMenuStyles();

  return (
    <View style={[staticMenuStyles.menu, styles.menu]}>
      <Text style={[staticMenuStyles.menuTitle, styles.menuTitle]}>Switch Subscription</Text>
      <CreatorList onClose={onClose} styles={styles} />
      <View style={styles.divider} />
      <ThemeToggle onClose={onClose} styles={styles} />
      <View style={styles.divider} />
      <LogoutItem onClose={onClose} styles={styles} />
    </View>
  );
}
