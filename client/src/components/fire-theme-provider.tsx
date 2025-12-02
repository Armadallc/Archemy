"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Your 6 Fire palette colors
const PALETTE = {
  charcoal: "#26282b",
  ice: "#e8fffe",
  lime: "#f1fec9",
  coral: "#ff555d",
  silver: "#eaeaea",
  cloud: "#f4f4f4",
} as const;

export type PaletteColor = keyof typeof PALETTE;

// Theme slots that users can configure
interface ThemeSlots {
  light: {
    pageBackground: PaletteColor; // Main page/body background
    background: PaletteColor; // Component backgrounds
    surface: PaletteColor;
    card: PaletteColor;
    cardText: PaletteColor;
    text: PaletteColor;
    accent: PaletteColor;
  };
  dark: {
    pageBackground: PaletteColor; // Main page/body background
    background: PaletteColor; // Component backgrounds
    surface: PaletteColor;
    card: PaletteColor;
    cardText: PaletteColor;
    text: PaletteColor;
    accent: PaletteColor;
  };
}

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
  },
  dark: {
    pageBackground: "charcoal", // Dark charcoal page background
    background: "charcoal",
    surface: "charcoal",
    card: "lime",
    cardText: "charcoal",
    text: "cloud",
    accent: "coral",
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
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "lime",
      cardText: "charcoal",
      text: "cloud",
      accent: "coral",
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
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "coral",
      cardText: "cloud",
      text: "ice",
      accent: "lime",
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
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "cloud",
      cardText: "charcoal",
      text: "cloud",
      accent: "coral",
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
    },
    dark: {
      pageBackground: "charcoal",
      background: "charcoal",
      surface: "charcoal",
      card: "charcoal",
      cardText: "lime",
      text: "silver",
      accent: "coral",
    },
  },
};

// Context
interface FireThemeContextType {
  theme: ThemeSlots;
  setSlot: (
    mode: "light" | "dark",
    slot: keyof ThemeSlots["light"],
    color: PaletteColor
  ) => void;
  loadPreset: (presetName: string) => void;
  reset: () => void;
  exportCSS: () => string;
  palette: typeof PALETTE;
  presetNames: string[];
}

const FireThemeContext = createContext<FireThemeContextType | null>(null);

// Apply theme to CSS variables
function applyTheme(theme: ThemeSlots) {
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
  
  // Border (derive from surface for subtle contrast)
  root.style.setProperty("--border", PALETTE[theme.light.surface]);
  
  // Secondary (use surface)
  root.style.setProperty("--secondary", PALETTE[theme.light.surface]);
  root.style.setProperty("--secondary-foreground", PALETTE[theme.light.text]);
  
  // Input (use card)
  root.style.setProperty("--input", PALETTE[theme.light.card]);
  root.style.setProperty("--input-border", PALETTE[theme.light.surface]);
  
  // Ring (focus states - use accent)
  root.style.setProperty("--ring", PALETTE[theme.light.accent]);
}

// Apply dark mode overrides when .dark class is present
function applyDarkMode(theme: ThemeSlots) {
  const root = document.documentElement;
  
  if (root.classList.contains("dark")) {
    // Core semantic variables
    root.style.setProperty("--page-background", PALETTE[theme.dark.pageBackground]); // Main page background
    root.style.setProperty("--background", PALETTE[theme.dark.background]);
    root.style.setProperty("--foreground", PALETTE[theme.dark.text]);
    root.style.setProperty("--card", PALETTE[theme.dark.card]);
    root.style.setProperty("--card-foreground", PALETTE[theme.dark.cardText]);
    root.style.setProperty("--primary", PALETTE[theme.dark.accent]);
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
    
    // Border
    root.style.setProperty("--border", PALETTE[theme.dark.surface]);
    
    // Secondary
    root.style.setProperty("--secondary", PALETTE[theme.dark.surface]);
    root.style.setProperty("--secondary-foreground", PALETTE[theme.dark.text]);
    
    // Input
    root.style.setProperty("--input", PALETTE[theme.dark.card]);
    root.style.setProperty("--input-border", PALETTE[theme.dark.surface]);
    
    // Ring (focus states)
    root.style.setProperty("--ring", PALETTE[theme.dark.accent]);
  } else {
    // Light mode fallback (when .dark class is removed)
    root.style.setProperty("--page-background", PALETTE[theme.light.pageBackground]); // Main page background
    root.style.setProperty("--background", PALETTE[theme.light.background]);
    root.style.setProperty("--foreground", PALETTE[theme.light.text]);
    root.style.setProperty("--card", PALETTE[theme.light.card]);
    root.style.setProperty("--card-foreground", PALETTE[theme.light.cardText]);
    root.style.setProperty("--primary", PALETTE[theme.light.accent]);
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
    
    root.style.setProperty("--border", PALETTE[theme.light.surface]);
    
    root.style.setProperty("--secondary", PALETTE[theme.light.surface]);
    root.style.setProperty("--secondary-foreground", PALETTE[theme.light.text]);
    
    root.style.setProperty("--input", PALETTE[theme.light.card]);
    root.style.setProperty("--input-border", PALETTE[theme.light.surface]);
    
    root.style.setProperty("--ring", PALETTE[theme.light.accent]);
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
          return JSON.parse(saved);
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

    return () => observer.disconnect();
  }, [theme]);

  const setSlot = (
    mode: "light" | "dark",
    slot: keyof ThemeSlots["light"],
    color: PaletteColor
  ) => {
    setTheme((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        [slot]: color,
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
        loadPreset,
        reset,
        exportCSS,
        palette: PALETTE,
        presetNames: Object.keys(PRESETS),
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

