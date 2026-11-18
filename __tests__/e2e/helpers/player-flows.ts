import type * as ReactNative from 'react-native';
import type { Video } from '@sinkplane/shared';

import type { Runtime } from './runtime';

export const PROGRESS_PATH = '/api/v3/content/progress';
export const PREFERENCES_KEY = 'playback-preferences';
export const LAUNCH_ERROR = ['Error', 'Error launching video. Please try again'];

export const channelVideo = (rt: Runtime, index: number): Video => {
  const [videos = []] = rt.api.videosByChannel.values();
  const video = videos[index];
  if (video === undefined) {
    throw new Error(`No fixture video at index ${String(index)}`);
  }
  return video;
};

export const openVideo = async (rt: Runtime, videoId: string): Promise<void> => {
  rt.seedSession();
  await rt.renderApp(`/video/${videoId}`);
  await rt.until(() => {
    expect(rt.videoDriver.mounted()).toBe(true);
  });
};

interface SavedProgress {
  readonly id: string;
  readonly progress: number;
}

const isSavedProgress = (value: unknown): value is SavedProgress =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  'progress' in value &&
  typeof value.id === 'string' &&
  typeof value.progress === 'number';

export const savedProgress = (rt: Runtime): SavedProgress[] =>
  rt.api
    .requestsTo(PROGRESS_PATH, 'POST')
    .map((request): unknown => JSON.parse(request.body ?? 'null'))
    .filter(isSavedProgress)
    .map(({ id, progress }) => ({ id, progress }));

export const storedPreferences = (rt: Runtime): unknown =>
  JSON.parse(rt.asyncStorage.items.get(PREFERENCES_KEY) ?? 'null');

export const spyOnAlerts = (): jest.SpyInstance =>
  jest
    .spyOn(jest.requireActual<typeof ReactNative>('react-native').Alert, 'alert')
    .mockImplementation(() => undefined);

export const actAndSettle = async (rt: Runtime, interaction: () => void): Promise<void> => {
  await rt.act(async () => {
    interaction();
    await Promise.resolve();
  });
  await rt.advanceTime(0);
};

export const firePlaybackState = async (rt: Runtime, isPlaying: boolean): Promise<void> => {
  const props = rt.videoDriver.props();
  await actAndSettle(rt, () => {
    props.onPlaybackStateChanged?.({ isPlaying, isSeeking: false });
  });
};
