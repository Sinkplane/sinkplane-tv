import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import type {
  CaptionTrack,
  OnCaptionTrackChangeData,
  OnPlaybackRateChangeData,
} from 'react-native-video';

import { findCaptionTrack } from '@/constants/caption-tracks';
import { NORMAL_PLAYBACK_RATE, PLAYBACK_SPEEDS } from '@/constants/video';

const STORAGE_KEY = 'playback-preferences';

interface PlaybackPreferences {
  readonly playbackRate: number;
  readonly rememberedCaptionLanguage: string | null;
}

interface StoredPreferences {
  readonly playbackRate: number;
  readonly captionLanguage: string | null;
}

export interface PlaybackPreferenceProps {
  readonly ready: boolean;
  readonly rate: number;
  readonly selectedCaptionTrackId?: string;
  readonly onPlaybackRateChange: (event: OnPlaybackRateChangeData) => void;
  readonly onCaptionTrackChange: (event: OnCaptionTrackChangeData) => void;
}

const DEFAULT_PREFERENCES: PlaybackPreferences = {
  playbackRate: NORMAL_PLAYBACK_RATE,
  rememberedCaptionLanguage: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPlaybackSpeed = (value: unknown): value is number =>
  typeof value === 'number' && PLAYBACK_SPEEDS.includes(value);

const parsePreferences = (raw: string | null): PlaybackPreferences => {
  const stored: unknown = raw === null ? {} : JSON.parse(raw);
  if (!isRecord(stored)) {
    return DEFAULT_PREFERENCES;
  }
  const { playbackRate, captionLanguage } = stored;
  return {
    playbackRate: isPlaybackSpeed(playbackRate) ? playbackRate : DEFAULT_PREFERENCES.playbackRate,
    rememberedCaptionLanguage: typeof captionLanguage === 'string' ? captionLanguage : null,
  };
};

const loadPreferences = async (): Promise<PlaybackPreferences> => {
  try {
    return parsePreferences(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const toStored = (preferences: PlaybackPreferences): StoredPreferences => ({
  playbackRate: preferences.playbackRate,
  captionLanguage: preferences.rememberedCaptionLanguage,
});

const preferencesQuery = (screenId: string) =>
  queryOptions({
    queryKey: [STORAGE_KEY, screenId],
    queryFn: loadPreferences,
    staleTime: Infinity,
    gcTime: 0,
  });

const usePreferencesStore = (): {
  preferences: PlaybackPreferences | undefined;
  current: () => PlaybackPreferences;
  update: (change: Partial<PlaybackPreferences>) => void;
} => {
  const queryClient = useQueryClient();
  const screenId = useId();
  const query = preferencesQuery(screenId);
  const { data: preferences } = useQuery(query);
  const current = (): PlaybackPreferences =>
    queryClient.getQueryData(query.queryKey) ?? DEFAULT_PREFERENCES;
  const update = (change: Partial<PlaybackPreferences>): void => {
    const next = { ...current(), ...change };
    queryClient.setQueryData(query.queryKey, next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(next))).catch(() => undefined);
  };
  return { preferences, current, update };
};

const selectedTrack = (
  picked: OnCaptionTrackChangeData | null,
  captionTracks: readonly CaptionTrack[],
  rememberedLanguage: string | null,
): Pick<PlaybackPreferenceProps, 'selectedCaptionTrackId'> => {
  const trackId =
    picked === null ? findCaptionTrack(captionTracks, rememberedLanguage)?.id : picked.trackId;
  return trackId === undefined ? {} : { selectedCaptionTrackId: trackId };
};

export const usePlaybackPreferences = (
  captionTracks: readonly CaptionTrack[],
): PlaybackPreferenceProps => {
  const { preferences, current, update } = usePreferencesStore();
  const [pickedCaptionTrack, setPickedCaptionTrack] = useState<OnCaptionTrackChangeData | null>(
    null,
  );
  const effective = preferences ?? DEFAULT_PREFERENCES;

  return {
    ready: preferences !== undefined,
    rate: effective.playbackRate,
    ...selectedTrack(pickedCaptionTrack, captionTracks, effective.rememberedCaptionLanguage),
    onPlaybackRateChange: ({ selectedPlaybackRate }) => {
      if (
        isPlaybackSpeed(selectedPlaybackRate) &&
        selectedPlaybackRate !== current().playbackRate
      ) {
        update({ playbackRate: selectedPlaybackRate });
      }
    },
    onCaptionTrackChange: (event) => {
      setPickedCaptionTrack(event);
      const picked = captionTracks.find((track) => track.id === event.trackId);
      update({ rememberedCaptionLanguage: picked?.language ?? null });
    },
  };
};
