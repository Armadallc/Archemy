/**
 * Integrated Theme Editor Component
 * 
 * Combines Theme Management, Live Preview, and Fire Theme Panel
 * into a unified workflow for creating and managing themes.
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
import { Save, Eye, Sun, Moon, Plus, Edit2, Trash2, Check, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useAuth } from '../../hooks/useAuth';
import { useFireTheme } from '../fire-theme-provider';

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

interface IntegratedThemeEditorProps {
  onThemeSaved?: () => void;
}

export function IntegratedThemeEditor({ onThemeSaved }: IntegratedThemeEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [activeEditingMode, setActiveEditingMode] = useState<'light' | 'dark'>('light');
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  
  // Fire theme state
  const { 
    theme: fireTheme, 
    setSlot, 
    setButtonStyle, 
    setBorderWeight,
    reset,
    palette = {},
    buttonStyles = [],
    borderWeights = [],
  } = useFireTheme();

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
      if (!fireTheme || !fireTheme.light || !fireTheme.dark) {
        throw new Error('Fire theme not initialized');
      }
      
      // Convert fire theme slots to tokens format
      const lightTokens = convertFireThemeToTokens(fireTheme.light);
      const darkTokens = convertFireThemeToTokens(fireTheme.dark);

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

  // Convert Fire Theme slots to token format
  function convertFireThemeToTokens(modeTheme: any): any {
    // This would convert the fire theme format to your token format
    // You'll need to adjust this based on your actual token structure
    return {
      // Map fire theme colors to tokens
      // This is a placeholder - adjust based on your actual token structure
      colors: {
        semantic: {
          background: {
            primary: palette[modeTheme.background],
            secondary: palette[modeTheme.surface],
            tertiary: palette[modeTheme.card],
          },
          text: {
            primary: palette[modeTheme.text],
            secondary: palette[modeTheme.cardText],
          },
          border: {
            primary: palette[modeTheme.borderColor],
          },
        },
        primary: {
          500: palette[modeTheme.accent],
        },
      },
    };
  }

  // Load theme for editing
  const handleLoadTheme = (theme: Theme, mode: 'light' | 'dark') => {
    setEditingTheme(theme);
    setThemeName(theme.name);
    setThemeDescription(theme.description || '');
    setActiveEditingMode(mode);
    
    // Load tokens into fire theme
    const tokens = mode === 'light' ? theme.light_mode_tokens : theme.dark_mode_tokens;
    // Convert tokens to fire theme format and apply
    // This would need to be implemented based on your token structure
    toast({
      title: 'Theme Loaded',
      description: `${mode === 'light' ? 'Light' : 'Dark'} mode loaded for editing`,
    });
  };

  // Start new theme
  const handleNewTheme = () => {
    setEditingTheme(null);
    setThemeName('');
    setThemeDescription('');
    setActiveEditingMode('light');
    reset();
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

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Theme Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {editingTheme 
              ? `Editing: ${editingTheme.name}` 
              : 'Create a new theme with both light and dark modes'}
          </p>
        </div>
        {isSuperAdmin && (
          <Button variant="outline" onClick={handleNewTheme}>
            <Plus className="w-4 h-4 mr-2" />
            New Theme
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Theme Management & Info */}
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
                  disabled={!isSuperAdmin}
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
                  disabled={!isSuperAdmin}
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
                <div className="text-sm font-medium">Editing Mode</div>
                <Tabs value={activeEditingMode} onValueChange={(v) => setActiveEditingMode(v as 'light' | 'dark')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="light" className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </TabsTrigger>
                    <TabsTrigger value="dark" className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  Currently editing: <strong>{activeEditingMode === 'light' ? 'Light' : 'Dark'}</strong> mode
                </p>
              </div>

              {isSuperAdmin && (
                <Button
                  onClick={handleSaveTheme}
                  disabled={saveThemeMutation.isPending || !themeName.trim()}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveThemeMutation.isPending 
                    ? 'Saving...' 
                    : editingTheme 
                      ? 'Update Theme' 
                      : 'Create Theme'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Saved Themes List */}
          {isSuperAdmin && (
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
                        onClick={() => {
                          setEditingTheme(theme);
                          setThemeName(theme.name);
                          setThemeDescription(theme.description || '');
                        }}
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
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadTheme(theme, 'light');
                            }}
                          >
                            Load Light
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadTheme(theme, 'dark');
                            }}
                          >
                            Load Dark
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Preview & Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Live Preview - Both Modes Side by Side */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    Preview how your theme looks in both light and dark modes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(previewMode === 'light' ? 'dark' : 'light')}
                  >
                    {previewMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    Switch Preview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ThemeLivePreview 
                mode={previewMode}
                fireTheme={fireTheme}
                palette={palette}
              />
            </CardContent>
          </Card>

          {/* Fire Theme Editor - Color Picker */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Color Configuration</CardTitle>
              <CardDescription>
                Editing <strong>{activeEditingMode === 'light' ? 'Light' : 'Dark'}</strong> mode colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Fire Theme Panel Content - without presets */}
              <FireThemeEditorContent
                mode={activeEditingMode}
                theme={fireTheme}
                setSlot={setSlot}
                setButtonStyle={setButtonStyle}
                setBorderWeight={setBorderWeight}
                palette={palette}
                buttonStyles={buttonStyles}
                borderWeights={borderWeights}
                disabled={!isSuperAdmin}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Color swatch component
function ColorSwatch({
  color,
  hex,
  isSelected,
  onClick,
}: {
  color: string;
  hex: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8 rounded-md border-2 transition-all
        ${isSelected ? "border-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-transparent"}
        hover:scale-110
      `}
      style={{ backgroundColor: hex }}
      title={color}
    />
  );
}

// Button style selector
function ButtonStyleSelector({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (style: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">Button Style</span>
      <div className="flex gap-1">
        {options.map((style) => (
          <button
            key={style}
            onClick={() => onChange(style)}
            className={`
              px-3 py-1 text-xs rounded-md transition-all capitalize
              ${value === style 
                ? "bg-foreground text-background" 
                : "bg-muted hover:bg-muted/80"}
            `}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}

// Border weight selector
function BorderWeightSelector({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (weight: string) => void;
  options: string[];
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">Border Weight</span>
      <div className="flex gap-1">
        {options.map((weight) => (
          <button
            key={weight}
            onClick={() => onChange(weight)}
            className={`
              px-3 py-1 text-xs rounded-md transition-all capitalize
              ${value === weight 
                ? "bg-foreground text-background" 
                : "bg-muted hover:bg-muted/80"}
            `}
          >
            {weight}
          </button>
        ))}
      </div>
    </div>
  );
}

// Dropdown selector for a color slot
function SlotSelector({
  label,
  value,
  onChange,
  palette,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  palette: Record<string, string>;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {(Object.keys(palette) as string[]).map((colorKey) => (
          <ColorSwatch
            key={colorKey}
            color={colorKey}
            hex={palette[colorKey]}
            isSelected={value === colorKey}
            onClick={() => onChange(colorKey)}
          />
        ))}
      </div>
    </div>
  );
}

// Extracted Fire Theme Editor Content (without presets)
function FireThemeEditorContent({
  mode,
  theme,
  setSlot,
  setButtonStyle,
  setBorderWeight,
  palette,
  buttonStyles,
  borderWeights,
  disabled,
}: {
  mode: 'light' | 'dark';
  theme: any;
  setSlot: (mode: 'light' | 'dark', slot: string, color: any) => void;
  setButtonStyle: (mode: 'light' | 'dark', style: any) => void;
  setBorderWeight: (mode: 'light' | 'dark', weight: any) => void;
  palette: Record<string, string>;
  buttonStyles: any[];
  borderWeights: any[];
  disabled?: boolean;
}) {
  if (!theme || !theme[mode]) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Loading theme configuration...</p>
      </div>
    );
  }
  
  const modeTheme = theme[mode];
  
  return (
    <div className="space-y-4">
      {/* Primary Colors */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Primary Colors
        </div>
        <SlotSelector
          label="Accent"
          value={modeTheme.accent}
          onChange={(c) => setSlot(mode, "accent", c)}
          palette={palette}
        />
      </div>

      {/* Surface & Layout Colors */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Surfaces & Layout
        </div>
        <SlotSelector
          label="Page Background"
          value={modeTheme.pageBackground}
          onChange={(c) => setSlot(mode, "pageBackground", c)}
          palette={palette}
        />
        <SlotSelector
          label="Background"
          value={modeTheme.background}
          onChange={(c) => setSlot(mode, "background", c)}
          palette={palette}
        />
        <SlotSelector
          label="Surface"
          value={modeTheme.surface}
          onChange={(c) => setSlot(mode, "surface", c)}
          palette={palette}
        />
        <SlotSelector
          label="Card"
          value={modeTheme.card}
          onChange={(c) => setSlot(mode, "card", c)}
          palette={palette}
        />
        <SlotSelector
          label="Card Text"
          value={modeTheme.cardText}
          onChange={(c) => setSlot(mode, "cardText", c)}
          palette={palette}
        />
        <SlotSelector
          label="Body Text"
          value={modeTheme.text}
          onChange={(c) => setSlot(mode, "text", c)}
          palette={palette}
        />
        <SlotSelector
          label="Border Color"
          value={modeTheme.borderColor}
          onChange={(c) => setSlot(mode, "borderColor", c)}
          palette={palette}
        />
      </div>

      {/* Button Controls */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Buttons
        </div>
        <ButtonStyleSelector
          value={modeTheme.buttonStyle}
          onChange={(style) => setButtonStyle(mode, style)}
          options={buttonStyles}
        />
        <SlotSelector
          label="Button Background"
          value={modeTheme.buttonBackground}
          onChange={(c) => setSlot(mode, "buttonBackground", c)}
          palette={palette}
        />
        <SlotSelector
          label="Button Text"
          value={modeTheme.buttonText}
          onChange={(c) => setSlot(mode, "buttonText", c)}
          palette={palette}
        />
        <SlotSelector
          label="Button Border"
          value={modeTheme.buttonBorder}
          onChange={(c) => setSlot(mode, "buttonBorder", c)}
          palette={palette}
        />
      </div>

      {/* Border Controls */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Borders
        </div>
        <BorderWeightSelector
          value={modeTheme.borderWeight}
          onChange={(weight) => setBorderWeight(mode, weight)}
          options={borderWeights}
        />
      </div>
    </div>
  );
}

// Live Preview Component (shows both modes)
function ThemeLivePreview({
  mode,
  fireTheme,
  palette,
}: {
  mode: 'light' | 'dark';
  fireTheme: any;
  palette: Record<string, string>;
}) {
  if (!fireTheme || !fireTheme.light || !fireTheme.dark) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Loading preview...</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Light Mode Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sun className="w-4 h-4" />
          Light Mode
        </div>
        <div 
          className="rounded-lg border-2 p-4 min-h-[300px]"
          style={{ 
            backgroundColor: palette[fireTheme.light.background],
            color: palette[fireTheme.light.text],
            borderColor: palette[fireTheme.light.borderColor],
          }}
        >
          {/* Preview content */}
          <div className="space-y-3">
            <h3 className="font-bold">Sample Card</h3>
            <div 
              className="p-3 rounded border"
              style={{ 
                backgroundColor: palette[fireTheme.light.card],
                borderColor: palette[fireTheme.light.borderColor],
                color: palette[fireTheme.light.cardText],
              }}
            >
              This is how cards look in light mode
            </div>
            <button 
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: palette[fireTheme.light.buttonBackground],
                color: palette[fireTheme.light.buttonText],
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
          Dark Mode
        </div>
        <div 
          className="rounded-lg border-2 p-4 min-h-[300px]"
          style={{ 
            backgroundColor: palette[fireTheme.dark.background],
            color: palette[fireTheme.dark.text],
            borderColor: palette[fireTheme.dark.borderColor],
          }}
        >
          {/* Preview content */}
          <div className="space-y-3">
            <h3 className="font-bold">Sample Card</h3>
            <div 
              className="p-3 rounded border"
              style={{ 
                backgroundColor: palette[fireTheme.dark.card],
                borderColor: palette[fireTheme.dark.borderColor],
                color: palette[fireTheme.dark.cardText],
              }}
            >
              This is how cards look in dark mode
            </div>
            <button 
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: palette[fireTheme.dark.buttonBackground],
                color: palette[fireTheme.dark.buttonText],
              }}
            >
              Primary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

