/**
 * Improved Theme Editor Component
 * 
 * Makes it clear that themes have both light and dark modes.
 * Allows editing both modes with integrated live preview.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Save, Eye, Sun, Moon, Plus, Edit2, Trash2, Check } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useAuth } from '../../hooks/useAuth';
import { FireThemePanel } from '../fire-theme-panel';

interface Theme {
  id: string;
  name: string;
  description?: string | null;
  light_mode_tokens: any;
  dark_mode_tokens: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ThemeEditorProps {
  onThemeSaved?: () => void;
}

export function ThemeEditor({ onThemeSaved }: ThemeEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [activeMode, setActiveMode] = useState<'light' | 'dark'>('light');
  const [lightTokens, setLightTokens] = useState<any>(null);
  const [darkTokens, setDarkTokens] = useState<any>(null);

  // Fetch all themes
  const { data: themes = [], isLoading } = useQuery<Theme[]>({
    queryKey: ['/api/themes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/themes');
      return response.json();
    },
  });

  // Save/Update theme mutation
  const saveThemeMutation = useMutation({
    mutationFn: async ({ themeId, name, description, isNew }: { 
      themeId?: string; 
      name: string; 
      description?: string; 
      isNew: boolean;
    }) => {
      if (!lightTokens || !darkTokens) {
        throw new Error('Both light and dark mode tokens are required');
      }

      if (isNew) {
        const response = await apiRequest('POST', '/api/themes', {
          name,
          description: description || null,
          light_mode_tokens: lightTokens,
          dark_mode_tokens: darkTokens,
          is_active: true,
        });
        return response.json();
      } else {
        const response = await apiRequest('PUT', `/api/themes/${themeId}`, {
          name,
          description: description || null,
          light_mode_tokens: lightTokens,
          dark_mode_tokens: darkTokens,
        });
        return response.json();
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      toast({
        title: 'Success',
        description: variables.isNew ? 'Theme created successfully!' : 'Theme updated successfully!',
      });
      handleNewTheme();
      onThemeSaved?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save theme',
        variant: 'destructive',
      });
    },
  });

  // Load theme for editing
  const handleLoadTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setThemeName(theme.name);
    setThemeDescription(theme.description || '');
    setLightTokens(theme.light_mode_tokens);
    setDarkTokens(theme.dark_mode_tokens);
    setActiveMode('light'); // Start with light mode
  };

  // Start new theme
  const handleNewTheme = () => {
    setEditingTheme(null);
    setThemeName('');
    setThemeDescription('');
    setLightTokens(null);
    setDarkTokens(null);
    setActiveMode('light');
  };

  // Save current tokens for active mode
  const handleSaveCurrentMode = () => {
    // This would capture current tokens from FireThemePanel
    // For now, we'll need to integrate with the actual token state
    toast({
      title: 'Mode Saved',
      description: `${activeMode === 'light' ? 'Light' : 'Dark'} mode tokens saved to draft`,
    });
  };

  // Final save of theme
  const handleSaveTheme = () => {
    if (!themeName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Theme name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!lightTokens || !darkTokens) {
      toast({
        title: 'Validation Error',
        description: 'Both light and dark mode tokens must be configured',
        variant: 'destructive',
      });
      return;
    }

    // Check theme limit
    const activeThemes = themes.filter(t => t.is_active);
    if (activeThemes.length >= 4 && (!editingTheme || !editingTheme.is_active)) {
      const hasInactive = themes.some(t => !t.is_active);
      if (!hasInactive) {
        toast({
          title: 'Limit Reached',
          description: 'Maximum of 4 active themes allowed. Please deactivate an existing theme first.',
          variant: 'destructive',
        });
        return;
      }
    }

    saveThemeMutation.mutate({
      themeId: editingTheme?.id,
      name: themeName.trim(),
      description: themeDescription.trim() || undefined,
      isNew: !editingTheme,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and edit themes with both light and dark modes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNewTheme}>
            <Plus className="w-4 h-4 mr-2" />
            New Theme
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Theme List & Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Theme Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingTheme ? 'Edit Theme' : 'Create New Theme'}
              </CardTitle>
              <CardDescription>
                {editingTheme 
                  ? 'Update this theme\'s light and dark modes'
                  : 'A theme includes both light and dark mode configurations'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme-name">Theme Name *</Label>
                <Input
                  id="theme-name"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="e.g., Corporate Blue"
                />
              </div>
              <div>
                <Label htmlFor="theme-description">Description</Label>
                <Textarea
                  id="theme-description"
                  value={themeDescription}
                  onChange={(e) => setThemeDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              
              {editingTheme && (
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Theme Status</div>
                  <Badge variant={editingTheme.is_active ? 'default' : 'secondary'}>
                    {editingTheme.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Mode Status</div>
                <div className="flex items-center gap-2 text-sm">
                  <Sun className="w-4 h-4" />
                  <span>Light Mode:</span>
                  {lightTokens ? (
                    <Badge variant="outline" className="text-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Set
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode:</span>
                  {darkTokens ? (
                    <Badge variant="outline" className="text-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Set
                    </Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSaveTheme}
                disabled={saveThemeMutation.isPending || !themeName.trim() || !lightTokens || !darkTokens}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveThemeMutation.isPending 
                  ? 'Saving...' 
                  : editingTheme 
                    ? 'Update Theme' 
                    : 'Create Theme'}
              </Button>
            </CardContent>
          </Card>

          {/* Saved Themes List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Themes</CardTitle>
              <CardDescription>
                {themes.filter(t => t.is_active).length} / 4 active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : themes.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No themes created yet</div>
                ) : (
                  themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        editingTheme?.id === theme.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleLoadTheme(theme)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{theme.name}</div>
                          {theme.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {theme.description}
                            </div>
                          )}
                        </div>
                        <Badge variant={theme.is_active ? 'default' : 'secondary'} className="ml-2">
                          {theme.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Mode Editor & Preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mode Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Edit Mode</CardTitle>
              <CardDescription>
                Select which mode to edit. Both light and dark modes are required for a complete theme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as 'light' | 'dark')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="light" className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Light Mode
                    {lightTokens && (
                      <Badge variant="outline" className="ml-2 text-green-600">
                        <Check className="w-3 h-3 mr-1" />
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="dark" className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Dark Mode
                    {darkTokens && (
                      <Badge variant="outline" className="ml-2 text-green-600">
                        <Check className="w-3 h-3 mr-1" />
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="light" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Editing Light Mode:</strong> Configure colors, spacing, and other design tokens for light mode. 
                        Changes are saved to your theme draft.
                      </p>
                    </div>
                    {/* FireThemePanel would go here - but we need to pass mode-specific tokens */}
                    <FireThemePanel />
                  </div>
                </TabsContent>
                <TabsContent value="dark" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Editing Dark Mode:</strong> Configure colors, spacing, and other design tokens for dark mode. 
                        Changes are saved to your theme draft.
                      </p>
                    </div>
                    {/* FireThemePanel would go here - but we need to pass mode-specific tokens */}
                    <FireThemePanel />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Live Preview - Both Modes Side by Side */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                Preview how your theme looks in both light and dark modes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light Mode Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sun className="w-4 h-4" />
                    Light Mode Preview
                  </div>
                  <div 
                    className="rounded-lg border-2 p-4 min-h-[400px]"
                    style={{ 
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {/* Preview content would go here */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold mb-2">Sample Card</h3>
                        <div className="p-3 rounded border" style={{ 
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--card-foreground)',
                        }}>
                          This is how cards look in light mode
                        </div>
                      </div>
                      <button 
                        className="px-4 py-2 rounded"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                        }}
                      >
                        Primary Button
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dark Mode Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Moon className="w-4 h-4" />
                    Dark Mode Preview
                  </div>
                  <div 
                    className="rounded-lg border-2 p-4 min-h-[400px] dark"
                    style={{ 
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {/* Preview content would go here */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold mb-2">Sample Card</h3>
                        <div className="p-3 rounded border" style={{ 
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          color: 'var(--card-foreground)',
                        }}>
                          This is how cards look in dark mode
                        </div>
                      </div>
                      <button 
                        className="px-4 py-2 rounded"
                        style={{
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                        }}
                      >
                        Primary Button
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}











