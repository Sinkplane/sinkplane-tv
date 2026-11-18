import type { ReactElement } from 'react';
import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useGetVideoDelivery, useSession } from '@sinkplane/shared';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { TabLayout as JsTabLayout } from '@/layouts/TabLayout.web';

const LIVESTREAM_ID = '5c13f3c006f1be15e08e05c0';
const LIVE_SELECTED_COLOR = '#FF0000';

function useIsLive(): boolean {
  const { token, tokenExpiration } = useSession();
  const { data: videoDelivery } = useGetVideoDelivery(
    token ?? undefined,
    tokenExpiration ?? undefined,
    LIVESTREAM_ID,
    true,
  );
  return videoDelivery !== undefined;
}

function NativeTabLayout(): ReactElement {
  const isLive = useIsLive();

  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'play', selected: 'play.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="history">
          <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        </NativeTabs.Trigger>
        {isLive && (
          <NativeTabs.Trigger name="live">
            <NativeTabs.Trigger.Label>Live Now</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{ default: 'tv', selected: 'tv.fill' }}
              selectedColor={LIVE_SELECTED_COLOR}
            />
          </NativeTabs.Trigger>
        )}
      </NativeTabs>
      <ProfileAvatar />
    </>
  );
}

export function TabLayout(): ReactElement {
  if (Platform.OS === 'android' && Platform.isTV) {
    return <JsTabLayout />;
  }
  return <NativeTabLayout />;
}
