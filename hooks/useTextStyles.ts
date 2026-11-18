import { useThemeColor } from '@sinkplane/shared';

import { type SizedTextStyle, type TextStyleName, textStyles } from '@/constants/text-styles';
import { useScale } from '@/hooks/useScale';

export function useTextStyles(): Record<TextStyleName, SizedTextStyle> {
  const linkColor = useThemeColor({}, 'link');
  const scale = useScale();
  return textStyles(scale, linkColor);
}
