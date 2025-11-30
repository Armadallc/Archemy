/**
 * HALCYON Mobile Typography Constants
 * 
 * React Native StyleSheet-compatible typography helpers
 * Imported from shared design tokens and adapted for mobile use.
 */

import { typography } from './design-tokens/typography';
import { TextStyle } from 'react-native';

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

/**
 * Typography presets for React Native StyleSheet
 */
export const textStyles = {
  display: {
    fontFamily: getFontFamilyByWeight(typography.presets.display.fontWeight),
    fontSize: typography.presets.display.fontSize.mobile,
    fontWeight: typography.presets.display.fontWeight as any,
    lineHeight: typography.presets.display.lineHeight * typography.presets.display.fontSize.mobile,
    letterSpacing: typography.presets.display.letterSpacing,
    textTransform: typography.presets.display.textTransform,
  } as TextStyle,

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

export const fontFamily = 'Nohemi-Regular';

