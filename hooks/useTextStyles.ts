import { useScale } from './useScale';
import { useThemeColor } from './useThemeColor';

import { textStyles } from '@/constants/text-styles';

export function useTextStyles() {
  const linkColor = useThemeColor({}, 'link');
  const scale = useScale() ?? 1.0;
  return textStyles(scale, linkColor);
}
