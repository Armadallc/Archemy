/**
 * HALCYON Design System - Color Tokens
 * 
 * Shared color definitions for both web and mobile applications.
 * These colors are used across the HALCYON transportation management system.
 */

export const halcyonColors = {
  // Primary Brand Colors
  primary: '#cc33ab',
  primaryForeground: '#ffffff',
  accent: '#33ccad',
  accentForeground: '#131320',
  destructive: '#cc5833',
  destructiveForeground: '#ffffff',

  // Trip Status Colors (same for light and dark)
  tripStatus: {
    scheduled: 'hsl(45, 100%, 51%)',
    inProgress: 'hsl(36, 100%, 50%)',
    completed: 'hsl(122, 39%, 49%)',
    cancelled: 'hsl(0, 84%, 60%)',
    confirmed: '#cc33ab',
  },

  // Driver Assignment Colors
  driverColors: {
    color1: '#8B5CF6',
    color2: '#EC4899',
    color3: '#06B6D4',
    color4: '#84CC16',
    color5: '#F97316',
    color6: '#6366F1',
  },
} as const;

export const lightTheme = {
  background: '#f5f5f5',
  foreground: '#131320',
  card: '#fafffb',
  cardForeground: '#131320',
  popover: '#ffffff',
  popoverForeground: '#131320',
  secondary: '#f3f3fc',
  secondaryForeground: '#131320',
  muted: '#f3f3fc',
  mutedForeground: '#131320',
  border: '#e1e5e7',
  input: '#e1e5e7',
  ring: '#cc33ab',
  sidebar: '#f3f3fc',
  sidebarForeground: '#131320',
  sidebarPrimary: '#cc33ab',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#33ccad',
  sidebarAccentForeground: '#131320',
  sidebarBorder: '#e1e5e7',
  sidebarRing: '#cc33ab',
  ...halcyonColors,
} as const;

export const darkTheme = {
  background: '#17171c',
  foreground: '#eeeff2',
  card: '#20222d',
  cardForeground: '#eeeff2',
  popover: '#252538',
  popoverForeground: '#eeeff2',
  secondary: '#252538',
  secondaryForeground: '#eeeff2',
  muted: '#1a1a2b',
  mutedForeground: '#888b9e',
  border: '#383854',
  input: '#383854',
  ring: '#cc33ab',
  sidebar: '#131320',
  sidebarForeground: '#eeeff2',
  sidebarPrimary: '#cc33ab',
  sidebarPrimaryForeground: '#ffffff',
  sidebarAccent: '#33ccad',
  sidebarAccentForeground: '#131320',
  sidebarBorder: '#383854',
  sidebarRing: '#cc33ab',
  ...halcyonColors,
} as const;

export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;
export type ThemeColors = LightTheme | DarkTheme;

