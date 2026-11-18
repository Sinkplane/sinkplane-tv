import { useState, type ReactElement } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSession, useThemeColor } from '@sinkplane/shared';

import { ProfileMenu } from '@/components/profile-menu/ProfileMenu';
import {
  staticMenuStyles,
  useProfileMenuStyles,
} from '@/components/profile-menu/profile-menu-styles';
import { BORDER_WIDTH, ICON_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';

const AVATAR_TOP = 40;
const AVATAR_SIZE = 50;

const staticStyles = StyleSheet.create({
  container: { position: 'absolute', zIndex: 1000 },
  avatarButton: { overflow: 'hidden' },
  avatarPressed: { opacity: 0.7 },
  avatarContainer: { justifyContent: 'center', alignItems: 'center' },
  avatar: { width: '100%', height: '100%' },
});

function useProfileAvatarStyles() {
  const scale = useScale();
  const tint = useThemeColor({}, 'tint');
  return StyleSheet.create({
    container: { top: AVATAR_TOP * scale, left: SPACE.xl * scale },
    avatarButton: {
      borderRadius: RADIUS.pill * scale,
      borderWidth: BORDER_WIDTH.thin * scale,
      borderColor: tint,
    },
    avatarFocused: { borderColor: tint, borderWidth: BORDER_WIDTH.thick * scale },
    avatarContainer: { width: AVATAR_SIZE * scale, height: AVATAR_SIZE * scale },
  });
}

function AvatarImage(): ReactElement {
  const { user } = useSession();
  const scale = useScale();

  if (user === undefined) {
    return <Ionicons size={ICON_SIZE.xl * scale} name="person-outline" />;
  }
  return <Image source={{ uri: user.profileImage.path }} style={staticStyles.avatar} />;
}

export function ProfileAvatar(): ReactElement {
  const [menuVisible, setMenuVisible] = useState(false);
  const styles = useProfileAvatarStyles();
  const menuStyles = useProfileMenuStyles();
  const closeMenu = (): void => {
    setMenuVisible(false);
  };

  return (
    <View style={[staticStyles.container, styles.container]}>
      <Pressable
        testID="profile-avatar-button"
        onPress={() => {
          setMenuVisible(true);
        }}
        style={({ pressed, focused }) => [
          staticStyles.avatarButton,
          styles.avatarButton,
          pressed && staticStyles.avatarPressed,
          focused && styles.avatarFocused,
        ]}
      >
        <View style={[staticStyles.avatarContainer, styles.avatarContainer]}>
          <AvatarImage />
        </View>
      </Pressable>
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <View style={[staticMenuStyles.modalOverlay, menuStyles.modalOverlay]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} focusable={false} />
          <ProfileMenu onClose={closeMenu} />
        </View>
      </Modal>
    </View>
  );
}
