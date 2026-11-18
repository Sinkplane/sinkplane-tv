import type { VideoDelivery, VideoDeliveryResource } from '@sinkplane/shared';

import {
  playbackHeaders,
  resumePoint,
  streamMetadata,
  streamUri,
  stripHtml,
} from '@/constants/video-stream';

const AUTHORIZATION = 'Authorization';
const COOKIE = 'Cookie';
const USER_AGENT = 'User-Agent';

const variant = (
  url: string,
  overrides: Partial<VideoDeliveryResource> = {},
): VideoDeliveryResource => ({
  url,
  ...overrides,
});

const delivery = (originUrl: string, variants: VideoDeliveryResource[]): VideoDelivery => ({
  groups: [{ origins: [{ url: originUrl }], variants }],
});

describe('playbackHeaders', () => {
  it('sends only the user agent without a token', () => {
    expect(playbackHeaders(undefined)).toEqual({ [USER_AGENT]: 'SinkplaneTV/1.0 (AppleTV; iOS)' });
    expect(playbackHeaders('')).toEqual({ [USER_AGENT]: 'SinkplaneTV/1.0 (AppleTV; iOS)' });
  });

  it('sends a JWT as a bearer token', () => {
    expect(playbackHeaders('eyabc')).toEqual({
      [USER_AGENT]: 'SinkplaneTV/1.0 (AppleTV; iOS)',
      [AUTHORIZATION]: 'Bearer eyabc',
    });
  });

  it('sends any other token as the sails.sid session cookie', () => {
    expect(playbackHeaders('session-id')).toEqual({
      [USER_AGENT]: 'SinkplaneTV/1.0 (AppleTV; iOS)',
      [COOKIE]: 'sails.sid=session-id',
    });
  });
});

describe('streamUri', () => {
  it('joins the origin with the last playable variant', () => {
    const result = streamUri(
      delivery('https://edge.test/', [variant('/720.m3u8'), variant('1080.m3u8')]),
    );
    expect(result).toBe('https://edge.test/1080.m3u8');
  });

  it('skips disabled, empty and access-denied variants', () => {
    const result = streamUri(
      delivery('https://edge.test', [
        variant('/360.m3u8', { enabled: true }),
        variant('/480.m3u8', { enabled: false }),
        variant(''),
        variant('/720.m3u8', { meta: { common: { access: { deniedReason: 'plan' } } } }),
      ]),
    );
    expect(result).toBe('https://edge.test/360.m3u8');
  });

  it('has no stream without a group, origin or playable variant', () => {
    expect(streamUri({ groups: [] })).toBeUndefined();
    expect(streamUri({ groups: [{ origins: [], variants: [variant('/a')] }] })).toBeUndefined();
    expect(
      streamUri(delivery('https://edge.test', [variant('/a', { enabled: false })])),
    ).toBeUndefined();
  });
});

describe('stripHtml', () => {
  it.each([
    ['<p>Hello <b>world</b></p>  ', 'Hello world'],
    ['plain text', 'plain text'],
    ['a < b', 'a < b'],
    ['', ''],
  ])('turns %j into %j', (html, text) => {
    expect(stripHtml(html)).toBe(text);
  });
});

describe('streamMetadata', () => {
  it('describes the post for the native Now Playing panel', () => {
    expect(
      streamMetadata({
        title: 'Title',
        text: '<p>Body <i>text</i></p>',
        channel: { title: 'Channel' },
        thumbnail: { path: 'https://img.test/t.jpg' },
      }),
    ).toEqual({
      title: 'Title',
      subtitle: 'Channel',
      description: 'Body text',
      imageUri: 'https://img.test/t.jpg',
    });
  });
});

describe('resumePoint', () => {
  it.each([
    [120, undefined, 120],
    [0, [{ id: 'v', progress: 45 }], 45],
    [null, [], 0],
    [undefined, undefined, 0],
  ])('post progress %j with saved %j resumes at %j', (post, saved, expected) => {
    expect(resumePoint(post, saved)).toBe(expected);
  });
});
