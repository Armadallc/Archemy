"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { queryClient } from "../lib/queryClient";

// Your 8 Fire palette colors
const PALETTE = {
  charcoal: "#26282b",
  ice: "#e8fffe",
  lime: "#f1fec9",
  coral: "#ff8475",
  silver: "#eaeaea",
  cloud: "#f4f4f4",
  shadow: "#343434",
  aqua: "#a5c8ca",
} as const;

export type PaletteColor = keyof typeof PALETTE;

// Button style options
export type ButtonStyle = 'solid' | 'outline' | 'ghost';

// Border weight options
export type BorderWeight = 'none' | 'thin' | 'medium' | 'thick';

// Theme slots that users can configure
interface ThemeSlots {
  light: {
    pageBackground: PaletteColor; // Main page/body background
    background: PaletteColor; // Component backgrounds
    surface: PaletteColor; // Panels, sidebars, muted areas
    card: PaletteColor;
    cardText: PaletteColor;
    text: PaletteColor;
    accent: PaletteColor;
    // NEW: Button-specific controls
    buttonBackground: PaletteColor; // Button fill color
    buttonText: PaletteColor; // Button text color
    buttonBorder: PaletteColor; // Button border color
    buttonStyle: ButtonStyle; // solid, outline, or ghost
    buttonHover: PaletteColor; // Button hover color
    // NEW: Border controls
    borderColor: PaletteColor; // Global border color
    borderWeight: BorderWeight; // Border thickness
  };
  dark: {
    pageBackground: PaletteColor; // Main page/body background
    background: PaletteColor; // Component backgrounds
    surface: PaletteColor; // Panels, sidebars, muted areas
    card: PaletteColor;
    cardText: PaletteColor;
    text: PaletteColor;
    accent: PaletteColor;
    // NEW: Button-specific controls
    buttonBackground: PaletteColor; // Button fill color
    buttonText: PaletteColor; // Button text color
    buttonBorder: PaletteColor; // Button border color
    buttonStyle: ButtonStyle; // solid, outline, or ghost
    // NEW: Border controls
    borderColor: PaletteColor; // Global border color
    borderWeight: BorderWeight; // Border thickness
  };
}

// Border weight to CSS value mapping
const BORDER_WEIGHTS: Record<BorderWeight, string> = {
  none: '0px',
  thin: '1px',
  medium: '2px',
  thick: '3px',
};

// Default theme configuration
const DEFAULT_THEME: ThemeSlots = {
  light: {
    pageBackground: "silver", // Light gray page background
    background: "cloud",
    surface: "silver",
    card: "lime",
    cardText: "charcoal",
    text: "charcoal",
    accent: "coral",
    // Button defaults
    buttonBackground: "coral", // Solid coral buttons
    buttonText: "cloud", // White text on buttons
    buttonBorder: "coral", // Coral border
    buttonStyle: "solid",
    // Border defaults
    borderColor: "silver",
    borderWeight: "thin",
  },
  dark: {
    pageBackground: "charcoal", // Dark charcoal page background
    background: "charcoal",
    surface: "charcoal",
    card: "lime",
    cardText: "charcoal",
    text: "cloud",
    accent: "coral",
    // Button defaults
    buttonBackground: "coral", // Solid coral buttons
    buttonText: "cloud", // White text on buttons
    buttonBorder: "coral", // Coral border
    buttonStyle: "solid",
    buttonHover: "coral", // Button hover color (same as background by default)
    // Border defaults
    borderColor: "charcoal",
    borderWeight: "thin",
  },
};

