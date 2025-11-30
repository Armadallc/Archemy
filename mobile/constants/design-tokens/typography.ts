/**
 * HALCYON Design System - Typography Tokens
 * 
 * Shared typography definitions for both web and mobile applications.
 * Uses Nohemi font family with a consistent scale.
 */

export const typography = {
  // Font Family
  fontFamily: {
    sans: 'Nohemi',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'Fira Code, monospace',
  },

  // Font Sizes (in pixels for mobile, rem for web)
  fontSize: {
    display: { web: 110, mobile: 68 },      // Display / Mega
    h1: { web: 68, mobile: 42 },             // H1 - Major Section
    h2: { web: 42, mobile: 32 },             // H2 - Subsection
    h3: { web: 26, mobile: 22 },             // H3 - Sub-subsection
    bodyLarge: { web: 20, mobile: 18 },      // Body Large
    body: { web: 16, mobile: 16 },           // Body - Default
    bodySmall: { web: 14, mobile: 14 },      // Body Small
    caption: { web: 12, mobile: 12 },        // Caption / Label
  },

  // Font Weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.2,
    normal: 1.3,
    relaxed: 1.4,
    loose: 1.5,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.02,
    tight: -0.01,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
  },

  // Typography Presets
  presets: {
    display: {
      fontSize: { web: 110, mobile: 68 },
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.02,
      textTransform: 'uppercase' as const,
    },
    h1: {
      fontSize: { web: 68, mobile: 42 },
      fontWeight: '700',
      lineHeight: 1.2,
      letterSpacing: -0.01,
      textTransform: 'uppercase' as const,
    },
    h2: {
      fontSize: { web: 42, mobile: 32 },
      fontWeight: '600',
      lineHeight: 1.3,
      letterSpacing: -0.01,
      textTransform: 'uppercase' as const,
    },
    h3: {
      fontSize: { web: 26, mobile: 22 },
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0,
      textTransform: 'uppercase' as const,
    },
    bodyLarge: {
      fontSize: { web: 20, mobile: 18 },
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none' as const,
    },
    body: {
      fontSize: { web: 16, mobile: 16 },
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none' as const,
    },
    bodySmall: {
      fontSize: { web: 14, mobile: 14 },
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none' as const,
    },
    caption: {
      fontSize: { web: 12, mobile: 12 },
      fontWeight: '600',
      lineHeight: 1.4,
      letterSpacing: 0.05,
      textTransform: 'uppercase' as const,
    },
  },
} as const;

export type TypographyPreset = keyof typeof typography.presets;
export type FontWeight = keyof typeof typography.fontWeight;

