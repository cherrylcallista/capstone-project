import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { readThemePreference, writeThemePreference } from '@/lib/themePersistence';

export type ColorScheme = 'light' | 'dark';

export type AppThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  primarySurface: string;
  primaryText: string;
  inputBackground: string;
  danger: string;
  dangerSurface: string;
  success: string;
  warning: string;
  overlay: string;
  shadow: string;
};

const PALETTES: Record<ColorScheme, AppThemeColors> = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    border: '#E2E8F0',
    primary: '#1D2B53',
    onPrimary: '#FFFFFF',
    primarySurface: '#EEF2FF',
    primaryText: '#34488A',
    inputBackground: '#F8FAFC',
    danger: '#B91C1C',
    dangerSurface: '#FEE2E2',
    success: '#047857',
    warning: '#B45309',
    overlay: 'rgba(15, 23, 42, 0.42)',
    shadow: '#0F172A',
  },
  dark: {
    background: '#0B1120',
    surface: '#111C31',
    surfaceSecondary: '#1A2941',
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#9AA9BF',
    border: '#33445F',
    primary: '#B7C7EA',
    onPrimary: '#101A2D',
    primarySurface: '#233451',
    primaryText: '#D5E0F5',
    inputBackground: '#17243A',
    danger: '#FDA4AF',
    dangerSurface: '#42202D',
    success: '#6EE7B7',
    warning: '#FCD34D',
    overlay: 'rgba(0, 0, 0, 0.68)',
    shadow: '#000000',
  },
};

type ThemeContextValue = {
  mode: ColorScheme;
  colors: AppThemeColors;
  isDark: boolean;
  isLoaded: boolean;
  setMode: (mode: ColorScheme) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: React.PropsWithChildren) {
  const [mode, setModeState] = useState<ColorScheme>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    readThemePreference()
      .then((savedMode) => {
        if (active && (savedMode === 'light' || savedMode === 'dark')) {
          setModeState(savedMode);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load color scheme preference:', error);
      })
      .finally(() => {
        if (active) setIsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.backgroundColor = PALETTES[mode].background;
    document.documentElement.style.colorScheme = mode;
    document.body.style.backgroundColor = PALETTES[mode].background;
  }, [mode]);

  const setMode = useCallback((nextMode: ColorScheme) => {
    setModeState(nextMode);
    void writeThemePreference(nextMode).catch((error: unknown) => {
      console.error('Failed to save color scheme preference:', error);
    });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const contextValue = useMemo(() => ({
    mode,
    colors: PALETTES[mode],
    isDark: mode === 'dark',
    isLoaded,
    setMode,
    toggleMode,
  }), [isLoaded, mode, setMode, toggleMode]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider.');
  }
  return context;
}

export function useThemeStyles<T extends StyleSheet.NamedStyles<T>>(
  createStyles: (colors: AppThemeColors) => T,
) {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create(createStyles(colors)), [colors, createStyles]);
}
