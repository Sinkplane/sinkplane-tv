import {
  channelVideo,
  firePlaybackState,
  LAUNCH_ERROR,
  openVideo,
  savedProgress,
  spyOnAlerts,
} from './helpers/player-flows';
import { loadRuntime, type Runtime } from './helpers/runtime';

const AUTHORIZATION = 'Authorization';
const USER_AGENT = 'User-Agent';

describe('E2E: video playback', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  it('describes the stream, its auth headers and Now Playing metadata to the native player', async () => {
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);

    expect(rt.videoDriver.props().source).toMatchObject({
      uri: `https://vfd.floatplane.test/vod/guid-${video.id}/1080/60/index.m3u8`,
      headers: {
        [USER_AGENT]: 'SinkplaneTV/1.0 (AppleTV; iOS)',
        [AUTHORIZATION]: `Bearer ${rt.api.accessToken}`,
      },
      metadata: { title: video.title, imageUri: video.thumbnail.path },
    });
    expect(rt.videoDriver.props().paused).toBe(false);
  });

  it('holds playback behind an overlay until it has resumed at the saved position', async () => {
    const video = channelVideo(rt, 0);
    rt.api.seedProgress(video, 300);
    await openVideo(rt, video.id);

    expect(rt.videoDriver.props().paused).toBe(true);
    expect(rt.screen.getByTestId('video-resume-overlay')).toBeTruthy();

    await rt.videoDriver.fireLoad();
    await rt.videoDriver.fireReadyForDisplay();
    expect(rt.videoDriver.seeks()).toEqual([300]);

    await rt.videoDriver.fireProgress(120);
    await firePlaybackState(rt, false);
    expect(rt.videoDriver.props().paused).toBe(true);

    await rt.videoDriver.fireProgress(299.5);
    expect(rt.videoDriver.props().paused).toBe(false);
    expect(rt.screen.queryByTestId('video-resume-overlay')).toBeNull();
    expect(savedProgress(rt)).toEqual([]);
  });

  it('saves progress after every 15 seconds of playback', async () => {
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);
    await rt.videoDriver.fireLoad();

    await rt.videoDriver.fireProgress(10);
    expect(savedProgress(rt)).toEqual([]);

    await rt.videoDriver.fireProgress(16.4);
    await rt.videoDriver.fireProgress(25);
    await rt.videoDriver.fireProgress(31);
    await rt.until(() => {
      expect(savedProgress(rt)).toEqual([
        { id: video.id, progress: 16 },
        { id: video.id, progress: 31 },
      ]);
    });
  });

  it('saves progress when playback pauses', async () => {
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);
    await rt.videoDriver.fireLoad();

    await rt.videoDriver.fireProgress(1);
    await firePlaybackState(rt, false);
    await rt.videoDriver.fireProgress(4);
    await firePlaybackState(rt, true);
    await firePlaybackState(rt, false);
    await firePlaybackState(rt, false);

    await rt.until(() => {
      expect(savedProgress(rt)).toEqual([{ id: video.id, progress: 4 }]);
    });
  });

  it('saves the last position when leaving the video', async () => {
    const video = channelVideo(rt, 0);
    rt.seedSession();
    await rt.renderApp('/');
    await rt.until(() => {
      expect(rt.screen.getByText(video.title)).toBeTruthy();
    });
    await rt.act(async () => {
      await rt.fireEvent.press(rt.screen.getByText(video.title));
    });
    await rt.until(() => {
      expect(rt.videoDriver.mounted()).toBe(true);
    });
    await rt.videoDriver.fireLoad();
    await rt.videoDriver.fireProgress(7);

    await rt.act(async () => {
      rt.testRouter.back();
      await Promise.resolve();
    });

    await rt.until(() => {
      expect(savedProgress(rt)).toEqual([{ id: video.id, progress: 7 }]);
    });
  });

  it('shows the loading indicator until the stream loads and while it buffers', async () => {
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);
    expect(rt.screen.getByTestId('video-loading')).toBeTruthy();

    await rt.videoDriver.fireLoad();
    expect(rt.screen.queryByTestId('video-loading')).toBeNull();

    await rt.videoDriver.fireBuffer(true);
    expect(rt.screen.getByTestId('video-loading')).toBeTruthy();

    await rt.videoDriver.fireBuffer(false);
    expect(rt.screen.queryByTestId('video-loading')).toBeNull();
  });

  it('alerts when the native player reports an error', async () => {
    const alerts = spyOnAlerts();
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);

    const props = rt.videoDriver.props();
    await rt.act(async () => {
      props.onError?.({ error: { code: -11800, domain: 'AVFoundationErrorDomain' } });
      await Promise.resolve();
    });

    expect(alerts).toHaveBeenCalledWith(...LAUNCH_ERROR);
  });

  it('alerts once and never mounts the player when no stream variant is playable', async () => {
    const alerts = spyOnAlerts();
    const video = channelVideo(rt, 0);
    rt.api.deniedDeliveryGuids.add(`guid-${video.id}`);
    rt.seedSession();
    await rt.renderApp(`/video/${video.id}`);

    await rt.until(() => {
      expect(alerts).toHaveBeenCalledWith(...LAUNCH_ERROR);
    });
    await rt.advanceTime(1000);
    expect(alerts).toHaveBeenCalledTimes(1);
    expect(rt.videoDriver.mounted()).toBe(false);
    expect(rt.screen.getByTestId('video-loading')).toBeTruthy();
  });

  it('alerts when the video post cannot be loaded', async () => {
    const alerts = spyOnAlerts();
    const video = channelVideo(rt, 0);
    rt.api.failRequests('GET', '/api/v3/content/post', { status: 500, body: {} }, 3);
    rt.seedSession();
    await rt.renderApp(`/video/${video.id}`);

    await rt.until(
      () => {
        expect(alerts).toHaveBeenCalledWith(...LAUNCH_ERROR);
      },
      { maxFakeMs: 10000 },
    );
    expect(rt.videoDriver.mounted()).toBe(false);
  });
});

