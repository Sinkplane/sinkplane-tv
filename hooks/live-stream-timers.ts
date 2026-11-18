export const LIVE_POLL_INTERVAL_MS = 60_000;
export const LIVE_RETRY_DELAY_MS = 5000;

export interface LiveStreamTimers {
  readonly whileFocused: () => () => void;
  readonly retrySoon: () => void;
}

export function createLiveStreamTimers(refetch: () => void): LiveStreamTimers {
  let focused = false;
  let poll: ReturnType<typeof setInterval> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;

  const blur = (): void => {
    focused = false;
    clearInterval(poll);
    clearTimeout(retry);
  };

  const retryIfFocused = (): void => {
    if (focused) {
      refetch();
    }
  };

  return {
    whileFocused: () => {
      focused = true;
      poll = setInterval(refetch, LIVE_POLL_INTERVAL_MS);
      return blur;
    },
    retrySoon: () => {
      clearTimeout(retry);
      retry = setTimeout(retryIfFocused, LIVE_RETRY_DELAY_MS);
    },
  };
}
