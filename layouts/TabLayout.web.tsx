import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { FOCUSED_OPACITY } from '@/constants/layout';
import { useIsDarkMode, usePalette } from '@/hooks/usePalette';
import { useTextStyles } from '@/hooks/useTextStyles';

const TAB_LABELS: Readonly<Record<string, string>> = {
  index: 'Home',
  history: 'History',
  live: 'Live Now',
};

const DARK_BORDER = '#333';
const LIGHT_BORDER = '#e0e0e0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tabBarContent: {
    flexDirection: 'row',
    flex: 1,
    gap: 16,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 16,
    width: 60,
  },
});

type TabRoute = BottomTabBarProps['state']['routes'][number];

interface TabButtonProps {
  readonly route: TabRoute;
  readonly isFocused: boolean;
  readonly navigation: BottomTabBarProps['navigation'];
}

function TabButton({ route, isFocused, navigation }: TabButtonProps): ReactElement {
  const palette = usePalette();
  const textStyles = useTextStyles();

  const onPress = (): void => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed, focused }) => [
        styles.tabButton,
        { opacity: pressed || focused ? FOCUSED_OPACITY : 1 },
      ]}
    >
      <Text
        style={[textStyles.default, { color: isFocused ? palette.tint : palette.tabIconDefault }]}
      >
        {TAB_LABELS[route.name] ?? route.name}
      </Text>
    </Pressable>
  );
}

function TabBar({ state, navigation }: Readonly<BottomTabBarProps>): ReactElement {
  const palette = usePalette();
  const isDarkMode = useIsDarkMode();

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: palette.background,
          borderBottomColor: isDarkMode ? DARK_BORDER : LIGHT_BORDER,
        },
      ]}
    >
      <View style={styles.avatarContainer}>
        <ProfileAvatar />
      </View>
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => (
          <TabButton
            key={route.key}
            route={route}
            isFocused={state.index === index}
            navigation={navigation}
          />
        ))}
      </View>
    </View>
  );
}

export function TabLayout(): ReactElement {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{ tabBarPosition: 'top', headerShown: false }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="live" options={{ title: 'Live Now' }} />
      </Tabs>
    </View>
  );
}
