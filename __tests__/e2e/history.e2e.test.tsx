import { holdRequestsMatching } from './helpers/browse-fetch-gate';
import { loadRuntime, type Runtime } from './helpers/runtime';

const techVideos = (rt: Runtime) => rt.api.videosByChannel.get('ch-tech-main') ?? [];

const videoAt = (rt: Runtime, index: number) => {
  const video = techVideos(rt)[index];
  if (video === undefined) {
    throw new Error(`No fixture video at index ${String(index)}`);
  }
  return video;
};

const scrollNearBottom = async (rt: Runtime): Promise<void> => {
  await rt.fireEvent.scroll(rt.screen.getByTestId('parallax-scroll-view'), {
    nativeEvent: {
      contentOffset: { y: 5000, x: 0 },
      contentSize: { height: 6000, width: 1920 },
      layoutMeasurement: { height: 1080, width: 1920 },
    },
  });
};

const seedHistory = (rt: Runtime, count: number) => {
  techVideos(rt)
    .slice(0, count)
    .forEach((video, index) => {
      const day = String(index + 1).padStart(2, '0');
      rt.api.seedHistoryEntry(video, 60 * (index + 1), `2026-01-${day}T12:00:00.000Z`);
    });
};

async function openHistory(rt: Runtime): Promise<void> {
  rt.seedSession();
  await rt.renderApp();
  await rt.until(() => {
    expect(rt.screen.getByText('History')).toBeTruthy();
  });
  await rt.fireEvent.press(rt.screen.getByText('History'));
  await rt.until(() => {
    expect(rt.screen.getByText('Watch History')).toBeTruthy();
  });
}

describe('E2E: watch history', () => {
  it('Given no watched videos, when the History tab opens, then it shows the empty state', async () => {
    const rt = loadRuntime();
    await openHistory(rt);

    await rt.until(() => {
      expect(rt.screen.getByText('No watch history found')).toBeTruthy();
    });
    expect(rt.screen.getByText('Watch some videos and they will show up here')).toBeTruthy();
  });

  it('Given watched videos, when the History tab opens, then it lists them with progress bars', async () => {
    const rt = loadRuntime();
    seedHistory(rt, 3);
    await openHistory(rt);

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 0).id}`)).toBeTruthy();
    });
    expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 2).id}`)).toBeTruthy();
    expect(rt.screen.getByTestId(`video-progress-${videoAt(rt, 1).id}`)).toBeTruthy();
    expect(rt.screen.queryByText('No watch history found')).toBeNull();
  });

  it('Given more history than one page, when scrolling near the bottom, then the next page loads', async () => {
    const rt = loadRuntime();
    rt.api.historyPageSize = 5;
    seedHistory(rt, 8);
    await openHistory(rt);

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 7).id}`)).toBeTruthy();
    });
    expect(rt.screen.queryByTestId(`video-card-${videoAt(rt, 0).id}`)).toBeNull();

    await scrollNearBottom(rt);

    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 0).id}`)).toBeTruthy();
    });
    expect(
      rt.api.requestsTo('/api/v3/content/history').some((req) => req.params.get('offset') === '5'),
    ).toBe(true);
  });

  it('Given the next page is in flight, when scrolling near the bottom, then a loading indicator shows', async () => {
    const rt = loadRuntime();
    rt.api.historyPageSize = 5;
    seedHistory(rt, 8);
    await openHistory(rt);
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 7).id}`)).toBeTruthy();
    });
    const releaseNextPage = holdRequestsMatching(rt, 'offset=5');

    await scrollNearBottom(rt);
    await rt.until(() => {
      expect(rt.screen.getByText('Loading more history...')).toBeTruthy();
    });

    releaseNextPage();
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 0).id}`)).toBeTruthy();
    });
  });

  it('Given a short scroll, when the list is far from the bottom, then no next page is requested', async () => {
    const rt = loadRuntime();
    rt.api.historyPageSize = 5;
    seedHistory(rt, 8);
    await openHistory(rt);
    await rt.until(() => {
      expect(rt.screen.getByTestId(`video-card-${videoAt(rt, 7).id}`)).toBeTruthy();
    });

    await rt.fireEvent.scroll(rt.screen.getByTestId('parallax-scroll-view'), {
      nativeEvent: {
        contentOffset: { y: 0, x: 0 },
        contentSize: { height: 6000, width: 1920 },
        layoutMeasurement: { height: 1080, width: 1920 },
      },
    });
    await rt.advanceTime(500);

    expect(
      rt.api.requestsTo('/api/v3/content/history').some((req) => req.params.get('offset') === '5'),
    ).toBe(false);
  });

  it('Given the history endpoint fails, when the History tab opens, then it shows the error', async () => {
    const rt = loadRuntime();
    rt.api.failRequests(
      'GET',
      '/api/v3/content/history',
      { status: 500, body: { message: 'exploded' } },
      Number.POSITIVE_INFINITY,
    );
    await openHistory(rt);

    await rt.until(
      () => {
        expect(rt.screen.getByText(/Error loading history:/)).toBeTruthy();
      },
      { maxFakeMs: 60000, stepMs: 500 },
    );
  });
});
