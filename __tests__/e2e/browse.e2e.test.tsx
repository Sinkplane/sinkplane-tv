import { holdRequestsMatching } from './helpers/browse-fetch-gate';
import { loadRuntime, type Runtime } from './helpers/runtime';

const channelVideo = (rt: Runtime, index: number, channelId = 'ch-tech-main') => {
  const video = rt.api.videosByChannel.get(channelId)?.[index];
  if (video === undefined) {
    throw new Error(`No fixture video ${String(index)} in ${channelId}`);
  }
  return video;
};

const videoId = (rt: Runtime, index: number, channelId = 'ch-tech-main'): string =>
  channelVideo(rt, index, channelId).id;

async function bootHome(rt: Runtime = loadRuntime()): Promise<Runtime> {
  rt.seedSession();
  await rt.renderApp();
  await rt.until(() => {
    expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
  });
  return rt;
}

const scrollTo = async (rt: Runtime, offsetY: number): Promise<void> => {
  await rt.fireEvent.scroll(rt.screen.getByTestId('parallax-scroll-view'), {
    nativeEvent: {
      contentOffset: { y: offsetY, x: 0 },
      contentSize: { height: 6000, width: 1920 },
      layoutMeasurement: { height: 1080, width: 1920 },
    },
  });
};

const pagedRequestCount = (rt: Runtime): number =>
  rt.api
    .requestsTo('/api/v3/content/creator')
    .filter((req) => req.params.get('fetchAfter') === '20').length;

const postRequested = (rt: Runtime, id: string): boolean =>
  rt.api.requestsTo('/api/v3/content/post').some((req) => req.params.get('id') === id);

async function pickChannel(rt: Runtime, title: string): Promise<void> {
  await rt.fireEvent.press(rt.screen.getByText('Change Channel'));
  await rt.until(() => {
    expect(rt.screen.getByText('Select Channel')).toBeTruthy();
  });
  await rt.fireEvent.press(rt.screen.getByText(title));
}

