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
          <Icon sf={{ default: 'play', selected: 'play.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="about">
          <Label>About</Label>
          <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="live">
          <Label>Live</Label>
          <Icon sf={{ default: 'tv', selected: 'tv.fill' }} />
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
