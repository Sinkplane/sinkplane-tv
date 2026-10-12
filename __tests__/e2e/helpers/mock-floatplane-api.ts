/**
 * In-memory Floatplane API used by the E2E integration suite.
 *
 * Replaces `global.fetch` and serves every endpoint the app talks to:
 *  - OIDC device flow (auth.floatplane.com)
 *  - token refresh
 *  - profile / subscriptions / creators
 *  - per-channel video listing with pagination + sort
 *  - video post + delivery info (on-demand and live)
 *  - watch progress (get/set) and watch history
 *  - related videos
 *
 * It is stateful: POSTing progress updates the history store, exactly like
 * the real backend, so the "watch a video → see it in history" loop is
 * exercised end-to-end. Tests can also script failures (401/500/…) and
 * inspect every recorded request.
 */

/* eslint-disable max-classes-per-file */
/* eslint-disable camelcase -- OIDC token-endpoint payloads use snake_case wire format */

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

import { Channel, Creator } from '@/types/creator-list.interface';
import { Subscription } from '@/types/subscriptions.interface';
import { Video } from '@/types/video.interface';

const DEVICE_AUTH_PATH = '/realms/floatplane/protocol/openid-connect/auth/device';
const TOKEN_PATH = '/realms/floatplane/protocol/openid-connect/token';

export interface RecordedRequest {
  method: string;
  url: string;
  path: string;
  params: URLSearchParams;
  body: string | null;
  bearer: string | null;
  /** Sequence number, useful to assert ordering. */
  seq: number;
}

export interface MockFetchResponseShape {
  status: number;
  body: unknown;
}

class MockFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  private readonly jsonBody: unknown;
  private readonly textBody: string;

  constructor(status: number, body: unknown) {
    this.ok = status >= 200 && status < 300;
    this.status = status;
    this.jsonBody = body;
    this.textBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  async json(): Promise<unknown> {
    return this.jsonBody;
  }

  async text(): Promise<string> {
    return this.textBody;
  }

  get headers(): { get: () => string } {
    return { get: () => 'application/json' };
  }
}

interface DeviceAuthState {
  deviceCode: string;
  userCode: string;
  approved: boolean;
}

interface QueuedFailure {
  remaining: number; // Infinity = fail until cleared
  response: MockFetchResponseShape;
}

const asResponse = (shape: MockFetchResponseShape) => new MockFetchResponse(shape.status, shape.body) as unknown as Response;

export class FloatplaneApiMock {
  /** Every request the app made, in order. */
  requests: RecordedRequest[] = [];

  // -- auth / tokens --------------------------------------------------------
  accessToken = 'eyJhbGciOiJIUzI1NiJ9.mock-access-token';
  refreshToken = 'mock-refresh-token';
  /** Tokens that will receive a 401 from /api/v3 (refresh-retry regression). */
  rejectedTokens = new Set<string>();
  /** When true, refresh-token grants fail with invalid_grant. */
  refreshFails = false;
  /** Bump on each refresh; new tokens are derived from this. */
  refreshCount = 0;

  // -- OIDC device flow ------------------------------------------------------
  deviceAuthCalls = 0;
  deviceExpiresInSeconds = 600;
  /** When set, the next token poll returns this OAuth error instead. */
  deviceTokenError: 'authorization_pending' | 'expired_token' | 'access_denied' | null = null;
  /** When set, the device-auth endpoint fails with this response. */
  deviceAuthFailure: MockFetchResponseShape | null = null;
  private currentDeviceAuth: DeviceAuthState | null = null;

  // -- catalog state ---------------------------------------------------------
  subscriptions: Subscription[] = fixtureSubscriptions;
  creators: Creator[] = fixtureCreators;
  /** channelId → videos, newest first. */
  videosByChannel = new Map<string, Video[]>();
  videosById = new Map<string, Video>();
  /** GUIDs (video attachments) that resolve to an all-denied delivery payload. */
  deniedDeliveryGuids = new Set<string>();
  liveNow = false;
  historyPageSize = 20;

  // -- user state -------------------------------------------------------------
  progress = new Map<string, number>();
  history: { video: Video; progress: number; updatedAt: string }[] = [];

  // -- failure injection -------------------------------------------------------
  private failures = new Map<string, QueuedFailure>();

