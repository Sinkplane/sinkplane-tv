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
  const scale = useScale();
  const colorScheme = useColorScheme();
  const styles = useThemedButtonStyles();

  const backgroundColor = isFocused
    ? Colors[colorScheme ?? 'light'].tint
    : Colors[colorScheme ?? 'light'].background;

  const textColor = isFocused
    ? '#FFFFFF'
    : Colors[colorScheme ?? 'light'].text;

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
  return StyleSheet.create({
    button: {
      paddingHorizontal: 20 * scale,
      paddingVertical: 12 * scale,
      borderRadius: 8 * scale,
      borderWidth: 2 * scale,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontSize: 16 * scale,
      fontWeight: '600',
    },
  });
};