// Preset themes
export const PRESETS: Record<string, ThemeSlots> = {
  "Lime Light": {
    light: {
      pageBackground: "cloud",
      background: "lime",
      surface: "cloud",
      card: "charcoal",
      cardText: "lime",
      text: "charcoal",
      accent: "coral",
      buttonBackground: "coral",
      buttonText: "cloud",
      buttonBorder: "coral",
      buttonStyle: "solid",
      borderColor: "silver",
      borderWeight: "thin",
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "lime",
      cardText: "charcoal",
      text: "cloud",
      accent: "coral",
      buttonBackground: "coral",
      buttonText: "cloud",
      buttonBorder: "coral",
      buttonStyle: "solid",
      borderColor: "charcoal",
      borderWeight: "thin",
    },
  },
  "Ice Coral": {
    light: {
      pageBackground: "silver",
      background: "ice",
      surface: "cloud",
      card: "coral",
      cardText: "cloud",
      text: "charcoal",
      accent: "charcoal",
      buttonBackground: "charcoal",
      buttonText: "ice",
      buttonBorder: "charcoal",
      buttonStyle: "solid",
      borderColor: "ice",
      borderWeight: "thin",
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "coral",
      cardText: "cloud",
      text: "ice",
      accent: "lime",
      buttonBackground: "coral",
      buttonText: "cloud",
      buttonBorder: "coral",
      buttonStyle: "solid",
      borderColor: "charcoal",
      borderWeight: "thin",
    },
  },
  "Cloud Minimal": {
    light: {
      pageBackground: "silver",
      background: "cloud",
      surface: "silver",
      card: "charcoal",
      cardText: "cloud",
      text: "charcoal",
      accent: "coral",
      buttonBackground: "charcoal",
      buttonText: "cloud",
      buttonBorder: "charcoal",
      buttonStyle: "outline",
      borderColor: "silver",
      borderWeight: "thin",
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "cloud",
      cardText: "charcoal",
      text: "cloud",
      accent: "coral",
      buttonBackground: "cloud",
      buttonText: "charcoal",
      buttonBorder: "cloud",
      buttonStyle: "outline",
      borderColor: "charcoal",
      borderWeight: "thin",
    },
  },
  "Charcoal Pro": {
    light: {
      pageBackground: "cloud",
      background: "silver",
      surface: "cloud",
      card: "charcoal",
      cardText: "lime",
      text: "charcoal",
      accent: "coral",
      buttonBackground: "coral",
      buttonText: "cloud",
      buttonBorder: "coral",
      buttonStyle: "solid",
      borderColor: "charcoal",
      borderWeight: "medium",
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "charcoal",
      cardText: "lime",
      text: "silver",
      accent: "coral",
      buttonBackground: "coral",
      buttonText: "cloud",
      buttonBorder: "lime",
      buttonStyle: "solid",
      borderColor: "lime",
      borderWeight: "thin",
    },
  },
};

// Context
interface FireThemeContextType {
  theme: ThemeSlots;
  setSlot: (
    mode: "light" | "dark",
    slot: keyof ThemeSlots["light"],
    value: PaletteColor | ButtonStyle | BorderWeight
  ) => void;
  setButtonStyle: (mode: "light" | "dark", style: ButtonStyle) => void;
  setBorderWeight: (mode: "light" | "dark", weight: BorderWeight) => void;
  loadPreset: (presetName: string) => void;
  reset: () => void;
  exportCSS: () => string;
  palette: typeof PALETTE;
  presetNames: string[];
  buttonStyles: ButtonStyle[];
  borderWeights: BorderWeight[];
}

const FireThemeContext = createContext<FireThemeContextType | null>(null);