  constructor() {
    this.registerDefaults();
  }

  // -- setup helpers -----------------------------------------------------------

  registerDefaults(): void {
    [techCreator, ...fixtureCreators.filter(c => c.id !== techCreator.id)].forEach(creator => {
      creator.channels.forEach((channel: Channel) => {
        this.registerChannelVideos(creator, channel.id);
      });
    });
  }

  registerChannelVideos(creator: Creator, channelId: string, count = 26): void {
    const videos = makeVideosForChannel(creator, channelId, count);
    this.videosByChannel.set(channelId, videos);
    videos.forEach(video => this.videosById.set(video.id, video));
  }

  seedProgress(video: Video, progress: number): void {
    this.progress.set(video.id, progress);
    this.seedHistoryEntry(video, progress);
  }

  seedHistoryEntry(video: Video, progress: number, updatedAt = '2026-01-15T12:00:00.000Z'): void {
    const existing = this.history.find(entry => entry.video.id === video.id);
    if (existing) {
      existing.progress = progress;
      existing.updatedAt = updatedAt;
    } else {
      this.history.push({ video, progress, updatedAt });
    }
  }

  /** Approve the pending device login; the next token poll returns tokens. */
  approveDeviceLogin(): void {
    if (this.currentDeviceAuth) this.currentDeviceAuth.approved = true;
  }

  /** Queue `count` failures (default: one) for matching requests. */
  failRequests(method: string, path: string, response: MockFetchResponseShape, count = 1): void {
    this.failures.set(`${method.toUpperCase()} ${path}`, { remaining: count, response });
  }

  requestsTo(pathSubstring: string, method?: string): RecordedRequest[] {
    return this.requests.filter(
      req => req.path.includes(pathSubstring) && (!method || req.method === method.toUpperCase()),
    );
  }

  reset(): void {
    this.requests = [];
    this.accessToken = 'eyJhbGciOiJIUzI1NiJ9.mock-access-token';
    this.refreshToken = 'mock-refresh-token';
    this.rejectedTokens.clear();
    this.refreshFails = false;
    this.refreshCount = 0;
    this.deviceAuthCalls = 0;
    this.deviceExpiresInSeconds = 600;
    this.deviceTokenError = null;
    this.deviceAuthFailure = null;
    this.currentDeviceAuth = null;
    this.subscriptions = fixtureSubscriptions;
    this.creators = fixtureCreators;
    this.videosByChannel.clear();
    this.videosById.clear();
    this.deniedDeliveryGuids.clear();
    this.liveNow = false;
    this.historyPageSize = 20;
    this.progress.clear();
    this.history = [];
    this.failures.clear();
    this.registerDefaults();
  }

  // -- fetch entry point ---------------------------------------------------------

  handleFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers: Record<string, string> = {};
    Object.entries(init?.headers ?? {}).forEach(([key, value]) => {
      headers[key.toLowerCase()] = String(value);
    });
    const body = typeof init?.body === 'string' ? init.body : null;
    const parsedUrl = new URL(url);
    const bearer = headers.authorization?.startsWith('Bearer ') ? headers.authorization.slice('Bearer '.length) : null;

    this.requests.push({
      method,
      url,
      path: parsedUrl.pathname,
      params: parsedUrl.searchParams,
      body,
      bearer,
      seq: this.requests.length,
    });

    const queued = this.consumeQueuedFailure(method, parsedUrl.pathname);
    if (queued) return asResponse(queued);

    if (parsedUrl.pathname === DEVICE_AUTH_PATH) return this.handleDeviceAuth();
    if (parsedUrl.pathname === TOKEN_PATH) return this.handleTokenGrant(body ?? '');

    if (parsedUrl.pathname.startsWith('/api/v3')) {
      const unauthorized = await this.checkAuthorized(bearer);
      if (unauthorized) return unauthorized;
      return this.handleApiV3(parsedUrl, method, body);
    }

