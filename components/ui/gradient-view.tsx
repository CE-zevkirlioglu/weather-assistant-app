import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

interface GradientViewProps {
  children?: React.ReactNode;
  colors?: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  gradientType?: 'primary' | 'secondary' | 'weather' | 'success';
}

export function GradientView({
  children,
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  gradientType,
}: GradientViewProps) {
  const colorScheme = useColorScheme();
  
  let gradientColors = colors;
  if (!gradientColors && gradientType) {
    gradientColors = Gradients[gradientType];
  }
  if (!gradientColors) {
    gradientColors = Colors[colorScheme ?? 'light'].gradient;
  }

  return (
    <LinearGradient
      colors={gradientColors as [string, string, ...string[]]}
      start={start}
      end={end}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
