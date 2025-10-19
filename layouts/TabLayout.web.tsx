import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Pressable, View, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTextStyles } from '@/hooks/useTextStyles';
import { ProfileAvatar } from '@/components/ProfileAvatar';

/**
 * This layout is required for the web platform.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const textStyles = useTextStyles();

  const tabBarButton = (props: React.ComponentProps<typeof Pressable>) => {
    const style: React.ComponentProps<typeof Pressable>['style'] = props.style ?? {};
    return (
      <Pressable
        {...props}
        style={({ pressed, focused }) => [
          style,
          {
            opacity: pressed || focused ? 0.6 : 1.0
          }
        ]}
      />
    );
  };

  const renderTabBar = (props: any) => {
    return (
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBarContent}>
          {props.state.routes.map((route: any, index: number) => {
            const isFocused = props.state.index === index;
            const onPress = () => {
              const event = props.navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                props.navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed, focused }) => [
                  styles.tabButton,
                  {
                    opacity: pressed || focused ? 0.6 : 1.0,
                  },
                ]}
              >
                <Text
                  style={[
                    textStyles.default,
                    { color: isFocused ? Colors[colorScheme ?? 'light'].tint : '#888' },
                  ]}
                >
                  {route.name === 'index' ? 'Home' : route.name === 'explore' ? 'Explore' : 'TV demo'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.avatarContainer}>
          <ProfileAvatar />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarActiveBackgroundColor: Colors[colorScheme ?? 'light'].background,
        tabBarStyle: {
          width: '100%'
        },
        tabBarPosition: 'top',
        tabBarIconStyle: {
          height: textStyles.title.lineHeight,
          width: 0
        },
        headerShown: false
      }}
      tabBar={renderTabBar}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButton,
          tabBarLabelStyle: textStyles.default,
          tabBarIcon: () => null
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarButton,
          tabBarLabelStyle: textStyles.default,
          tabBarIcon: () => null
        }}
      />
      <Tabs.Screen
        name="tv_focus"
        options={
          Platform.OS === 'web'
            ? {
                href: null
              }
            : {
                title: 'TV demo',
                tabBarButton,
                tabBarLabelStyle: textStyles.default,
                tabBarIcon: () => null
              }
        }
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    marginLeft: 'auto',
  },
});
