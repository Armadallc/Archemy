/**
 * HALCYON Mobile Design Tokens
 * 
 * React Native compatible design tokens
 */

// ============================================================
// COLOR PALETTE
// ============================================================

export const palette = {
  // Core brand colors (darkened 20% for better neumorphic contrast)
  charcoal: '#1e2023', // Was #26282b (38,40,43) → 20% darker = (30,32,35)
  ice: '#e8fffe',
  lime: '#f1fec9',
  coral: '#ff8475',
  silver: '#eaeaea',
  cloud: '#f4f4f4',
  shadow: '#292929', // Was #343434 (52,52,52) → 20% darker = (41,41,41)
  aqua: '#a5c8ca',
  
  // Extended shades
  charcoalLight: '#363a3e',
  charcoalLighter: '#464a4f',
  charcoalMuted: '#5c6166',
  limeDark: '#d4e5a8',
  limeLight: '#f7ffdf',
  coralDark: '#e04850',
  coralLight: '#ff7a80',
  
  // Pure
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// ============================================================
// LIGHT THEME
// ============================================================

export const lightTheme = {
  // Backgrounds - same color as cards for neumorphic design
  background: palette.cloud, // #f4f4f4
  backgroundSecondary: palette.cloud, // #f4f4f4
  backgroundTertiary: palette.cloud, // #f4f4f4
  
  // Surfaces - same color as background for neumorphic design
  surface: palette.cloud, // #f4f4f4
  surfaceElevated: palette.cloud, // #f4f4f4
  surfaceMuted: palette.cloud, // #f4f4f4
  
  // Text
  text: palette.charcoal,
  textSecondary: '#5c6166',
  textMuted: '#8a8f94',
  textInverse: palette.white,
  
  // Primary
  primary: palette.coral,
  primaryLight: palette.coralLight,
  primaryDark: palette.coralDark,
  
  // Accent
  accent: palette.lime,
  accentLight: palette.limeLight,
  accentDark: palette.limeDark,
  
  // Borders
  border: '#d4d7da',
  borderMuted: palette.silver,
  borderStrong: '#b8bcc0',
  
  // Status
  success: '#22c55e',
  successBg: '#dcfce7',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  error: '#ef4444',
  errorBg: '#fee2e2',
  info: '#3b82f6',
  infoBg: '#dbeafe',
  
  // Trip status - Fire palette colors
  scheduled: '#7afffe',
  scheduledBg: '#dbeafe',
  inProgress: '#f1fe60',
  inProgressBg: '#fef3c7',
  completed: '#3bfec9',
  completedBg: 'rgba(59, 254, 201, 0.15)',
  cancelled: '#e04850',
  cancelledBg: 'rgba(224, 72, 80, 0.15)',
  confirmed: '#c2b4fe',
  confirmedBg: 'rgba(194, 180, 254, 0.15)',
  
  // Trip status grouped (for easier access) - Fire palette
  tripStatus: {
    scheduled: '#7afffe',
    inProgress: '#f1fe60',
    completed: '#3bfec9',
    cancelled: '#e04850',
    confirmed: '#c2b4fe',
  },
  
  // Driver colors (for UI elements)
  driverColors: {
    color1: '#3b82f6', // Blue
    color2: '#22c55e', // Green
    color3: '#f59e0b', // Amber
    color4: '#8b5cf6', // Purple
    color5: '#f59e0b', // Orange/Amber (for warnings, no-show)
    color6: '#06b6d4', // Cyan
  },
  
  // Additional theme properties
  foreground: palette.charcoal,
  mutedForeground: '#8a8f94',
  secondary: palette.silver,
  primaryForeground: palette.white,
  
  // Tab bar
  tabBar: palette.white,
  tabBarBorder: '#d4d7da',
  tabActive: palette.coral,
  tabInactive: '#8a8f94',
  
  // Card - same color as background for neumorphic design
  card: palette.cloud, // #f4f4f4
  cardBorder: 'transparent', // No borders, use shadows instead
  
  // Input
  input: palette.white,
  inputBorder: '#d4d7da',
  inputPlaceholder: '#8a8f94',
  inputFocus: palette.coral,
  
  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.1,
};

// ============================================================
// DARK THEME
// ============================================================

export const darkTheme = {
  // Backgrounds - same color as cards for neumorphic design
  background: palette.charcoal, // #1e2023 (20% darker charcoal)
  backgroundSecondary: palette.charcoal, // #1e2023
  backgroundTertiary: palette.charcoal, // #1e2023
  
  // Surfaces - same color as background for neumorphic design
  surface: palette.charcoal, // #1e2023
  surfaceElevated: palette.charcoal, // #1e2023
  surfaceMuted: palette.charcoal, // #1e2023
  
  // Text
  text: palette.cloud,
  textSecondary: '#b8bcc0',
  textMuted: '#8a8f94',
  textInverse: palette.charcoal,
  
  // Primary
  primary: palette.coral,
  primaryLight: palette.coralLight,
  primaryDark: palette.coralDark,
  
  // Accent
  accent: palette.lime,
  accentLight: palette.limeLight,
  accentDark: palette.limeDark,
  
  // Borders
  border: '#464a4f',
  borderMuted: palette.charcoalLight,
  borderStrong: '#5c6166',
  
  // Status
  success: '#22c55e',
  successBg: 'rgba(34, 197, 94, 0.15)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.15)',
  info: '#3b82f6',
  infoBg: 'rgba(59, 130, 246, 0.15)',
  
  // Trip status - Fire palette colors
  scheduled: '#7afffe',
  scheduledBg: 'rgba(122, 255, 254, 0.15)',
  inProgress: '#f1fe60',
  inProgressBg: 'rgba(241, 254, 96, 0.15)',
  completed: '#3bfec9',
  completedBg: 'rgba(59, 254, 201, 0.15)',
  cancelled: '#e04850',
  cancelledBg: 'rgba(224, 72, 80, 0.15)',
  confirmed: '#c2b4fe',
  confirmedBg: 'rgba(194, 180, 254, 0.15)',
  
  // Trip status grouped (for easier access) - Fire palette
  tripStatus: {
    scheduled: '#7afffe',
    inProgress: '#f1fe60',
    completed: '#3bfec9',
    cancelled: '#e04850',
    confirmed: '#c2b4fe',
  },
  
  // Driver colors (for UI elements)
  driverColors: {
    color1: '#3b82f6', // Blue
    color2: '#22c55e', // Green
    color3: '#f59e0b', // Amber
    color4: '#8b5cf6', // Purple
    color5: '#f59e0b', // Orange/Amber (for warnings, no-show)
    color6: '#06b6d4', // Cyan
  },
  
  // Additional theme properties
  foreground: palette.cloud,
  mutedForeground: '#8a8f94',
  secondary: palette.charcoalLight,
  primaryForeground: palette.white,
  
  // Tab bar
  tabBar: '#1a1c1e',
  tabBarBorder: '#2d3035',
  tabActive: palette.coral,
  tabInactive: '#6b7280',
  
  // Card - same color as background for neumorphic design
  card: palette.charcoal, // #1e2023 (20% darker charcoal)
  cardBorder: 'transparent', // No borders, use shadows instead
  
  // Input
  input: palette.charcoalLight,
  inputBorder: '#464a4f',
  inputPlaceholder: '#6b7280',
  inputFocus: palette.coral,
  
  // Shadows
  shadowColor: '#000000',
  shadowOpacity: 0.4,
};

// ============================================================
// DRIVER COLORS
// ============================================================

export const driverColors = [
  '#3b82f6', // Blue
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
];

// ============================================================
// TYPOGRAPHY
// ============================================================

export const typography = {
  fonts: {
    heading: 'Nohemi',
    headingBold: 'Nohemi-Bold',
    body: 'SpaceGrotesk-Regular',
    bodyMedium: 'SpaceGrotesk-Medium',
    bodyBold: 'SpaceGrotesk-Bold',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
};

// ============================================================
// SPACING
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

// ============================================================
// BORDER RADIUS
// ============================================================

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================================
// SHADOWS (React Native style)
// ============================================================

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  neu: {
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    dark: {
      shadowColor: '#000',
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 5,
    },
  },
};

// ============================================================
// THEME HELPER
// ============================================================

export const getTheme = (isDark: boolean) => ({
  colors: isDark ? darkTheme : lightTheme,
  palette,
  driverColors,
  typography,
  spacing,
  borderRadius,
  shadows,
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type MobileTheme = ReturnType<typeof getTheme>;
export type MobileColors = typeof lightTheme;
export type ThemeColors = typeof lightTheme;

// ============================================================
// NEUMORPHIC SHADOW SYSTEM
// ============================================================

export type NeumorphicStyle = 'embossed' | 'debossed';

export interface NeumorphicShadowConfig {
  light: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowRadius: number;
    shadowOpacity: number;
  };
  dark: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowRadius: number;
    shadowOpacity: number;
  };
}

export const neumorphicShadows = {
  // Light theme - embossed (pushed out)
  light: {
    embossed: {
      light: {
        shadowColor: '#FAFBFF', // Light highlight (top-left)
        shadowOffset: { width: -5, height: -5 },
        shadowRadius: 10,
        shadowOpacity: 1,
      },
      dark: {
        shadowColor: '#161B1D', // Dark shadow (bottom-right)
        shadowOffset: { width: 5, height: 5 },
        shadowRadius: 10,
        shadowOpacity: 0.23,
      },
    },
    debossed: {
      light: {
        shadowColor: '#161B1D', // Reverse for pressed-in
        shadowOffset: { width: -5, height: -5 },
        shadowRadius: 10,
        shadowOpacity: 0.23,
      },
      dark: {
        shadowColor: '#FAFBFF',
        shadowOffset: { width: 5, height: 5 },
        shadowRadius: 10,
        shadowOpacity: 1,
      },
    },
  },
  // Dark theme - debossed (pushed in) by default
  dark: {
    embossed: {
      light: {
        shadowColor: '#464a4f', // Lighter than background
        shadowOffset: { width: -5, height: -5 },
        shadowRadius: 10,
        shadowOpacity: 0.5,
      },
      dark: {
        shadowColor: '#1a1c1e', // Darker than background
        shadowOffset: { width: 5, height: 5 },
        shadowRadius: 10,
        shadowOpacity: 0.8,
      },
    },
    debossed: {
      light: {
        shadowColor: '#1a1c1e', // Reverse for pressed-in
        shadowOffset: { width: -5, height: -5 },
        shadowRadius: 10,
        shadowOpacity: 0.8,
      },
      dark: {
        shadowColor: '#464a4f',
        shadowOffset: { width: 5, height: 5 },
        shadowRadius: 10,
        shadowOpacity: 0.5,
      },
    },
  },
} as const;

// Helper function to get neumorphic shadow config
export const getNeumorphicShadow = (
  isDark: boolean,
  style: NeumorphicStyle
): NeumorphicShadowConfig => {
  return neumorphicShadows[isDark ? 'dark' : 'light'][style];
};