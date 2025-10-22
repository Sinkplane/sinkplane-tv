// types/captcha.types.ts
export interface CaptchaInfo {
  siteKey: string;
  // Add other properties that might be returned by the API
}

export interface TurnstileMessage {
  event: 'mount' | 'success' | 'error' | 'expire' | 'timeout';
  token?: string;
}

export interface TurnstileWebViewProps {
  siteKey: string;
  theme?: 'light' | 'dark' | 'auto';
  // eslint-disable-next-line no-unused-vars
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onTimeout?: () => void;
}
