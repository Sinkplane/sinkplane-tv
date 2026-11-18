export interface MockFetchResponseShape {
  status: number;
  body: unknown;
}

export class MockFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  private readonly jsonBody: unknown;
  private readonly textBody: string;

  constructor(shape: MockFetchResponseShape) {
    this.ok = shape.status >= 200 && shape.status < 300;
    this.status = shape.status;
    this.jsonBody = shape.body;
    this.textBody = typeof shape.body === 'string' ? shape.body : JSON.stringify(shape.body);
  }

  get headers(): { get: () => string } {
    return { get: () => 'application/json' };
  }

  json(): Promise<unknown> {
    return Promise.resolve(this.jsonBody);
  }

  text(): Promise<string> {
    return Promise.resolve(this.textBody);
  }
}

export const respond = (status: number, body: unknown): MockFetchResponse =>
  new MockFetchResponse({ status, body });

const toSnakeCase = (key: string): string =>
  key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export const oauthBody = (fields: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(fields).map(([key, value]) => [toSnakeCase(key), value]));
