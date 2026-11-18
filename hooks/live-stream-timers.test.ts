import {
  createLiveStreamTimers,
  LIVE_POLL_INTERVAL_MS,
  LIVE_RETRY_DELAY_MS,
} from './live-stream-timers';

describe('createLiveStreamTimers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('polls every interval while focused and stops when blurred', () => {
    const refetch = jest.fn();
    const timers = createLiveStreamTimers(refetch);

    const blur = timers.whileFocused();
    jest.advanceTimersByTime(LIVE_POLL_INTERVAL_MS * 2);
    expect(refetch).toHaveBeenCalledTimes(2);

    blur();
    jest.advanceTimersByTime(LIVE_POLL_INTERVAL_MS * 2);
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('retries once after the delay while focused, collapsing repeated errors', () => {
    const refetch = jest.fn();
    const timers = createLiveStreamTimers(refetch);
    timers.whileFocused();

    timers.retrySoon();
    timers.retrySoon();
    jest.advanceTimersByTime(LIVE_RETRY_DELAY_MS);

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not retry when the screen is not focused', () => {
    const refetch = jest.fn();
    const timers = createLiveStreamTimers(refetch);

    timers.retrySoon();
    jest.advanceTimersByTime(LIVE_RETRY_DELAY_MS);

    expect(refetch).not.toHaveBeenCalled();
  });

  it('cancels a pending retry when blurred', () => {
    const refetch = jest.fn();
    const timers = createLiveStreamTimers(refetch);
    const blur = timers.whileFocused();

    timers.retrySoon();
    blur();
    jest.advanceTimersByTime(LIVE_RETRY_DELAY_MS);

    expect(refetch).not.toHaveBeenCalled();
  });
});
