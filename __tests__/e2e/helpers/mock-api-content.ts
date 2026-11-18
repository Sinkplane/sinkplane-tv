import { type Channel, type Creator } from '@sinkplane/shared/types/creator-list.interface';
import { type Subscription, type TextTrack, type Video } from '@sinkplane/shared';
import {
  fixtureCreators,
  fixtureSubscriptions,
  fixtureUser,
  LIVESTREAM_ID,
  makeDeniedVideoDelivery,
  makeHistoryEntry,
  makeLiveVideoDelivery,
  makeVideoDelivery,
  makeVideoPost,
  makeVideosForChannel,
  techCreator,
} from './fixtures';
import { OidcApiMock } from './mock-api-oidc';
import { type MockFetchResponse, respond } from './mock-api-response';

const DEFAULT_HISTORY_PAGE_SIZE = 20;
const DEFAULT_PAGE_LIMIT = 10;
const RELATED_VIDEO_COUNT = 3;
const DEFAULT_HISTORY_UPDATED_AT = '2026-01-15T12:00:00.000Z';
const ID_PARAM = /^ids\[(\d+)\]$/;

export interface HistoryRecord {
  video: Video;
  progress: number;
  updatedAt: string;
}

type RouteHandler = (params: URLSearchParams, rawBody: string | null) => MockFetchResponse;

interface ProgressUpdate {
  id: string;
  progress: number;
}

const isProgressUpdate = (value: unknown): value is ProgressUpdate =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'string' &&
  'progress' in value &&
  typeof value.progress === 'number';

const parseIdParams = (params: URLSearchParams): string[] => {
  const ids: string[] = [];
  params.forEach((value, key) => {
    const match = ID_PARAM.exec(key);
    if (match) {
      ids[Number(match[1])] = value;
    }
  });
  return ids;
};

const isDefined = <T>(value: T | undefined): value is T => value !== undefined;

export class ContentApiMock extends OidcApiMock {
  subscriptions: Subscription[] = fixtureSubscriptions;
  creators: Creator[] = fixtureCreators;
  videosByChannel = new Map<string, Video[]>();
  videosById = new Map<string, Video>();
  deniedDeliveryGuids = new Set<string>();
  textTracks = new Map<string, TextTrack[]>();
  liveNow = false;
  historyPageSize = DEFAULT_HISTORY_PAGE_SIZE;
  progress = new Map<string, number>();
  history: HistoryRecord[] = [];

  private readonly routes = new Map<string, RouteHandler>([
    ['GET /api/v3/status', () => this.handleStatus()],
    ['GET /api/v3/user/subscriptions', () => respond(200, this.subscriptions)],
    ['GET /api/v3/creator/list', (params) => this.handleCreatorList(params)],
    ['GET /api/v3/content/creator', (params) => this.handleContentCreator(params)],
    ['GET /api/v3/content/post', (params) => this.handleContentPost(params)],
    ['GET /api/v3/delivery/info', (params) => this.handleDeliveryInfo(params)],
    ['GET /api/v3/content/progress', (params) => this.handleGetProgress(params)],
    ['POST /api/v3/content/progress', (_params, rawBody) => this.handlePostProgress(rawBody)],
    ['GET /api/v3/content/history', (params) => this.handleHistory(params)],
    ['GET /api/v3/content/related', (params) => this.handleRelated(params)],
  ]);

  constructor() {
    super();
    this.registerDefaults();
  }

  registerDefaults(): void {
    const creators = [techCreator, ...fixtureCreators.filter((c) => c.id !== techCreator.id)];
    creators.forEach((creator) => {
      creator.channels.forEach((channel: Channel) => {
        this.registerChannelVideos(creator, channel.id);
      });
    });
  }

  registerChannelVideos(creator: Creator, channelId: string, count = 26): void {
    const videos = makeVideosForChannel(creator, channelId, count);
    this.videosByChannel.set(channelId, videos);
    videos.forEach((video) => this.videosById.set(video.id, video));
  }

  seedProgress(video: Video, progress: number): void {
    this.progress.set(video.id, progress);
    this.seedHistoryEntry(video, progress);
  }

  seedHistoryEntry(video: Video, progress: number, updatedAt = DEFAULT_HISTORY_UPDATED_AT): void {
    const existing = this.history.find((entry) => entry.video.id === video.id);
    if (existing) {
      existing.progress = progress;
      existing.updatedAt = updatedAt;
    } else {
      this.history.push({ video, progress, updatedAt });
    }
  }

