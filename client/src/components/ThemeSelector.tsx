import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Palette, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Theme {
  id: string;
  name: string;
  description?: string | null;
  light_mode_tokens: any;
  dark_mode_tokens: any;
  is_active: boolean;
}

interface UserThemeSelection {
  id: string;
  user_id: string;
  theme_id: string;
  theme_mode: 'light' | 'dark';
  theme?: Theme;
}

export function ThemeSelector() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available themes
  const { data: themes = [], isLoading: themesLoading } = useQuery({
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
    mutationFn: async (themeId: string) => {
      const response = await apiRequest('POST', '/api/themes/user/selection', {
        theme_id: themeId,
        theme_mode: userSelection?.theme_mode || 'light',
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
        <CardHeader>
          <CardTitle>Theme Selection</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading themes...</div>
        </CardContent>
      </Card>
    );
  }

  const activeThemes = themes.filter((t: Theme) => t.is_active);
  const selectedThemeId = userSelection?.theme_id;

  if (activeThemes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Theme Selection</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No themes available. Please contact your administrator.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Theme Selection
        </CardTitle>
        <CardDescription>
          Choose your preferred theme. Changes will apply immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeThemes.map((theme: Theme) => {
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
                    selectThemeMutation.mutate(theme.id);
                  }
                }}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Selected
                    </Badge>
                  </div>
                )}
                <div className="font-semibold text-lg mb-1">{theme.name}</div>
                {theme.description && (
                  <div className="text-sm text-muted-foreground mb-3">{theme.description}</div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Light & Dark modes available</span>
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

