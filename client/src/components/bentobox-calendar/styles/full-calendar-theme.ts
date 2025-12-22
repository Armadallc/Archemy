/**
 * Full Calendar Theme Configuration
 * 
 * Ensures all full-calendar components use Fire design system colors
 * Prevents color conflicts with existing BentoBox styling
 */

import { FIRE_PALETTE } from '../adapters/color-adapter';

/**
 * Theme configuration for full-calendar components
 * All colors must align with Fire design system
 */
export const fullCalendarTheme = {
  // Core Fire palette colors
  colors: {
    primary: FIRE_PALETTE.coral,      // #ff8475 - Primary actions
    secondary: FIRE_PALETTE.lime,     // #f1fec9 - Secondary actions
    accent: FIRE_PALETTE.ice,         // #e8fffe - Accent elements
    dark: FIRE_PALETTE.charcoal,      // #26282b - Dark text/backgrounds
    light: FIRE_PALETTE.silver,       // #eaeaea - Light backgrounds
    background: '#f4f4f4',            // cloud - Main background
  },
  
  // Event color mapping (for calendar events)
  eventColors: {
    coral: FIRE_PALETTE.coral,        // Clinical
    lime: FIRE_PALETTE.lime,          // Life skills
    ice: FIRE_PALETTE.ice,            // Recreation
    charcoal: FIRE_PALETTE.charcoal,  // Medical
    silver: FIRE_PALETTE.silver,      // Administrative
  },
  
  // Border colors (matching BentoBox pattern)
  borders: {
    default: FIRE_PALETTE.silver,
    accent: FIRE_PALETTE.charcoal,
    primary: FIRE_PALETTE.coral,
  },
  
  // Text colors
  text: {
    primary: FIRE_PALETTE.charcoal,
    secondary: FIRE_PALETTE.charcoal,
    muted: FIRE_PALETTE.silver,
    inverse: FIRE_PALETTE.silver, // For dark backgrounds
  },
  
  // Background colors (with opacity for events)
  backgrounds: {
    coral: `${FIRE_PALETTE.coral}20`,      // 20% opacity
    lime: `${FIRE_PALETTE.lime}60`,        // 60% opacity
    ice: `${FIRE_PALETTE.ice}60`,          // 60% opacity
    charcoal: `${FIRE_PALETTE.charcoal}20`, // 20% opacity
    silver: `${FIRE_PALETTE.silver}60`,     // 60% opacity
  },
  
  // Hover states (matching BentoBox pattern)
  hover: {
    coral: `${FIRE_PALETTE.coral}30`,
    lime: `${FIRE_PALETTE.lime}80`,
    ice: `${FIRE_PALETTE.ice}80`,
    charcoal: `${FIRE_PALETTE.charcoal}30`,
    silver: `${FIRE_PALETTE.silver}80`,
  },
} as const;

/**
 * CSS Variables for full-calendar components
 * Can be injected into component styles
 */
export const fullCalendarCSSVars = {
  '--fc-primary-color': fullCalendarTheme.colors.primary,
  '--fc-secondary-color': fullCalendarTheme.colors.secondary,
  '--fc-accent-color': fullCalendarTheme.colors.accent,
  '--fc-dark-color': fullCalendarTheme.colors.dark,
  '--fc-light-color': fullCalendarTheme.colors.light,
  '--fc-background-color': fullCalendarTheme.colors.background,
} as const;

/**
 * Tailwind class mapping for full-calendar components
 * Ensures consistent styling with BentoBox
 */
export const fullCalendarTailwindClasses = {
  event: {
    coral: 'bg-[#ff8475]/20 text-[#ff8475] border-l-4 border-[#ff8475]',
    lime: 'bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8]',
    ice: 'bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3]',
    charcoal: 'bg-[#26282b]/20 text-[#26282b] border-l-4 border-[#26282b]',
    silver: 'bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4]',
  },
  hover: {
    coral: 'hover:bg-[#ff8475]/30',
    lime: 'hover:bg-[#f1fec9]/80',
    ice: 'hover:bg-[#e8fffe]/80',
    charcoal: 'hover:bg-[#26282b]/30',
    silver: 'hover:bg-[#eaeaea]/80',
  },
} as const;

