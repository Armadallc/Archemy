/**
 * HALCYON Design Tokens
 * 
 * Central source of truth for design values.
 * Used across web (via CSS variables) and mobile (directly).
 */

// ============================================================
// COLOR PALETTE - Raw Values
// ============================================================

export const palette = {
  // Core brand colors
  charcoal: '#26282b',
  ice: '#e8fffe',
  lime: '#f1fec9',
  coral: '#ff8475',
  silver: '#eaeaea',
  cloud: '#f4f4f4',
  shadow: '#343434',
  aqua: '#a5c8ca',
  
  // Extended charcoal shades
  charcoalLight: '#363a3e',
  charcoalLighter: '#464a4f',
  charcoalMuted: '#5c6166',
  
  // Extended lime shades
  limeDark: '#d4e5a8',
  limeLight: '#f7ffdf',
  
  // Extended coral shades
  coralDark: '#e04850',
  coralLight: '#ff7a80',
  
  // Pure values
  white: '#ffffff',
  black: '#000000',
} as const;

// ============================================================
// SEMANTIC COLORS - Light Theme
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
  foreground: palette.charcoal,
  foregroundSecondary: '#5c6166',
  foregroundMuted: '#8a8f94',
  foregroundInverse: palette.white,
  
  // Primary
  primary: palette.coral,
  primaryHover: palette.coralDark,
  primaryForeground: palette.white,
  
  // Accent
  accent: palette.lime,
  accentHover: palette.limeDark,
  accentForeground: palette.charcoal,
  
  // Borders
  border: '#d4d7da',
  borderMuted: palette.silver,
  borderStrong: '#b8bcc0',
  
  // Input
  input: palette.white,
  inputBorder: '#d4d7da',
  inputFocus: palette.coral,
  
  // Focus ring
  ring: palette.coral,
  ringOffset: palette.cloud,
  
  // Destructive
  destructive: '#dc2626',
  destructiveHover: '#b91c1c',
  destructiveForeground: palette.white,
  
  // Muted
  muted: palette.silver,
  mutedForeground: '#6b7280',
  
  // Card
  card: palette.white,
  cardForeground: palette.charcoal,
  
  // Popover
  popover: palette.white,
  popoverForeground: palette.charcoal,
  
  // Sidebar
  sidebar: palette.charcoal,
  sidebarForeground: palette.cloud,
  sidebarForegroundMuted: '#9ca3af',
  sidebarPrimary: palette.coral,
  sidebarAccent: palette.lime,
  sidebarBorder: palette.charcoalLight,
};

// ============================================================
// SEMANTIC COLORS - Dark Theme
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
  foreground: palette.cloud,
  foregroundSecondary: '#b8bcc0',
  foregroundMuted: '#8a8f94',
  foregroundInverse: palette.charcoal,
  
  // Primary
  primary: palette.coral,
  primaryHover: palette.coralLight,
  primaryForeground: palette.white,
  
  // Accent
  accent: palette.lime,
  accentHover: palette.limeLight,
  accentForeground: palette.charcoal,
  
  // Borders
  border: '#464a4f',
  borderMuted: palette.charcoalLight,
  borderStrong: '#5c6166',
  
  // Input
  input: palette.charcoalLight,
  inputBorder: '#464a4f',
  inputFocus: palette.coral,
  
  // Focus ring
  ring: palette.coral,
  ringOffset: palette.charcoal,
  
  // Destructive
  destructive: '#f87171',
  destructiveHover: '#ef4444',
  destructiveForeground: palette.white,
  
  // Muted
  muted: palette.charcoalLight,
  mutedForeground: '#9ca3af',
  
  // Card
  card: palette.charcoalLight,
  cardForeground: palette.cloud,
  
  // Popover
  popover: palette.charcoalLight,
  popoverForeground: palette.cloud,
  
  // Sidebar
  sidebar: '#1a1c1e',
  sidebarForeground: palette.cloud,
  sidebarForegroundMuted: '#6b7280',
  sidebarPrimary: palette.coral,
  sidebarAccent: palette.lime,
  sidebarBorder: '#2d3035',
};

// ============================================================
// STATUS COLORS
// ============================================================

export const statusColors = {
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  light: {
    successBg: '#dcfce7',
    successBorder: '#86efac',
    warningBg: '#fef3c7',
    warningBorder: '#fcd34d',
    errorBg: '#fee2e2',
    errorBorder: '#fca5a5',
    infoBg: '#dbeafe',
    infoBorder: '#93c5fd',
  },
  
  dark: {
    successBg: 'rgba(34, 197, 94, 0.15)',
    successBorder: 'rgba(34, 197, 94, 0.3)',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    warningBorder: 'rgba(245, 158, 11, 0.3)',
    errorBg: 'rgba(239, 68, 68, 0.15)',
    errorBorder: 'rgba(239, 68, 68, 0.3)',
    infoBg: 'rgba(59, 130, 246, 0.15)',
    infoBorder: 'rgba(59, 130, 246, 0.3)',
  },
};

// ============================================================
// TRIP STATUS COLORS
// ============================================================

export const tripStatusColors = {
  scheduled: '#3b82f6',
  inProgress: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#ef4444',
  confirmed: '#8b5cf6',
  
  light: {
    scheduledBg: '#dbeafe',
    inProgressBg: '#fef3c7',
    completedBg: '#dcfce7',
    cancelledBg: '#fee2e2',
    confirmedBg: '#ede9fe',
  },
  
  dark: {
    scheduledBg: 'rgba(59, 130, 246, 0.15)',
    inProgressBg: 'rgba(245, 158, 11, 0.15)',
    completedBg: 'rgba(34, 197, 94, 0.15)',
    cancelledBg: 'rgba(239, 68, 68, 0.15)',
    confirmedBg: 'rgba(139, 92, 246, 0.15)',
  },
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
    body: 'Space Grotesk',
    mono: 'JetBrains Mono',
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
  
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
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
  lg: 10,
  xl: 14,
  full: 9999,
};

// ============================================================
// SHADOWS
// ============================================================

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  
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
// TRANSITIONS
// ============================================================

export const transitions = {
  fast: 150,
  normal: 200,
  slow: 300,
};

// ============================================================
// Z-INDEX
// ============================================================

export const zIndex = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
};

// ============================================================
// THEME HELPER
// ============================================================

export const getTheme = (isDark: boolean) => ({
  colors: isDark ? darkTheme : lightTheme,
  status: statusColors,
  tripStatus: tripStatusColors,
  drivers: driverColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Theme = ReturnType<typeof getTheme>;
export type ThemeColors = typeof lightTheme;
export type Palette = typeof palette;}