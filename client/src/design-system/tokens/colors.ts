/**
 * HALCYON Design System - Color Tokens
 * 
 * This file defines the color palette for the HALCYON transportation management system.
 * Colors are organized by semantic meaning and usage context.
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',   // Lightest blue
    100: '#e0f2fe',  // Very light blue
    200: '#bae6fd',  // Light blue
    300: '#7dd3fc',  // Medium light blue
    400: '#38bdf8',  // Medium blue
    500: '#0ea5e9',  // Primary blue (main brand color)
    600: '#0284c7',  // Darker blue
    700: '#0369a1',  // Dark blue
    800: '#075985',  // Very dark blue
    900: '#0c4a6e',  // Darkest blue
  },

  // Secondary Colors (Complementary)
  secondary: {
    50: '#f8fafc',   // Lightest gray
    100: '#f1f5f9',  // Very light gray
    200: '#e2e8f0',  // Light gray
    300: '#cbd5e1',  // Medium light gray
    400: '#94a3b8',  // Medium gray
    500: '#64748b',  // Primary gray
    600: '#475569',  // Darker gray
    700: '#334155',  // Dark gray
    800: '#1e293b',  // Very dark gray
    900: '#0f172a',  // Darkest gray
  },

  // Success Colors (Green)
  success: {
    50: '#f0fdf4',   // Lightest green
    100: '#dcfce7',  // Very light green
    200: '#bbf7d0',  // Light green
    300: '#86efac',  // Medium light green
    400: '#4ade80',  // Medium green
    500: '#22c55e',  // Primary green
    600: '#16a34a',  // Darker green
    700: '#15803d',  // Dark green
    800: '#166534',  // Very dark green
    900: '#14532d',  // Darkest green
  },

  // Warning Colors (Yellow/Orange)
  warning: {
    50: '#fffbeb',   // Lightest yellow
    100: '#fef3c7',  // Very light yellow
    200: '#fde68a',  // Light yellow
    300: '#fcd34d',  // Medium light yellow
    400: '#fbbf24',  // Medium yellow
    500: '#f59e0b',  // Primary yellow
    600: '#d97706',  // Darker yellow
    700: '#b45309',  // Dark yellow
    800: '#92400e',  // Very dark yellow
    900: '#78350f',  // Darkest yellow
  },

  // Error Colors (Red)
  error: {
    50: '#fef2f2',   // Lightest red
    100: '#fee2e2',  // Very light red
    200: '#fecaca',  // Light red
    300: '#fca5a5',  // Medium light red
    400: '#f87171',  // Medium red
    500: '#ef4444',  // Primary red
    600: '#dc2626',  // Darker red
    700: '#b91c1c',  // Dark red
    800: '#991b1b',  // Very dark red
    900: '#7f1d1d',  // Darkest red
  },

  // Info Colors (Blue)
  info: {
    50: '#eff6ff',   // Lightest blue
    100: '#dbeafe',  // Very light blue
    200: '#bfdbfe',  // Light blue
    300: '#93c5fd',  // Medium light blue
    400: '#60a5fa',  // Medium blue
    500: '#3b82f6',  // Primary blue
    600: '#2563eb',  // Darker blue
    700: '#1d4ed8',  // Dark blue
    800: '#1e40af',  // Very dark blue
    900: '#1e3a8a',  // Darkest blue
  },

  // Neutral Colors (Gray Scale)
  neutral: {
    50: '#fafafa',   // Lightest gray
    100: '#f5f5f5',  // Very light gray
    200: '#e5e5e5',  // Light gray
    300: '#d4d4d4',  // Medium light gray
    400: '#a3a3a3',  // Medium gray
    500: '#737373',  // Primary gray
    600: '#525252',  // Darker gray
    700: '#404040',  // Dark gray
    800: '#262626',  // Very dark gray
    900: '#171717',  // Darkest gray
  },

  // Semantic Color Mappings
  semantic: {
    // Background Colors
    background: {
      primary: '#ffffff',      // White background
      secondary: '#f8fafc',    // Light gray background
      tertiary: '#f1f5f9',    // Very light gray background
      dark: '#0f172a',        // Dark background
    },

    // Text Colors
    text: {
      primary: '#0f172a',      // Dark text
      secondary: '#475569',    // Medium gray text
      tertiary: '#94a3b8',    // Light gray text
      inverse: '#ffffff',     // White text (for dark backgrounds)
      disabled: '#cbd5e1',    // Disabled text
    },

    // Border Colors
    border: {
      primary: '#e2e8f0',     // Light border
      secondary: '#cbd5e1',   // Medium border
      focus: '#0ea5e9',       // Focus border (primary blue)
      error: '#ef4444',       // Error border (red)
      success: '#22c55e',     // Success border (green)
    },

    // Status Colors
    status: {
      active: '#22c55e',      // Active status (green)
      inactive: '#94a3b8',    // Inactive status (gray)
      pending: '#f59e0b',     // Pending status (yellow)
      error: '#ef4444',       // Error status (red)
      warning: '#f59e0b',     // Warning status (yellow)
      info: '#3b82f6',        // Info status (blue)
    },
  },
} as const;

// Type definitions for better TypeScript support
export type ColorScale = typeof colors.primary;
export type SemanticColors = typeof colors.semantic;
export type ColorToken = keyof typeof colors;

