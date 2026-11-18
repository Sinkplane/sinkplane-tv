import { updateVideoProgress } from '@sinkplane/shared';

import {
  FORCED_SAVE_SECONDS,
  hasToken,
  PERIODIC_SAVE_SECONDS,
  PlayerSession,
  ProgressTracker,
  saveFinalProgress,
} from '@/hooks/progress-tracker';

jest.mock('@sinkplane/shared', () => ({ updateVideoProgress: jest.fn() }));

const savedProgress = jest.mocked(updateVideoProgress);
const owner = { id: 'video-1', token: 'token' };

const flushPromises = async (): Promise<void> => {
  await Promise.resolve();
};

describe('ProgressTracker', () => {
  it('is due periodically after enough playback and on force after a short gap', () => {
    const tracker = new ProgressTracker(100);
    tracker.record(100 + FORCED_SAVE_SECONDS + 0.5, owner);
    expect(tracker.dueProgress(false)).toBeUndefined();
    expect(tracker.dueProgress(true)).toBe(100 + FORCED_SAVE_SECONDS);

    tracker.record(100 + PERIODIC_SAVE_SECONDS, owner);
    expect(tracker.dueProgress(false)).toBe(100 + PERIODIC_SAVE_SECONDS);
    tracker.markSaved(100 + PERIODIC_SAVE_SECONDS);
    expect(tracker.dueProgress(true)).toBeUndefined();
  });

  it('never reports the very start of a video', () => {
    const tracker = new ProgressTracker(30);
    tracker.record(0.4, owner);
    expect(tracker.dueProgress(true)).toBeUndefined();
  });

  it('claims the resume seek once and forgets progress on restart', () => {
    const tracker = new ProgressTracker(40);
    expect(tracker.claimResumeSeek()).toBe(true);
    expect(tracker.claimResumeSeek()).toBe(false);
    tracker.restart();
    tracker.record(PERIODIC_SAVE_SECONDS, owner);
    expect(tracker.dueProgress(false)).toBe(PERIODIC_SAVE_SECONDS);
  });
});

describe('hasToken', () => {
  it.each([
    [undefined, false],
    ['', false],
    ['token', true],
  ])('%j is a usable token: %j', (token, expected) => {
    expect(hasToken(token)).toBe(expected);
  });
});

describe('saveFinalProgress', () => {
  beforeEach(() => {
    savedProgress.mockResolvedValue(undefined);
  });

  it('saves unsaved progress for the last owner', () => {
    const tracker = new ProgressTracker(0);
    tracker.record(42.7, owner);
    saveFinalProgress(tracker);
    expect(savedProgress).toHaveBeenCalledWith('token', { id: 'video-1', progress: 42 });
  });

  it('skips when nothing played, nothing changed, or there is no token', () => {
    const unplayed = new ProgressTracker(10);
    saveFinalProgress(unplayed);

    const signedOut = new ProgressTracker(0);
    signedOut.record(60, { id: 'video-1', token: undefined });
    saveFinalProgress(signedOut);

    const unchanged = new ProgressTracker(60);
    unchanged.record(61, owner);
    saveFinalProgress(unchanged);

    expect(savedProgress).not.toHaveBeenCalled();
  });

  it('ignores a failed final save', async () => {
    savedProgress.mockRejectedValue(new Error('offline'));
    const tracker = new ProgressTracker(0);
    tracker.record(42, owner);
    saveFinalProgress(tracker);
    await flushPromises();
    expect(savedProgress).toHaveBeenCalledTimes(1);
  });
});

describe('PlayerSession', () => {
  const player = (): { seek: jest.Mock<undefined, [number]> } => ({
    seek: jest.fn<undefined, [number]>(),
  });

  it('seeks to the resume point once the native player is attached', () => {
    const session = new PlayerSession(90);
    session.seekToResumePoint(90);
    const video = player();
    session.attachVideo(video);
    session.seekToResumePoint(0);
    session.seekToResumePoint(90);
    session.seekToResumePoint(90);
    expect(video.seek.mock.calls).toEqual([[90]]);
  });

  it('replays from the start only while a player is attached', () => {
    const session = new PlayerSession(0);
    session.replay();
    const video = player();
    session.attachVideo(video);
    session.replay();
    expect(video.seek.mock.calls).toEqual([[0]]);
  });

  it('saves the final progress when the container detaches', () => {
    const session = new PlayerSession(0);
    expect(session.saveOnDetach(null)).toBeUndefined();
    const detach = session.saveOnDetach({});
    session.tracker.record(75, owner);
    detach?.();
    expect(savedProgress).toHaveBeenCalledWith('token', { id: 'video-1', progress: 75 });
  });
});
