import type { OnVideoErrorData } from 'react-native-video';

import type { Runtime } from './runtime';

export async function firePlayerError(
  rt: Runtime,
  error: OnVideoErrorData['error'],
): Promise<void> {
  const { onError } = rt.videoDriver.props();
  await rt.act(() => {
    onError?.({ error });
    return Promise.resolve();
  });
}

export function withoutLiveStreams<T extends { liveStream?: unknown }>(
  creators: readonly T[],
): Omit<T, 'liveStream'>[] {
  return creators.map((creator) => {
    const { liveStream, ...withoutStream } = creator;
    return liveStream === undefined ? creator : withoutStream;
  });
}
