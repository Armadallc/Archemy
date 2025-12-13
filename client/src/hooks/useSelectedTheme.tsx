import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './useAuth';
import { useTheme } from '../components/theme-provider';

/**
 * Hook to load and apply user's selected theme from database
 */
export function useSelectedTheme() {
  const { user, isAuthenticated } = useAuth();
  const { theme: currentThemeMode, setTheme } = useTheme();
  const [hasSynced, setHasSynced] = useState(false);

  // Fetch user's theme selection
  const { data: userSelection, isLoading } = useQuery({
    queryKey: ['/api/themes/user/selection'],
    queryFn: async () => {
      try {
        // Use fetch directly to have better control over error handling
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || localStorage.getItem('auth_token');
        
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
        const response = await fetch(`${apiBaseUrl}/api/themes/user/selection`, {
          method: 'GET',
          headers: {
            'Authorization': authToken ? `Bearer ${authToken}` : '',
          },
          credentials: 'include',
        });

        if (response.status === 404) {
          return null; // No selection yet - this is expected for new users
        }

        if (!response.ok) {
          // Don't throw - just return null for any error
          console.warn('Failed to fetch theme selection:', response.status);
          return null;
        }

        return response.json();
      } catch (error: any) {
        // Silently fail - theme selection is optional and shouldn't block the app
        console.warn('Error loading theme selection (non-blocking):', error.message);
        return null;
      }
    },
    enabled: isAuthenticated && !!user,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Helper function to get token value by path (e.g., 'colors.semantic.background.primary')
  const getTokenValueByPath = (obj: any, path: string): string | null => {
    // Handle string tokens (they might be stored as JSON strings in the database)
    let parsedObj = obj;
    if (typeof obj === 'string') {
      try {
        parsedObj = JSON.parse(obj);
      } catch {
        return null;
      }
    }

    const keys = path.split('.');
    let current = parsedObj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    return typeof current === 'string' ? current : null;
  };

  // Apply theme tokens when selection is loaded
  // Note: This runs after FireThemeProvider, so we need to ensure our styles take precedence
  useEffect(() => {
    if (!userSelection || !userSelection.theme) {
      return;
    }

    // Apply theme immediately, then reapply after a delay to ensure it persists
    // This handles both initial load and theme mode toggles
    const applyTokens = () => {
      const theme = userSelection.theme;
      // Use currentThemeMode (from the theme provider) instead of database theme_mode
      // This ensures we use the actual current state, not a stale database value
      const effectiveThemeMode = currentThemeMode;
      const isDark = effectiveThemeMode === 'dark';
      
      // Verify dark class matches the theme mode
      const root = document.documentElement;
      const hasDarkClass = root.classList.contains('dark');
      if (hasDarkClass !== isDark) {
        console.warn(`⚠️ Dark class mismatch! Theme mode: ${effectiveThemeMode}, Dark class: ${hasDarkClass}. Fixing...`);
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
      
      let tokens = isDark ? theme.dark_mode_tokens : theme.light_mode_tokens;

      console.log('🎨 Applying theme tokens:', {
        themeName: theme.name,
        mode: effectiveThemeMode,
        isDark,
        hasTokens: !!tokens,
        tokenType: typeof tokens,
      });

      // Parse tokens if they're stored as JSON strings
      if (typeof tokens === 'string') {
        try {
          tokens = JSON.parse(tokens);
        } catch (error) {
          console.warn('Failed to parse theme tokens:', error);
          return;
        }
      }

      if (!tokens || typeof tokens !== 'object') {
        console.warn('Invalid theme tokens format');
        return;
      }

      // Map token paths to CSS variables (same mapping as useThemePreferences)
      // NOTE: --page-background is handled separately above to ensure it's applied first
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

      // Clear previous mode's variables before applying new ones
      // This prevents conflicts when switching between light and dark modes
      if (isDark) {
        // Switching to dark mode - clear light mode variables from :root
        Object.values(mapping).forEach((cssVar) => {
          root.style.removeProperty(cssVar);
        });
        root.style.removeProperty('--ring');
        root.style.removeProperty('--page-background'); // Explicitly clear page-background
      } else {
        // Switching to light mode - clear dark mode variables from style block
        const styleElement = document.getElementById('dark-mode-custom-styles');
        if (styleElement) {
          // Clear all dark mode variables by removing the .dark block
          styleElement.textContent = '';
        }
        // Also ensure --page-background is cleared from :root if it was set by dark mode
        root.style.removeProperty('--page-background');
      }

      // CRITICAL: Apply --page-background FIRST, before other variables
      // This ensures the page background is set correctly for the current mode
      const pageBgValue = getTokenValueByPath(tokens, 'colors.pageBackground') || 
                          getTokenValueByPath(tokens, 'colors.background') ||
                          getTokenValueByPath(tokens, 'colors.semantic.background.primary');
      
      if (pageBgValue) {
        console.log(`🎨 Applying --page-background for ${isDark ? 'dark' : 'light'} mode:`, {
          value: pageBgValue,
          source: getTokenValueByPath(tokens, 'colors.pageBackground') ? 'colors.pageBackground' :
                  getTokenValueByPath(tokens, 'colors.background') ? 'colors.background' :
                  'colors.semantic.background.primary',
        });
        
        if (isDark) {
          // For dark mode, update the .dark class styles
          let styleElement = document.getElementById('dark-mode-custom-styles');
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dark-mode-custom-styles';
            document.head.appendChild(styleElement);
          }

          let existingStyles = styleElement.textContent || '';
          const varRegex = /--page-background\s*:[^;]+;/g;
          const newRule = '--page-background: ' + pageBgValue + ';';

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
          root.style.setProperty('--page-background', pageBgValue);
        }
      } else {
        console.warn(`⚠️ No pageBackground value found for ${isDark ? 'dark' : 'light'} mode tokens`);
      }

      // Apply each mapped token to its CSS variable
      Object.entries(mapping).forEach(([path, cssVar]) => {
        // Skip pageBackground since we already handled it above
        if (cssVar === '--page-background') return;
        
        const value = getTokenValueByPath(tokens, path);
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

      // Set --ring to same value as --primary (focus ring color)
      const primaryValue = getTokenValueByPath(tokens, 'colors.primary.500');
      if (primaryValue) {
        if (isDark) {
          let styleElement = document.getElementById('dark-mode-custom-styles');
          if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dark-mode-custom-styles';
            document.head.appendChild(styleElement);
          }
          let existingStyles = styleElement.textContent || '';
          const varRegex = /--ring\s*:[^;]+;/g;
          const newRule = '--ring: ' + primaryValue + ';';
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
          root.style.setProperty('--ring', primaryValue);
        }
      }

      console.log('✅ Theme tokens applied successfully', {
        mode: effectiveThemeMode,
        isDark,
        darkClassPresent: root.classList.contains('dark'),
        cssVarsApplied: isDark ? 'in .dark style block' : 'on :root'
      });
    };

    // Apply immediately for instant feedback
    applyTokens();
    
    // Reapply after a delay to ensure it persists after FireThemeProvider's MutationObserver
    // Use a longer delay for external browsers which may have different timing
    const timeoutId = setTimeout(() => {
      applyTokens();
    }, 200);
    
    // Also reapply after a longer delay as a safety net for external browsers
    const timeoutId2 = setTimeout(() => {
      applyTokens();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [userSelection, currentThemeMode, userSelection?.theme_mode]);

  // Sync theme mode with database selection (only once on initial load)
  useEffect(() => {
    if (!userSelection || isLoading || hasSynced) return;
    if (userSelection.theme_mode === currentThemeMode) {
      setHasSynced(true);
      return; // Already in sync
    }

    // If user has a theme mode preference in database, apply it
    if (userSelection.theme_mode && (userSelection.theme_mode === 'light' || userSelection.theme_mode === 'dark')) {
      setTheme(userSelection.theme_mode);
      setHasSynced(true);
    }
  }, [userSelection, currentThemeMode, setTheme, isLoading, hasSynced]);

  // Watch for dark class changes and ensure it matches currentThemeMode
  // This is critical for external browsers where next-themes might not work correctly
  useEffect(() => {
    const root = document.documentElement;
    const shouldBeDark = currentThemeMode === 'dark';
    const isDark = root.classList.contains('dark');
    
    if (shouldBeDark !== isDark) {
      console.log(`🔧 Syncing dark class: shouldBeDark=${shouldBeDark}, isDark=${isDark}, currentThemeMode=${currentThemeMode}`);
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [currentThemeMode]);

  return {
    userSelection,
    isLoading,
    selectedTheme: userSelection?.theme,
    themeMode: userSelection?.theme_mode || currentThemeMode,
  };
}