    return asResponse({ status: 404, body: { message: `No mock for ${method} ${parsedUrl.pathname}` } });
  };

  private consumeQueuedFailure(method: string, path: string): MockFetchResponseShape | null {
    const key = `${method} ${path}`;
    const queued = this.failures.get(key);
    if (!queued) return null;
    queued.remaining -= 1;
    if (queued.remaining <= 0) this.failures.delete(key);
    return queued.response;
  }

  private async checkAuthorized(bearer: string | null): Promise<Response | null> {
    if (bearer && this.rejectedTokens.has(bearer)) {
      return asResponse({ status: 401, body: { message: 'Unauthorized' } });
    }
    return null;
  }

  // -- OIDC endpoints ----------------------------------------------------------

  private handleDeviceAuth(): Response {
    this.deviceAuthCalls += 1;
    if (this.deviceAuthFailure) return asResponse(this.deviceAuthFailure);
    const n = this.deviceAuthCalls;
    const userCode = `FPQD-1${String(n).padStart(3, '0')}`;
    this.currentDeviceAuth = { deviceCode: `device-code-${n}`, userCode, approved: false };
    return asResponse({
      status: 200,
      body: {
        device_code: this.currentDeviceAuth.deviceCode,
        user_code: userCode,
        verification_uri: 'https://www.floatplane.com/link',
        verification_uri_complete: `https://www.floatplane.com/link?code=${userCode}`,
        expires_in: this.deviceExpiresInSeconds,
        interval: 1,
      },
    });
  }

  private handleTokenGrant(rawBody: string): Response {
    const params = new URLSearchParams(rawBody);
    const grantType = params.get('grant_type');

    if (grantType === 'urn:ietf:params:oauth:grant-type:device_code') {
      if (!this.currentDeviceAuth) {
        return asResponse({ status: 400, body: { error: 'invalid_request' } });
      }
      if (this.deviceTokenError) {
        const error = this.deviceTokenError;
        this.deviceTokenError = null;
        return asResponse({ status: 400, body: { error } });
      }
      if (!this.currentDeviceAuth.approved) {
        return asResponse({ status: 400, body: { error: 'authorization_pending' } });
      }
      return asResponse({
        status: 200,
        body: {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_in: 3600,
          token_type: 'Bearer',
        },
      });
    }

    if (grantType === 'refresh_token') {
      if (this.refreshFails) {
        return asResponse({ status: 400, body: { error: 'invalid_grant', error_description: 'Token expired' } });
      }
      this.refreshCount += 1;
      this.accessToken = `eyJhbGciOiJIUzI1NiJ9.mock-access-token-refreshed-${this.refreshCount}`;
      return asResponse({
        status: 200,
        body: {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_in: 3600,
          token_type: 'Bearer',
        },
      });
    }

    return asResponse({ status: 400, body: { error: 'unsupported_grant_type' } });
  }

  // -- Floatplane API ---------------------------------------------------------------

  private handleApiV3(url: URL, method: string, rawBody: string | null): Response {
    const { pathname } = url;
    const params = url.searchParams;
    const route = `${method} ${pathname}`;

    switch (route) {
      case 'GET /api/v3/status':
        return this.handleStatus();
      case 'GET /api/v3/user/subscriptions':
        return this.handleSubscriptions();
      case 'GET /api/v3/creator/list':
        return this.handleCreatorList(params);
      case 'GET /api/v3/content/creator':
        return this.handleContentCreator(params);
      case 'GET /api/v3/content/post':
        return this.handleContentPost(params);
      case 'GET /api/v3/delivery/info':
        return this.handleDeliveryInfo(params);
      case 'GET /api/v3/content/progress':
        return this.handleGetProgress(params);
      case 'POST /api/v3/content/progress':
        return this.handlePostProgress(rawBody);
      case 'GET /api/v3/content/history':
        return this.handleHistory(params);
      case 'GET /api/v3/content/related':
        return this.handleRelated(params);
      default:
        return asResponse({ status: 404, body: { message: `No mock handler for ${route}` } });
    }
  }

  private handleStatus(): Response {
    return asResponse({
      status: 200,
      body: { selfUser: fixtureUser, selfCreator: null, serviceMessages: [], serviceDenied: null },
    });
  }

  private handleSubscriptions(): Response {
    return asResponse({ status: 200, body: this.subscriptions });
  }

  private handleCreatorList(params: URLSearchParams): Response {
    const ids = this.parseIdParams(params);
    const ordered = ids.map(id => this.creators.find(creator => creator.id === id)).filter(Boolean);
    return asResponse({ status: 200, body: ordered });
  }

  private handleContentCreator(params: URLSearchParams): Response {
    const channelId = params.get('channel');
    const limit = Number(params.get('limit') ?? 10);
    const fetchAfter = Number(params.get('fetchAfter') ?? 0);
    const sort = params.get('sort') ?? 'DESC';
    const all = this.videosByChannel.get(channelId ?? '') ?? [];
    const ordered = sort === 'ASC' ? [...all].reverse() : all;
    return asResponse({ status: 200, body: ordered.slice(fetchAfter, fetchAfter + limit) });
  }

  private handleContentPost(params: URLSearchParams): Response {
    const video = this.videosById.get(params.get('id') ?? '');
    if (!video) return asResponse({ status: 404, body: { message: 'Post not found' } });
    return asResponse({ status: 200, body: this.buildPost(video) });
  }

  private handleGetProgress(params: URLSearchParams): Response {
    const ids = this.parseIdParams(params);
    const body = ids
      .filter(id => (this.progress.get(id) ?? 0) > 0)
      .map(id => ({ id, progress: this.progress.get(id) ?? 0 }));
    return asResponse({ status: 200, body });
  }

  private handlePostProgress(rawBody: string | null): Response {
    const payload = JSON.parse(rawBody ?? '{}') as { id: string; progress: number };
    this.progress.set(payload.id, payload.progress);
    const video = this.videosById.get(payload.id);
    if (video) this.seedHistoryEntry(video, payload.progress, new Date().toISOString());
    return asResponse({ status: 200, body: { message: 'ok' } });
  }

  private handleHistory(params: URLSearchParams): Response {
    const offset = Number(params.get('offset') ?? 0);
    const ordered = [...this.history].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const page = ordered.slice(offset, offset + this.historyPageSize).map(entry => ({
      ...makeHistoryEntry(entry.video, entry.progress),
      updatedAt: entry.updatedAt,
    }));
    return asResponse({ status: 200, body: page });
  }

  private handleRelated(params: URLSearchParams): Response {
    const video = this.videosById.get(params.get('id') ?? '');
    if (!video) return asResponse({ status: 404, body: { message: 'Not found' } });
    const related = (this.videosByChannel.get(video.channel.id) ?? []).filter(v => v.id !== video.id).slice(0, 3);
    return asResponse({ status: 200, body: related });
  }

  private parseIdParams(params: URLSearchParams): string[] {
    const ids: string[] = [];
    params.forEach((value, key) => {
      const match = /^ids\[(\d+)\]$/.exec(key);
      if (match) ids[Number(match[1])] = value;
    });
    return ids;
  }

  private buildPost(video: Video) {
    return makeVideoPost(video, this.progress.get(video.id) ?? 0);
  }

  private handleDeliveryInfo(params: URLSearchParams): Response {
    const entityId = params.get('entityId') ?? '';
    const isLive = params.get('entityKind') === 'livestream';

    if (isLive) {
      if (this.liveNow && entityId === LIVESTREAM_ID) {
        return asResponse({ status: 200, body: makeLiveVideoDelivery() });
      }
      return asResponse({ status: 404, body: { message: 'Not Found' } });
    }

    if (this.deniedDeliveryGuids.has(entityId)) {
      return asResponse({ status: 200, body: makeDeniedVideoDelivery(entityId) });
    }

    return asResponse({ status: 200, body: makeVideoDelivery(entityId) });
  }
}

export const api = new FloatplaneApiMock();

/**
 * Route every fetch the app makes through this instance.
 *
 * Defined as non-configurable on purpose: when the app first loads, expo's
 * winter runtime calls `installGlobal('fetch', …)` to replace the global with
 * its native fetch — installGlobal refuses to clobber non-configurable
 * descriptors, which keeps the mock in charge. `writable: true` still allows
 * each per-test module reset (see helpers/runtime.ts) to rebind the fresh
 * instance with a plain assignment.
 */
Object.defineProperty(globalThis, 'fetch', {
  value: (input: RequestInfo | URL, init?: RequestInit) => api.handleFetch(input, init),
  writable: true,
  enumerable: true,
  configurable: false,
});
