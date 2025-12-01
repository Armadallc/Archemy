/**
 * HALCYON Mobile Design Tokens
 * 
 * React Native compatible design tokens
 */

// ============================================================
// COLOR PALETTE
// ============================================================

export const palette = {
  // Core brand colors
  charcoal: '#26282b',
  ice: '#e8fffe',
  lime: '#f1fec9',
  coral: '#ff555d',
  silver: '#eaeaea',
  cloud: '#f4f4f4',
  
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
  // Backgrounds
  background: palette.cloud,
  backgroundSecondary: palette.silver,
  backgroundTertiary: palette.ice,
  
  // Surfaces
  surface: palette.white,
  surfaceElevated: palette.lime,
  surfaceMuted: palette.silver,
  
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
  
  // Trip status
  scheduled: '#3b82f6',
  scheduledBg: '#dbeafe',
  inProgress: '#f59e0b',
  inProgressBg: '#fef3c7',
  completed: '#22c55e',
  completedBg: '#dcfce7',
  cancelled: '#ef4444',
  cancelledBg: '#fee2e2',
  confirmed: '#8b5cf6',
  confirmedBg: '#ede9fe',
  
  // Tab bar
  tabBar: palette.white,
  tabBarBorder: '#d4d7da',
  tabActive: palette.coral,
  tabInactive: '#8a8f94',
  
  // Card
  card: palette.white,
  cardBorder: '#d4d7da',
  
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
  // Backgrounds
  background: palette.charcoal,
  backgroundSecondary: palette.charcoalLight,
  backgroundTertiary: palette.charcoalLighter,
  
  // Surfaces
  surface: palette.charcoalLight,
  surfaceElevated: palette.charcoalLighter,
  surfaceMuted: palette.charcoalLight,
  
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
  
  // Trip status
  scheduled: '#3b82f6',
  scheduledBg: 'rgba(59, 130, 246, 0.15)',
  inProgress: '#f59e0b',
  inProgressBg: 'rgba(245, 158, 11, 0.15)',
  completed: '#22c55e',
  completedBg: 'rgba(34, 197, 94, 0.15)',
  cancelled: '#ef4444',
  cancelledBg: 'rgba(239, 68, 68, 0.15)',
  confirmed: '#8b5cf6',
  confirmedBg: 'rgba(139, 92, 246, 0.15)',
  
  // Tab bar
  tabBar: '#1a1c1e',
  tabBarBorder: '#2d3035',
  tabActive: palette.coral,
  tabInactive: '#6b7280',
  
  // Card
  card: palette.charcoalLight,
  cardBorder: '#464a4f',
  
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