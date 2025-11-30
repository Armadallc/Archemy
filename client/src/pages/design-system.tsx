/**
 * HALCYON Design System - Control Panel
 * 
 * Comprehensive control panel for the Atomic Design System with:
 * - Design token editor
 * - Component builder
 * - Live preview
 * - Theme management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { designTokens } from '../design-system/tokens';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useTheme } from '../components/theme-provider';
import { 
  Palette, 
  Type, 
  Ruler, 
  Box, 
  Eye, 
  Download, 
  Upload, 
  Save,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Minus,
  Settings,
  Layers,
  Component,
  Layout
} from 'lucide-react';

// Mapping function to convert design token paths to CSS variable names
const getCssVariableName = (path: string): string | null => {
  // Map design token paths to CSS variable names
  const mapping: Record<string, string> = {
    // Semantic colors - Background
    'colors.semantic.background.primary': '--background',
    'colors.semantic.text.primary': '--foreground',
    'colors.semantic.background.secondary': '--card',
    'colors.semantic.text.secondary': '--card-foreground',
    'colors.semantic.background.tertiary': '--popover',
    'colors.semantic.text.tertiary': '--popover-foreground',
    
    // Primary colors
    'colors.primary.500': '--primary',
    'colors.semantic.text.inverse': '--primary-foreground',
    
    // Secondary/Muted colors
    'colors.secondary.100': '--secondary',
    'colors.secondary.100': '--muted',
    
    // Accent colors
    'colors.info.500': '--accent',
    
    // Destructive colors
    'colors.error.500': '--destructive',
    
    // Border/Input colors
    'colors.semantic.border.primary': '--border',
    'colors.semantic.border.primary': '--input',
    'colors.primary.500': '--ring',
    
    // Typography - Font Families (need to convert array to string)
    'typography.fontFamily.sans': '--font-sans',
    'typography.fontFamily.serif': '--font-serif',
    'typography.fontFamily.mono': '--font-mono',
    
    // Spacing/Border Radius
    'spacing.borderRadius.base': '--radius',
    
    // Status Colors
    'colors.semantic.status.active': '--completed',
    'colors.semantic.status.inactive': '--cancelled',
    'colors.semantic.status.pending': '--scheduled',
    'colors.semantic.status.error': '--cancelled',
    'colors.semantic.status.warning': '--in-progress',
    'colors.semantic.status.info': '--accent',
  };
  
  return mapping[path] || null;
};

// Design token editor component
const TokenEditor = ({ tokens, onUpdate }: { tokens: any, onUpdate: (tokens: any) => void }) => {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('colors');
  const [originalTokens] = useState(() => JSON.parse(JSON.stringify(tokens))); // Deep clone for reset
  const [hasChanges, setHasChanges] = useState(false);

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
  const applyStagedCssVariables = useCallback((tokenObj: any) => {
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
      'colors.secondary.100': '--muted',
      'colors.info.500': '--accent',
      'colors.error.500': '--destructive',
      'colors.semantic.border.primary': '--border',
      'colors.semantic.border.primary': '--input',
      'colors.primary.500': '--ring',
      'spacing.borderRadius.base': '--radius',
      
      // Status Colors
      'colors.semantic.status.active': '--completed',
      'colors.semantic.status.inactive': '--cancelled',
      'colors.semantic.status.pending': '--scheduled',
      'colors.semantic.status.error': '--cancelled',
      'colors.semantic.status.warning': '--in-progress',
      'colors.semantic.status.info': '--accent',
    };
    
    Object.entries(mapping).forEach(([path, cssVar]) => {
      const value = getTokenValueByPath(tokenObj, path);
      if (value) {
        updateCssVariable(cssVar, value, theme === 'dark');
      }
    });
  }, [theme]);

  // Load staged changes from localStorage on mount
  useEffect(() => {
    const staged = localStorage.getItem('design-system-staged-tokens');
    if (staged) {
      try {
        const parsed = JSON.parse(staged);
        onUpdate(parsed);
        setHasChanges(true);
        // Apply CSS variables from staged changes
        applyStagedCssVariables(parsed);
      } catch (e) {
        console.error('Failed to load staged tokens:', e);
      }
    }
  }, [onUpdate, applyStagedCssVariables]);

  // Update CSS variable in the DOM
  const updateCssVariable = (cssVarName: string, value: string, isDark: boolean = false) => {
    const root = document.documentElement;
    
    // For dark mode, we need to update the .dark class styles
    if (isDark) {
      // Get or create style element for dark mode
      let styleElement = document.getElementById('dark-mode-custom-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dark-mode-custom-styles';
        document.head.appendChild(styleElement);
      }
      
      // Update the style element
      let existingStyles = styleElement.textContent || '';
      const varRegex = new RegExp(`${cssVarName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:[^;]+;`, 'g');
      const newRule = `${cssVarName}: ${value};`;
      
      if (varRegex.test(existingStyles)) {
        styleElement.textContent = existingStyles.replace(varRegex, newRule);
      } else {
        // If .dark block doesn't exist, create it
        if (!existingStyles.includes('.dark')) {
          styleElement.textContent = `${existingStyles}\n.dark {\n  ${newRule}\n}`;
        } else {
          // Add to existing .dark block
          styleElement.textContent = existingStyles.replace(
            /\.dark\s*\{([^}]*)\}/,
            (match, content) => `.dark {${content}\n  ${newRule}}`
          );
        }
      }
    } else {
      // For light mode, update :root directly
      root.style.setProperty(cssVarName, value);
    }
  };

  const updateColor = (path: string, value: string) => {
    const newTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
    const keys = path.split('.');
    let current = newTokens;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    // Update CSS variable if mapping exists
    const cssVarName = getCssVariableName(path);
    if (cssVarName) {
      updateCssVariable(cssVarName, value, theme === 'dark');
    }
    
    setHasChanges(true);
    onUpdate(newTokens);
  };

  const updateTypography = (path: string, value: string) => {
    const newTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
    const keys = path.split('.');
    let current = newTokens;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    // Handle font family arrays - convert string to array if needed
    if (path.includes('fontFamily') && Array.isArray(current[keys[keys.length - 1]])) {
      // For font families, we need to convert the string to a comma-separated list
      const fontValue = value.split(',').map(f => f.trim()).join(', ');
      current[keys[keys.length - 1]] = fontValue.split(', '); // Keep as array for tokens
      value = fontValue; // Use string for CSS
    } else {
      current[keys[keys.length - 1]] = value;
    }
    
    // Update CSS variable if mapping exists
    const cssVarName = getCssVariableName(path);
    if (cssVarName) {
      // For font families, convert array to string
      const cssValue = Array.isArray(value) ? value.join(', ') : value;
      updateCssVariable(cssVarName, cssValue, theme === 'dark');
    }
    
    setHasChanges(true);
    onUpdate(newTokens);
  };

  const updateSpacing = (path: string, value: string) => {
    const newTokens = JSON.parse(JSON.stringify(tokens)); // Deep clone
    const keys = path.split('.');
    let current = newTokens;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    // Update CSS variable if mapping exists
    const cssVarName = getCssVariableName(path);
    if (cssVarName) {
      updateCssVariable(cssVarName, value, theme === 'dark');
    }
    
    setHasChanges(true);
    onUpdate(newTokens);
  };

  const handleReset = () => {
    const resetTokens = JSON.parse(JSON.stringify(originalTokens));
    onUpdate(resetTokens);
    setHasChanges(false);
    localStorage.removeItem('design-system-staged-tokens');
    // Reset CSS variables to original values
    applyStagedCssVariables(resetTokens);
  };

  const handleSave = () => {
    // Save to localStorage for staging
    localStorage.setItem('design-system-staged-tokens', JSON.stringify(tokens));
    setHasChanges(false);
    // Show success message (you can add toast notification here)
    console.log('Changes staged successfully');
  };

  const renderColorEditor = () => (
    <div className="space-y-6 mt-6">
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Dev Lab Colors</h3>
        <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-4">
          Glass morphism design system colors from Dev Lab styling reference
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Light Mode Colors */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Light Mode</h4>
            {[
              { key: 'background', value: '#eaeaea', label: 'Background' },
              { key: 'card-surface', value: '#ffffff', label: 'Card Surface' },
              { key: 'muted-secondary', value: '#f5f5f5', label: 'Muted Secondary' },
              { key: 'accent', value: '#ff555d', label: 'Accent' },
              { key: 'text-primary', value: '#26282b', label: 'Text Primary' },
              { key: 'text-primary-alt', value: '#1a1c1e', label: 'Text Primary Alt' },
            ].map(({ key, value, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`dev-lab-light-${key}`} className="text-sm text-[#26282b] dark:text-[#eaeaea]">
                  {label}
                </Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    id={`dev-lab-light-${key}`}
                    value={value}
                    onChange={(e) => updateColor(`colors.devLab.light.${key}`, e.target.value)}
                    className="flex-1 text-sm bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Dark Mode Colors */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Dark Mode</h4>
            {[
              { key: 'background', value: '#26282b', label: 'Background' },
              { key: 'card-surface', value: '#2f3235', label: 'Card Surface' },
              { key: 'muted-secondary', value: '#383b3e', label: 'Muted Secondary' },
              { key: 'accent', value: '#ff555d', label: 'Accent' },
              { key: 'text-primary', value: '#eaeaea', label: 'Text Primary' },
              { key: 'text-primary-alt', value: '#f5f5f5', label: 'Text Primary Alt' },
            ].map(({ key, value, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`dev-lab-dark-${key}`} className="text-sm text-[#26282b] dark:text-[#eaeaea]">
                  {label}
                </Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    id={`dev-lab-dark-${key}`}
                    value={value}
                    onChange={(e) => updateColor(`colors.devLab.dark.${key}`, e.target.value)}
                    className="flex-1 text-sm bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Semantic Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(tokens.colors.semantic).map(([category, colors]) => (
            <div key={category} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
              <h4 className="font-medium capitalize text-[#26282b] dark:text-[#eaeaea]">{category}</h4>
              <div className="space-y-3">
                {Object.entries(colors as any).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`${category}-${key}`} className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">
                      {category} {key}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                        style={{ backgroundColor: value as string }}
                      />
                      <Input
                        id={`${category}-${key}`}
                        value={value as string}
                        onChange={(e) => updateColor(`colors.semantic.${category}.${key}`, e.target.value)}
                        className="flex-1 text-sm bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTypographyEditor = () => (
    <div className="space-y-6 mt-6">
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Font Sizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
            <div key={key} className="space-y-2 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
              <Label htmlFor={`fontSize-${key}`} className="text-[#26282b] dark:text-[#eaeaea]">{key}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={`fontSize-${key}`}
                  value={value as string}
                  onChange={(e) => updateTypography(`typography.fontSize.${key}`, e.target.value)}
                  className="flex-1 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                />
                <div 
                  className="text-sm px-3 py-2 bg-white/40 dark:bg-white/20 rounded-lg border border-white/30 dark:border-white/20 backdrop-blur-sm text-[#26282b] dark:text-[#eaeaea] font-medium"
                  style={{ fontSize: value as string }}
                >
                  Aa
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSpacingEditor = () => (
    <div className="space-y-6 mt-6">
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Border Radius</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tokens.spacing?.borderRadius && Object.entries(tokens.spacing.borderRadius).map(([key, value]) => (
            <div key={key} className="space-y-2 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between">
                <Label htmlFor={`borderRadius-${key}`} className="text-[#26282b] dark:text-[#eaeaea]">{key}</Label>
                <span className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70">{String(value)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="h-12 w-20 bg-gradient-to-br from-[#ff555d] to-[#ff444c] rounded-lg border-2 border-white/30 dark:border-white/20 shadow-lg flex-shrink-0"
                  style={{ borderRadius: value as string }}
                />
                <Input
                  id={`borderRadius-${key}`}
                  value={value as string}
                  onChange={(e) => updateSpacing(`spacing.borderRadius.${key}`, e.target.value)}
                  className="flex-1 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Spacing Scale</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {tokens.spacing?.scale && Object.entries(tokens.spacing.scale).map(([key, value]) => (
            <div key={key} className="space-y-2 bg-white/20 dark:bg-white/10 rounded-lg p-3 border border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between">
                <Label htmlFor={`spacing-${key}`} className="text-[#26282b] dark:text-[#eaeaea]">{key}</Label>
                <span className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70">{String(value)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="h-6 bg-gradient-to-r from-[#ff555d] to-[#ff444c] rounded-lg border border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                  style={{ width: `min(${value as string}, 200px)` }}
                />
                <Input
                  id={`spacing-${key}`}
                  value={value as string}
                  onChange={(e) => updateSpacing(`spacing.scale.${key}`, e.target.value)}
                  className="w-24 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#26282b] to-[#26282b]/80 dark:from-[#eaeaea] dark:to-[#eaeaea]/80 bg-clip-text text-transparent">
            Design Tokens
          </h2>
          <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-1">
            Edit design tokens and stage changes before committing
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-[#ff555d]/20 hover:bg-[#ff555d]/30 border-[#ff555d]/30 text-[#ff555d] backdrop-blur-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Stage Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-[#ff555d]/10 border border-[#ff555d]/30 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-sm text-[#26282b] dark:text-[#eaeaea]">
            <span className="font-semibold">⚠️ Unsaved changes:</span> You have unsaved changes. Click "Stage Changes" to save them, or "Reset" to discard.
          </p>
        </div>
      )}

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4 bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-1">
          <TabsTrigger 
            value="colors" 
            className="flex items-center space-x-2 data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/20 data-[state=active]:shadow-lg rounded-lg transition-all"
          >
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger 
            value="typography" 
            className="flex items-center space-x-2 data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/20 data-[state=active]:shadow-lg rounded-lg transition-all"
          >
            <Type className="w-4 h-4" />
            <span>Typography</span>
          </TabsTrigger>
          <TabsTrigger 
            value="spacing" 
            className="flex items-center space-x-2 data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/20 data-[state=active]:shadow-lg rounded-lg transition-all"
          >
            <Ruler className="w-4 h-4" />
            <span>Spacing</span>
          </TabsTrigger>
          <TabsTrigger 
            value="shadows" 
            className="flex items-center space-x-2 data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/20 data-[state=active]:shadow-lg rounded-lg transition-all"
          >
            <Box className="w-4 h-4" />
            <span>Shadows</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6">
          {renderColorEditor()}
        </TabsContent>
        <TabsContent value="typography" className="mt-6">
          {renderTypographyEditor()}
        </TabsContent>
        <TabsContent value="spacing" className="mt-6">
          {renderSpacingEditor()}
        </TabsContent>
        <TabsContent value="shadows" className="mt-6">
          <div className="space-y-6">
            {/* Dev Lab Glass Morphism Shadows */}
            <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Dev Lab Glass Morphism Shadows</h3>
              <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
                Glass morphism shadow effects used in the Dev Lab design system
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Light Mode Glass Shadow */}
                <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                  <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Light Mode Glass</h4>
                  <div 
                    className="w-full h-24 rounded-xl border border-white/20 bg-white/25 backdrop-blur-md mx-auto mb-3"
                    style={{ 
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                      border: '1px solid rgba(255, 255, 255, 0.18)'
                    }}
                  />
                  <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                    <div className="mb-1">box-shadow:</div>
                    <div>0 8px 32px 0</div>
                    <div>rgba(31, 38, 135, 0.37)</div>
                  </div>
                </div>

                {/* Dark Mode Glass Shadow */}
                <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                  <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Dark Mode Glass</h4>
                  <div 
                    className="w-full h-24 rounded-xl border border-white/10 bg-[#2f3235]/25 backdrop-blur-md mx-auto mb-3"
                    style={{ 
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  />
                  <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                    <div className="mb-1">box-shadow:</div>
                    <div>0 8px 32px 0</div>
                    <div>rgba(0, 0, 0, 0.37)</div>
                  </div>
                </div>

                {/* Accent Glow Shadow */}
                <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                  <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Accent Glow</h4>
                  <div 
                    className="w-full h-24 rounded-xl border border-[#ff555d]/30 bg-[#ff555d]/20 backdrop-blur-md mx-auto mb-3"
                    style={{ 
                      boxShadow: '0 0 20px rgba(255, 85, 93, 0.3)',
                      border: '1px solid rgba(255, 85, 93, 0.3)'
                    }}
                  />
                  <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                    <div className="mb-1">box-shadow:</div>
                    <div>0 0 20px</div>
                    <div>rgba(255, 85, 93, 0.3)</div>
                  </div>
                </div>

                {/* Card Shadow XL */}
                <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                  <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Card Shadow XL</h4>
                  <div 
                    className="w-full h-24 rounded-xl border border-white/20 bg-white/25 backdrop-blur-md mx-auto mb-3"
                    style={{ 
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                      border: '1px solid rgba(255, 255, 255, 0.18)'
                    }}
                  />
                  <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                    <div className="mb-1">shadow-xl</div>
                    <div>Used on cards</div>
                  </div>
                </div>

                {/* Hover Shadow */}
                <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                  <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Hover Shadow</h4>
                  <div 
                    className="w-full h-24 rounded-xl border border-white/20 bg-white/25 backdrop-blur-md mx-auto mb-3 transition-shadow hover:shadow-2xl"
                    style={{ 
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                      border: '1px solid rgba(255, 255, 255, 0.18)'
                    }}
                  />
                  <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                    <div className="mb-1">hover:shadow-2xl</div>
                    <div>Interactive elements</div>
                  </div>
                </div>

                {/* Button Shadow */}
                <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                  <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Button Shadow</h4>
                  <div 
                    className="w-full h-24 rounded-xl border border-[#ff555d]/30 bg-[#ff555d]/30 backdrop-blur-md mx-auto mb-3"
                    style={{ 
                      boxShadow: '0 4px 14px 0 rgba(255, 85, 93, 0.3)',
                      border: '1px solid rgba(255, 85, 93, 0.3)'
                    }}
                  />
                  <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                    <div className="mb-1">shadow-lg</div>
                    <div>Accent buttons</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Shadow System */}
            <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Standard Shadow System</h3>
              <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
                Standard elevation and depth shadows for general use
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tokens.shadows?.box && Object.entries(tokens.shadows.box).map(([key, value]) => (
                  <div key={key} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                    <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm capitalize">{key}</h4>
                    <div 
                      className="w-full h-20 rounded-lg border border-white/20 bg-white/30 dark:bg-white/10 mx-auto mb-3"
                      style={{ boxShadow: value as string }}
                    />
                    <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Elevation System */}
            {tokens.shadows?.elevation && (
              <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Elevation System</h3>
                <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
                  Material design-like depth system for layered components
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {Object.entries(tokens.shadows.elevation).map(([key, value]) => (
                    <div key={key} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                      <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] text-sm">Elevation {key}</h4>
                      <div 
                        className="w-full h-20 rounded-lg border border-white/20 bg-white/30 dark:bg-white/10 mx-auto mb-3"
                        style={{ boxShadow: value as string }}
                      />
                      <div className="text-xs text-[#26282b]/70 dark:text-[#eaeaea]/70 font-mono break-all">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component builder component
const ComponentBuilder = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [components, setComponents] = useState<any[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const availableComponents = [
    { id: 'button', name: 'Button', icon: Component, category: 'atoms' },
    { id: 'input', name: 'Input', icon: Component, category: 'atoms' },
    { id: 'card', name: 'Card', icon: Component, category: 'atoms' },
    { id: 'badge', name: 'Badge', icon: Component, category: 'atoms' },
    { id: 'form-field', name: 'Form Field', icon: Component, category: 'molecules' },
    { id: 'search-input', name: 'Search Input', icon: Component, category: 'molecules' },
    { id: 'data-table', name: 'Data Table', icon: Component, category: 'organisms' },
    { id: 'navigation', name: 'Navigation', icon: Component, category: 'organisms' },
  ];

  // Load staged components from localStorage on mount
  useEffect(() => {
    const staged = localStorage.getItem('design-system-staged-components');
    if (staged) {
      try {
        const parsed = JSON.parse(staged);
        setComponents(parsed);
        setHasChanges(true);
      } catch (e) {
        console.error('Failed to load staged components:', e);
      }
    }
  }, []);

  const addComponent = (component: any) => {
    const newComponent = {
      id: `${component.id}-${Date.now()}`,
      type: component.id,
      name: component.name,
      category: component.category,
      props: {},
      position: { x: 100, y: 100 + components.length * 60 }
    };
    setComponents([...components, newComponent]);
    setHasChanges(true);
  };

  const deleteComponent = (componentId: string) => {
    setComponents(components.filter(c => c.id !== componentId));
    if (selectedComponent === componentId) {
      setSelectedComponent(null);
    }
    setHasChanges(true);
  };

  const updateComponentProps = (componentId: string, props: any) => {
    setComponents(components.map(c => 
      c.id === componentId ? { ...c, props: { ...c.props, ...props } } : c
    ));
    setHasChanges(true);
  };

  const handleCopy = () => {
    const json = JSON.stringify(components, null, 2);
    navigator.clipboard.writeText(json);
    // You can add toast notification here
    console.log('Components copied to clipboard');
  };

  const handleExport = () => {
    const json = JSON.stringify(components, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `components-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    localStorage.setItem('design-system-staged-components', JSON.stringify(components));
    setHasChanges(false);
    console.log('Components staged successfully');
  };

  const handleReset = () => {
    setComponents([]);
    setSelectedComponent(null);
    setHasChanges(false);
    localStorage.removeItem('design-system-staged-components');
  };

  const selectedComponentData = components.find(c => c.id === selectedComponent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#26282b] to-[#26282b]/80 dark:from-[#eaeaea] dark:to-[#eaeaea]/80 bg-clip-text text-transparent">
            Component Builder
          </h2>
          <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-1">
            Build and test component configurations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges && components.length === 0}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopy}
            disabled={components.length === 0}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={components.length === 0}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges}
            className="bg-[#ff555d]/20 hover:bg-[#ff555d]/30 border-[#ff555d]/30 text-[#ff555d] backdrop-blur-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Stage
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-[#ff555d]/10 border border-[#ff555d]/30 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-sm text-[#26282b] dark:text-[#eaeaea]">
            <span className="font-semibold">⚠️ Unsaved changes:</span> Click "Stage" to save your component configuration.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Component Palette */}
        <div className="lg:col-span-3">
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-sm text-[#26282b] dark:text-[#eaeaea]">Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {availableComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center space-x-2 p-3 rounded-lg border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/10 cursor-pointer hover:bg-white/30 dark:hover:bg-white/20 transition-all backdrop-blur-sm"
                  onClick={() => addComponent(component)}
                >
                  <component.icon className="w-4 h-4 text-[#26282b] dark:text-[#eaeaea]" />
                  <span className="text-sm text-[#26282b] dark:text-[#eaeaea] flex-1">{component.name}</span>
                  <Badge variant="outline" className="text-xs bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20">
                    {component.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-6">
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-sm text-[#26282b] dark:text-[#eaeaea]">Canvas</CardTitle>
            </CardHeader>
            <CardContent className="relative h-full min-h-[500px] bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/0 rounded-lg border-2 border-dashed border-white/20 dark:border-white/10">
              {components.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-30 text-[#26282b] dark:text-[#eaeaea]" />
                    <p className="text-[#26282b]/70 dark:text-[#eaeaea]/70">Click components to add them to the canvas</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {components.map((component) => (
                    <div
                      key={component.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer backdrop-blur-sm ${
                        selectedComponent === component.id
                          ? 'bg-[#ff555d]/20 border-[#ff555d]/50 shadow-lg'
                          : 'bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedComponent(component.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Component className="w-5 h-5 text-[#26282b] dark:text-[#eaeaea]" />
                          <div>
                            <span className="text-sm font-medium text-[#26282b] dark:text-[#eaeaea]">{component.name}</span>
                            <Badge variant="outline" className="text-xs ml-2 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20">
                              {component.category}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteComponent(component.id);
                          }}
                          className="text-[#ff555d] hover:text-[#ff444c] hover:bg-[#ff555d]/10"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="lg:col-span-3">
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl h-full">
            <CardHeader>
              <CardTitle className="text-sm text-[#26282b] dark:text-[#eaeaea]">Properties</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {selectedComponentData ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#26282b] dark:text-[#eaeaea]">Component Type</Label>
                    <Input 
                      value={selectedComponentData.name} 
                      disabled 
                      className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-[#26282b] dark:text-[#eaeaea]">Category</Label>
                    <Input 
                      value={selectedComponentData.category} 
                      disabled 
                      className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] backdrop-blur-sm"
                    />
                  </div>
                  <Separator className="bg-white/20 dark:bg-white/10" />
                  <div>
                    <Label className="text-[#26282b] dark:text-[#eaeaea]">Component ID</Label>
                    <Input 
                      value={selectedComponentData.id} 
                      disabled 
                      className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] backdrop-blur-sm text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[#26282b] dark:text-[#eaeaea]">Properties (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(selectedComponentData.props, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateComponentProps(selectedComponentData.id, parsed);
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] font-mono text-xs backdrop-blur-sm min-h-[200px]"
                      placeholder='{"prop": "value"}'
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#26282b] dark:text-[#eaeaea]" />
                  <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70">Select a component to edit properties</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Live preview component
// Purpose: Shows real-time preview of how design token changes affect actual UI components
// Functionality: 
// - Displays sample components using current CSS variables (reflects token changes)
// - Allows viewport switching (mobile/tablet/desktop) to test responsive design
// - Theme toggle to preview light/dark mode variations
// - Real-time updates as tokens are modified in the Design Tokens section
const LivePreview = ({ tokens }: { tokens: any }) => {
  const { theme: currentTheme } = useTheme();
  const [viewport, setViewport] = useState('desktop');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>((currentTheme || 'light') as 'light' | 'dark');

  const viewportOptions = [
    { value: 'mobile', label: 'Mobile', width: '375px', icon: '📱' },
    { value: 'tablet', label: 'Tablet', width: '768px', icon: '📱' },
    { value: 'desktop', label: 'Desktop', width: '1024px', icon: '🖥️' },
  ];

  const handleThemeToggle = () => {
    const newTheme = previewTheme === 'light' ? 'dark' : 'light';
    setPreviewTheme(newTheme);
    // Apply theme class to preview container
    const previewContainer = document.getElementById('live-preview-container');
    if (previewContainer) {
      if (newTheme === 'dark') {
        previewContainer.classList.add('dark');
      } else {
        previewContainer.classList.remove('dark');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#26282b] to-[#26282b]/80 dark:from-[#eaeaea] dark:to-[#eaeaea]/80 bg-clip-text text-transparent">
            Live Preview
          </h2>
          <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-1">
            See how your design token changes affect UI components in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={viewport} onValueChange={setViewport}>
            <SelectTrigger className="w-36 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-[#2f3235]/95 backdrop-blur-md border border-white/20 dark:border-white/10">
              {viewportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center space-x-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleThemeToggle}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewTheme === 'light' ? 'Dark' : 'Light'}
          </Button>
        </div>
      </div>

      <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
        <CardContent className="p-6">
          <div className="relative">
            {/* Preview Container - Uses actual CSS variables that update in real-time */}
            <div 
              id="live-preview-container"
              className={`mx-auto rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 dark:border-white/20 transition-all ${
                previewTheme === 'dark' ? 'dark' : ''
              }`}
              style={{ 
                width: viewportOptions.find(v => v.value === viewport)?.width,
                maxWidth: '100%',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
              }}
            >
              <div className="p-6 space-y-6" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
                <div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Live Preview
                  </h3>
                  <p className="text-sm opacity-70" style={{ color: 'var(--foreground)' }}>
                    Changes to design tokens are reflected here in real-time
                  </p>
                </div>

                {/* Buttons Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Buttons
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      style={{ 
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                      }}
                    >
                      Primary Button
                    </Button>
                    <Button 
                      variant="outline"
                      style={{ 
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)',
                      }}
                    >
                      Secondary Button
                    </Button>
                    <Button 
                      variant="ghost"
                      style={{ color: 'var(--foreground)' }}
                    >
                      Ghost Button
                    </Button>
                    <Button 
                      variant="destructive"
                      style={{ 
                        backgroundColor: 'var(--destructive)',
                        color: 'var(--destructive-foreground)',
                      }}
                    >
                      Destructive
                    </Button>
                  </div>
                </div>

                {/* Cards Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Cards
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      style={{ 
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2" style={{ color: 'var(--card-foreground)' }}>
                          Card Title
                        </h4>
                        <p className="text-sm opacity-70" style={{ color: 'var(--card-foreground)' }}>
                          This card uses <code className="text-xs">--card</code> and <code className="text-xs">--card-foreground</code> variables.
                        </p>
                      </CardContent>
                    </Card>
                    <Card 
                      style={{ 
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                      }}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2" style={{ color: 'var(--card-foreground)' }}>
                          Another Card
                        </h4>
                        <p className="text-sm opacity-70" style={{ color: 'var(--card-foreground)' }}>
                          Border radius: <code className="text-xs">var(--radius)</code>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Form Elements Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Form Elements
                  </Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--foreground)' }}>Input Field</Label>
                      <Input 
                        placeholder="Enter text..." 
                        style={{ 
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--input)',
                          color: 'var(--foreground)',
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label style={{ color: 'var(--foreground)' }}>Textarea</Label>
                      <Textarea 
                        placeholder="Enter longer text..." 
                        rows={3}
                        style={{ 
                          backgroundColor: 'var(--background)',
                          borderColor: 'var(--input)',
                          color: 'var(--foreground)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Badges Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Badges & Tags
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                      Primary Badge
                    </Badge>
                    <Badge variant="outline" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      Outline Badge
                    </Badge>
                    <Badge variant="secondary" style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                      Secondary
                    </Badge>
                  </div>
                </div>

                {/* Typography Preview */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Typography
                  </Label>
                  <div className="space-y-2" style={{ fontFamily: 'var(--font-sans)' }}>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Heading 1</h1>
                    <h2 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Heading 2</h2>
                    <h3 className="text-xl font-medium" style={{ color: 'var(--foreground)' }}>Heading 3</h3>
                    <p className="text-base opacity-80" style={{ color: 'var(--foreground)' }}>
                      Body text using the current foreground color variable. This text will update as you change design tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewport Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60">
                Viewport: {viewportOptions.find(v => v.value === viewport)?.label} ({viewportOptions.find(v => v.value === viewport)?.width}) • 
                Theme: {previewTheme === 'light' ? 'Light' : 'Dark'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Theme manager component
// Purpose: Manage and stage multiple theme configurations before committing
// Functionality:
// - Create new themes from current design tokens
// - Save/load themes from localStorage
// - Import/export themes as JSON files
// - Activate themes to preview them (applies CSS variables)
// - Delete themes
// - Theme preview with color swatches
const ThemeManager = ({ currentTokens }: { currentTokens?: any }) => {
  const [themes, setThemes] = useState<Array<{
    id: string;
    name: string;
    isActive: boolean;
    tokens?: any;
    createdAt?: string;
  }>>([]);
  const [newThemeName, setNewThemeName] = useState('');
  
  // Get current tokens from prop, localStorage, or defaults
  const getCurrentTokens = () => {
    if (currentTokens) return currentTokens;
    const staged = localStorage.getItem('design-system-staged-tokens');
    return staged ? JSON.parse(staged) : designTokens;
  };

  // Load themes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('design-system-themes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setThemes(parsed);
      } catch (e) {
        console.error('Failed to load themes:', e);
      }
    } else {
      // Initialize with default themes
      const defaultThemes = [
        { id: 'default', name: 'Default Theme', isActive: true, tokens: designTokens, createdAt: new Date().toISOString() },
        { id: 'dark', name: 'Dark Theme', isActive: false, tokens: designTokens, createdAt: new Date().toISOString() },
      ];
      setThemes(defaultThemes);
      localStorage.setItem('design-system-themes', JSON.stringify(defaultThemes));
    }
  }, []);

  const saveThemes = (updatedThemes: typeof themes) => {
    localStorage.setItem('design-system-themes', JSON.stringify(updatedThemes));
    setThemes(updatedThemes);
  };

  const createTheme = () => {
    if (newThemeName.trim()) {
      const currentTokens = getCurrentTokens();
      const newTheme = {
        id: newThemeName.toLowerCase().replace(/\s+/g, '-'),
        name: newThemeName,
        isActive: false,
        tokens: JSON.parse(JSON.stringify(currentTokens)), // Deep clone current tokens
        createdAt: new Date().toISOString()
      };
      const updated = [...themes, newTheme];
      saveThemes(updated);
      setNewThemeName('');
    }
  };

  const activateTheme = (themeId: string) => {
    const updated = themes.map(theme => ({
      ...theme,
      isActive: theme.id === themeId
    }));
    saveThemes(updated);
    
    // Apply theme's CSS variables
    const theme = themes.find(t => t.id === themeId);
    if (theme && theme.tokens) {
      applyThemeTokens(theme.tokens);
    }
  };

  const applyThemeTokens = (themeTokens: any) => {
    // Apply all CSS variables from theme tokens
    const mapping: Record<string, string> = {
      'colors.semantic.background.primary': '--background',
      'colors.semantic.text.primary': '--foreground',
      'colors.semantic.background.secondary': '--card',
      'colors.semantic.text.secondary': '--card-foreground',
      'colors.primary.500': '--primary',
      'colors.error.500': '--destructive',
      'colors.info.500': '--accent',
      'colors.semantic.border.primary': '--border',
      'spacing.borderRadius.base': '--radius',
    };

    Object.entries(mapping).forEach(([path, cssVar]) => {
      const keys = path.split('.');
      let value: any = themeTokens;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return;
        }
      }
      if (typeof value === 'string') {
        document.documentElement.style.setProperty(cssVar, value);
      }
    });
  };

  const resetTheme = () => {
    // Remove all inline CSS variable overrides to restore original values from index.css
    const cssVarsToReset = [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--primary',
      '--destructive',
      '--accent',
      '--border',
      '--radius',
    ];
    
    cssVarsToReset.forEach(cssVar => {
      document.documentElement.style.removeProperty(cssVar);
    });
    
    // Also remove dark mode custom styles if they exist
    const darkModeStyleElement = document.getElementById('dark-mode-custom-styles');
    if (darkModeStyleElement) {
      darkModeStyleElement.remove();
    }
    
    // Deactivate all themes
    const updated = themes.map(theme => ({
      ...theme,
      isActive: false
    }));
    saveThemes(updated);
    
    console.log('Theme reset - original CSS variables restored');
  };

  const deleteTheme = (themeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${themes.find(t => t.id === themeId)?.name}"?`)) {
      const updated = themes.filter(t => t.id !== themeId);
      saveThemes(updated);
    }
  };

  const handleExport = (themeId?: string) => {
    const themesToExport = themeId 
      ? themes.filter(t => t.id === themeId)
      : themes;
    
    const json = JSON.stringify(themesToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = themeId 
      ? `theme-${themeId}-${Date.now()}.json`
      : `themes-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string);
            const importedArray = Array.isArray(imported) ? imported : [imported];
            const updated = [...themes, ...importedArray];
            saveThemes(updated);
            console.log('Themes imported successfully');
          } catch (error) {
            alert('Failed to import themes. Invalid JSON file.');
            console.error('Import error:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getThemeColors = (theme: typeof themes[0]) => {
    if (!theme.tokens) return ['#cc33ab', '#33ccad', '#cc5833', '#8933cc'];
    const tokens = theme.tokens;
    return [
      tokens.colors?.primary?.[500] || tokens.colors?.semantic?.status?.active || '#cc33ab',
      tokens.colors?.info?.[500] || tokens.colors?.semantic?.status?.info || '#33ccad',
      tokens.colors?.error?.[500] || tokens.colors?.semantic?.status?.error || '#cc5833',
      tokens.colors?.primary?.[700] || '#8933cc',
    ];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#26282b] to-[#26282b]/80 dark:from-[#eaeaea] dark:to-[#eaeaea]/80 bg-clip-text text-transparent">
            Theme Manager
          </h2>
          <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-1">
            Create, manage, and stage theme configurations before committing
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetTheme}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm text-[#ff555d] hover:text-[#ff444c]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Theme
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleImport}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleExport()}
            disabled={themes.length === 0}
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card 
            key={theme.id} 
            className={`cursor-pointer transition-all backdrop-blur-sm ${
              theme.isActive 
                ? 'ring-2 ring-[#ff555d] bg-[#ff555d]/20 border-[#ff555d]/50 shadow-xl' 
                : 'bg-white/25 dark:bg-[#2f3235]/25 border-white/20 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/20 hover:shadow-lg'
            }`}
            onClick={() => activateTheme(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#26282b] dark:text-[#eaeaea]">{theme.name}</h3>
                <div className="flex items-center space-x-2">
                  {theme.isActive && (
                    <Badge className="text-xs bg-[#ff555d] text-white">
                      Active
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteTheme(theme.id, e)}
                    className="h-6 w-6 p-0 text-[#ff555d] hover:text-[#ff444c] hover:bg-[#ff555d]/10"
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExport(theme.id);
                    }}
                    className="h-6 w-6 p-0 text-[#26282b] dark:text-[#eaeaea] hover:bg-white/20"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex space-x-2 mb-3">
                {getThemeColors(theme).map((color, idx) => (
                  <div 
                    key={idx}
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              {theme.createdAt && (
                <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60">
                  Created: {new Date(theme.createdAt).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/10">
        <div className="flex space-x-2">
          <Input
            placeholder="New theme name..."
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newThemeName.trim()) {
                createTheme();
              }
            }}
            className="flex-1 bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
          />
          <Button 
            onClick={createTheme} 
            disabled={!newThemeName.trim()}
            className="bg-[#ff555d] hover:bg-[#ff444c] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Theme
          </Button>
        </div>
        <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mt-2">
          Creates a new theme from your current design token configuration
        </p>
      </div>
    </div>
  );
};

// Main design system page
export default function DesignSystem() {
  const [tokens, setTokens] = useState(designTokens);
  const [activePanel, setActivePanel] = useState('tokens');

  const updateTokens = useCallback((newTokens: any) => {
    setTokens(newTokens);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaeaea] to-[#f5f5f5] dark:from-[#26282b] dark:to-[#383b3e]">
      {/* Header */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border-b border-white/20 dark:border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#26282b] to-[#26282b]/80 dark:from-[#eaeaea] dark:to-[#eaeaea]/80 bg-clip-text text-transparent">
                  Design System Control Panel
                </h1>
                <p className="text-lg text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-2">
                  Comprehensive tool for managing design tokens, building components, and creating themes
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  className="bg-[#ff555d] hover:bg-[#ff444c] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Design Tokens */}
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
            <CardContent className="p-6">
              <TokenEditor tokens={tokens} onUpdate={updateTokens} />
            </CardContent>
          </Card>

          {/* Component Builder */}
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
            <CardContent className="p-6">
              <ComponentBuilder />
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
            <CardContent className="p-6">
              <LivePreview tokens={tokens} />
            </CardContent>
          </Card>

          {/* Theme Manager */}
          <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
            <CardContent className="p-6">
              <ThemeManager currentTokens={tokens} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}