describe('E2E: home video list', () => {
  it('renders the first page of 20 videos with metadata formatting', async () => {
    const rt = await bootHome();

    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0)}`)).toBeTruthy();
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 19)}`)).toBeTruthy();
    expect(rt.screen.queryByText('Main Channel Video 21')).toBeNull();

    expect(rt.screen.getByText('1.5M')).toBeTruthy();
    expect(rt.screen.getByText('1:02:05')).toBeTruthy();
  });

  it('loads the next page when scrolling near the bottom', async () => {
    const rt = await bootHome();
    await scrollTo(rt, 5000);

    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 21')).toBeTruthy();
    });
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 25)}`)).toBeTruthy();

    const pagedRequest = rt.api
      .requestsTo('/api/v3/content/creator')
      .find((req) => req.params.get('fetchAfter') === '20');
    expect(pagedRequest).toBeDefined();
    expect(pagedRequest?.params.get('channel')).toBe('ch-tech-main');
  });

  it('shows a loading indicator while the next page is in flight', async () => {
    const rt = await bootHome();
    const releaseNextPage = holdRequestsMatching(rt, 'fetchAfter=20');

    await scrollTo(rt, 5000);
    await rt.until(() => {
      expect(rt.screen.getByText('Loading more videos...')).toBeTruthy();
    });

    releaseNextPage();
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 21')).toBeTruthy();
    });
    expect(rt.screen.queryByText('Loading more videos...')).toBeNull();
  });

  it('renders the home screen with the dark theme', async () => {
    const rt = loadRuntime();
    rt.secureStore.items.set('themeMode', JSON.stringify('dark'));
    await bootHome(rt);

    expect(rt.screen.getByTestId('parallax-scroll-view')).toBeTruthy();
    expect(rt.screen.getByText('Main Channel Videos')).toBeTruthy();
  });

  it('does not request another page when the list is far from the bottom', async () => {
    const rt = await bootHome();
    await scrollTo(rt, 0);
    await rt.advanceTime(500);

    expect(pagedRequestCount(rt)).toBe(0);
  });

  it('stops paging once the last page has loaded', async () => {
    const rt = await bootHome();
    await scrollTo(rt, 5000);
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 26')).toBeTruthy();
    });

    await scrollTo(rt, 5000);
    await rt.advanceTime(500);

    expect(pagedRequestCount(rt)).toBe(1);
    expect(
      rt.api
        .requestsTo('/api/v3/content/creator')
        .some((req) => req.params.get('fetchAfter') === '26'),
    ).toBe(false);
  });

  it('toggles between newest and oldest sort', async () => {
    const rt = await bootHome();
    expect(rt.screen.getByText('Newest Videos')).toBeTruthy();

    await rt.fireEvent.press(rt.screen.getByText('Newest Videos'));

    await rt.until(() => {
      expect(rt.screen.getByText('Oldest Videos')).toBeTruthy();
    });
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 26')).toBeTruthy();
    });
    expect(
      rt.api.requestsTo('/api/v3/content/creator').some((req) => req.params.get('sort') === 'ASC'),
    ).toBe(true);

    await rt.fireEvent.press(rt.screen.getByText('Oldest Videos'));
    await rt.until(() => {
      expect(rt.screen.getByText('Newest Videos')).toBeTruthy();
    });
  });

  it('toggles between card and list view', async () => {
    const rt = await bootHome();
    expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0)}`)).toBeTruthy();

    await rt.fireEvent.press(rt.screen.getByText('List View'));

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`)).toBeTruthy();
    });
    expect(rt.screen.queryByTestId(`video-card-${videoId(rt, 0)}`)).toBeNull();
    expect(rt.screen.getByText(/Description for Main Channel video 01/)).toBeTruthy();

    await rt.fireEvent.press(rt.screen.getByText('Card View'));
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0)}`)).toBeTruthy();
    });
  });

  it('opens a video from the list view', async () => {
    const rt = await bootHome();
    await rt.fireEvent.press(rt.screen.getByText('List View'));
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`)).toBeTruthy();
    });

    await rt.fireEvent(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`), 'focus');
    await rt.fireEvent(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`), 'blur');
    await rt.fireEvent.press(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`));

    await rt.until(() => {
      expect(postRequested(rt, videoId(rt, 0))).toBe(true);
    });
  });

  it('opens a video from a focused card', async () => {
    const rt = await bootHome();
    const card = rt.screen.getByTestId(`video-card-${videoId(rt, 1)}`);

    await rt.fireEvent(card, 'focus');
    await rt.fireEvent(card, 'blur');
    await rt.fireEvent.press(card);

    await rt.until(() => {
      expect(postRequested(rt, videoId(rt, 1))).toBe(true);
    });
  });

  it('shows watch progress bars on in-progress videos', async () => {
    const rt = loadRuntime();
    rt.api.seedProgress(channelVideo(rt, 0), 600);
    await bootHome(rt);
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-progress-${videoId(rt, 0)}`)).toBeTruthy();
    });
    expect(rt.screen.queryByTestId(`video-progress-${videoId(rt, 1)}`)).toBeNull();

    await rt.fireEvent.press(rt.screen.getByText('List View'));
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-list-item-${videoId(rt, 0)}`)).toBeTruthy();
    });
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

  it('shows an empty state for a channel with no videos', async () => {
    const rt = loadRuntime();
    const [techCreator] = rt.api.creators;
    if (techCreator === undefined) {
      throw new Error('No fixture creator');
    }
    rt.api.registerChannelVideos(techCreator, 'ch-tech-side', 0);
    await bootHome(rt);

    await pickChannel(rt, 'Side Channel');

    await rt.until(() => {
      expect(rt.screen.getByText('Side Channel Videos')).toBeTruthy();
    });
    await rt.until(() => {
      expect(rt.screen.getByText('No videos found')).toBeTruthy();
    });
  });
});

