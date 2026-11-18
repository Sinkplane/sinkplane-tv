import type { ReactElement, ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeColor } from '@sinkplane/shared';

interface MenuItemProps {
  readonly onPress: () => void;
  readonly style: StyleProp<ViewStyle>;
  readonly hasTVPreferredFocus?: boolean;
  readonly children: (focused: boolean) => ReactNode;
}

export function MenuItem({
  onPress,
  style,
  hasTVPreferredFocus = false,
  children,
}: MenuItemProps): ReactElement {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      style={({ pressed, focused }) => [
        style,
        (pressed || focused) && { backgroundColor: tintColor },
      ]}
    >
      {({ focused }) => children(focused)}
    </Pressable>
  );
}