describe('E2E: Up Next', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  const finishVideo = async (videoId: string): Promise<void> => {
    await openVideo(rt, videoId);
    await rt.videoDriver.fireLoad();
    await rt.videoDriver.fireProgress(100);
    await rt.videoDriver.fireEnd();
    await rt.until(() => {
      expect(rt.screen.getByText('Up Next')).toBeTruthy();
    });
  };

  it('lists related videos and replays from the start', async () => {
    const video = channelVideo(rt, 0);
    const next = channelVideo(rt, 1);
    await finishVideo(video.id);
    await rt.until(() => {
      expect(rt.screen.getByText(next.title)).toBeTruthy();
    });

    await rt.act(async () => {
      await rt.fireEvent.press(rt.screen.getByText('Replay'));
    });

    expect(rt.screen.queryByText('Up Next')).toBeNull();
    expect(rt.videoDriver.seeks()).toEqual([0]);

    await rt.videoDriver.fireProgress(16);
    await rt.until(() => {
      expect(savedProgress(rt)).toEqual([
        { id: video.id, progress: 100 },
        { id: video.id, progress: 16 },
      ]);
    });
  });

  it('highlights the replay button while it has focus', async () => {
    await finishVideo(channelVideo(rt, 0).id);

    expect(rt.screen.getByText('Replay')).toHaveStyle({ color: '#fff' });
    await rt.act(async () => {
      await rt.fireEvent(rt.screen.getByText('Replay'), 'focus');
    });
    expect(rt.screen.getByText('Replay')).toHaveStyle({ color: '#000' });
  });

  it('says when there are no related videos', async () => {
    const video = channelVideo(rt, 0);
    rt.api.videosByChannel.set(video.channel.id, [video]);
    await finishVideo(video.id);

    await rt.until(() => {
      expect(rt.screen.getByText('No related videos found.')).toBeTruthy();
    });
  });

  it('explains when related videos fail to load', async () => {
    rt.api.failRequests('GET', '/api/v3/content/related', { status: 500, body: {} }, 3);
    await finishVideo(channelVideo(rt, 0).id);

    await rt.until(
      () => {
        expect(rt.screen.getByText("Couldn't load related videos.")).toBeTruthy();
      },
      { maxFakeMs: 10000 },
    );
  });
});
