/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ColorKey = Exclude<keyof typeof Colors.light, 'gradient'>;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey
): string {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    const color = Colors[theme][colorName];
    // Ensure we return a string, not an array
    return typeof color === 'string' ? color : String(color);
  }
}
