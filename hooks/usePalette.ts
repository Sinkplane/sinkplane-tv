import { Colors, useColorScheme } from '@sinkplane/shared';

export type Palette = (typeof Colors)['light'];

export function useIsDarkMode(): boolean {
  return useColorScheme() === 'dark';
}

export function usePalette(): Palette {
  return useIsDarkMode() ? Colors.dark : Colors.light;
}
