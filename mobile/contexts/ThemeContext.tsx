import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Platform } from 'react-native';
import { lightTheme, darkTheme, type ThemeColors } from '../constants/design-tokens/colors';
import { typography } from '../constants/design-tokens/typography';
import { TextStyle } from 'react-native';

// Conditionally import SecureStore only on native to prevent web bundler issues
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('SecureStore not available:', e);
  }
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: {
    fontFamily: string;
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    bodyLarge: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    caption: TextStyle;
  };
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'halcyon_theme_mode';

// Helper function to get font family name based on weight
const getFontFamilyByWeight = (weight: string): string => {
  const weightMap: Record<string, string> = {
    '100': 'Nohemi-Thin',
    '200': 'Nohemi-ExtraLight',
    '300': 'Nohemi-Light',
    '400': 'Nohemi-Regular',
    '500': 'Nohemi-Medium',
    '600': 'Nohemi-SemiBold',
    '700': 'Nohemi-Bold',
    '800': 'Nohemi-ExtraBold',
    '900': 'Nohemi-Black',
  };
  return weightMap[weight] || 'Nohemi-Regular';
};

// Helper to get mobile typography styles
const getMobileTypography = () => {
  return {
    fontFamily: 'Nohemi-Regular',
    h1: {
      fontFamily: getFontFamilyByWeight(typography.presets.h1.fontWeight),
      fontSize: typography.presets.h1.fontSize.mobile,
      fontWeight: typography.presets.h1.fontWeight as any,
      lineHeight: typography.presets.h1.lineHeight * typography.presets.h1.fontSize.mobile,
      letterSpacing: typography.presets.h1.letterSpacing,
      textTransform: typography.presets.h1.textTransform,
    } as TextStyle,
    h2: {
      fontFamily: getFontFamilyByWeight(typography.presets.h2.fontWeight),
      fontSize: typography.presets.h2.fontSize.mobile,
      fontWeight: typography.presets.h2.fontWeight as any,
      lineHeight: typography.presets.h2.lineHeight * typography.presets.h2.fontSize.mobile,
      letterSpacing: typography.presets.h2.letterSpacing,
      textTransform: typography.presets.h2.textTransform,
    } as TextStyle,
    h3: {
      fontFamily: getFontFamilyByWeight(typography.presets.h3.fontWeight),
      fontSize: typography.presets.h3.fontSize.mobile,
      fontWeight: typography.presets.h3.fontWeight as any,
      lineHeight: typography.presets.h3.lineHeight * typography.presets.h3.fontSize.mobile,
      letterSpacing: typography.presets.h3.letterSpacing,
      textTransform: typography.presets.h3.textTransform,
    } as TextStyle,
    bodyLarge: {
      fontFamily: getFontFamilyByWeight(typography.presets.bodyLarge.fontWeight),
      fontSize: typography.presets.bodyLarge.fontSize.mobile,
      fontWeight: typography.presets.bodyLarge.fontWeight as any,
      lineHeight: typography.presets.bodyLarge.lineHeight * typography.presets.bodyLarge.fontSize.mobile,
      letterSpacing: typography.presets.bodyLarge.letterSpacing,
      textTransform: typography.presets.bodyLarge.textTransform,
    } as TextStyle,
    body: {
      fontFamily: getFontFamilyByWeight(typography.presets.body.fontWeight),
      fontSize: typography.presets.body.fontSize.mobile,
      fontWeight: typography.presets.body.fontWeight as any,
      lineHeight: typography.presets.body.lineHeight * typography.presets.body.fontSize.mobile,
      letterSpacing: typography.presets.body.letterSpacing,
      textTransform: typography.presets.body.textTransform,
    } as TextStyle,
    bodySmall: {
      fontFamily: getFontFamilyByWeight(typography.presets.bodySmall.fontWeight),
      fontSize: typography.presets.bodySmall.fontSize.mobile,
      fontWeight: typography.presets.bodySmall.fontWeight as any,
      lineHeight: typography.presets.bodySmall.lineHeight * typography.presets.bodySmall.fontSize.mobile,
      letterSpacing: typography.presets.bodySmall.letterSpacing,
      textTransform: typography.presets.bodySmall.textTransform,
    } as TextStyle,
    caption: {
      fontFamily: getFontFamilyByWeight(typography.presets.caption.fontWeight),
      fontSize: typography.presets.caption.fontSize.mobile,
      fontWeight: typography.presets.caption.fontWeight as any,
      lineHeight: typography.presets.caption.lineHeight * typography.presets.caption.fontSize.mobile,
      letterSpacing: typography.presets.caption.letterSpacing,
      textTransform: typography.presets.caption.textTransform,
    } as TextStyle,
  };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
          stored = localStorage.getItem(THEME_STORAGE_KEY);
        } else if (SecureStore) {
          stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        }
        if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setThemeModeState(stored as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Determine actual theme based on mode
  const actualMode = themeMode === 'system' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : themeMode;

  const colors = actualMode === 'dark' ? darkTheme : lightTheme;
  const typographyStyles = getMobileTypography();

  const theme: Theme = {
    mode: themeMode,
    colors,
    typography: typographyStyles,
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } else if (SecureStore) {
        await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
      }
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = actualMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  if (isLoading) {
    // Return a default theme while loading
    return (
      <ThemeContext.Provider
        value={{
          theme: {
            mode: 'system',
            colors: lightTheme,
            typography: getMobileTypography(),
          },
          toggleTheme: () => {},
          setThemeMode: () => {},
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

