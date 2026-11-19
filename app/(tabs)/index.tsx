import { useState, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { ChannelPicker } from '@/components/home/ChannelPicker';
import { CreatorScrollView } from '@/components/home/CreatorScrollView';
import { HomeToolbar } from '@/components/home/HomeToolbar';
import { loadMoreNearBottom } from '@/components/infinite-scroll';
import { presentOrUndefined } from '@/components/session-value';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useVideoFeed } from '@/components/videos/useVideoFeed';
import { Videos, type VideoView } from '@/components/videos/Videos';
import { SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';
import { AssDass, useSession } from '@sinkplane/shared';
import { type Channel, type Creator } from '@sinkplane/shared/types/creator-list.interface';

interface CreatorHomeProps {
  readonly creator: Creator;
  readonly defaultChannel: Channel;
  readonly token: string;
  readonly tokenExpiration: string | undefined;
}

function NotSubscribed(): ReactElement {
  const scale = useScale();
  const styles = StyleSheet.create({
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACE.xl * scale,
    },
  });
  return (
    <ThemedView style={styles.centerContainer}>
      <ThemedText type="title">You are not subscribed to any creators</ThemedText>
    </ThemedView>
  );
}

interface DisplayPrefs {
  readonly view: VideoView;
  readonly sort: AssDass;
  readonly toggleView: () => void;
  readonly toggleSort: () => void;
}

function useDisplayPrefs(): DisplayPrefs {
  const [view, setView] = useState<VideoView>('card');
  const [sort, setSort] = useState(AssDass.DESC);
  return {
    view,
    sort,
    toggleView: (): void => {
      setView(view === 'card' ? 'list' : 'card');
    },
    toggleSort: (): void => {
      setSort(sort === AssDass.ASC ? AssDass.DESC : AssDass.ASC);
    },
  };
}

function useChannelPicker(defaultChannel: Channel) {
  const [channel, setChannel] = useState(defaultChannel);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  return {
    channel,
    isPickerVisible,
    openPicker: (): void => {
      setIsPickerVisible(true);
    },
    closePicker: (): void => {
      setIsPickerVisible(false);
    },
    selectChannel: (selected: Channel): void => {
      setChannel(selected);
      setIsPickerVisible(false);
    },
  };
}

interface CreatorHomeScreenProps extends CreatorHomeProps {
  readonly prefs: DisplayPrefs;
}

function CreatorHome(props: CreatorHomeScreenProps): ReactElement {
  const { creator, token, tokenExpiration, prefs } = props;
  const controls = useChannelPicker(props.defaultChannel);
  const { channel } = controls;
  const { view, sort } = prefs;
  const feed = useVideoFeed({
    token,
    tokenExpiration,
    creatorId: creator.id,
    channelId: channel.id,
    sort,
  });

  return (
    <CreatorScrollView
      creator={creator}
      onScroll={(event) => {
        loadMoreNearBottom(feed.query, event);
      }}
    >
      <ThemedView>
        <HomeToolbar
          channelTitle={channel.title}
          view={view}
          sort={sort}
          onOpenChannels={controls.openPicker}
          onToggleView={prefs.toggleView}
          onToggleSort={prefs.toggleSort}
        />
        <Videos feed={feed} view={view} />
        <ChannelPicker
          visible={controls.isPickerVisible}
          channels={creator.channels}
          selectedId={channel.id}
          onSelect={controls.selectChannel}
          onClose={controls.closePicker}
        />
      </ThemedView>
    </CreatorScrollView>
  );
}

function signedInHome(
  creator: Creator | undefined,
  token: string | undefined,
  tokenExpiration: string | undefined,
): CreatorHomeProps | undefined {
  if (creator === undefined || token === undefined || token === '') {
    return undefined;
  }
  const [defaultChannel] = creator.channels;
  return defaultChannel === undefined
    ? undefined
    : { creator, defaultChannel, token, tokenExpiration };
}

export default function HomeScreen(): ReactElement {
  const { creator, token, tokenExpiration } = useSession();
  const prefs = useDisplayPrefs();
  const home = signedInHome(
    creator,
    presentOrUndefined(token),
    presentOrUndefined(tokenExpiration),
  );

  if (home === undefined) {
    return (
      <CreatorScrollView creator={creator}>
        <ThemedView>
          <NotSubscribed />
        </ThemedView>
      </CreatorScrollView>
    );
  }
  return <CreatorHome key={home.creator.id} {...home} prefs={prefs} />;
}
