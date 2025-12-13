/**
 * Theme Picker Component
 * 
 * Allows users to select from available themes to apply to the live app.
 * - Super admins: Can use in design system page
 * - All users: Can use in settings page
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useAuth } from '../../hooks/useAuth';

interface Theme {
  id: string;
  name: string;
  description?: string | null;
  light_mode_tokens: any;
  dark_mode_tokens: any;
  is_active: boolean;
}

interface ThemePickerProps {
  compact?: boolean;
  maxThemes?: number;
}

export function ThemePicker({ compact = false, maxThemes = 4 }: ThemePickerProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available themes (only active themes for non-super admins)
  const { data: themes = [], isLoading: themesLoading } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/themes');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch user's current theme selection
  const { data: userSelection, isLoading: selectionLoading } = useQuery({
    queryKey: ['/api/themes/user/selection'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/themes/user/selection');
        return response.json();
      } catch (error: any) {
        if (error.status === 404) {
          return null; // No selection yet
        }
        throw error;
      }
    },
    enabled: isAuthenticated,
  });

  // Select theme mutation
  const selectThemeMutation = useMutation({
    mutationFn: async ({ themeId, themeMode }: { themeId: string; themeMode: 'light' | 'dark' }) => {
      const response = await apiRequest('POST', '/api/themes/user/selection', {
        theme_id: themeId,
        theme_mode: themeMode,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes/user/selection'] });
      toast({
        title: 'Theme Selected',
        description: 'Your theme has been updated. The page will refresh to apply changes.',
        variant: 'default',
      });
      // Reload page to apply new theme
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to select theme: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  if (themesLoading || selectionLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading themes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter themes based on user role
  const isSuperAdmin = user.role === 'super_admin';
  const availableThemes = isSuperAdmin 
    ? themes 
    : themes.filter((t: Theme) => t.is_active);

  // Limit to maxThemes
  const displayThemes = availableThemes.slice(0, maxThemes);

  const selectedThemeId = userSelection?.theme_id;

  if (displayThemes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-muted-foreground">
            No themes available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium">Select Theme</div>
        <div className="grid grid-cols-2 gap-2">
          {displayThemes.map((theme: Theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  if (!isSelected) {
                    selectThemeMutation.mutate({
                      themeId: theme.id,
                      themeMode: 'light', // Default to light, user can switch mode after
                    });
                  }
                }}
                disabled={selectThemeMutation.isPending}
                className={`relative p-3 border-2 rounded-lg transition-all text-left ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="font-medium text-sm">{theme.name}</div>
                {theme.description && (
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {theme.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Theme Selection
        </CardTitle>
        <CardDescription>
          Choose your preferred theme. Changes will apply immediately to the live app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayThemes.map((theme: Theme) => {
            const isSelected = selectedThemeId === theme.id;
            return (
              <div
                key={theme.id}
                className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => {
                  if (!isSelected) {
                    selectThemeMutation.mutate({
                      themeId: theme.id,
                      themeMode: 'light', // Default to light
                    });
                  }
                }}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>
                )}
                <div className="font-semibold text-lg mb-1">{theme.name}</div>
                {theme.description && (
                  <div className="text-sm text-muted-foreground mb-3">{theme.description}</div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>☀️ Light & 🌙 Dark modes</span>
                </div>
                {selectThemeMutation.isPending && isSelected && (
                  <div className="mt-2 text-sm text-muted-foreground">Applying...</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}






