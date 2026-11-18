import { updateVideoProgress } from '@sinkplane/shared';

export const PERIODIC_SAVE_SECONDS = 15;
export const FORCED_SAVE_SECONDS = 2;

export interface ProgressOwner {
  readonly id: string;
  readonly token: string | undefined;
}

export class ProgressTracker {
  private currentTime: number;
  private lastSaved: number;
  private resumeSeekClaimed = false;
  private owner: ProgressOwner | undefined;

  constructor(startTime: number) {
    this.currentTime = startTime;
    this.lastSaved = startTime;
  }

  record(currentTime: number, owner: ProgressOwner): void {
    this.currentTime = currentTime;
    this.owner = owner;
  }

  dueProgress(force: boolean): number | undefined {
    const progress = Math.floor(this.currentTime);
    const threshold = force ? FORCED_SAVE_SECONDS : PERIODIC_SAVE_SECONDS;
    const due = progress > 0 && Math.abs(progress - this.lastSaved) >= threshold;
    return due ? progress : undefined;
  }

  markSaved(progress: number): void {
    this.lastSaved = progress;
  }

  restart(): void {
    this.currentTime = 0;
    this.lastSaved = 0;
  }

  claimResumeSeek(): boolean {
    const claimed = !this.resumeSeekClaimed;
    this.resumeSeekClaimed = true;
    return claimed;
  }

  lastOwner(): ProgressOwner | undefined {
    return this.owner;
  }
}

export const hasToken = (token: string | undefined): token is string =>
  token !== undefined && token !== '';

export const saveFinalProgress = (tracker: ProgressTracker): void => {
  const owner = tracker.lastOwner();
  const progress = tracker.dueProgress(true);
  if (owner === undefined || !hasToken(owner.token) || progress === undefined) {
    return;
  }
  updateVideoProgress(owner.token, { id: owner.id, progress }).catch(() => undefined);
};

export interface Seekable {
  seek: (time: number) => void;
}

export class PlayerSession {
  readonly tracker: ProgressTracker;
  private video: Seekable | null = null;

  constructor(initialSeek: number) {
    this.tracker = new ProgressTracker(initialSeek);
  }

  readonly attachVideo = (video: Seekable | null): void => {
    this.video = video;
  };

  readonly saveOnDetach = (node: object | null): (() => void) | undefined => {
    if (node === null) {
      return undefined;
    }
    return () => {
      saveFinalProgress(this.tracker);
    };
  };

  seekToResumePoint(target: number): void {
    if (target > 0 && this.video !== null && this.tracker.claimResumeSeek()) {
      this.video.seek(target);
    }
  }

  replay(): void {
    if (this.video !== null) {
      this.video.seek(0);
      this.tracker.restart();
    }
  }
}
