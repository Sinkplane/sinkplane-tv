import { act, renderRouter } from 'expo-router/testing-library';
import { fixtureUser } from './fixtures';
import { api } from './mock-floatplane-api';
import { mockSecureStore, mockVideoState, type MockVideoProps } from './native-mocks';

export { act, screen, fireEvent, testRouter } from 'expo-router/testing-library';

type RenderRouterResult = ReturnType<typeof renderRouter>;

const ONE_HOUR_MS = 60 * 60 * 1000;
const DEFAULT_UNTIL_OPTIONS = { maxFakeMs: 5000, stepMs: 50 };

export async function renderApp(initialUrl = '/'): Promise<RenderRouterResult> {
  const view = renderRouter('./app', { initialUrl });
  await view;
  return view;
}

export interface SeedSessionOptions {
  token?: string;
  refreshToken?: string;
  tokenExpiration?: string;
}

const storeAsUseStorageStateDoes = (key: string, value: string): void => {
  mockSecureStore.items.set(key, JSON.stringify(value));
};

export function seedSession(options: SeedSessionOptions = {}): void {
  const token = options.token ?? api.accessToken;
  const expiration = options.tokenExpiration ?? new Date(Date.now() + ONE_HOUR_MS).toISOString();
  const userJsonFromAuthContext = JSON.stringify(fixtureUser);
  storeAsUseStorageStateDoes('fptoken', token);
  storeAsUseStorageStateDoes('fpuser', userJsonFromAuthContext);
  storeAsUseStorageStateDoes('fptokenExpiration', expiration);
  if (options.refreshToken !== undefined) {
    storeAsUseStorageStateDoes('fprefreshToken', options.refreshToken);
  }
}

export async function advanceTime(ms: number): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

const flushMicrotasks = (): Promise<void> => advanceTime(0);

export async function until(
  assertion: () => void,
  options: { maxFakeMs?: number; stepMs?: number } = {},
): Promise<void> {
  const { maxFakeMs, stepMs } = { ...DEFAULT_UNTIL_OPTIONS, ...options };
  let waited = 0;
  for (;;) {
    try {
      await flushMicrotasks();
      assertion();
      return;
    } catch (error) {
      if (waited >= maxFakeMs) {
        throw error;
      }
      await advanceTime(stepMs);
      waited += stepMs;
    }
  }
}

const videoProps = (): MockVideoProps => {
  if (!mockVideoState.props) {
    throw new Error('Native video player has not mounted yet');
  }
  return mockVideoState.props;
};

const inAsyncAct = async (run: () => void): Promise<void> => {
  await act(() => {
    run();
    return Promise.resolve();
  });
};

export const videoDriver = {
  mounted: (): boolean => mockVideoState.mountCount > 0,
  props: videoProps,
  seeks: (): number[] => [...mockVideoState.seeks],

  async fireLoad(duration = 1200): Promise<void> {
    const props = videoProps();
    await inAsyncAct(() => props.onLoad?.({ duration, currentTime: 0 }));
  },

  async fireReadyForDisplay(): Promise<void> {
    const props = videoProps();
    await inAsyncAct(() => props.onReadyForDisplay?.());
  },

  async fireProgress(currentTime: number): Promise<void> {
    const props = videoProps();
    await inAsyncAct(() => props.onProgress?.({ currentTime, playableDuration: currentTime + 10 }));
  },

  async fireSeek(time: number): Promise<void> {
    await inAsyncAct(() => mockVideoState.seeks.push(time));
    await this.fireProgress(time);
  },

  async fireEnd(): Promise<void> {
    const props = videoProps();
    await inAsyncAct(() => props.onEnd?.());
  },

  async fireBuffer(isBuffering: boolean): Promise<void> {
    const props = videoProps();
    await inAsyncAct(() => props.onBuffer?.({ isBuffering }));
  },
};

export { api };
