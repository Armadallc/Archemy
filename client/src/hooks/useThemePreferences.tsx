/**
 * useThemePreferences Hook
 * 
 * Manages loading and applying user-specific theme customizations
 * for both light and dark modes from the database.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTheme } from '../components/theme-provider';
import { queryClient } from '../lib/queryClient';

interface ThemeTokens {
  [key: string]: any;
}

interface ThemePreferences {
  id: string;
  user_id: string;
  light_mode_tokens: ThemeTokens | null;
  dark_mode_tokens: ThemeTokens | null;
  created_at: string;
  updated_at: string;
}

// Mapping function to convert design token paths to CSS variable names
const getCssVariableName = (path: string): string | null => {
  const mapping: Record<string, string> = {
    'colors.semantic.background.primary': '--background',
    'colors.semantic.text.primary': '--foreground',
    'colors.semantic.background.secondary': '--card',
    'colors.semantic.text.secondary': '--card-foreground',
    'colors.semantic.background.tertiary': '--popover',
    'colors.semantic.text.tertiary': '--popover-foreground',
    'colors.primary.500': '--primary',
    'colors.semantic.text.inverse': '--primary-foreground',
    'colors.secondary.100': '--secondary',
    'colors.info.500': '--accent',
    'colors.error.500': '--destructive',
    'colors.semantic.border.primary': '--border',
    'spacing.borderRadius.base': '--radius',
    'colors.semantic.status.active': '--completed',
    'colors.semantic.status.inactive': '--cancelled',
    'colors.semantic.status.pending': '--scheduled',
    'colors.semantic.status.warning': '--in-progress',
  };
  return mapping[path] || null;
};

// Helper to get token value by path
const getTokenValueByPath = (obj: any, path: string): string | null => {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
};

// Apply CSS variables from token object
const applyThemeTokens = (tokenObj: any, isDark: boolean = false) => {
  const mapping: Record<string, string> = {
    'colors.semantic.background.primary': '--background',
    'colors.semantic.text.primary': '--foreground',
    'colors.semantic.background.secondary': '--card',
    'colors.semantic.text.secondary': '--card-foreground',
    'colors.semantic.background.tertiary': '--popover',
    'colors.semantic.text.tertiary': '--popover-foreground',
    'colors.primary.500': '--primary',
    'colors.semantic.text.inverse': '--primary-foreground',
    'colors.secondary.100': '--secondary',
    'colors.info.500': '--accent',
    'colors.error.500': '--destructive',
    'colors.semantic.border.primary': '--border',
    'spacing.borderRadius.base': '--radius',
    'colors.semantic.status.active': '--completed',
    'colors.semantic.status.inactive': '--cancelled',
    'colors.semantic.status.pending': '--scheduled',
    'colors.semantic.status.warning': '--in-progress',
  };

  const root = document.documentElement;

  Object.entries(mapping).forEach(([path, cssVar]) => {
    const value = getTokenValueByPath(tokenObj, path);
    if (value) {
      if (isDark) {
        // For dark mode, update the .dark class styles
        let styleElement = document.getElementById('dark-mode-custom-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'dark-mode-custom-styles';
          document.head.appendChild(styleElement);
        }

        let existingStyles = styleElement.textContent || '';
        const varRegex = new RegExp(`${cssVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:[^;]+;`, 'g');
        const newRule = `${cssVar}: ${value};`;

        if (varRegex.test(existingStyles)) {
          styleElement.textContent = existingStyles.replace(varRegex, newRule);
        } else {
          if (!existingStyles.includes('.dark')) {
            styleElement.textContent = `${existingStyles}\n.dark {\n  ${newRule}\n}`;
          } else {
            styleElement.textContent = existingStyles.replace(
              /\.dark\s*\{([^}]*)\}/,
              (match, content) => `.dark {${content}\n  ${newRule}}`
            );
          }
        }
      } else {
        // For light mode, update :root directly
        root.style.setProperty(cssVar, value);
      }
    }
  });
};

export function useThemePreferences() {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [preferences, setPreferences] = useState<ThemePreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preferences from database
  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      // Get Supabase session for authentication
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/theme-preferences`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Theme preferences API error:', errorData);
        throw new Error(errorData.message || 'Failed to load theme preferences');
      }

      const data = await response.json();
      console.log('Theme preferences loaded:', data);
      setPreferences(data.preferences || null);
    } catch (error) {
      console.error('Error loading theme preferences:', error);
      setPreferences(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Apply theme preferences based on current theme mode
  // NOTE: This is legacy - useSelectedTheme should take precedence
  // Only apply if useSelectedTheme hasn't already applied a theme
  useEffect(() => {
    if (!preferences || isLoading) return;

    // Check if useSelectedTheme has a selection by checking React Query cache
    // This prevents conflicts between the two theme systems
    const selectedThemeData = queryClient.getQueryData(['/api/themes/user/selection']);
    
    if (selectedThemeData && selectedThemeData.theme) {
      console.log('⏭️ Skipping legacy theme preferences - useSelectedTheme is active');
      return;
    }

    const isDark = theme === 'dark';
    const tokens = isDark ? preferences.dark_mode_tokens : preferences.light_mode_tokens;

    if (tokens) {
      console.log('🎨 Applying legacy theme preferences');
      applyThemeTokens(tokens, isDark);
    }
  }, [preferences, theme, isLoading]);

  // Load preferences when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPreferences();
    } else {
      setPreferences(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, loadPreferences]);

  // Save theme preferences to database
  const savePreferences = useCallback(async (
    lightModeTokens: ThemeTokens | null,
    darkModeTokens: ThemeTokens | null
  ) => {
    if (!isAuthenticated || !user) {
      throw new Error('User must be authenticated to save theme preferences');
    }

    try {
      // Get Supabase session for authentication
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      // If only one mode is provided, get existing preferences to preserve the other mode
      let finalLightTokens = lightModeTokens;
      let finalDarkTokens = darkModeTokens;

      if ((lightModeTokens === null && darkModeTokens === null)) {
        throw new Error('At least one mode must have tokens');
      }

      // If only one mode is provided, fetch existing preferences to preserve the other
      if ((lightModeTokens !== null && darkModeTokens === null) || 
          (lightModeTokens === null && darkModeTokens !== null)) {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
        const getResponse = await fetch(`${apiBaseUrl}/api/theme-preferences`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (getResponse.ok) {
          const getData = await getResponse.json();
          if (getData.preferences) {
            // Preserve the mode we're not updating
            if (lightModeTokens !== null) {
              finalDarkTokens = getData.preferences.dark_mode_tokens || darkModeTokens;
            } else {
              finalLightTokens = getData.preferences.light_mode_tokens || lightModeTokens;
            }
          }
        }
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/theme-preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          light_mode_tokens: finalLightTokens,
          dark_mode_tokens: finalDarkTokens,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save theme preferences');
      }

      const data = await response.json();
      setPreferences(data.preferences);
      return data;
    } catch (error) {
      console.error('Error saving theme preferences:', error);
      throw error;
    }
  }, [isAuthenticated, user]);

  // Reset theme preferences (delete from database)
  const resetPreferences = useCallback(async () => {
    if (!isAuthenticated || !user) {
      throw new Error('User must be authenticated to reset theme preferences');
    }

    try {
      // Get Supabase session for authentication
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/theme-preferences`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset theme preferences');
      }

      setPreferences(null);
      
      // Remove custom styles
      const styleElement = document.getElementById('dark-mode-custom-styles');
      if (styleElement) {
        styleElement.remove();
      }

      // Reset CSS variables to default (remove inline styles)
      const root = document.documentElement;
      const cssVars = [
        '--background', '--foreground', '--card', '--card-foreground',
        '--popover', '--popover-foreground', '--primary', '--primary-foreground',
        '--secondary', '--accent', '--destructive', '--border', '--radius',
        '--completed', '--cancelled', '--scheduled', '--in-progress'
      ];
      cssVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
    } catch (error) {
      console.error('Error resetting theme preferences:', error);
      throw error;
    }
  }, [isAuthenticated, user]);

  return {
    preferences,
    isLoading,
    loadPreferences,
    savePreferences,
    resetPreferences,
  };
}

