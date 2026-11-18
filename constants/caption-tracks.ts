import type { CaptionTrack } from 'react-native-video';
import type { TextTrack } from '@sinkplane/shared';
import { API_BASE_URL } from '@sinkplane/shared/constants/api';

const ABSOLUTE_URL = /^https?:\/\//i;
const FLOATPLANE_URL = /^https:\/\/([a-z0-9-]+\.)*floatplane\.com(\/|$)/i;
const GENERATED_SUBTITLE = 'Auto-generated';

const resolveTrackUrl = (src: string): string => {
  if (ABSOLUTE_URL.test(src)) {
    return src;
  }
  return `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
};

const primaryLanguage = (language: string): string => {
  const lower = language.toLowerCase();
  const regionStart = lower.indexOf('-');
  return regionStart === -1 ? lower : lower.slice(0, regionStart);
};

const matchesExactly = (track: CaptionTrack, language: string): boolean =>
  track.language?.toLowerCase() === language.toLowerCase();

const matchesPrimary = (track: CaptionTrack, language: string): boolean =>
  track.language !== undefined &&
  track.language !== '' &&
  primaryLanguage(track.language) === primaryLanguage(language);

export const findCaptionTrack = (
  tracks: readonly CaptionTrack[],
  rememberedLanguage: string | null,
): CaptionTrack | undefined => {
  if (rememberedLanguage === null || rememberedLanguage === '') {
    return undefined;
  }
  return (
    tracks.find((track) => matchesExactly(track, rememberedLanguage)) ??
    tracks.find((track) => matchesPrimary(track, rememberedLanguage))
  );
};

const toCaptionTrack = (track: TextTrack, authHeaders: Record<string, string>): CaptionTrack => {
  const uri = resolveTrackUrl(track.src);
  return {
    id: track.id,
    uri,
    language: track.language,
    ...(track.generated ? { subtitle: GENERATED_SUBTITLE } : {}),
    ...(FLOATPLANE_URL.test(uri) ? { headers: authHeaders } : {}),
  };
};

export const toCaptionTracks = (
  textTracks: readonly TextTrack[] | undefined,
  authHeaders: Record<string, string>,
): CaptionTrack[] =>
  (textTracks ?? [])
    .filter((track) => track.src !== '' && !track.processing)
    .map((track) => toCaptionTrack(track, authHeaders));
