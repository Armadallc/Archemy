/**
 * HALCYON Design System - Spacing Tokens
 * 
 * This file defines the spacing scale for consistent layout and spacing
 * throughout the HALCYON transportation management system.
 */

export const spacing = {
  // Base spacing scale (rem values)
  scale: {
    0: '0',           // 0px
    1: '0.25rem',     // 4px
    2: '0.5rem',      // 8px
    3: '0.75rem',     // 12px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // Semantic spacing (commonly used combinations)
  semantic: {
    // Component spacing
    component: {
      xs: '0.5rem',      // 8px - Very tight spacing
      sm: '0.75rem',     // 12px - Tight spacing
      md: '1rem',        // 16px - Default spacing
      lg: '1.5rem',      // 24px - Loose spacing
      xl: '2rem',        // 32px - Very loose spacing
    },

    // Layout spacing
    layout: {
      xs: '1rem',        // 16px - Tight layout spacing
      sm: '1.5rem',      // 24px - Default layout spacing
      md: '2rem',        // 32px - Loose layout spacing
      lg: '3rem',        // 48px - Very loose layout spacing
      xl: '4rem',        // 64px - Extra loose layout spacing
    },

    // Section spacing
    section: {
      xs: '2rem',        // 32px - Tight section spacing
      sm: '3rem',        // 48px - Default section spacing
      md: '4rem',        // 64px - Loose section spacing
      lg: '6rem',        // 96px - Very loose section spacing
      xl: '8rem',        // 128px - Extra loose section spacing
    },

    // Container spacing
    container: {
      xs: '1rem',        // 16px - Tight container padding
      sm: '1.5rem',      // 24px - Default container padding
      md: '2rem',        // 32px - Loose container padding
      lg: '3rem',        // 48px - Very loose container padding
      xl: '4rem',        // 64px - Extra loose container padding
    },
  },

  // Border radius (for rounded corners)
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    base: '0.25rem',    // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px',     // Fully rounded
  },

  // Border width
  borderWidth: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
} as const;

// Type definitions for better TypeScript support
export type SpacingScale = keyof typeof spacing.scale;
export type SemanticSpacing = keyof typeof spacing.semantic.component;
export type BorderRadius = keyof typeof spacing.borderRadius;
export type BorderWidth = keyof typeof spacing.borderWidth;

