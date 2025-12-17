"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      storageKey="halcyon-theme"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

export function useTheme() {
  // Safely get theme from next-themes, with fallback if it fails
  let theme: string | undefined;
  let setNextTheme: ((theme: string) => void) | undefined;
  let resolvedTheme: string | undefined;
  
  try {
    const nextTheme = useNextTheme();
    theme = nextTheme.theme;
    setNextTheme = nextTheme.setTheme;
    resolvedTheme = nextTheme.resolvedTheme;
  } catch (error) {
    console.error('Error initializing next-themes:', error);
    // Fallback values
    theme = 'light';
    setNextTheme = () => {};
    resolvedTheme = 'light';
  }
  
  const [mounted, setMounted] = useState(false);
  
  // Track if we're in Cursor's browser (heuristic: check if localStorage is restricted)
  const [isCursorBrowser, setIsCursorBrowser] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Detect if we're in Cursor's browser by checking localStorage access
    try {
      const testKey = '__cursor_browser_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (e) {
      setIsCursorBrowser(true);
      console.warn('⚠️ Cursor browser detected - localStorage may be restricted');
    }
  }, []);
  
  const setTheme = (newTheme: "light" | "dark" | "system") => {
    try {
      if (setNextTheme) {
        setNextTheme(newTheme);
      }
      
      // Always manually toggle dark class as fallback (works in all browsers)
      const root = document.documentElement;
      if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error setting theme:', error);
      // Fallback: manually toggle dark class
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };
  
  const toggleTheme = () => {
    try {
      const currentTheme = resolvedTheme || theme || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      
      if (setNextTheme) {
        setNextTheme(newTheme);
      }
      
      // Always manually toggle dark class as fallback (works in all browsers)
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
      // Fallback: manually toggle dark class
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
      } else {
        root.classList.add('dark');
      }
    }
  };
  
  // Return resolved theme (actual theme being used) or fallback to light
  const activeTheme = resolvedTheme || theme || "light";
  
  return {
    theme: activeTheme,
    setTheme,
    toggleTheme,
    mounted, // Useful for preventing hydration mismatches
  };
}

