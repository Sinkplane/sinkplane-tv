import type { Runtime } from './runtime';

export function holdRequestsMatching(rt: Runtime, fragment: string): () => void {
  const { api } = rt;
  const original = api.handleFetch;
  let release: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  api.handleFetch = async (input, init) => {
    if (typeof input === 'string' && input.includes(fragment)) {
      await gate;
    }
    return original(input, init);
  };
  return () => {
    release();
  };
}
