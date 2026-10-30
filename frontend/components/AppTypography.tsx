import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
} from 'react-native';
import type {
  TextInputProps,
  TextProps,
  TextStyle,
  StyleProp,
} from 'react-native';
import { useAppTheme } from '@/theme/ThemeProvider';

const FONT_BY_WEIGHT: Record<string, string> = {
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
  bold: 'Inter_700Bold',
  '800': 'Inter_800ExtraBold',
  '900': 'Inter_900Black',
  normal: 'Inter_400Regular',
  '400': 'Inter_400Regular',
};

function getFontFamily(style: StyleProp<TextStyle>) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  return FONT_BY_WEIGHT[String(weight)] ?? 'Inter_400Regular';
}

export const AppText = forwardRef<NativeText, TextProps>(({ style, ...props }, ref) => {
  const { colors } = useAppTheme();
  return (
    <NativeText
      ref={ref}
      {...props}
      style={[{ fontFamily: getFontFamily(style), color: colors.text }, style]}
    />
  );
});

AppText.displayName = 'AppText';

export const AppTextInput = forwardRef<NativeTextInput, TextInputProps>(({ style, ...props }, ref) => {
  const { colors } = useAppTheme();
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      placeholderTextColor={props.placeholderTextColor ?? colors.textMuted}
      style={[{ fontFamily: getFontFamily(style), color: colors.text }, style]}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';
