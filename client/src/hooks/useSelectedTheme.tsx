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

  // Apply theme tokens when selection is loaded
  useEffect(() => {
    if (!userSelection || !userSelection.theme) return;

    const theme = userSelection.theme;
    const isDark = currentThemeMode === 'dark';
    const tokens = isDark ? theme.dark_mode_tokens : theme.light_mode_tokens;

    if (tokens) {
      // Apply tokens to CSS variables
      Object.entries(tokens).forEach(([key, value]) => {
        if (typeof value === 'string') {
          document.documentElement.style.setProperty(`--${key}`, value);
        }
      });
    }
  }, [userSelection, currentThemeMode]);

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

  return {
    userSelection,
    isLoading,
    selectedTheme: userSelection?.theme,
    themeMode: userSelection?.theme_mode || currentThemeMode,
  };
}

