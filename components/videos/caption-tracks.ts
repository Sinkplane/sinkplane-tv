import type { CaptionTrack } from 'react-native-video';
import { API_BASE_URL, TextTrack } from '@sinkplane/shared';

const ABSOLUTE_URL = /^https?:\/\//i;
const FLOATPLANE_URL = /^https:\/\/([a-z0-9-]+\.)*floatplane\.com(\/|$)/i;

const resolveTrackUrl = (src: string) => (ABSOLUTE_URL.test(src) ? src : `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`);

const primaryLanguage = (language: string) => language.toLowerCase().split('-')[0];

/** Finds the track for a remembered caption language, falling back to the same primary language (`en-US` → `en`). */
export const findCaptionTrack = (tracks: CaptionTrack[], language: string | null) => {
  if (!language) return undefined;
  return (
    tracks.find(track => track.language?.toLowerCase() === language.toLowerCase()) ??
    tracks.find(track => !!track.language && primaryLanguage(track.language) === primaryLanguage(language))
  );
};

/** Maps a video attachment's `textTracks` to native caption tracks; auth headers are only sent to Floatplane hosts. */
export const toCaptionTracks = (textTracks: TextTrack[] | undefined, authHeaders: Record<string, string>): CaptionTrack[] =>
  (textTracks ?? [])
    .filter(track => !!track.src && !track.processing)
    .map(track => {
      const uri = resolveTrackUrl(track.src);
      return {
        id: track.id,
        uri,
        language: track.language,
        subtitle: track.generated ? 'Auto-generated' : undefined,
        headers: FLOATPLANE_URL.test(uri) ? authHeaders : undefined,
      };
    });
