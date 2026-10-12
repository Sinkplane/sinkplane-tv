import { Tabs, type BottomTabBarButtonProps, type BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTextStyles } from '@/hooks/useTextStyles';
import { ProfileAvatar } from '@/components/ProfileAvatar';

type Route = {
  key: string;
  name: string;
};

/**
 * This layout is required for the web platform.
 */
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const textStyles = useTextStyles();
  const styles = useTabLayoutStyles();

  const tabBarButton = ({ ref: _ref, href: _href, ...props }: BottomTabBarButtonProps) => {
    const style: BottomTabBarButtonProps['style'] = props.style ?? {};
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

  const renderTabBar = (props: BottomTabBarProps) => (
    <View style={styles.tabBarContainer}>
      <View style={styles.avatarContainer}>
        <ProfileAvatar />
      </View>
      <View style={styles.tabBarContent}>
        {props.state.routes.map((route: Route, index: number) => {
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
                  { color: isFocused ? palette.tint : palette.tabIconDefault },
                ]}
              >
                {route.name === 'index'
                  ? 'Home'
                  : route.name === 'history'
                    ? 'History'
                    : route.name === 'live'
                      ? 'Live Now'
                      : route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: palette.tint,
          tabBarActiveBackgroundColor: palette.background,
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
          name="history"
          options={{
            title: 'History',
            tabBarButton,
            tabBarLabelStyle: textStyles.default,
            tabBarIcon: () => null
          }}
        />
        <Tabs.Screen
          name="live"
          options={{
            title: 'Live Now',
            tabBarButton,
            tabBarLabelStyle: textStyles.default,
            tabBarIcon: () => null
          }}
        />
      </Tabs>
    </View>
  );
}

const useTabLayoutStyles = function () {
  const colorScheme = useColorScheme();

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    tabBarContainer: {
      flexDirection: 'row',
      backgroundColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
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
      width: 60, // Give it some space since ProfileAvatar is absolute and might need it
    },
  });
};