describe('E2E: channel switching', () => {
  it('switches channels through the channel drawer', async () => {
    const rt = await bootHome();

    await pickChannel(rt, 'Side Channel');

    await rt.until(() => {
      expect(rt.screen.getByText('Side Channel Videos')).toBeTruthy();
    });
    expect(rt.screen.queryByText('Select Channel')).toBeNull();
    const sideRequest = rt.api
      .requestsTo('/api/v3/content/creator')
      .find((req) => req.params.get('channel') === 'ch-tech-side');
    expect(sideRequest).toBeDefined();
  });

  it('closes the channel drawer without changing the channel', async () => {
    const rt = await bootHome();
    await rt.fireEvent.press(rt.screen.getByText('Change Channel'));
    await rt.until(() => {
      expect(rt.screen.getByText('Select Channel')).toBeTruthy();
    });

    await rt.fireEvent.press(rt.screen.getByTestId('modal-close-button'));

    await rt.until(() => {
      expect(rt.screen.queryByText('Select Channel')).toBeNull();
    });
    expect(rt.screen.getByText('Main Channel Videos')).toBeTruthy();
  });
});

describe('E2E: switching between creators', () => {
  it('switches the active subscription from the profile menu', async () => {
    const rt = await bootHome();

    await rt.fireEvent.press(rt.screen.getByTestId('profile-avatar-button'));
    await rt.until(() => {
      expect(rt.screen.getByText('Switch Subscription')).toBeTruthy();
    });

    await rt.fireEvent.press(rt.screen.getByText('Gaming Channel'));

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoId(rt, 0, 'ch-gaming-main')}`)).toBeTruthy();
    });
    const gamingRequest = rt.api
      .requestsTo('/api/v3/content/creator')
      .find((req) => req.params.get('id') === 'creator-gaming');
    expect(gamingRequest).toBeDefined();
  });

  it('keeps the view and sort while the channel resets when switching creator', async () => {
    const rt = await bootHome();

    await pickChannel(rt, 'Side Channel');
    await rt.until(() => {
      expect(rt.screen.getByText('Side Channel Videos')).toBeTruthy();
    });
    await rt.fireEvent.press(rt.screen.getByText('List View'));
    await rt.until(() => {
      expect(
        rt.screen.getByTestId(`video-list-item-${videoId(rt, 0, 'ch-tech-side')}`),
      ).toBeTruthy();
    });
    await rt.fireEvent.press(rt.screen.getByText('Newest Videos'));
    await rt.until(() => {
      expect(rt.screen.getByText('Oldest Videos')).toBeTruthy();
    });

    await rt.fireEvent.press(rt.screen.getByTestId('profile-avatar-button'));
    await rt.until(() => {
      expect(rt.screen.getByText('Switch Subscription')).toBeTruthy();
    });
    await rt.fireEvent.press(rt.screen.getByText('Gaming Channel'));

    await rt.until(() => {
      expect(
        rt.screen.getByTestId(`video-list-item-${videoId(rt, 25, 'ch-gaming-main')}`),
      ).toBeTruthy();
    });
    expect(rt.screen.getByText('Oldest Videos')).toBeTruthy();
    expect(rt.screen.queryByTestId(`video-card-${videoId(rt, 25, 'ch-gaming-main')}`)).toBeNull();
    expect(rt.screen.getByText('Main Channel Videos')).toBeTruthy();
    expect(rt.screen.queryByText('Side Channel Videos')).toBeNull();
    expect(
      rt.api
        .requestsTo('/api/v3/content/creator')
        .some(
          (req) =>
            req.params.get('id') === 'creator-gaming' &&
            req.params.get('channel') === 'ch-gaming-main' &&
            req.params.get('sort') === 'ASC',
        ),
    ).toBe(true);
  });
});

describe('E2E: subscribed creator without channels', () => {
  it('shows the not-subscribed message', async () => {
    const rt = loadRuntime();
    rt.api.creators = rt.api.creators.map((creator) => ({ ...creator, channels: [] }));
    rt.seedSession();
    await rt.renderApp();

    await rt.until(() => {
      expect(rt.screen.getByText('You are not subscribed to any creators')).toBeTruthy();
    });
  });
});
