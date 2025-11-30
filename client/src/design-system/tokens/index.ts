/**
 * HALCYON Design System - Design Tokens Index
 * 
 * This file exports all design tokens for the HALCYON transportation management system.
 * Import this file to access all design tokens in your components.
 */

// Import all design tokens
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';

// Export all design tokens
export { colors, typography, spacing, shadows };

// Re-export types for convenience
export type {
  ColorScale,
  SemanticColors,
  ColorToken,
} from './colors';

export type {
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  LetterSpacing,
  TextStyle,
} from './typography';

export type {
  SpacingScale,
  SemanticSpacing,
  BorderRadius,
  BorderWidth,
} from './spacing';

export type {
  BoxShadow,
  DropShadow,
  Elevation,
  FocusShadow,
  ColoredShadow,
} from './shadows';

// Combined design tokens object
export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
} as const;

// Type for the complete design tokens
export type DesignTokens = typeof designTokens;
