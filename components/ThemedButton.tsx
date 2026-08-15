import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useState } from 'react';
import { ThemedText } from './ThemedText';
import { useScale } from '@/hooks/useScale';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ThemedButtonProps {
  onPress: () => void;
  title: string;
  style?: ViewStyle;
}

export function ThemedButton({ onPress, title, style }: ThemedButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const colorScheme = useColorScheme();
  const styles = useThemedButtonStyles();

  const palette = Colors[colorScheme ?? 'light'];

  const backgroundColor = isFocused
    ? palette.tint
    : palette.background;

  // Dark mode tint (#aaa) needs dark text for contrast; light mode tint (#0085FF) needs white text.
  const textColor = isFocused
    ? (colorScheme === 'dark' ? Colors.dark.background : '#FFFFFF')
    : palette.text;

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.button,
        {
          backgroundColor,
          opacity: isPressed ? 0.8 : 1,
          transform: [{ scale: isFocused ? 1.05 : 1 }],
        },
        style,
      ]}
    >
      <ThemedText style={[styles.text, { color: textColor }]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const useThemedButtonStyles = function () {
  const scale = useScale();
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    button: {
      paddingHorizontal: 20 * scale,
      paddingVertical: 12 * scale,
      borderRadius: 8 * scale,
      borderWidth: 2 * scale,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 16 * scale,
      fontWeight: '600',
    },
  });
};
