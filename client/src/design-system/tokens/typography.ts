/**
 * HALCYON Design System - Typography Tokens
 * 
 * This file defines the typography scale, font families, and text styles
 * for the HALCYON transportation management system.
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ] as string[],
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Monaco',
      'Consolas',
      'Liberation Mono',
      'Courier New',
      'monospace',
    ] as string[],
    display: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ] as string[],
  },

  // Font Sizes (rem values)
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem',      // 128px
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
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Text Styles (Predefined combinations)
  textStyles: {
    // Display Styles (Large headings)
    'display-2xl': {
      fontSize: '4.5rem',      // 72px
      lineHeight: '1',
      fontWeight: '800',
      letterSpacing: '-0.025em',
    },
    'display-xl': {
      fontSize: '3.75rem',     // 60px
      lineHeight: '1',
      fontWeight: '800',
      letterSpacing: '-0.025em',
    },
    'display-lg': {
      fontSize: '3rem',        // 48px
      lineHeight: '1',
      fontWeight: '800',
      letterSpacing: '-0.025em',
    },
    'display-md': {
      fontSize: '2.25rem',     // 36px
      lineHeight: '1.2',
      fontWeight: '800',
      letterSpacing: '-0.025em',
    },
    'display-sm': {
      fontSize: '1.875rem',    // 30px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    'display-xs': {
      fontSize: '1.5rem',      // 24px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },

    // Heading Styles
    'heading-xl': {
      fontSize: '1.25rem',     // 20px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    'heading-lg': {
      fontSize: '1.125rem',    // 18px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    'heading-md': {
      fontSize: '1rem',        // 16px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    'heading-sm': {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    'heading-xs': {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },

    // Body Text Styles
    'body-xl': {
      fontSize: '1.25rem',     // 20px
      lineHeight: '1.5',
      fontWeight: '400',
    },
    'body-lg': {
      fontSize: '1.125rem',    // 18px
      lineHeight: '1.5',
      fontWeight: '400',
    },
    'body-md': {
      fontSize: '1rem',        // 16px
      lineHeight: '1.5',
      fontWeight: '400',
    },
    'body-sm': {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.5',
      fontWeight: '400',
    },
    'body-xs': {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1.5',
      fontWeight: '400',
    },

    // Label Styles
    'label-lg': {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.2',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },
    'label-md': {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1.2',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },
    'label-sm': {
      fontSize: '0.625rem',    // 10px
      lineHeight: '1.2',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },

    // Caption Styles
    'caption-lg': {
      fontSize: '0.875rem',    // 14px
      lineHeight: '1.2',
      fontWeight: '400',
    },
    'caption-md': {
      fontSize: '0.75rem',     // 12px
      lineHeight: '1.2',
      fontWeight: '400',
    },
    'caption-sm': {
      fontSize: '0.625rem',    // 10px
      lineHeight: '1.2',
      fontWeight: '400',
    },
  },
};

// Type definitions for better TypeScript support
export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type LineHeight = keyof typeof typography.lineHeight;
export type LetterSpacing = keyof typeof typography.letterSpacing;
export type TextStyle = keyof typeof typography.textStyles;
