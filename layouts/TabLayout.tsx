import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Platform, View, StyleSheet } from 'react-native';

import WebTabLayout from './TabLayout.web';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { useGetVideoDelivery } from '@/hooks/videos/useGetVideoDelivery';
import { useSession } from '@/hooks/authentication/auth.context';

const LIVESTREAM_ID = '5c13f3c006f1be15e08e05c0';

export default function TabLayout() {
  const { token, tokenExpiration } = useSession();
  const { data: videoDelivery } = useGetVideoDelivery(token ?? undefined, tokenExpiration ?? undefined, LIVESTREAM_ID, true);

  const isLive = !!videoDelivery;

  if (Platform.OS === 'android' && Platform.isTV) {
    return <WebTabLayout />;
  }
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon sf={{ default: 'play', selected: 'play.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="about">
          <Label>About</Label>
          <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        </NativeTabs.Trigger>
        {isLive && (
          <NativeTabs.Trigger name="live">
            <Label>{isLive ? 'Live Now' : 'Not Live'}</Label>
            <Icon sf={{ default: 'tv', selected: 'tv.fill' }} selectedColor="#FF0000" />
          </NativeTabs.Trigger>
        )}
      </NativeTabs>
      <ProfileAvatar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
