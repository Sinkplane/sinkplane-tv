import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CaptionTrack, OnCaptionTrackChangeData, OnPlaybackRateChangeData } from 'react-native-video';

import { findCaptionTrack } from '@/components/videos/caption-tracks';
import { PLAYBACK_SPEEDS } from '@/constants/video';

const STORAGE_KEY = 'playback-preferences';

interface PlaybackPreferences {
  playbackRate: number;
  /** Language of the last caption track picked; `null` means captions off. */
  captionLanguage: string | null;
}

const DEFAULT_PREFERENCES: PlaybackPreferences = { playbackRate: 1, captionLanguage: null };

const parsePreferences = (raw: string | null): PlaybackPreferences => {
  const stored = raw ? JSON.parse(raw) : {};
  return {
    playbackRate: PLAYBACK_SPEEDS.includes(stored.playbackRate) ? stored.playbackRate : DEFAULT_PREFERENCES.playbackRate,
    captionLanguage: typeof stored.captionLanguage === 'string' ? stored.captionLanguage : null,
  };
};

/**
 * Remembers the speed and caption language picked in the native player menus across videos.
 * Returns props for `VideoPlayer`; `ready` is false until the stored preferences have loaded.
 */
export const usePlaybackPreferences = (captionTracks: CaptionTrack[]) => {
  const [preferences, setPreferences] = useState<PlaybackPreferences | null>(null);
  const latestRef = useRef(DEFAULT_PREFERENCES);
  // The exact track picked for this video; `trackId: undefined` means captions were turned off.
  const [pickedCaptionTrack, setPickedCaptionTrack] = useState<OnCaptionTrackChangeData | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(parsePreferences)
      .catch(() => DEFAULT_PREFERENCES)
      .then(loaded => {
        if (cancelled) return;
        latestRef.current = loaded;
        setPreferences(loaded);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePreferences = useCallback((update: Partial<PlaybackPreferences>) => {
    const next = { ...latestRef.current, ...update };
    latestRef.current = next;
    setPreferences(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(err => {
      console.error('[usePlaybackPreferences] Failed to save playback preferences:', err);
    });
  }, []);

  const onPlaybackRateChange = useCallback(
    ({ selectedPlaybackRate }: OnPlaybackRateChangeData) => {
      if (
        selectedPlaybackRate !== undefined &&
        PLAYBACK_SPEEDS.includes(selectedPlaybackRate) &&
        selectedPlaybackRate !== latestRef.current.playbackRate
      ) {
        updatePreferences({ playbackRate: selectedPlaybackRate });
      }
    },
    [updatePreferences],
  );

  const onCaptionTrackChange = useCallback(
    (event: OnCaptionTrackChangeData) => {
      setPickedCaptionTrack(event);
      const language = captionTracks.find(track => track.id === event.trackId)?.language;
      updatePreferences({ captionLanguage: language ?? null });
    },
    [captionTracks, updatePreferences],
  );

  const captionLanguage = preferences?.captionLanguage ?? null;
  const selectedCaptionTrackId = useMemo(
    () => (pickedCaptionTrack ? pickedCaptionTrack.trackId : findCaptionTrack(captionTracks, captionLanguage)?.id),
    [pickedCaptionTrack, captionTracks, captionLanguage],
  );

  return {
    ready: preferences !== null,
    rate: preferences?.playbackRate ?? DEFAULT_PREFERENCES.playbackRate,
    onPlaybackRateChange,
    selectedCaptionTrackId,
    onCaptionTrackChange,
  };
};