// Apply theme to CSS variables
function applyTheme(theme: ThemeSlots) {
  // Check if useSelectedTheme has applied a database theme
  // If so, skip applying FireThemeProvider's theme to avoid conflicts
  const selectedThemeData = queryClient.getQueryData(['/api/themes/user/selection']);
  
  if (selectedThemeData && selectedThemeData.theme) {
    // Database theme is active - don't override it
    return;
  }
  
  const root = document.documentElement;

  // Light mode variables (applied to :root)
  root.style.setProperty("--fire-light-page-background", PALETTE[theme.light.pageBackground]);
  root.style.setProperty("--fire-light-background", PALETTE[theme.light.background]);
  root.style.setProperty("--fire-light-surface", PALETTE[theme.light.surface]);
  root.style.setProperty("--fire-light-card", PALETTE[theme.light.card]);
  root.style.setProperty("--fire-light-card-text", PALETTE[theme.light.cardText]);
  root.style.setProperty("--fire-light-text", PALETTE[theme.light.text]);
  root.style.setProperty("--fire-light-accent", PALETTE[theme.light.accent]);

  // Dark mode variables
  root.style.setProperty("--fire-dark-page-background", PALETTE[theme.dark.pageBackground]);
  root.style.setProperty("--fire-dark-background", PALETTE[theme.dark.background]);
  root.style.setProperty("--fire-dark-surface", PALETTE[theme.dark.surface]);
  root.style.setProperty("--fire-dark-card", PALETTE[theme.dark.card]);
  root.style.setProperty("--fire-dark-card-text", PALETTE[theme.dark.cardText]);
  root.style.setProperty("--fire-dark-text", PALETTE[theme.dark.text]);
  root.style.setProperty("--fire-dark-accent", PALETTE[theme.dark.accent]);

  // Also apply directly to semantic variables for immediate effect
  // These get overridden by .dark class when in dark mode
  root.style.setProperty("--page-background", PALETTE[theme.light.pageBackground]); // Main page background
  root.style.setProperty("--background", PALETTE[theme.light.background]);
  root.style.setProperty("--foreground", PALETTE[theme.light.text]);
  root.style.setProperty("--card", PALETTE[theme.light.card]);
  root.style.setProperty("--card-foreground", PALETTE[theme.light.cardText]);
  root.style.setProperty("--primary", PALETTE[theme.light.accent]);
  root.style.setProperty("--surface", PALETTE[theme.light.surface]);
  root.style.setProperty("--surface-elevated", PALETTE[theme.light.card]);
  root.style.setProperty("--accent", PALETTE[theme.light.accent]);
  
  // Extended coverage for components using other variable names
  // Sidebar
  root.style.setProperty("--sidebar", PALETTE[theme.light.background]);
  root.style.setProperty("--sidebar-background", PALETTE[theme.light.background]);
  root.style.setProperty("--sidebar-foreground", PALETTE[theme.light.text]);
  root.style.setProperty("--sidebar-primary", PALETTE[theme.light.accent]);
  
  // Muted variants (use surface)
  root.style.setProperty("--muted", PALETTE[theme.light.surface]);
  root.style.setProperty("--muted-foreground", PALETTE[theme.light.text]);
  root.style.setProperty("--surface-muted", PALETTE[theme.light.surface]);
  
  // Popover (use card)
  root.style.setProperty("--popover", PALETTE[theme.light.card]);
  root.style.setProperty("--popover-foreground", PALETTE[theme.light.cardText]);
  
  // Border - NOW SEPARATE from surface
  root.style.setProperty("--border", PALETTE[theme.light.borderColor]);
  root.style.setProperty("--border-weight", BORDER_WEIGHTS[theme.light.borderWeight]);
  
  // Secondary (use surface)
  root.style.setProperty("--secondary", PALETTE[theme.light.surface]);
  root.style.setProperty("--secondary-foreground", PALETTE[theme.light.text]);
  
  // Input (use surface for background, separate border)
  root.style.setProperty("--input", PALETTE[theme.light.surface]);
  root.style.setProperty("--input-border", PALETTE[theme.light.borderColor]);
  
  // Ring (focus states - use accent)
  root.style.setProperty("--ring", PALETTE[theme.light.accent]);
  
  // NEW: Button-specific variables
  root.style.setProperty("--button-background", PALETTE[theme.light.buttonBackground]);
  root.style.setProperty("--button-foreground", PALETTE[theme.light.buttonText]);
  root.style.setProperty("--button-border", PALETTE[theme.light.buttonBorder]);
  root.style.setProperty("--button-hover", PALETTE[theme.light.buttonHover || theme.light.buttonBackground]);
  root.style.setProperty("--button-style", theme.light.buttonStyle);
  
  // Primary button uses button colors (not surface!)
  root.style.setProperty("--primary", PALETTE[theme.light.buttonBackground]);
  root.style.setProperty("--primary-foreground", PALETTE[theme.light.buttonText]);
}

