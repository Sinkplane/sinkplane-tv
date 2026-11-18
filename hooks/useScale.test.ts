import { Platform } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import { useScale } from '@/hooks/useScale';

describe('useScale', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps design units on non-TV platforms', async () => {
    jest.spyOn(Platform, 'isTV', 'get').mockReturnValue(false);
    const { result } = await renderHook(() => useScale());

    expect(result.current).toBe(1);
  });

  it('scales from a 1000-unit wide design on TV', async () => {
    jest.spyOn(Platform, 'isTV', 'get').mockReturnValue(true);
    const { result } = await renderHook(() => useScale());

    expect(result.current).toBe(750 / 1000);
  });
});
