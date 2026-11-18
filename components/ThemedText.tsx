import type { ReactElement } from 'react';
import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '@sinkplane/shared';

import type { TextStyleName } from '@/constants/text-styles';
import { useTextStyles } from '@/hooks/useTextStyles';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: TextStyleName;
};

interface ColorOverrides {
  light?: string;
  dark?: string;
}

function colorOverrides(light: string | undefined, dark: string | undefined): ColorOverrides {
  return {
    ...(light === undefined ? {} : { light }),
    ...(dark === undefined ? {} : { dark }),
  };
}

export const ThemedText = ({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps): ReactElement => {
  const color = useThemeColor(colorOverrides(lightColor, darkColor), 'text');
  const styles = useTextStyles();

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
};
