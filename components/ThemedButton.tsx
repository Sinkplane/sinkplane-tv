import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@sinkplane/shared';

import { ThemedText } from '@/components/ThemedText';
import { BORDER_WIDTH, FONT_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { useIsDarkMode, usePalette, type Palette } from '@/hooks/usePalette';
import { useScale } from '@/hooks/useScale';

const PRESSED_OPACITY = 0.8;
const FOCUSED_SCALE = 1.05;
const FOCUSED_LIGHT_TEXT = '#FFFFFF';
const DARK_BORDER = 'rgba(255, 255, 255, 0.2)';
const LIGHT_BORDER = 'rgba(0, 0, 0, 0.2)';

interface ThemedButtonProps {
  readonly onPress: () => void;
  readonly title: string;
  readonly style?: StyleProp<ViewStyle>;
}

interface ButtonColors {
  readonly background: string;
  readonly text: string;
}

function buttonColors(palette: Palette, isDarkMode: boolean, isFocused: boolean): ButtonColors {
  if (!isFocused) {
    return { background: palette.background, text: palette.text };
  }
  return {
    background: palette.tint,
    text: isDarkMode ? Colors.dark.background : FOCUSED_LIGHT_TEXT,
  };
}

function useThemedButtonStyles(isDarkMode: boolean) {
  const scale = useScale();
  return StyleSheet.create({
    button: {
      paddingHorizontal: SPACE.xl * scale,
      paddingVertical: SPACE.md * scale,
      borderRadius: RADIUS.md * scale,
      borderWidth: BORDER_WIDTH.thin * scale,
      borderColor: isDarkMode ? DARK_BORDER : LIGHT_BORDER,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: FONT_SIZE.body * scale,
      fontWeight: '600',
    },
  });
}

export function ThemedButton({ onPress, title, style }: ThemedButtonProps): ReactElement {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const isDarkMode = useIsDarkMode();
  const palette = usePalette();
  const styles = useThemedButtonStyles(isDarkMode);
  const colors = buttonColors(palette, isDarkMode, isFocused);

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => {
        setIsFocused(true);
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
      onPressIn={() => {
        setIsPressed(true);
      }}
      onPressOut={() => {
        setIsPressed(false);
      }}
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          opacity: isPressed ? PRESSED_OPACITY : 1,
          transform: [{ scale: isFocused ? FOCUSED_SCALE : 1 }],
        },
        style,
      ]}
    >
      <ThemedText style={[styles.text, { color: colors.text }]}>{title}</ThemedText>
    </Pressable>
  );
}