// Apply dark mode overrides when .dark class is present
function applyDarkMode(theme: ThemeSlots) {
  const root = document.documentElement;
  
  // Check if useSelectedTheme has applied a database theme
  // If so, skip applying FireThemeProvider's theme to avoid conflicts
  const selectedThemeData = queryClient.getQueryData(['/api/themes/user/selection']);
  
  if (selectedThemeData && selectedThemeData.theme) {
    // Database theme is active - don't override it
    return;
  }
  
  // Also check DOM for database theme indicators as fallback
  const hasDatabaseTheme = document.getElementById('dark-mode-custom-styles');
  if (hasDatabaseTheme && hasDatabaseTheme.textContent && hasDatabaseTheme.textContent.trim().length > 0) {
    // Database theme is active - don't override it
    return;
  }
  
  if (root.classList.contains("dark")) {
    // Core semantic variables
    root.style.setProperty("--page-background", PALETTE[theme.dark.pageBackground]); // Main page background
    root.style.setProperty("--background", PALETTE[theme.dark.background]);
    root.style.setProperty("--foreground", PALETTE[theme.dark.text]);
    root.style.setProperty("--card", PALETTE[theme.dark.card]);
    root.style.setProperty("--card-foreground", PALETTE[theme.dark.cardText]);
    root.style.setProperty("--surface", PALETTE[theme.dark.surface]);
    root.style.setProperty("--surface-elevated", PALETTE[theme.dark.card]);
    root.style.setProperty("--accent", PALETTE[theme.dark.accent]);
    
    // Extended coverage for dark mode
    // Sidebar
    root.style.setProperty("--sidebar", PALETTE[theme.dark.background]);
    root.style.setProperty("--sidebar-background", PALETTE[theme.dark.background]);
    root.style.setProperty("--sidebar-foreground", PALETTE[theme.dark.text]);
    root.style.setProperty("--sidebar-primary", PALETTE[theme.dark.accent]);
    
    // Muted variants
    root.style.setProperty("--muted", PALETTE[theme.dark.surface]);
    root.style.setProperty("--muted-foreground", PALETTE[theme.dark.text]);
    root.style.setProperty("--surface-muted", PALETTE[theme.dark.surface]);
    
    // Popover
    root.style.setProperty("--popover", PALETTE[theme.dark.card]);
    root.style.setProperty("--popover-foreground", PALETTE[theme.dark.cardText]);
    
    // Border - NOW SEPARATE from surface
    root.style.setProperty("--border", PALETTE[theme.dark.borderColor]);
    root.style.setProperty("--border-weight", BORDER_WEIGHTS[theme.dark.borderWeight]);
    
    // Secondary
    root.style.setProperty("--secondary", PALETTE[theme.dark.surface]);
    root.style.setProperty("--secondary-foreground", PALETTE[theme.dark.text]);
    
    // Input
    root.style.setProperty("--input", PALETTE[theme.dark.surface]);
    root.style.setProperty("--input-border", PALETTE[theme.dark.borderColor]);
    
    // Ring (focus states)
    root.style.setProperty("--ring", PALETTE[theme.dark.accent]);
    
    // NEW: Button-specific variables for dark mode
    root.style.setProperty("--button-background", PALETTE[theme.dark.buttonBackground]);
    root.style.setProperty("--button-foreground", PALETTE[theme.dark.buttonText]);
    root.style.setProperty("--button-border", PALETTE[theme.dark.buttonBorder]);
    root.style.setProperty("--button-hover", PALETTE[theme.dark.buttonHover || theme.dark.buttonBackground]);
    root.style.setProperty("--button-style", theme.dark.buttonStyle);
    
    // Primary button uses button colors (not surface!)
    root.style.setProperty("--primary", PALETTE[theme.dark.buttonBackground]);
    root.style.setProperty("--primary-foreground", PALETTE[theme.dark.buttonText]);
  } else {
    // Light mode fallback (when .dark class is removed)
    root.style.setProperty("--page-background", PALETTE[theme.light.pageBackground]); // Main page background
    root.style.setProperty("--background", PALETTE[theme.light.background]);
    root.style.setProperty("--foreground", PALETTE[theme.light.text]);
    root.style.setProperty("--card", PALETTE[theme.light.card]);
    root.style.setProperty("--card-foreground", PALETTE[theme.light.cardText]);
    root.style.setProperty("--surface", PALETTE[theme.light.surface]);
    root.style.setProperty("--surface-elevated", PALETTE[theme.light.card]);
    root.style.setProperty("--accent", PALETTE[theme.light.accent]);
    
    // Extended coverage for light mode
    root.style.setProperty("--sidebar", PALETTE[theme.light.background]);
    root.style.setProperty("--sidebar-background", PALETTE[theme.light.background]);
    root.style.setProperty("--sidebar-foreground", PALETTE[theme.light.text]);
    root.style.setProperty("--sidebar-primary", PALETTE[theme.light.accent]);
    
    root.style.setProperty("--muted", PALETTE[theme.light.surface]);
    root.style.setProperty("--muted-foreground", PALETTE[theme.light.text]);
    root.style.setProperty("--surface-muted", PALETTE[theme.light.surface]);
    
    root.style.setProperty("--popover", PALETTE[theme.light.card]);
    root.style.setProperty("--popover-foreground", PALETTE[theme.light.cardText]);
    
    // Border - NOW SEPARATE from surface
    root.style.setProperty("--border", PALETTE[theme.light.borderColor]);
    root.style.setProperty("--border-weight", BORDER_WEIGHTS[theme.light.borderWeight]);
    
    root.style.setProperty("--secondary", PALETTE[theme.light.surface]);
    root.style.setProperty("--secondary-foreground", PALETTE[theme.light.text]);
    
    root.style.setProperty("--input", PALETTE[theme.light.surface]);
    root.style.setProperty("--input-border", PALETTE[theme.light.borderColor]);
    
    root.style.setProperty("--ring", PALETTE[theme.light.accent]);
    
    // NEW: Button-specific variables for light mode
    root.style.setProperty("--button-background", PALETTE[theme.light.buttonBackground]);
    root.style.setProperty("--button-foreground", PALETTE[theme.light.buttonText]);
    root.style.setProperty("--button-border", PALETTE[theme.light.buttonBorder]);
    root.style.setProperty("--button-style", theme.light.buttonStyle);
    
    // Primary button uses button colors (not surface!)
    root.style.setProperty("--primary", PALETTE[theme.light.buttonBackground]);
    root.style.setProperty("--primary-foreground", PALETTE[theme.light.buttonText]);
  }
}

