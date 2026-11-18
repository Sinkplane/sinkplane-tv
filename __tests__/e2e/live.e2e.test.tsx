import type * as ReactNative from 'react-native';

import { firePlayerError, withoutLiveStreams } from './helpers/live-player';
import { loadRuntime, type Runtime } from './helpers/runtime';

const LIVE_URI = 'https://live.floatplane.test/live/tech/master.m3u8';
const POLL_MS = 60_000;
const RETRY_MS = 5000;

describe('E2E: live tab', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  const liveRequests = () =>
    rt.api
      .requestsTo('/api/v3/delivery/info')
      .filter((req) => req.params.get('entityKind') === 'livestream');

  const openLiveTab = async () => {
    rt.seedSession();
    await rt.renderApp();
    await rt.until(() => {
      expect(rt.screen.getByText('Live Now')).toBeTruthy();
    });
    await rt.fireEvent.press(rt.screen.getByText('Live Now'));
  };

  const openPlayingStream = async () => {
    rt.api.liveNow = true;
    await openLiveTab();
    await rt.until(() => {
      expect(rt.videoDriver.mounted()).toBe(true);
    });
  };

  it('Given the creator is offline, when the live tab opens, then it says the creator is not live', async () => {
    await openLiveTab();

    await rt.until(() => {
      expect(rt.screen.getByText('Tech Channel is not live right now.')).toBeTruthy();
    });
    expect(rt.screen.getByText('🔄 Refresh Stream Status')).toBeTruthy();
    expect(rt.videoDriver.mounted()).toBe(false);
  });

  it('Given the creator is live, when the live tab opens, then the stream plays unpaused', async () => {
    await openPlayingStream();

    expect(rt.videoDriver.props().source?.uri).toBe(LIVE_URI);
    expect(rt.videoDriver.props().paused).toBe(false);
    expect(rt.screen.getByTestId('native-video-player')).toBeTruthy();
  });

  it('Given the stream is loading, when it loads and buffers, then the spinner follows the buffering state', async () => {
    await openPlayingStream();
    const spinners = () => rt.screen.queryAllByTestId('live-loading').length;
    expect(spinners()).toBeGreaterThan(0);

    await rt.videoDriver.fireLoad();
    expect(spinners()).toBe(0);

    await rt.videoDriver.fireBuffer(true);
    expect(spinners()).toBeGreaterThan(0);

    await rt.videoDriver.fireBuffer(false);
    expect(spinners()).toBe(0);
  });

  it('Given the stream is playing, when a minute passes, then the stream status is polled again', async () => {
    await openPlayingStream();
    const before = liveRequests().length;

    await rt.advanceTime(POLL_MS);

    expect(liveRequests().length).toBeGreaterThan(before);
    expect(rt.videoDriver.props().source?.uri).toBe(LIVE_URI);
  });

  it('Given the stream is playing, when the player reports a generic error, then an error overlay offers a retry', async () => {
    await openPlayingStream();

    await firePlayerError(rt, { localizedDescription: 'Decoder failed' });

    expect(rt.screen.getByText('Video Player Error')).toBeTruthy();
    expect(rt.screen.getByText('Decoder failed')).toBeTruthy();
    const before = liveRequests().length;
    await rt.fireEvent.press(rt.screen.getByText('Try Again'));
    await rt.until(() => {
      expect(liveRequests().length).toBeGreaterThan(before);
    });
  });

  it('Given the player error has no description, when it is shown, then a default message appears', async () => {
    await openPlayingStream();

    await firePlayerError(rt, { errorString: '' });

    expect(rt.screen.getByText('The video could not be loaded.')).toBeTruthy();
  });

  it('Given the stream is playing, when the player cannot find it, then the tab says not live and retries after five seconds', async () => {
    await openPlayingStream();

    await firePlayerError(rt, { code: -1100 });

    await rt.until(() => {
      expect(rt.screen.getByText('Tech Channel is not live right now.')).toBeTruthy();
    });
    const before = liveRequests().length;
    await rt.advanceTime(RETRY_MS);
    expect(liveRequests().length).toBeGreaterThan(before);
  });

  it('Given the player says the stream was not found, when the error arrives, then the tab says not live', async () => {
    await openPlayingStream();

    await firePlayerError(rt, { localizedDescription: 'Stream not found' });

    await rt.until(() => {
      expect(rt.screen.getByText('Tech Channel is not live right now.')).toBeTruthy();
    });
  });

  it('Given the status check fails, when the live tab opens, then the error is shown', async () => {
    rt.api.failRequests('GET', '/api/v3/delivery/info', { status: 500, body: 'boom' }, Infinity);
    await openLiveTab();

    await rt.until(
      () => {
        expect(rt.screen.getByText('Error checking stream status')).toBeTruthy();
      },
      { maxFakeMs: 30_000 },
    );
    expect(rt.screen.getByText(/Failed to fetch video delivery: 500/)).toBeTruthy();
  });

  it('Given the creator is offline, when the user refreshes, then the status is checked again', async () => {
    await openLiveTab();
    await rt.until(() => {
      expect(rt.screen.getByText('Tech Channel is not live right now.')).toBeTruthy();
    });
    const before = liveRequests().length;

    rt.api.liveNow = true;
    await rt.fireEvent.press(rt.screen.getByText('🔄 Refresh Stream Status'));

    await rt.until(() => {
      expect(rt.videoDriver.mounted()).toBe(true);
    });
    expect(liveRequests().length).toBeGreaterThan(before);
  });

  it('Given the live tab is in the background, when a minute passes, then the stream status is not polled', async () => {
    await openPlayingStream();
    await rt.fireEvent.press(rt.screen.getByText('Home'));
    await rt.until(() => {
      expect(rt.screen.getByText('Main Channel Video 01')).toBeTruthy();
    });
    const before = liveRequests().length;

    await rt.advanceTime(POLL_MS * 2);

    expect(liveRequests()).toHaveLength(before);
  });

  it('Given the creators could not be loaded, when the live tab opens, then it says there are no subscriptions', async () => {
    rt.api.failRequests('GET', '/api/v3/creator/list', { status: 500, body: 'down' }, Infinity);
    await openLiveTab();

    await rt.until(() => {
      expect(rt.screen.getByText('You are not subscribed to any creators')).toBeTruthy();
    });
  });

  it('Given the player errored, when the user leaves the tab and comes back, then the stream plays again', async () => {
    await openPlayingStream();
    await firePlayerError(rt, { localizedDescription: 'Decoder failed' });
    expect(rt.screen.getByText('Video Player Error')).toBeTruthy();

    await rt.fireEvent.press(rt.screen.getByText('Home'));
    await rt.fireEvent.press(rt.screen.getByText('Live Now'));

    await rt.until(() => {
      expect(rt.videoDriver.props().paused).toBe(false);
    });
    expect(rt.screen.queryByText('Video Player Error')).toBeNull();
  });

  it('Given an Android TV, when the player errors, then a toast asks the user to try again', async () => {
    await openPlayingStream();
    const reactNative = jest.requireActual<typeof ReactNative>('react-native');
    const show = jest.spyOn(reactNative.ToastAndroid, 'show').mockImplementation(() => undefined);
    const os = jest.replaceProperty(reactNative.Platform, 'OS', 'android');

    await firePlayerError(rt, { localizedDescription: 'Decoder failed' });
    os.restore();

    expect(show).toHaveBeenCalledWith(
      'Error loading livestream. Please try again',
      reactNative.ToastAndroid.SHORT,
    );
  });

  it('Given the creator has no livestream, when the status is still being checked, then only the title and a checking state show', async () => {
    rt.api.creators = withoutLiveStreams(rt.api.creators);
    rt.api.failRequests('GET', '/api/v3/delivery/info', { status: 500, body: 'boom' }, Infinity);
    await openLiveTab();

    expect(rt.screen.getByText('🔄 Checking...')).toBeTruthy();
    expect(rt.screen.queryByText('Stream Offline')).toBeNull();
    expect(rt.screen.queryByText(/is not live right now/)).toBeNull();
    expect(
      liveRequests().every((req) => req.params.get('entityId') === '5c13f3c006f1be15e08e05c0'),
    ).toBe(true);
  });
});
