interface UseHeadersOptions {
  token?: string;
  tokenExpiration?: string;
  additionalHeaders?: Record<string, string>;
}

export const useHeaders = ({ token, tokenExpiration, additionalHeaders }: UseHeadersOptions = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    // Construct full cookie with expiration
    let cookieValue = `sails.sid=${token}`;

    if (tokenExpiration) {
      cookieValue += `; Expires=${tokenExpiration}`;
    }

    // Add domain and path for proper cookie handling
    cookieValue += '; Domain=.floatplane.com; Path=/';

    headers.Cookie = cookieValue;
  }

  return headers;
};

export const getHeaders = useHeaders;
