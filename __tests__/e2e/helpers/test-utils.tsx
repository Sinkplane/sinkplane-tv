/**
 * Shared helpers for driving the app under test.
 */

import { act, renderRouter } from 'expo-router/testing-library';

// Re-exported so tests always use the exact instance renderRouter binds to
// (Jest can load the same file under two module ids; going through one import
// chain avoids querying a screen that was never bound).
export { screen, fireEvent, testRouter } from 'expo-router/testing-library';

import { api } from './mock-floatplane-api';
import { mockSecureStore, mockVideoState, MockVideoProps } from './native-mocks';

import { fixtureUser } from './fixtures';

type RenderRouterResult = ReturnType<typeof renderRouter>;

/**
 * Boot the real app (app/** routes, providers, screens) at `initialUrl`.
 * The native tab layout is swapped for the pure-JS web one (see native-mocks),
 * everything else is the production code path.
 *
 * expo-router's renderRouter does not await @testing-library/react-native's
 * async render; the still-pending act scope would swallow every later state
 * update ("overlapping act" calls). Awaiting the returned render result here
 * settles it before the test drives the app.
 */
export async function renderApp(initialUrl = '/'): Promise<RenderRouterResult> {
  const result = renderRouter('./app', { initialUrl });
  await result;
  return result;
}

export interface SeedSessionOptions {
  token?: string;
  refreshToken?: string;
  /** Token expiration ISO string. Defaults to one hour from "now". */
  tokenExpiration?: string;
}

/**
 * Seed the secure store exactly the way a previous sign-in left it,
 * i.e. simulate launching the TV app while already authenticated.
 *
 * Note: useStorageState JSON-stringifies whatever it is handed, and the auth
 * context hands it pre-stringified JSON for `fpuser` — so the user needs to be
 * double-stringified here to match what a real session looks like on disk.
 */
export function seedSession(options: SeedSessionOptions = {}): void {
  const token = options.token ?? api.accessToken;
  const expiration =
    options.tokenExpiration ?? new Date(Date.now() + 60 * 60 * 1000).toISOString();
  mockSecureStore.items.set('fptoken', JSON.stringify(token));
  mockSecureStore.items.set('fpuser', JSON.stringify(JSON.stringify(fixtureUser)));
  mockSecureStore.items.set('fptokenExpiration', JSON.stringify(expiration));
  if (options.refreshToken !== undefined) {
    mockSecureStore.items.set('fprefreshToken', JSON.stringify(options.refreshToken));
  }
}

/** Advance the (fake) clock and let React + queries settle. */
export async function advanceTime(ms: number): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

/**
 * Deterministic replacement for RNTL's `waitFor` under fake timers.
 *
 * `renderRouter` enables Jest modern fake timers and pins the system clock,
 * which conflicts with waitFor's internal timeout accounting. This poller
 * instead flushes microtasks, asserts, and steps the fake clock by `stepMs`
 * until the assertion passes (or the fake-time budget is exhausted).
 */
export async function until(
  assertion: () => void,
  options: { maxFakeMs?: number; stepMs?: number } = {},
): Promise<void> {
  const { maxFakeMs = 5000, stepMs = 50 } = options;
  let waited = 0;
  for (;;) {
    try {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(0);
      });
      assertion();
      return;
    } catch (error) {
      if (waited >= maxFakeMs) throw error;
      await advanceTime(stepMs);
      waited += stepMs;
    }
  }
}

// ---------------------------------------------------------------------------
// Video player driver
// ---------------------------------------------------------------------------

const videoProps = (): MockVideoProps => {
  if (!mockVideoState.props) throw new Error('Native video player has not mounted yet');
  return mockVideoState.props;
};

export const videoDriver = {
  mounted: () => mockVideoState.mountCount > 0,
  props: videoProps,
  seeks: () => [...mockVideoState.seeks],

  async fireLoad(duration = 1200): Promise<void> {
    const props = videoProps();
    await act(async () => {
      props.onLoad?.({ duration, currentTime: 0 });
    });
  },

  async fireReadyForDisplay(): Promise<void> {
    const props = videoProps();
    await act(async () => {
      props.onReadyForDisplay?.();
    });
  },

  async fireProgress(currentTime: number): Promise<void> {
    const props = videoProps();
    await act(async () => {
      props.onProgress?.({ currentTime, playableDuration: currentTime + 10 });
    });
  },

  /** Simulate the user scrubbing with the native controls. */
  async fireSeek(time: number): Promise<void> {
    await act(async () => {
      // The native player applies the seek and then reports progress at the new position.
      mockVideoState.seeks.push(time);
    });
    await this.fireProgress(time);
  },

  async fireEnd(): Promise<void> {
    const props = videoProps();
    await act(async () => {
      props.onEnd?.();
    });
  },

  async fireBuffer(isBuffering: boolean): Promise<void> {
    const props = videoProps();
    await act(async () => {
      props.onBuffer?.({ isBuffering });
    });
  },
};

export { api };
