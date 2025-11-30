"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme as useNextTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function useTheme() {
  const { theme, setTheme } = useNextTheme();
  
  return {
    theme: theme || "light",
    toggleTheme: () => {
      setTheme(theme === "light" ? "dark" : "light");
    },
  };
}

