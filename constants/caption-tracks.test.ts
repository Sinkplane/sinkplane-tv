import type { TextTrack } from '@sinkplane/shared';

import { findCaptionTrack, toCaptionTracks } from '@/constants/caption-tracks';

const textTrack = (overrides: Partial<TextTrack>): TextTrack => ({
  id: 'en',
  src: 'https://www.floatplane.com/captions/en.vtt',
  kind: 'captions',
  language: 'en',
  generated: false,
  processing: false,
  ...overrides,
});

describe('findCaptionTrack', () => {
  const tracks = [
    { id: 'none', uri: 'https://x.test/none.vtt' },
    { id: 'en-us', uri: 'https://x.test/en-us.vtt', language: 'en-US' },
    { id: 'fr', uri: 'https://x.test/fr.vtt', language: 'fr' },
  ];

  it.each([
    [null, undefined],
    ['', undefined],
    ['EN-us', 'en-us'],
    ['en-GB', 'en-us'],
    ['fr-CA', 'fr'],
    ['de', undefined],
  ])('finds the track for %j', (language, expectedId) => {
    expect(findCaptionTrack(tracks, language)?.id).toBe(expectedId);
  });
});

describe('toCaptionTracks', () => {
  const headers = { authorization: 'Bearer token' };

  it('has no tracks for a post without text tracks', () => {
    expect(toCaptionTracks(undefined, headers)).toEqual([]);
  });

  it('resolves relative sources against the API and only authenticates Floatplane hosts', () => {
    const tracks = toCaptionTracks(
      [
        textTrack({ id: 'rel', src: 'captions/rel.vtt', generated: true }),
        textTrack({ id: 'abs', src: '/captions/abs.vtt' }),
        textTrack({ id: 'cdn', src: 'http://cdn.example.com/cdn.vtt' }),
        textTrack({ id: 'pending', processing: true }),
        textTrack({ id: 'empty', src: '' }),
      ],
      headers,
    );
    expect(tracks).toEqual([
      {
        id: 'rel',
        uri: 'https://www.floatplane.com/captions/rel.vtt',
        language: 'en',
        subtitle: 'Auto-generated',
        headers,
      },
      {
        id: 'abs',
        uri: 'https://www.floatplane.com/captions/abs.vtt',
        language: 'en',
        headers,
      },
      { id: 'cdn', uri: 'http://cdn.example.com/cdn.vtt', language: 'en' },
    ]);
  });
});
