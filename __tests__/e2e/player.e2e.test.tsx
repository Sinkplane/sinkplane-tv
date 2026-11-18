import type { TextTrack } from '@sinkplane/shared';

import {
  actAndSettle,
  channelVideo,
  openVideo,
  PREFERENCES_KEY,
  storedPreferences,
} from './helpers/player-flows';
import { loadRuntime, type Runtime } from './helpers/runtime';

const AUTHORIZATION = 'Authorization';
const USER_AGENT = 'User-Agent';

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

  it('passes the attachment text tracks to the native player as caption tracks', async () => {
    const video = channelVideo(rt, 0);
    rt.api.textTracks.set(video.id, [
      track('en', 'en', { src: 'https://www.floatplane.com/captions/en.vtt' }),
      track('fr', 'fr', { src: '/captions/fr.vtt', generated: true }),
      track('es', 'es', { src: 'https://cdn.example.com/es.vtt' }),
      track('de', 'de', { src: '', generated: true, processing: true }),
    ]);

    await openVideo(rt, video.id);

    const authHeaders = {
      [USER_AGENT]: 'SinkplaneTV/1.0 (AppleTV; iOS)',
      [AUTHORIZATION]: `Bearer ${rt.api.accessToken}`,
    };
    expect(rt.videoDriver.props().captionTracks).toEqual([
      {
        id: 'en',
        uri: 'https://www.floatplane.com/captions/en.vtt',
        language: 'en',
        subtitle: undefined,
        headers: authHeaders,
      },
      {
        id: 'fr',
        uri: 'https://www.floatplane.com/captions/fr.vtt',
        language: 'fr',
        subtitle: 'Auto-generated',
        headers: authHeaders,
      },
      {
        id: 'es',
        uri: 'https://cdn.example.com/es.vtt',
        language: 'es',
        subtitle: undefined,
        headers: undefined,
      },
    ]);
  });

  it('starts with captions off at normal speed when nothing is saved', async () => {
    const video = channelVideo(rt, 0);
    rt.api.textTracks.set(video.id, [track('en', 'en')]);

    await openVideo(rt, video.id);

    expect(rt.videoDriver.props().rate).toBe(1);
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBeUndefined();
  });

  it('restores the saved speed and caption language', async () => {
    const video = channelVideo(rt, 0);
    rt.api.textTracks.set(video.id, [track('en', 'en'), track('fr', 'fr')]);
    rt.asyncStorage.items.set(
      PREFERENCES_KEY,
      JSON.stringify({ playbackRate: 1.5, captionLanguage: 'fr-CA' }),
    );

    await openVideo(rt, video.id);

    expect(rt.videoDriver.props().rate).toBe(1.5);
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBe('fr');
  });

  it.each([
    ['corrupt JSON', '{not json'],
    ['a non-object', '5'],
    ['null', 'null'],
    ['unknown values', JSON.stringify({ playbackRate: 3, captionLanguage: 7 })],
  ])('ignores %s saved as preferences', async (_label, stored) => {
    const video = channelVideo(rt, 0);
    rt.api.textTracks.set(video.id, [track('en', 'en')]);
    rt.asyncStorage.items.set(PREFERENCES_KEY, stored);

    await openVideo(rt, video.id);

    expect(rt.videoDriver.props().rate).toBe(1);
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBeUndefined();
  });

  it('remembers speed and caption choices from the native menus across videos', async () => {
    const first = channelVideo(rt, 0);
    const second = channelVideo(rt, 1);
    rt.api.textTracks.set(first.id, [track('first-en', 'en'), track('first-de', 'de')]);
    rt.api.textTracks.set(second.id, [track('second-de', 'de'), track('second-en', 'en')]);

    await openVideo(rt, first.id);
    await actAndSettle(rt, () => {
      rt.videoDriver.props().onCaptionTrackChange?.({ trackId: 'first-en' });
      rt.videoDriver
        .props()
        .onPlaybackRateChange?.({ playbackRate: 1.25, selectedPlaybackRate: 1.25 });
    });

    expect(storedPreferences(rt)).toEqual({ playbackRate: 1.25, captionLanguage: 'en' });
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBe('first-en');
    expect(rt.videoDriver.props().rate).toBe(1.25);

    await rt.videoDriver.fireEnd();
    await rt.until(() => {
      expect(rt.screen.getByText(second.title)).toBeTruthy();
    });
    await rt.act(async () => {
      await rt.fireEvent.press(rt.screen.getByText(second.title));
    });
    await rt.until(() => {
      expect(rt.videoDriver.props().captionTracks?.[0]?.id).toBe('second-de');
    });

    expect(rt.videoDriver.props().selectedCaptionTrackId).toBe('second-en');
    expect(rt.videoDriver.props().rate).toBe(1.25);

    await actAndSettle(rt, () => {
      rt.videoDriver.props().onCaptionTrackChange?.({});
    });

    expect(storedPreferences(rt)).toEqual({ playbackRate: 1.25, captionLanguage: null });
    expect(rt.videoDriver.props().selectedCaptionTrackId).toBeUndefined();
  });

  it('does not save rates outside the speed menu, such as pauses', async () => {
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);

    await actAndSettle(rt, () => {
      rt.videoDriver.props().onPlaybackRateChange?.({ playbackRate: 0, selectedPlaybackRate: 1 });
      rt.videoDriver.props().onPlaybackRateChange?.({ playbackRate: 8 });
    });

    expect(rt.asyncStorage.items.has(PREFERENCES_KEY)).toBe(false);
  });

  it('keeps playing when the preferences cannot be saved', async () => {
    const storage = jest.requireMock<{ default: { setItem: jest.Mock } }>(
      '@react-native-async-storage/async-storage',
    );
    storage.default.setItem.mockRejectedValueOnce(new Error('disk full'));
    const video = channelVideo(rt, 0);
    await openVideo(rt, video.id);

    await actAndSettle(rt, () => {
      rt.videoDriver.props().onPlaybackRateChange?.({ playbackRate: 2, selectedPlaybackRate: 2 });
    });

    expect(rt.videoDriver.props().rate).toBe(2);
    expect(rt.asyncStorage.items.has(PREFERENCES_KEY)).toBe(false);
  });
});
