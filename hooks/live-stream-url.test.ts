import type { VideoDelivery } from '@sinkplane/shared';

import { isSameStream, liveStreamUri } from './live-stream-url';

const delivery = (
  originUrl: string | undefined,
  variants: { url: string; enabled?: boolean }[],
): VideoDelivery => ({
  groups: [
    {
      origins: originUrl === undefined ? [] : [{ url: originUrl }],
      variants,
    },
  ],
});

describe('liveStreamUri', () => {
  it('joins the origin and the first enabled variant without doubling slashes', () => {
    const uri = liveStreamUri(
      delivery('https://edge.test/', [
        { url: '/off.m3u8', enabled: false },
        { url: '/live.m3u8', enabled: true },
      ]),
    );
    expect(uri).toBe('https://edge.test/live.m3u8');
  });

  it('adds the missing slash between origin and variant', () => {
    expect(liveStreamUri(delivery('https://edge.test', [{ url: 'live.m3u8' }]))).toBe(
      'https://edge.test/live.m3u8',
    );
  });

  it.each([
    ['no origin', delivery(undefined, [{ url: '/live.m3u8' }])],
    ['only disabled variants', delivery('https://edge.test', [{ url: '/a', enabled: false }])],
    ['no groups', { groups: [] }],
  ])('returns undefined when the delivery has %s', (_label, input) => {
    expect(liveStreamUri(input)).toBeUndefined();
  });
});

describe('isSameStream', () => {
  it('ignores the rotating query string', () => {
    expect(
      isSameStream('https://edge.test/a.m3u8?token=1', 'https://edge.test/a.m3u8?token=2'),
    ).toBe(true);
  });

  it('tells different streams apart', () => {
    expect(isSameStream('https://edge.test/a.m3u8', 'https://edge.test/b.m3u8')).toBe(false);
  });
});
