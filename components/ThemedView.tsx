import type { ReactElement } from 'react';
import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@sinkplane/shared';

export const ThemedView = ({ style, ...otherProps }: ViewProps): ReactElement => {
  const backgroundColor = useThemeColor({}, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
};
