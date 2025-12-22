/**
 * Color Adapter for Full Calendar Integration
 * 
 * Maps full-calendar colors to Fire design system palette
 * Ensures all calendar colors align with HALCYON design system
 */

import { FireColor } from '../types';

/**
 * Fire Design System Color Palette
 * Core colors that must be used for calendar events
 */
export const FIRE_PALETTE = {
  coral: '#ff8475',      // Clinical groups
  lime: '#f1fec9',       // Life skills
  ice: '#e8fffe',        // Recreation
  charcoal: '#26282b',   // Medical
  silver: '#eaeaea',     // Administrative
} as const;

/**
 * Extended Fire Palette (for additional color variations)
 */
export const FIRE_PALETTE_EXTENDED = {
  ...FIRE_PALETTE,
  coralDark: '#e04850',
  coralLight: '#ff7a80',
  limeDark: '#d4e5a8',
  limeLight: '#f7ffdf',
  iceDark: '#b8e5e3',
  iceLight: '#f0fffe',
  charcoalLight: '#363a3e',
  charcoalLighter: '#464a4f',
  silverDark: '#d4d4d4',
  silverLight: '#f4f4f4',
} as const;

/**
 * Maps arbitrary color strings to Fire palette colors
 * Used when integrating external calendar components
 */
export const mapToFireColor = (color: string | undefined | null): FireColor => {
  if (!color) return 'silver'; // Default
  
  const normalizedColor = color.toLowerCase().trim();
  
  // Direct matches
  if (normalizedColor === 'coral' || normalizedColor === '#ff8475' || normalizedColor === 'ff8475') {
    return 'coral';
  }
  if (normalizedColor === 'lime' || normalizedColor === '#f1fec9' || normalizedColor === 'f1fec9') {
    return 'lime';
  }
  if (normalizedColor === 'ice' || normalizedColor === '#e8fffe' || normalizedColor === 'e8fffe') {
    return 'ice';
  }
  if (normalizedColor === 'charcoal' || normalizedColor === '#26282b' || normalizedColor === '26282b') {
    return 'charcoal';
  }
  if (normalizedColor === 'silver' || normalizedColor === '#eaeaea' || normalizedColor === 'eaeaea') {
    return 'silver';
  }
  
  // Semantic color mappings (common calendar colors)
  const colorMap: Record<string, FireColor> = {
    // Red variants → coral
    'red': 'coral',
    'rose': 'coral',
    'pink': 'coral',
    'orange': 'coral',
    
    // Green variants → lime
    'green': 'lime',
    'emerald': 'lime',
    'yellow': 'lime',
    'amber': 'lime',
    
    // Blue variants → ice
    'blue': 'ice',
    'cyan': 'ice',
    'sky': 'ice',
    'teal': 'ice',
    
    // Gray/Black variants → charcoal
    'gray': 'charcoal',
    'grey': 'charcoal',
    'slate': 'charcoal',
    'zinc': 'charcoal',
    'black': 'charcoal',
    
    // Light/Neutral variants → silver
    'white': 'silver',
    'neutral': 'silver',
    'stone': 'silver',
  };
  
  // Check for color name matches
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedColor.includes(key)) {
      return value;
    }
  }
  
  // Default to silver for unknown colors
  return 'silver';
};

/**
 * Converts FireColor to hex value
 */
export const fireColorToHex = (color: FireColor): string => {
  return FIRE_PALETTE[color];
};

/**
 * Converts FireColor to Tailwind classes (matching BentoBox pattern)
 */
export const fireColorToClasses = (color: FireColor): string => {
  const colorMap: Record<FireColor, string> = {
    coral: 'bg-[#ff8475]/20 text-[#ff8475] border-l-4 border-[#ff8475] hover:bg-[#ff8475]/30',
    lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8] hover:bg-[#f1fec9]/80 dark:text-[#26282b]',
    ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3] hover:bg-[#e8fffe]/80 dark:text-[#26282b]',
    charcoal: 'bg-[#26282b]/20 text-[#26282b] border-l-4 border-[#26282b] hover:bg-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]',
    silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4] hover:bg-[#eaeaea]/80 dark:text-[#26282b]',
  };
  return colorMap[color] || colorMap.silver;
};

/**
 * Validates that a color is part of the Fire palette
 */
export const isValidFireColor = (color: string): color is FireColor => {
  return ['coral', 'lime', 'ice', 'charcoal', 'silver'].includes(color);
};