// Provider component
export function FireThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSlots>(() => {
    // Load from localStorage on init
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fire-theme");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Merge with defaults to ensure all new properties exist
          return {
            light: { ...DEFAULT_THEME.light, ...parsed.light },
            dark: { ...DEFAULT_THEME.dark, ...parsed.dark },
          };
        } catch {
          return DEFAULT_THEME;
        }
      }
    }
    return DEFAULT_THEME;
  });

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(theme);
    applyDarkMode(theme);
    localStorage.setItem("fire-theme", JSON.stringify(theme));
  }, [theme]);

  // Watch for dark mode class changes (from next-themes)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          applyDarkMode(theme);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Also listen for custom theme-toggle events (for Cursor browser workaround)
    const handleThemeToggle = () => {
      // Small delay to ensure class has been applied
      setTimeout(() => {
        applyDarkMode(theme);
      }, 10);
    };
    
    window.addEventListener('theme-toggle', handleThemeToggle);

    return () => {
      observer.disconnect();
      window.removeEventListener('theme-toggle', handleThemeToggle);
    };
  }, [theme]);

  const setSlot = (
    mode: "light" | "dark",
    slot: keyof ThemeSlots["light"],
    value: PaletteColor | ButtonStyle | BorderWeight
  ) => {
    setTheme((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [slot]: value,
      },
    }));
  };

  const setButtonStyle = (mode: "light" | "dark", style: ButtonStyle) => {
    setTheme((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        buttonStyle: style,
      },
    }));
  };

  const setBorderWeight = (mode: "light" | "dark", weight: BorderWeight) => {
    setTheme((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        borderWeight: weight,
      },
    }));
  };

  const loadPreset = (presetName: string) => {
    const preset = PRESETS[presetName];
    if (preset) {
      setTheme(preset);
    }
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
  };

  const exportCSS = () => {
    return `/* Fire Theme Export - Extended Coverage */
:root {
  /* Page background (main body/page area) */
  --page-background: ${PALETTE[theme.light.pageBackground]};
  
  /* Core semantic variables */
  --background: ${PALETTE[theme.light.background]};
  --foreground: ${PALETTE[theme.light.text]};
  --card: ${PALETTE[theme.light.card]};
  --card-foreground: ${PALETTE[theme.light.cardText]};
  --primary: ${PALETTE[theme.light.accent]};
  --surface: ${PALETTE[theme.light.surface]};
  --surface-elevated: ${PALETTE[theme.light.card]};
  --accent: ${PALETTE[theme.light.accent]};
  
  /* Sidebar */
  --sidebar: ${PALETTE[theme.light.background]};
  --sidebar-background: ${PALETTE[theme.light.background]};
  --sidebar-foreground: ${PALETTE[theme.light.text]};
  --sidebar-primary: ${PALETTE[theme.light.accent]};
  
  /* Muted variants */
  --muted: ${PALETTE[theme.light.surface]};
  --muted-foreground: ${PALETTE[theme.light.text]};
  --surface-muted: ${PALETTE[theme.light.surface]};
  
  /* Popover */
  --popover: ${PALETTE[theme.light.card]};
  --popover-foreground: ${PALETTE[theme.light.cardText]};
  
  /* Border */
  --border: ${PALETTE[theme.light.surface]};
  
  /* Secondary */
  --secondary: ${PALETTE[theme.light.surface]};
  --secondary-foreground: ${PALETTE[theme.light.text]};
  
  /* Input */
  --input: ${PALETTE[theme.light.card]};
  --input-border: ${PALETTE[theme.light.surface]};
  
  /* Ring (focus states) */
  --ring: ${PALETTE[theme.light.accent]};
}

.dark {
  /* Page background (main body/page area) */
  --page-background: ${PALETTE[theme.dark.pageBackground]};
  
  /* Core semantic variables */
  --background: ${PALETTE[theme.dark.background]};
  --foreground: ${PALETTE[theme.dark.text]};
  --card: ${PALETTE[theme.dark.card]};
  --card-foreground: ${PALETTE[theme.dark.cardText]};
  --primary: ${PALETTE[theme.dark.accent]};
  --surface: ${PALETTE[theme.dark.surface]};
  --surface-elevated: ${PALETTE[theme.dark.card]};
  --accent: ${PALETTE[theme.dark.accent]};
  
  /* Sidebar */
  --sidebar: ${PALETTE[theme.dark.background]};
  --sidebar-background: ${PALETTE[theme.dark.background]};
  --sidebar-foreground: ${PALETTE[theme.dark.text]};
  --sidebar-primary: ${PALETTE[theme.dark.accent]};
  
  /* Muted variants */
  --muted: ${PALETTE[theme.dark.surface]};
  --muted-foreground: ${PALETTE[theme.dark.text]};
  --surface-muted: ${PALETTE[theme.dark.surface]};
  
  /* Popover */
  --popover: ${PALETTE[theme.dark.card]};
  --popover-foreground: ${PALETTE[theme.dark.cardText]};
  
  /* Border */
  --border: ${PALETTE[theme.dark.surface]};
  
  /* Secondary */
  --secondary: ${PALETTE[theme.dark.surface]};
  --secondary-foreground: ${PALETTE[theme.dark.text]};
  
  /* Input */
  --input: ${PALETTE[theme.dark.card]};
  --input-border: ${PALETTE[theme.dark.surface]};
  
  /* Ring (focus states) */
  --ring: ${PALETTE[theme.dark.accent]};
}`;
  };

  return (
    <FireThemeContext.Provider
      value={{
        theme,
        setSlot,
        setButtonStyle,
        setBorderWeight,
        loadPreset,
        reset,
        exportCSS,
        palette: PALETTE,
        presetNames: Object.keys(PRESETS),
        buttonStyles: ['solid', 'outline', 'ghost'] as ButtonStyle[],
        borderWeights: ['none', 'thin', 'medium', 'thick'] as BorderWeight[],
      }}
    >
      {children}
    </FireThemeContext.Provider>
  );
}

// Hook to use the Fire theme
export function useFireTheme() {
  const context = useContext(FireThemeContext);
  if (!context) {
    throw new Error("useFireTheme must be used within FireThemeProvider");
  }
  return context;
}

// Export types
export type { ThemeSlots };

