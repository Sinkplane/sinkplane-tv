import { useState } from 'react';
import { View, Pressable, Image, StyleSheet, Modal, Text, TouchableHighlight } from 'react-native';
import { useRouter } from 'expo-router';

import { useSession } from '@/hooks/authentication/auth.context';
import { Colors } from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Creator } from '@/types/creator-list.interface';
import { useScale } from '@/hooks/useScale';

export function ProfileAvatar() {
  const [menuVisible, setMenuVisible] = useState(false);
  const { user, signOut, creators, creator: currentCreator, subscriptions, setCreator, setSubscription } = useSession();
  const router = useRouter();
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const styles = useProfileAvatarStyles();
  const scale = useScale();

  const handleLogout = () => {
    setMenuVisible(false);
    signOut();
    router.replace('/sign-in');
  };

  const handleSwitchCreator = (creator: Creator) => {
    const sub = subscriptions?.find((s) => s.creator === creator.id);
    if (sub) {
      setSubscription(sub);
      setCreator(creator);
    }
    setMenuVisible(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setMenuVisible(true)}
        style={({ pressed, focused }) => [
          styles.avatarButton,
          pressed && styles.avatarPressed,
          focused && styles.avatarFocused
        ]}
      >
        <View style={styles.avatarContainer}>
          {!!user && !!user.profileImage ? (
            <Image source={{ uri: user.profileImage.path }} style={styles.avatar} />
          ) : (
            <Ionicons size={30 * scale} name="person-outline" />
          )}
        </View>
      </Pressable>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setMenuVisible(false)}
            focusable={false}
          />
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Switch Subscription</Text>
            {creators?.map((creator, index) => {
              const isActive = currentCreator?.id === creator.id;
              return (
                <Pressable
                  key={creator.id}
                  hasTVPreferredFocus={index === 0}
                  onPress={() => handleSwitchCreator(creator)}
                  style={({ pressed, focused }) => [
                    styles.menuItem,
                    (pressed || focused) && { backgroundColor: tintColor },
                    isActive && styles.activeMenuItem,
                  ]}
                >
                  {({ focused }) => (
                    <View style={styles.creatorItem}>
                      <Image source={{ uri: creator.icon.path }} style={styles.creatorIcon} />
                      <Text
                        style={[
                          styles.menuItemTextNormal,
                          focused && { color: backgroundColor },
                          isActive && styles.activeMenuItemText,
                        ]}
                      >
                        {creator.title}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
            <View style={styles.divider} />
            <Pressable
              onPress={handleLogout}
              style={({ pressed, focused }) => [
                styles.menuItem,
                (pressed || focused) && { backgroundColor: tintColor }
              ]}
            >
              {({ focused }) => (
                <Text style={[
                  styles.menuItemLogoutText,
                  focused && { color: backgroundColor }
                ]}>
                  Logout
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useProfileAvatarStyles = function () {
  const scale = useScale();
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 40 * scale,
      left: 20 * scale,
      zIndex: 1000,
    },
    avatarButton: {
      borderRadius: 25 * scale,
      borderWidth: 2 * scale,
      borderColor: Colors.light.tint,
      overflow: 'hidden',
    },
    avatarContainer: {
      width: 50 * scale,
      height: 50 * scale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: '100%',
      height: '100%',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      paddingTop: 80 * scale,
      paddingLeft: 20 * scale,
    },
    menu: {
      backgroundColor: '#fff',
      borderRadius: 12 * scale,
      padding: 16 * scale,
      minWidth: 300 * scale,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    menuTitle: {
      fontSize: 18 * scale,
      fontWeight: 'bold',
      marginBottom: 12 * scale,
      color: '#333',
      paddingHorizontal: 8 * scale,
    },
    creatorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12 * scale,
    },
    creatorIcon: {
      width: 30 * scale,
      height: 30 * scale,
      borderRadius: 15 * scale,
    },
    activeMenuItem: {
      borderLeftWidth: 4 * scale,
      borderLeftColor: Colors.light.tint,
    },
    activeMenuItemText: {
      fontWeight: 'bold',
    },
    divider: {
      height: 1 * scale,
      backgroundColor: '#e0e0e0',
      marginVertical: 8 * scale,
    },
    menuItem: {
      paddingVertical: 12 * scale,
      paddingHorizontal: 8 * scale,
      borderRadius: 8 * scale,
    },
    menuItemTextNormal: {
      fontSize: 16 * scale,
      color: '#000',
      fontWeight: '400',
    },
    menuItemLogoutText: {
      fontSize: 16 * scale,
      color: '#d32f2f',
      fontWeight: '600',
    },
  });
};
