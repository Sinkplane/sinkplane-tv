import { TextTrack } from '@sinkplane/shared';

import { loadRuntime, Runtime } from './helpers/runtime';

const PREFERENCES_KEY = 'playback-preferences';

const track = (id: string, language: string, overrides: Partial<TextTrack> = {}): TextTrack => ({
  id,
  src: `https://captions.example.com/${id}.vtt`,
  kind: 'captions',
  language,
  generated: false,
  processing: false,
  ...overrides,
});

describe('E2E: video player captions', () => {
  let rt: Runtime;

  beforeEach(() => {
    rt = loadRuntime();
  });

  const firstVideos = (count: number) => [...rt.api.videosByChannel.values()][0].slice(0, count);

  const openVideo = async (videoId: string) => {
    rt.seedSession();
    await rt.renderApp(`/video/${videoId}`);
    await rt.until(() => {
      expect(rt.videoDriver.mounted()).toBe(true);
    });
  };

  const storedPreferences = () => JSON.parse(rt.asyncStorage.items.get(PREFERENCES_KEY) ?? 'null');

  it('passes the attachment text tracks to the native player as caption tracks', async () => {
    const [video] = firstVideos(1);
    rt.api.textTracks.set(video.id, [
      track('en', 'en', { src: 'https://www.floatplane.com/captions/en.vtt' }),
      track('fr', 'fr', { src: '/captions/fr.vtt', generated: true }),
      track('es', 'es', { src: 'https://cdn.example.com/es.vtt' }),
      track('de', 'de', { src: '', generated: true, processing: true }),
    ]);

    await openVideo(video.id);

    const authHeaders = {
      'User-Agent': 'SinkplaneTV/1.0 (AppleTV; iOS)',
      Authorization: `Bearer ${rt.api.accessToken}`,
    };
    expect(rt.videoDriver.props().captionTracks).toEqual([
      { id: 'en', uri: 'https://www.floatplane.com/captions/en.vtt', language: 'en', subtitle: undefined, headers: authHeaders },
      { id: 'fr', uri: 'https://www.floatplane.com/captions/fr.vtt', language: 'fr', subtitle: 'Auto-generated', headers: authHeaders },
      { id: 'es', uri: 'https://cdn.example.com/es.vtt', language: 'es', subtitle: undefined, headers: undefined },
    ]);
  });

  it('starts with captions off at normal speed when nothing is saved', async () => {
    const [video] = firstVideos(1);
    rt.api.textTracks.set(video.id, [track('en', 'en')]);

    await openVideo(video.id);

    expect(rt.videoDriver.props().rate).toBe(1);
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBeUndefined();
  });

  it('restores the saved speed and caption language', async () => {
    const [video] = firstVideos(1);
    rt.api.textTracks.set(video.id, [track('en', 'en'), track('fr', 'fr')]);
    rt.asyncStorage.items.set(PREFERENCES_KEY, JSON.stringify({ playbackRate: 1.5, captionLanguage: 'fr-CA' }));

    await openVideo(video.id);

    expect(rt.videoDriver.props().rate).toBe(1.5);
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBe('fr');
  });

  it('ignores corrupt saved preferences', async () => {
    const [video] = firstVideos(1);
    rt.api.textTracks.set(video.id, [track('en', 'en')]);
    rt.asyncStorage.items.set(PREFERENCES_KEY, '{not json');

    await openVideo(video.id);

    expect(rt.videoDriver.props().rate).toBe(1);
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBeUndefined();
  });

  it('remembers speed and caption choices from the native menus across videos', async () => {
    const [first, second] = firstVideos(2);
    rt.api.textTracks.set(first.id, [track('first-en', 'en'), track('first-de', 'de')]);
    rt.api.textTracks.set(second.id, [track('second-de', 'de'), track('second-en', 'en')]);

    await openVideo(first.id);
    await rt.act(async () => {
      rt.videoDriver.props().onCaptionTrackChange?.({ trackId: 'first-en' });
      rt.videoDriver.props().onPlaybackRateChange?.({ playbackRate: 1.25, selectedPlaybackRate: 1.25 });
    });

    expect(storedPreferences()).toEqual({ playbackRate: 1.25, captionLanguage: 'en' });
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBe('first-en');
    expect(rt.videoDriver.props().rate).toBe(1.25);

    await rt.act(async () => {
      rt.videoDriver.props().onEnd?.();
    });
    await rt.until(() => {
      expect(rt.screen.getByText(second.title)).toBeTruthy();
    });
    await rt.act(async () => {
      rt.fireEvent.press(rt.screen.getByText(second.title));
    });
    await rt.until(() => {
      expect(rt.videoDriver.props().captionTracks?.[0]?.id).toBe('second-de');
    });

    expect(rt.videoDriver.props().selectedCaptionTrackId).toBe('second-en');
    expect(rt.videoDriver.props().rate).toBe(1.25);

    await rt.act(async () => {
      rt.videoDriver.props().onCaptionTrackChange?.({});
    });

    expect(storedPreferences()).toEqual({ playbackRate: 1.25, captionLanguage: null });
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBeUndefined();
  });

  it('does not save rates outside the speed menu, such as pauses', async () => {
    const [video] = firstVideos(1);
    await openVideo(video.id);

    await rt.act(async () => {
      rt.videoDriver.props().onPlaybackRateChange?.({ playbackRate: 0, selectedPlaybackRate: 1 });
      rt.videoDriver.props().onPlaybackRateChange?.({ playbackRate: 8 });
    });

    expect(rt.asyncStorage.items.has(PREFERENCES_KEY)).toBe(false);
  });
});
