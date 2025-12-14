/**
 * Modern Weather App Theme - Beautiful gradients and colors
 */

import { Platform } from 'react-native';

// Modern gradient colors
const primaryGradient = ['#667eea', '#764ba2'];
const secondaryGradient = ['#f093fb', '#f5576c'];
const weatherGradient = ['#4facfe', '#00f2fe'];
const successGradient = ['#43e97b', '#38f9d7'];

export const Colors = {
  light: {
    text: '#1a1a2e',
    textSecondary: '#6b7280',
    background: '#f8fafc',
    backgroundSecondary: '#ffffff',
    tint: '#667eea',
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: '#667eea',
    card: '#ffffff',
    cardBorder: '#e5e7eb',
    primary: '#667eea',
    secondary: '#764ba2',
    accent: '#f5576c',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient: primaryGradient,
  },
  dark: {
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    tint: '#818cf8',
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#818cf8',
    card: '#1e293b',
    cardBorder: '#334155',
    primary: '#818cf8',
    secondary: '#a78bfa',
    accent: '#f472b6',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    gradient: ['#818cf8', '#a78bfa'],
  },
};

export const Gradients = {
  primary: primaryGradient,
  secondary: secondaryGradient,
  weather: weatherGradient,
  success: successGradient,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