  protected resetCatalog(): void {
    this.subscriptions = fixtureSubscriptions;
    this.creators = fixtureCreators;
    this.videosByChannel.clear();
    this.videosById.clear();
    this.deniedDeliveryGuids.clear();
    this.textTracks.clear();
    this.liveNow = false;
    this.historyPageSize = DEFAULT_HISTORY_PAGE_SIZE;
    this.progress.clear();
    this.history = [];
    this.registerDefaults();
  }

  protected handleApiV3(url: URL, method: string, rawBody: string | null): MockFetchResponse {
    const route = `${method} ${url.pathname}`;
    const handler = this.routes.get(route);
    if (handler === undefined) {
      return respond(404, { message: `No mock handler for ${route}` });
    }
    return handler(url.searchParams, rawBody);
  }

  private handleStatus(): MockFetchResponse {
    return respond(200, {
      selfUser: fixtureUser,
      selfCreator: null,
      serviceMessages: [],
      serviceDenied: null,
    });
  }

  private handleCreatorList(params: URLSearchParams): MockFetchResponse {
    const ordered = parseIdParams(params)
      .map((id) => this.creators.find((creator) => creator.id === id))
      .filter(isDefined);
    return respond(200, ordered);
  }

  private handleContentCreator(params: URLSearchParams): MockFetchResponse {
    const limit = Number(params.get('limit') ?? DEFAULT_PAGE_LIMIT);
    const fetchAfter = Number(params.get('fetchAfter') ?? 0);
    const all = this.videosByChannel.get(params.get('channel') ?? '') ?? [];
    const ordered = params.get('sort') === 'ASC' ? [...all].reverse() : all;
    return respond(200, ordered.slice(fetchAfter, fetchAfter + limit));
  }

  private handleContentPost(params: URLSearchParams): MockFetchResponse {
    const video = this.videosById.get(params.get('id') ?? '');
    if (!video) {
      return respond(404, { message: 'Post not found' });
    }
    return respond(
      200,
      makeVideoPost(video, this.progress.get(video.id) ?? 0, this.textTracks.get(video.id)),
    );
  }

  private handleGetProgress(params: URLSearchParams): MockFetchResponse {
    const body = parseIdParams(params)
      .filter((id) => (this.progress.get(id) ?? 0) > 0)
      .map((id) => ({ id, progress: this.progress.get(id) ?? 0 }));
    return respond(200, body);
  }

  private handlePostProgress(rawBody: string | null): MockFetchResponse {
    const payload: unknown = JSON.parse(rawBody ?? '{}');
    if (!isProgressUpdate(payload)) {
      return respond(400, { message: 'Invalid progress payload' });
    }
    this.progress.set(payload.id, payload.progress);
    const video = this.videosById.get(payload.id);
    if (video) {
      this.seedHistoryEntry(video, payload.progress, new Date().toISOString());
    }
    return respond(200, { message: 'ok' });
  }

  private handleHistory(params: URLSearchParams): MockFetchResponse {
    const offset = Number(params.get('offset') ?? 0);
    const ordered = [...this.history].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const page = ordered.slice(offset, offset + this.historyPageSize).map((entry) => ({
      ...makeHistoryEntry(entry.video, entry.progress),
      updatedAt: entry.updatedAt,
    }));
    return respond(200, page);
  }

  private handleRelated(params: URLSearchParams): MockFetchResponse {
    const video = this.videosById.get(params.get('id') ?? '');
    if (!video) {
      return respond(404, { message: 'Not found' });
    }
    const related = (this.videosByChannel.get(video.channel.id) ?? [])
      .filter((v) => v.id !== video.id)
      .slice(0, RELATED_VIDEO_COUNT);
    return respond(200, related);
  }

  private handleDeliveryInfo(params: URLSearchParams): MockFetchResponse {
    const entityId = params.get('entityId') ?? '';
    if (params.get('entityKind') === 'livestream') {
      return this.liveNow && entityId === LIVESTREAM_ID
        ? respond(200, makeLiveVideoDelivery())
        : respond(404, { message: 'Not Found' });
    }
    if (this.deniedDeliveryGuids.has(entityId)) {
      return respond(200, makeDeniedVideoDelivery(entityId));
    }
    return respond(200, makeVideoDelivery(entityId));
  }
}
