import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Platform, View, StyleSheet } from 'react-native';

import WebTabLayout from './TabLayout.web';
import { ProfileAvatar } from '@/components/ProfileAvatar';

export default function TabLayout() {
  if (Platform.OS === 'android' && Platform.isTV) {
    return <WebTabLayout />;
  }
  return (
    <View style={styles.container}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf="house" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <Label>Explore</Label>
          <Icon sf="atom" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tv_focus">
          <Label>TV demo</Label>
          <Icon sf="tv.fill" />
        </NativeTabs.Trigger>
      </NativeTabs>
      <ProfileAvatar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
