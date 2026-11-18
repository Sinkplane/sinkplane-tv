import { useSyncExternalStore } from 'react';

const TICK_MS = 1000;

const listeners = new Set<() => void>();
let now = Date.now();
let ticker: ReturnType<typeof setInterval> | undefined;

function tick(): void {
  now = Date.now();
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    now = Date.now();
    ticker = setInterval(tick, TICK_MS);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(ticker);
    }
  };
}

function getSnapshot(): number {
  return now;
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}
