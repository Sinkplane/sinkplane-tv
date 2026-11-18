import { useState } from 'react';
import type { OnPlaybackStateChangedData, OnProgressData } from 'react-native-video';
import { useUpdateVideoProgress } from '@sinkplane/shared';

import { hasToken, PlayerSession, type Seekable } from '@/hooks/progress-tracker';

const RESUME_TOLERANCE_SECONDS = 1;

export interface VideoProgressOptions {
  readonly id: string;
  readonly token: string | undefined;
  readonly initialSeek: number;
  readonly paused: boolean;
}

interface ProgressHandlers {
  readonly onProgress: (data: Pick<OnProgressData, 'currentTime'>) => void;
  readonly onPlaybackStateChanged: (data: Pick<OnPlaybackStateChangedData, 'isPlaying'>) => void;
}

export interface VideoProgress extends ProgressHandlers {
  readonly attachVideo: (video: Seekable | null) => void;
  readonly attachContainer: (node: object | null) => (() => void) | undefined;
  readonly isInitialSeeking: boolean;
  readonly seekToResumePoint: () => void;
  readonly replay: () => void;
}

interface ProgressHandlerOptions extends VideoProgressOptions {
  readonly session: PlayerSession;
  readonly isInitialSeeking: boolean;
  readonly onResumed: () => void;
}

const useProgressHandlers = (options: ProgressHandlerOptions): ProgressHandlers => {
  const { id, token, initialSeek, paused, session, isInitialSeeking, onResumed } = options;
  const { tracker } = session;
  const { mutate: saveProgress } = useUpdateVideoProgress(token);

  const save = (force: boolean): void => {
    const progress = tracker.dueProgress(force);
    if (hasToken(token) && progress !== undefined) {
      saveProgress({ id, progress });
      tracker.markSaved(progress);
    }
  };

  return {
    onProgress: ({ currentTime }) => {
      tracker.record(currentTime, { id, token });
      if (isInitialSeeking && currentTime >= initialSeek - RESUME_TOLERANCE_SECONDS) {
        onResumed();
      }
      if (!isInitialSeeking && !paused) {
        save(false);
      }
    },
    onPlaybackStateChanged: ({ isPlaying }) => {
      if (!isPlaying && !isInitialSeeking) {
        save(true);
      }
    },
  };
};

export const useVideoProgress = (options: VideoProgressOptions): VideoProgress => {
  const { initialSeek } = options;
  const [session] = useState(() => new PlayerSession(initialSeek));
  const [isInitialSeeking, setIsInitialSeeking] = useState(initialSeek > 0);
  const handlers = useProgressHandlers({
    ...options,
    session,
    isInitialSeeking,
    onResumed: () => {
      setIsInitialSeeking(false);
    },
  });

  return {
    ...handlers,
    attachVideo: session.attachVideo,
    attachContainer: session.saveOnDetach,
    isInitialSeeking,
    seekToResumePoint: () => {
      session.seekToResumePoint(initialSeek);
    },
    replay: () => {
      session.replay();
    },
  };
};
