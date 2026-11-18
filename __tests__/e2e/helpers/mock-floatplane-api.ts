import { ContentApiMock } from './mock-api-content';
import { DEVICE_AUTH_PATH, TOKEN_PATH } from './mock-api-oidc';
import { MockFetchResponse, type MockFetchResponseShape, respond } from './mock-api-response';

export type { MockFetchResponseShape } from './mock-api-response';
export type { DeviceAuthState, DeviceTokenError } from './mock-api-oidc';
export type { HistoryRecord } from './mock-api-content';

const BEARER_PREFIX = 'Bearer ';

export interface RecordedRequest {
  method: string;
  url: string;
  path: string;
  params: URLSearchParams;
  body: string | null;
  bearer: string | null;
  seq: number;
}

interface QueuedFailure {
  remaining: number;
  response: MockFetchResponseShape;
}

type FailureSpec = [response: MockFetchResponseShape, count?: number];

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

const lowerCaseHeaders = (headers: HeadersInit | undefined): Record<string, string> =>
  Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );

const bearerToken = (authorization: string | undefined): string | null =>
  authorization?.startsWith(BEARER_PREFIX) === true
    ? authorization.slice(BEARER_PREFIX.length)
    : null;

export class FloatplaneApiMock extends ContentApiMock {
  requests: RecordedRequest[] = [];
  private readonly failures = new Map<string, QueuedFailure>();

  failRequests(method: string, path: string, ...failure: FailureSpec): void {
    const [response, count = 1] = failure;
    this.failures.set(`${method.toUpperCase()} ${path}`, { remaining: count, response });
  }

  requestsTo(pathSubstring: string, method?: string): RecordedRequest[] {
    const wantedMethod = method?.toUpperCase();
    return this.requests.filter(
      (req) =>
        req.path.includes(pathSubstring) &&
        (wantedMethod === undefined || req.method === wantedMethod),
    );
  }

  reset(): void {
    this.requests = [];
    this.failures.clear();
    this.resetAuth();
    this.resetCatalog();
  }

  handleFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<MockFetchResponse> =>
    Promise.resolve(this.route(this.recordRequest(input, init)));

  private recordRequest(input: RequestInfo | URL, init?: RequestInit): RecordedRequest {
    const url = requestUrl(input);
    const parsedUrl = new URL(url);
    const request: RecordedRequest = {
      method: (init?.method ?? 'GET').toUpperCase(),
      url,
      path: parsedUrl.pathname,
      params: parsedUrl.searchParams,
      body: typeof init?.body === 'string' ? init.body : null,
      bearer: bearerToken(lowerCaseHeaders(init?.headers)['authorization']),
      seq: this.requests.length,
    };
    this.requests.push(request);
    return request;
  }

  private route(request: RecordedRequest): MockFetchResponse {
    const queued = this.consumeQueuedFailure(request.method, request.path);
    if (queued) {
      return new MockFetchResponse(queued);
    }
    if (request.path === DEVICE_AUTH_PATH) {
      return this.handleDeviceAuth();
    }
    if (request.path === TOKEN_PATH) {
      return this.handleTokenGrant(request.body ?? '');
    }
    if (request.path.startsWith('/api/v3')) {
      return this.routeApiV3(request);
    }
    return respond(404, { message: `No mock for ${request.method} ${request.path}` });
  }

  private routeApiV3(request: RecordedRequest): MockFetchResponse {
    if (this.isRejectedBearer(request.bearer)) {
      return respond(401, { message: 'Unauthorized' });
    }
    return this.handleApiV3(new URL(request.url), request.method, request.body);
  }

  private consumeQueuedFailure(method: string, path: string): MockFetchResponseShape | null {
    const key = `${method} ${path}`;
    const queued = this.failures.get(key);
    if (!queued) {
      return null;
    }
    queued.remaining -= 1;
    if (queued.remaining <= 0) {
      this.failures.delete(key);
    }
    return queued.response;
  }
}

export const api = new FloatplaneApiMock();

function installNonConfigurableFetchSoExpoRuntimeCannotReplaceIt(): void {
  Object.defineProperty(globalThis, 'fetch', {
    value: (input: RequestInfo | URL, init?: RequestInit) => api.handleFetch(input, init),
    writable: true,
    enumerable: true,
    configurable: false,
  });
}

installNonConfigurableFetchSoExpoRuntimeCannotReplaceIt();
