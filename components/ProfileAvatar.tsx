import { useState } from 'react';
import { View, Pressable, Image, StyleSheet, Modal, Text, Platform, findNodeHandle } from 'react-native';
import { useRouter } from 'expo-router';

import { useSession } from '@/hooks/authentication/auth.context';
import { Colors } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import Ionicons from '@expo/vector-icons/Ionicons';

export function ProfileAvatar() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, signOut } = useSession();
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const handleLogout = () => {
    setMenuVisible(false);
    signOut();
    router.replace('/sign-in');
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setMenuVisible(true)} style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarPressed]}>
        {!!user && !!user.profileImage ? (
          <Image source={{ uri: user.profileImage.path }} style={styles.avatar} />
        ) : (
          <Ionicons size={310} name="person-outline" />
        )}
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.menu}>
            {/* <Pressable style={({ pressed, focused }) => [
              styles.menuItem,
              (pressed || focused) && { backgroundColor: tintColor }
            ]}>
              {({ focused }) => (
                <Text style={[styles.menuItemTextNormal, focused && { color: backgroundColor }]}>
                  Change Creator
                </Text>
              )}
            </Pressable> */}
            <Pressable
              style={({ pressed, focused }) => [styles.menuItem, (pressed || focused) && { backgroundColor: tintColor }]}
              onPress={handleLogout}
            >
              {({ focused }) => <Text style={[styles.menuItemText, focused && { color: backgroundColor }]}>Logout</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1000,
  },
  avatarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  avatarPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 20,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  displayName: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuItemPressed: {
    backgroundColor: '#f0f0f0',
  },
  menuItemTextNormal: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  menuItemText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
  },
});
