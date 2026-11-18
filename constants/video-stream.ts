import type { ContentProgress, VideoDelivery, VideoDeliveryResource } from '@sinkplane/shared';

const USER_AGENT_HEADER = 'User-Agent';
const AUTHORIZATION_HEADER = 'Authorization';
const COOKIE_HEADER = 'Cookie';
const USER_AGENT = 'SinkplaneTV/1.0 (AppleTV; iOS)';
const JWT_PREFIX = 'ey';
const TAG_OPEN = '<';
const TAG_CLOSE = '>';

export interface StreamMetadata {
  title?: string;
  subtitle?: string;
  description?: string;
  imageUri?: string;
}

export const playbackHeaders = (token: string | undefined): Record<string, string> => {
  if (token === undefined || token === '') {
    return { [USER_AGENT_HEADER]: USER_AGENT };
  }
  if (token.startsWith(JWT_PREFIX)) {
    return { [USER_AGENT_HEADER]: USER_AGENT, [AUTHORIZATION_HEADER]: `Bearer ${token}` };
  }
  return { [USER_AGENT_HEADER]: USER_AGENT, [COOKIE_HEADER]: `sails.sid=${token}` };
};

const deniedReason = (variant: VideoDeliveryResource): string =>
  variant.meta?.common?.access?.deniedReason ?? '';

const isPlayable = (variant: VideoDeliveryResource): boolean =>
  variant.enabled !== false && variant.url !== '' && deniedReason(variant) === '';

const joinUrl = (originUrl: string, path: string): string => {
  const origin = originUrl.endsWith('/') ? originUrl.slice(0, -1) : originUrl;
  const absolutePath = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${absolutePath}`;
};

export const streamUri = (delivery: VideoDelivery): string | undefined => {
  const group = delivery.groups[0];
  const origin = group?.origins[0];
  const variant = group?.variants.filter(isPlayable).at(-1);
  if (origin === undefined || variant === undefined) {
    return undefined;
  }
  return joinUrl(origin.url, variant.url);
};

const definedValues = (values: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );

const withoutTag = (segment: string, index: number): string => {
  const tagEnd = segment.indexOf(TAG_CLOSE);
  if (index === 0) {
    return segment;
  }
  return tagEnd === -1 ? `${TAG_OPEN}${segment}` : segment.slice(tagEnd + 1);
};

export const stripHtml = (html: string): string =>
  html.split(TAG_OPEN).map(withoutTag).join('').trim();

export interface MetadataSource {
  readonly title: string;
  readonly text: string;
  readonly channel: { readonly title: string };
  readonly thumbnail: { readonly path: string };
}

export const streamMetadata = (post: MetadataSource): StreamMetadata =>
  definedValues({
    title: post.title,
    subtitle: post.channel.title,
    description: stripHtml(post.text),
    imageUri: post.thumbnail.path,
  });

export const resumePoint = (
  postProgress: number | null | undefined,
  savedProgress: readonly ContentProgress[] | undefined,
): number => {
  const fromPost = postProgress ?? 0;
  return fromPost > 0 ? fromPost : (savedProgress?.[0]?.progress ?? 0);
};
