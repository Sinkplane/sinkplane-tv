/**
 * E2E: Browsing the catalog — home video list, pagination, sorting, view
 * toggles, channel switching within a creator, and switching subscriptions
 * between creators.
 */

import { loadRuntime, Runtime } from './helpers/runtime';

const videoId = (rt: Runtime, index: number, channelId = 'ch-tech-main'): string => {
  const videos = rt.api.videosByChannel.get(channelId) ?? [];
  return videos[index].id;
};

/** Boot the app signed-in and wait for the home list to appear. */
async function bootHome(): Promise<Runtime> {
  const rt = loadRuntime();
  rt.seedSession();
  await rt.renderApp();
  await rt.until(() => {
    expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
  });
  return rt;
}

const scrollNearBottom = (rt: Runtime) => {
  rt.fireEvent.scroll(rt.screen.getByTestId('parallax-scroll-view'), {
    nativeEvent: {
      contentOffset: { y: 5000, x: 0 },
      contentSize: { height: 6000, width: 1920 },
      layoutMeasurement: { height: 1080, width: 1920 },
    },
  });
};

describe('E2E: home video list', () => {
  it('renders the first page of 20 videos with metadata formatting', async () => {
    const rt = await bootHome();

    // Cards for the whole first page exist…
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0)}`)).toBeTruthy();
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 19)}`)).toBeTruthy();
    // …and page two has not been fetched yet.
    expect(rt.screen.queryByText('Main Channel Video 21')).toBeNull();

    // Formatting regression probes: 1,500,000 likes → "1.5M", 3725s → "1:02:05".
    expect(rt.screen.getByText('1.5M')).toBeTruthy();
    expect(rt.screen.getByText('1:02:05')).toBeTruthy();
  });

  it('loads the next page when scrolling near the bottom', async () => {
    const rt = await bootHome();
    scrollNearBottom(rt);

    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 21')).toBeTruthy();
    });
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 25)}`)).toBeTruthy();

    const pagedRequest = rt.api
      .requestsTo('/api/v3/content/creator')
      .find(req => req.params.get('fetchAfter') === '20');
    expect(pagedRequest).toBeDefined();
    expect(pagedRequest?.params.get('channel')).toBe('ch-tech-main');
  });

  it('toggles between newest and oldest sort', async () => {
    const rt = await bootHome();
    expect(rt.screen.getByText('Newest Videos')).toBeTruthy();

    rt.fireEvent.press(rt.screen.getByText('Newest Videos'));

    await rt.until(() => {
      expect(rt.screen.getByText('Oldest Videos')).toBeTruthy();
    });
    // Oldest first → video 26 (the oldest fixture) is on the first page.
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 26')).toBeTruthy();
    });
    expect(rt.api.requestsTo('/api/v3/content/creator').some(req => req.params.get('sort') === 'ASC')).toBe(true);
  });

  it('toggles between card and list view', async () => {
    const rt = await bootHome();
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0)}`)).toBeTruthy();

    rt.fireEvent.press(rt.screen.getByText('List View'));

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`)).toBeTruthy();
    });
    expect(rt.screen.queryByTestId(`video-card-${videoId(rt, 0)}`)).toBeNull();
    // List items show the description.
    expect(rt.screen.getByText(/Description for Main Channel video 01/)).toBeTruthy();
  });

  it('shows watch progress bars on in-progress videos', async () => {
    const rt = loadRuntime();
    rt.api.seedProgress(rt.api.videosByChannel.get('ch-tech-main')![0], 600);
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-progress-${videoId(rt, 0)}`)).toBeTruthy();
    });
    expect(rt.screen.queryByTestId(`video-progress-${videoId(rt, 1)}`)).toBeNull();
  });

  it('shows an error surface when the videos endpoint fails persistently', async () => {
    const rt = loadRuntime();
    rt.api.failRequests(
      'GET',
      '/api/v3/content/creator',
      { status: 500, body: { message: 'exploded' } },
      Number.POSITIVE_INFINITY,
    );
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText(/Error loading videos:/)).toBeTruthy();
    });
  });

  // TODO(e2e): presses inside the channel drawer fire handleChannelSelect
  // (verified by instrumentation) but test-renderer does not commit the
  // resulting setState, so the drawer never closes. Re-enable once the
  // Modal/act interaction is resolved.
  it.skip('shows an empty state for a channel with no videos', async () => {
    const rt = loadRuntime();
    rt.api.registerChannelVideos(rt.api.creators[0], 'ch-tech-side', 0);
    rt.seedSession();
    await rt.renderApp();

    rt.fireEvent.press(rt.screen.getByText('Change Channel'));
    await rt.until(() => {
      expect(rt.screen.getByText('Select Channel')).toBeTruthy();
    });
    rt.fireEvent.press(rt.screen.getByText('Side Channel'));

    await rt.until(() => {
      expect(rt.screen.getByText('Side Channel Videos')).toBeTruthy();
    });
    await rt.until(() => {
      expect(rt.screen.getByText('No videos found')).toBeTruthy();
    });
  });
});

describe('E2E: channel switching', () => {
  // TODO(e2e): same drawer/act limitation as the empty-state test above —
  // the selection handler runs but the modal never closes in the test env.
  it.skip('switches channels through the channel drawer', async () => {
    const rt = await bootHome();

    rt.fireEvent.press(rt.screen.getByText('Change Channel'));
    await rt.until(() => {
      expect(rt.screen.getByText('Select Channel')).toBeTruthy();
    });
    // Both of the creator's channels are listed.
    expect(rt.screen.getByText('Main Channel')).toBeTruthy();
    expect(rt.screen.getByText('Side Channel')).toBeTruthy();

    rt.fireEvent.press(rt.screen.getByText('Side Channel'));

    await rt.until(() => {
      expect(rt.screen.getByText('Side Channel Videos')).toBeTruthy();
    });
    // The list is now fetched for the other channel.
    const sideRequest = rt.api
      .requestsTo('/api/v3/content/creator')
      .find(req => req.params.get('channel') === 'ch-tech-side');
    expect(sideRequest).toBeDefined();
  });
});

describe('E2E: switching between creators', () => {
  it('switches the active subscription from the profile menu', async () => {
    const rt = await bootHome();

    rt.fireEvent.press(rt.screen.getByTestId('profile-avatar-button'));
    await rt.until(() => {
      expect(rt.screen.getByText('Switch Subscription')).toBeTruthy();
    });

    rt.fireEvent.press(rt.screen.getByText('Gaming Channel'));

    // Home now shows the gaming creator's default channel videos.
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0, 'ch-gaming-main')}`)).toBeTruthy();
    });
    const gamingRequest = rt.api
      .requestsTo('/api/v3/content/creator')
      .find(req => req.params.get('id') === 'creator-gaming');
    expect(gamingRequest).toBeDefined();
  });
});
