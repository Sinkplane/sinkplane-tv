import type { TextStyle } from 'react-native';

import { FONT_SIZE, LINE_HEIGHT } from '@/constants/layout';

export type TextStyleName = 'default' | 'defaultSemiBold' | 'title' | 'subtitle' | 'link';

export type SizedTextStyle = TextStyle & { fontSize: number; lineHeight: number };

export function textStyles(
  scale: number,
  linkColor: string,
): Record<TextStyleName, SizedTextStyle> {
  return {
    default: {
      fontSize: FONT_SIZE.body * scale,
      lineHeight: LINE_HEIGHT.body * scale,
    },
    defaultSemiBold: {
      fontSize: FONT_SIZE.body * scale,
      lineHeight: LINE_HEIGHT.body * scale,
      fontWeight: '600',
    },
    title: {
      fontSize: FONT_SIZE.title * scale,
      fontWeight: 'bold',
      lineHeight: LINE_HEIGHT.title * scale,
    },
    subtitle: {
      fontSize: FONT_SIZE.subtitle * scale,
      lineHeight: LINE_HEIGHT.subtitle * scale,
      fontWeight: 'bold',
    },
    link: {
      lineHeight: LINE_HEIGHT.link * scale,
      fontSize: FONT_SIZE.body * scale,
      color: linkColor,
    },
  };
}
