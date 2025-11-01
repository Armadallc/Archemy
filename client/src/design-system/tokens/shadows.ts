/**
 * HALCYON Design System - Shadow Tokens
 * 
 * This file defines the shadow system for depth, elevation, and visual hierarchy
 * in the HALCYON transportation management system.
 */

export const shadows = {
  // Box shadows (for cards, modals, etc.)
  box: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Drop shadows (for text, icons, etc.)
  drop: {
    none: 'none',
    sm: '0 1px 2px rgb(0 0 0 / 0.05)',
    base: '0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.06)',
    md: '0 4px 6px rgb(0 0 0 / 0.07), 0 2px 4px rgb(0 0 0 / 0.06)',
    lg: '0 10px 15px rgb(0 0 0 / 0.1), 0 4px 6px rgb(0 0 0 / 0.05)',
    xl: '0 20px 25px rgb(0 0 0 / 0.1), 0 8px 10px rgb(0 0 0 / 0.04)',
    '2xl': '0 25px 50px rgb(0 0 0 / 0.25)',
  },

  // Elevation system (for material design-like depth)
  elevation: {
    0: 'none',
    1: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
    2: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    3: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    4: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
    5: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },

  // Focus shadows (for accessibility)
  focus: {
    primary: '0 0 0 3px rgb(14 165 233 / 0.1)',      // Primary blue focus
    secondary: '0 0 0 3px rgb(100 116 139 / 0.1)',  // Secondary gray focus
    success: '0 0 0 3px rgb(34 197 94 / 0.1)',      // Success green focus
    warning: '0 0 0 3px rgb(245 158 11 / 0.1)',     // Warning yellow focus
    error: '0 0 0 3px rgb(239 68 68 / 0.1)',       // Error red focus
  },

  // Colored shadows (for special effects)
  colored: {
    primary: '0 4px 14px 0 rgb(14 165 233 / 0.15)',
    secondary: '0 4px 14px 0 rgb(100 116 139 / 0.15)',
    success: '0 4px 14px 0 rgb(34 197 94 / 0.15)',
    warning: '0 4px 14px 0 rgb(245 158 11 / 0.15)',
    error: '0 4px 14px 0 rgb(239 68 68 / 0.15)',
  },
} as const;

// Type definitions for better TypeScript support
export type BoxShadow = keyof typeof shadows.box;
export type DropShadow = keyof typeof shadows.drop;
export type Elevation = keyof typeof shadows.elevation;
export type FocusShadow = keyof typeof shadows.focus;
export type ColoredShadow = keyof typeof shadows.colored;

