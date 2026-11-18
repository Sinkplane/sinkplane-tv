import {
  MockFetchResponse,
  type MockFetchResponseShape,
  oauthBody,
  respond,
} from './mock-api-response';

export const DEVICE_AUTH_PATH = '/realms/floatplane/protocol/openid-connect/auth/device';
export const TOKEN_PATH = '/realms/floatplane/protocol/openid-connect/token';

const DEFAULT_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.mock-access-token';
const DEFAULT_REFRESH_TOKEN = 'mock-refresh-token';
const DEFAULT_DEVICE_EXPIRES_IN_SECONDS = 600;
const TOKEN_LIFETIME_SECONDS = 3600;
const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

export type DeviceTokenError = 'authorization_pending' | 'expired_token' | 'access_denied';

export interface DeviceAuthState {
  deviceCode: string;
  userCode: string;
  approved: boolean;
}

export class OidcApiMock {
  accessToken = DEFAULT_ACCESS_TOKEN;
  refreshToken = DEFAULT_REFRESH_TOKEN;
  rejectedTokens = new Set<string>();
  refreshFails = false;
  refreshCount = 0;
  deviceAuthCalls = 0;
  deviceExpiresInSeconds = DEFAULT_DEVICE_EXPIRES_IN_SECONDS;
  deviceTokenError: DeviceTokenError | null = null;
  deviceAuthFailure: MockFetchResponseShape | null = null;
  currentDeviceAuth: DeviceAuthState | null = null;

  approveDeviceLogin(): void {
    if (this.currentDeviceAuth) {
      this.currentDeviceAuth.approved = true;
    }
  }

  protected resetAuth(): void {
    this.accessToken = DEFAULT_ACCESS_TOKEN;
    this.refreshToken = DEFAULT_REFRESH_TOKEN;
    this.rejectedTokens.clear();
    this.refreshFails = false;
    this.refreshCount = 0;
    this.deviceAuthCalls = 0;
    this.deviceExpiresInSeconds = DEFAULT_DEVICE_EXPIRES_IN_SECONDS;
    this.deviceTokenError = null;
    this.deviceAuthFailure = null;
    this.currentDeviceAuth = null;
  }

  protected isRejectedBearer(bearer: string | null): boolean {
    return bearer !== null && this.rejectedTokens.has(bearer);
  }

  protected handleDeviceAuth(): MockFetchResponse {
    this.deviceAuthCalls += 1;
    if (this.deviceAuthFailure) {
      return new MockFetchResponse(this.deviceAuthFailure);
    }
    const userCode = `FPQD-1${String(this.deviceAuthCalls).padStart(3, '0')}`;
    const deviceCode = `device-code-${String(this.deviceAuthCalls)}`;
    this.currentDeviceAuth = { deviceCode, userCode, approved: false };
    return respond(
      200,
      oauthBody({
        deviceCode,
        userCode,
        verificationUri: 'https://www.floatplane.com/link',
        verificationUriComplete: `https://www.floatplane.com/link?code=${userCode}`,
        expiresIn: this.deviceExpiresInSeconds,
        interval: 1,
      }),
    );
  }

  protected handleTokenGrant(rawBody: string): MockFetchResponse {
    const grantType = new URLSearchParams(rawBody).get('grant_type');
    if (grantType === DEVICE_CODE_GRANT) {
      return this.handleDeviceCodeGrant();
    }
    if (grantType === 'refresh_token') {
      return this.handleRefreshGrant();
    }
    return respond(400, { error: 'unsupported_grant_type' });
  }

  private handleDeviceCodeGrant(): MockFetchResponse {
    if (!this.currentDeviceAuth) {
      return respond(400, { error: 'invalid_request' });
    }
    if (this.deviceTokenError) {
      const error = this.deviceTokenError;
      this.deviceTokenError = null;
      return respond(400, { error });
    }
    if (!this.currentDeviceAuth.approved) {
      return respond(400, { error: 'authorization_pending' });
    }
    return this.tokenResponse();
  }

  private handleRefreshGrant(): MockFetchResponse {
    if (this.refreshFails) {
      return respond(400, oauthBody({ error: 'invalid_grant', errorDescription: 'Token expired' }));
    }
    this.refreshCount += 1;
    this.accessToken = `${DEFAULT_ACCESS_TOKEN}-refreshed-${String(this.refreshCount)}`;
    return this.tokenResponse();
  }

  private tokenResponse(): MockFetchResponse {
    return respond(
      200,
      oauthBody({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiresIn: TOKEN_LIFETIME_SECONDS,
        tokenType: 'Bearer',
      }),
    );
  }
}
