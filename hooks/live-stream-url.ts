import type { VideoDelivery } from '@sinkplane/shared';

export const LIVESTREAM_ID = '5c13f3c006f1be15e08e05c0';

export interface LiveSource {
  readonly uri: string;
}

const withoutTrailingSlash = (url: string): string => (url.endsWith('/') ? url.slice(0, -1) : url);

const withLeadingSlash = (path: string): string => (path.startsWith('/') ? path : `/${path}`);

function withoutQuery(url: string): string {
  const queryStart = url.indexOf('?');
  return queryStart === -1 ? url : url.slice(0, queryStart);
}

export function liveStreamUri(delivery: VideoDelivery): string | undefined {
  const group = delivery.groups[0];
  const origin = group?.origins[0];
  const variant = group?.variants.find((candidate) => candidate.enabled !== false);
  if (origin === undefined || variant === undefined) {
    return undefined;
  }
  return `${withoutTrailingSlash(origin.url)}${withLeadingSlash(variant.url)}`;
}

export function isSameStream(current: string, next: string): boolean {
  return withoutQuery(current) === withoutQuery(next);
}
