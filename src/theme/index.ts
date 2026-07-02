import { createContext, useContext } from 'react';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  income: string;
  expense: string;
  transfer: string;
  warning: string;
  danger: string;
  success: string;
  fabShadow: string;
  tabBar: string;
  headerGradientStart: string;
  headerGradientEnd: string;
}

export const lightColors: ThemeColors = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  card: '#FFFFFF',
  primary: '#10B981',
  primarySoft: '#D1FAE5',
  onPrimary: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  income: '#10B981',
  expense: '#EF4444',
  transfer: '#3B82F6',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
  fabShadow: 'rgba(16, 185, 129, 0.4)',
  tabBar: '#FFFFFF',
  headerGradientStart: '#0F172A',
  headerGradientEnd: '#134E4A',
};

export const darkColors: ThemeColors = {
  background: '#0B1120',
  surface: '#111827',
  surfaceAlt: '#1E293B',
  card: '#111827',
  primary: '#34D399',
  primarySoft: 'rgba(52, 211, 153, 0.15)',
  onPrimary: '#052E16',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  border: '#1E293B',
  income: '#34D399',
  expense: '#F87171',
  transfer: '#60A5FA',
  warning: '#FBBF24',
  danger: '#F87171',
  success: '#34D399',
  fabShadow: 'rgba(52, 211, 153, 0.4)',
  tabBar: '#111827',
  headerGradientStart: '#020617',
  headerGradientEnd: '#0F2E2A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  heading: { fontSize: 18, fontWeight: '700' as const },
  subheading: { fontSize: 15, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  amountLarge: { fontSize: 32, fontWeight: '800' as const },
  amount: { fontSize: 16, fontWeight: '700' as const },
} as const;

export interface Theme {
  colors: ThemeColors;
  dark: boolean;
}

export const ThemeContext = createContext<Theme>({ colors: lightColors, dark: false });

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
