import { act, renderHook } from '@testing-library/react-native';

import { useNow } from '@/hooks/useNow';

describe('useNow', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: Date.UTC(2026, 0, 1) });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ticks every second for every subscriber and stops when the last one leaves', async () => {
    const { result: first, unmount: unmountFirst } = await renderHook(() => useNow());
    const { result: second, unmount: unmountSecond } = await renderHook(() => useNow());
    const start = first.current;

    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(first.current).toBe(start + 1000);
    expect(second.current).toBe(start + 1000);

    await unmountFirst();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(second.current).toBe(start + 2000);

    const clearInterval = jest.spyOn(globalThis, 'clearInterval');
    await unmountSecond();
    expect(clearInterval).toHaveBeenCalledTimes(1);
  });
});
