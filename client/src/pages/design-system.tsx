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
import { ThemeController } from '../components/design-system/ThemeController';
import { FireThemePanel } from '../components/fire-theme-panel';
import { useThemePreferences } from '../hooks/useThemePreferences';
import { useAuth } from '../hooks/useAuth';
import { 
  StatusBadge, 
  StatusIcon,
  TripProgressMeter, 
  TripStatusInline, 
  TripProgressBar,
  PriorityIndicator, 
  PriorityBadge, 
  PriorityText 
} from '../components/ui/minimal-color-system';
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
    
    // Accent colors
    'colors.info.500': '--accent',
    
    // Destructive colors
    'colors.error.500': '--destructive',
    
    // Border/Input colors
    'colors.semantic.border.primary': '--border',
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
    'colors.semantic.status.warning': '--in-progress',
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
      'colors.info.500': '--accent',
      'colors.error.500': '--destructive',
      'colors.semantic.border.primary': '--border',
      'colors.primary.500': '--ring',
      'spacing.borderRadius.base': '--radius',
      
      // Status Colors
      'colors.semantic.status.active': '--completed',
      'colors.semantic.status.inactive': '--cancelled',
      'colors.semantic.status.pending': '--scheduled',
      'colors.semantic.status.warning': '--in-progress',
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
      {/* Fire Palette Colors */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-2 text-[#26282b] dark:text-[#eaeaea]">Fire Palette - Core Colors</h3>
        <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-4">
          Your "Fire" color palette - the foundation of the HALCYON design system
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Charcoal', value: '#26282b', cssVar: '--color-charcoal', usage: 'Dark backgrounds, light mode text' },
            { name: 'Ice', value: '#e8fffe', cssVar: '--color-ice', usage: 'Light accent backgrounds' },
            { name: 'Lime', value: '#f1fec9', cssVar: '--color-lime', usage: 'Elevated surfaces, accent' },
            { name: 'Coral', value: '#ff8475', cssVar: '--color-coral', usage: 'Primary actions, highlights' },
            { name: 'Silver', value: '#eaeaea', cssVar: '--color-silver', usage: 'Borders, muted backgrounds' },
            { name: 'Cloud', value: '#f4f4f4', cssVar: '--color-cloud', usage: 'Light mode background' },
            { name: 'Shadow', value: '#343434', cssVar: '--color-shadow', usage: 'Dark gray accents' },
            { name: 'Aqua', value: '#a5c8ca', cssVar: '--color-aqua', usage: 'Light teal accents' },
          ].map(({ name, value, cssVar, usage }) => (
            <div key={name} className="space-y-2 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
              <div 
                className="w-full h-20 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md mb-2"
                style={{ backgroundColor: value }}
              />
              <div className="text-sm font-semibold text-[#26282b] dark:text-[#eaeaea]">{name}</div>
              <div className="text-xs font-mono text-[#26282b]/70 dark:text-[#eaeaea]/70">{value}</div>
              <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mt-1">{usage}</div>
              <div className="text-xs font-mono text-[#26282b]/50 dark:text-[#eaeaea]/50 mt-1">{cssVar}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Extended Palette */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Extended Palette</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Charcoal Light', value: '#363a3e', cssVar: '--color-charcoal-light' },
            { name: 'Charcoal Lighter', value: '#464a4f', cssVar: '--color-charcoal-lighter' },
            { name: 'Charcoal Muted', value: '#5c6166', cssVar: '--color-charcoal-muted' },
            { name: 'Lime Dark', value: '#d4e5a8', cssVar: '--color-lime-dark' },
            { name: 'Lime Light', value: '#f7ffdf', cssVar: '--color-lime-light' },
            { name: 'Coral Dark', value: '#e04850', cssVar: '--color-coral-dark' },
            { name: 'Coral Light', value: '#ff7a80', cssVar: '--color-coral-light' },
          ].map(({ name, value, cssVar }) => (
            <div key={name} className="space-y-2 bg-white/20 dark:bg-white/10 rounded-lg p-3 border border-white/20 dark:border-white/10">
              <div 
                className="w-full h-16 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md mb-2"
                style={{ backgroundColor: value }}
              />
              <div className="text-xs font-semibold text-[#26282b] dark:text-[#eaeaea]">{name}</div>
              <div className="text-xs font-mono text-[#26282b]/70 dark:text-[#eaeaea]/70">{value}</div>
              <div className="text-xs font-mono text-[#26282b]/50 dark:text-[#eaeaea]/50">{cssVar}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic Colors - Light Mode */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Semantic Colors - Light Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Backgrounds & Surfaces</h4>
            {[
              { key: 'background', value: 'var(--background)', label: 'Background', color: '#f4f4f4' },
              { key: 'background-secondary', value: 'var(--background-secondary)', label: 'Background Secondary', color: '#eaeaea' },
              { key: 'background-tertiary', value: 'var(--background-tertiary)', label: 'Background Tertiary', color: '#e8fffe' },
              { key: 'surface', value: 'var(--surface)', label: 'Surface', color: '#ffffff' },
              { key: 'surface-elevated', value: 'var(--surface-elevated)', label: 'Surface Elevated', color: '#f1fec9' },
              { key: 'surface-muted', value: 'var(--surface-muted)', label: 'Surface Muted', color: '#eaeaea' },
            ].map(({ key, value, label, color }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`semantic-light-${key}`} className="text-sm text-[#26282b] dark:text-[#eaeaea]">
                  {label}
                </Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <Input
                    id={`semantic-light-${key}`}
                    value={value}
                    readOnly
                    className="flex-1 text-sm bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Actions & Text</h4>
            {[
              { key: 'primary', value: 'var(--primary)', label: 'Primary', color: '#ff8475' },
              { key: 'accent', value: 'var(--accent)', label: 'Accent', color: '#f1fec9' },
              { key: 'foreground', value: 'var(--foreground)', label: 'Foreground', color: '#26282b' },
              { key: 'foreground-secondary', value: 'var(--foreground-secondary)', label: 'Foreground Secondary', color: '#5c6166' },
              { key: 'foreground-muted', value: 'var(--foreground-muted)', label: 'Foreground Muted', color: '#8a8f94' },
            ].map(({ key, value, label, color }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`semantic-light-${key}`} className="text-sm text-[#26282b] dark:text-[#eaeaea]">
                  {label}
                </Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <Input
                    id={`semantic-light-${key}`}
                    value={value}
                    readOnly
                    className="flex-1 text-sm bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea] placeholder:text-[#26282b]/50 dark:placeholder:text-[#eaeaea]/50 backdrop-blur-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Complete Semantic Colors - All CSS Variables */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">All Semantic Colors</h3>
        <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
          Complete list of all semantic color CSS variables from the Fire design system
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Backgrounds & Surfaces */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Backgrounds & Surfaces</h4>
            {[
              { cssVar: '--background', value: '#f4f4f4', label: 'Background' },
              { cssVar: '--background-secondary', value: '#eaeaea', label: 'Background Secondary' },
              { cssVar: '--background-tertiary', value: '#e8fffe', label: 'Background Tertiary' },
              { cssVar: '--surface', value: '#ffffff', label: 'Surface' },
              { cssVar: '--surface-elevated', value: '#f1fec9', label: 'Surface Elevated' },
              { cssVar: '--surface-muted', value: '#eaeaea', label: 'Surface Muted' },
              { cssVar: '--card', value: '#ffffff', label: 'Card' },
              { cssVar: '--popover', value: '#ffffff', label: 'Popover' },
            ].map(({ cssVar, value, label }) => (
              <div key={cssVar} className="space-y-2">
                <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Text & Foreground */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Text & Foreground</h4>
            {[
              { cssVar: '--foreground', value: '#26282b', label: 'Foreground' },
              { cssVar: '--foreground-secondary', value: '#5c6166', label: 'Foreground Secondary' },
              { cssVar: '--foreground-muted', value: '#8a8f94', label: 'Foreground Muted' },
              { cssVar: '--foreground-inverse', value: '#ffffff', label: 'Foreground Inverse' },
              { cssVar: '--card-foreground', value: '#26282b', label: 'Card Foreground' },
              { cssVar: '--popover-foreground', value: '#26282b', label: 'Popover Foreground' },
              { cssVar: '--muted-foreground', value: '#6b7280', label: 'Muted Foreground' },
            ].map(({ cssVar, value, label }) => (
              <div key={cssVar} className="space-y-2">
                <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Actions</h4>
            {[
              { cssVar: '--primary', value: '#ff8475', label: 'Primary' },
              { cssVar: '--primary-hover', value: '#e04850', label: 'Primary Hover' },
              { cssVar: '--primary-foreground', value: '#ffffff', label: 'Primary Foreground' },
              { cssVar: '--accent', value: '#f1fec9', label: 'Accent' },
              { cssVar: '--accent-hover', value: '#d4e5a8', label: 'Accent Hover' },
              { cssVar: '--accent-foreground', value: '#26282b', label: 'Accent Foreground' },
              { cssVar: '--destructive', value: '#dc2626', label: 'Destructive' },
              { cssVar: '--destructive-hover', value: '#b91c1c', label: 'Destructive Hover' },
              { cssVar: '--destructive-foreground', value: '#ffffff', label: 'Destructive Foreground' },
            ].map(({ cssVar, value, label }) => (
              <div key={cssVar} className="space-y-2">
                <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Borders & Inputs */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Borders & Inputs</h4>
            {[
              { cssVar: '--border', value: '#d4d7da', label: 'Border' },
              { cssVar: '--border-muted', value: '#eaeaea', label: 'Border Muted' },
              { cssVar: '--border-strong', value: '#b8bcc0', label: 'Border Strong' },
              { cssVar: '--input', value: '#ffffff', label: 'Input' },
              { cssVar: '--input-border', value: '#d4d7da', label: 'Input Border' },
              { cssVar: '--input-focus', value: '#ff8475', label: 'Input Focus' },
              { cssVar: '--ring', value: '#ff8475', label: 'Ring' },
              { cssVar: '--ring-offset', value: '#f4f4f4', label: 'Ring Offset' },
              { cssVar: '--muted', value: '#eaeaea', label: 'Muted' },
            ].map(({ cssVar, value, label }) => (
              <div key={cssVar} className="space-y-2">
                <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Status Colors - Derived from Fire Palette */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-2">Status Colors</h4>
            <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-3">Derived from Fire palette</p>
            {[
              { cssVar: '--status-pending', value: '#f7ffdf', label: 'Pending', derived: 'Light lime shade' },
              { cssVar: '--status-pending-bg', value: 'rgba(247, 255, 223, 0.15)', label: 'Pending BG', derived: '15% opacity' },
              { cssVar: '--status-success', value: '#3bfec9', label: 'Success', derived: 'From Lime (#f1fec9) - Red: 3B' },
              { cssVar: '--status-success-bg', value: 'rgba(59, 254, 201, 0.15)', label: 'Success BG', derived: '15% opacity' },
              { cssVar: '--status-warning', value: '#f1fe60', label: 'Warning', derived: 'From Lime (#f1fec9) - Blue: 60' },
              { cssVar: '--status-warning-bg', value: 'rgba(241, 254, 96, 0.15)', label: 'Warning BG', derived: '15% opacity' },
              { cssVar: '--status-error', value: '#e04850', label: 'Error', derived: 'From Coral (#ff8475) - darker' },
              { cssVar: '--status-error-bg', value: 'rgba(224, 72, 80, 0.15)', label: 'Error BG', derived: '15% opacity' },
              { cssVar: '--status-info', value: '#7afffe', label: 'Info', derived: 'From Ice (#e8fffe) - Red: 7A' },
              { cssVar: '--status-info-bg', value: 'rgba(122, 255, 254, 0.15)', label: 'Info BG', derived: '15% opacity' },
            ].map(({ cssVar, value, label, derived }) => (
              <div key={cssVar} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                  {derived && <span className="text-xs text-[#26282b]/50 dark:text-[#eaeaea]/50 italic">{derived}</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Trip Status Colors - Derived from Fire Palette */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-2">Trip Status Colors</h4>
            <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-3">Derived from Fire palette</p>
            {[
              { cssVar: '--scheduled', value: '#7afffe', label: 'Scheduled', derived: 'From Ice (#e8fffe) - Red: 7A' },
              { cssVar: '--scheduled-bg', value: 'rgba(122, 255, 254, 0.15)', label: 'Scheduled BG', derived: '15% opacity' },
              { cssVar: '--in-progress', value: '#f1fe60', label: 'In Progress', derived: 'From Lime (#f1fec9) - Blue: 60' },
              { cssVar: '--in-progress-bg', value: 'rgba(241, 254, 96, 0.15)', label: 'In Progress BG', derived: '15% opacity' },
              { cssVar: '--completed', value: '#3bfec9', label: 'Completed', derived: 'From Lime (#f1fec9) - Red: 3B' },
              { cssVar: '--completed-bg', value: 'rgba(59, 254, 201, 0.15)', label: 'Completed BG', derived: '15% opacity' },
              { cssVar: '--cancelled', value: '#e04850', label: 'Cancelled', derived: 'From Coral (#ff8475) - darker' },
              { cssVar: '--cancelled-bg', value: 'rgba(224, 72, 80, 0.15)', label: 'Cancelled BG', derived: '15% opacity' },
              { cssVar: '--confirmed', value: '#c2b4fe', label: 'Confirmed', derived: 'From Ice (#e8fffe) - Red: C2, Green: B4' },
              { cssVar: '--confirmed-bg', value: 'rgba(194, 180, 254, 0.15)', label: 'Confirmed BG', derived: '15% opacity' },
            ].map(({ cssVar, value, label, derived }) => (
              <div key={cssVar} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                  {derived && <span className="text-xs text-[#26282b]/50 dark:text-[#eaeaea]/50 italic">{derived}</span>}
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Sidebar Colors */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Sidebar Colors</h4>
            {[
              { cssVar: '--sidebar', value: '#26282b', label: 'Sidebar' },
              { cssVar: '--sidebar-foreground', value: '#f4f4f4', label: 'Sidebar Foreground' },
              { cssVar: '--sidebar-foreground-muted', value: '#9ca3af', label: 'Sidebar Foreground Muted' },
              { cssVar: '--sidebar-primary', value: '#ff8475', label: 'Sidebar Primary' },
              { cssVar: '--sidebar-primary-foreground', value: '#ffffff', label: 'Sidebar Primary FG' },
              { cssVar: '--sidebar-accent', value: '#f1fec9', label: 'Sidebar Accent' },
              { cssVar: '--sidebar-accent-foreground', value: '#26282b', label: 'Sidebar Accent FG' },
              { cssVar: '--sidebar-border', value: '#363a3e', label: 'Sidebar Border' },
              { cssVar: '--sidebar-ring', value: '#ff8475', label: 'Sidebar Ring' },
            ].map(({ cssVar, value, label }) => (
              <div key={cssVar} className="space-y-2">
                <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ backgroundColor: value }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>

          {/* Priority Classification Colors */}
          <div className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
            <h4 className="font-medium text-[#26282b] dark:text-[#eaeaea] mb-3">Priority Classification</h4>
            {[
              { cssVar: '--priority-high', value: '#ff7a80', label: 'High Priority', glow: 'rgba(255, 122, 128, 0.4)' },
              { cssVar: '--priority-high-bg', value: 'rgba(255, 122, 128, 0.15)', label: 'High Priority BG', glow: null },
              { cssVar: '--priority-high-glow', value: 'rgba(255, 122, 128, 0.4)', label: 'High Priority Glow', glow: null },
              { cssVar: '--priority-medium', value: '#7afffe', label: 'Medium Priority', glow: 'rgba(122, 255, 254, 0.4)' },
              { cssVar: '--priority-medium-bg', value: 'rgba(122, 255, 254, 0.15)', label: 'Medium Priority BG', glow: null },
              { cssVar: '--priority-medium-glow', value: 'rgba(122, 255, 254, 0.4)', label: 'Medium Priority Glow', glow: null },
              { cssVar: '--priority-low', value: '#b8e8e7', label: 'Low Priority', glow: 'rgba(184, 232, 231, 0.3)' },
              { cssVar: '--priority-low-bg', value: 'rgba(184, 232, 231, 0.15)', label: 'Low Priority BG', glow: null },
              { cssVar: '--priority-low-glow', value: 'rgba(184, 232, 231, 0.3)', label: 'Low Priority Glow', glow: null },
            ].map(({ cssVar, value, label, glow }) => (
              <div key={cssVar} className="space-y-2">
                <Label className="text-sm text-[#26282b]/80 dark:text-[#eaeaea]/80">{label}</Label>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-lg border-2 border-white/30 dark:border-white/20 shadow-md flex-shrink-0"
                    style={{ 
                      backgroundColor: value,
                      boxShadow: glow ? `0 0 8px ${glow}, 0 0 12px ${glow}` : undefined
                    }}
                  />
                  <Input
                    value={cssVar}
                    readOnly
                    className="flex-1 text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                </div>
                <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60 ml-10">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTypographyEditor = () => (
    <div className="space-y-6 mt-6">
      {/* Font Families */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Font Families</h3>
        <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
          Fire design system typography - Nohemi for headings, Space Grotesk for body text
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nohemi - Headings */}
          <div className="space-y-4 bg-white/20 dark:bg-white/10 rounded-lg p-6 border border-white/20 dark:border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-[#26282b] dark:text-[#eaeaea]">Nohemi</Label>
                <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">--font-heading</span>
              </div>
              <Input
                value="'Nohemi', system-ui, -apple-system, sans-serif"
                readOnly
                className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
              />
              <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60">
                Used for headings, titles, and bold text
              </p>
            </div>
            <div className="space-y-3 pt-4 border-t border-white/20 dark:border-white/10">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  The Quick Brown Fox
                </div>
                <div className="text-lg font-semibold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Jumps Over The Lazy Dog
                </div>
                <div className="text-base font-medium text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </div>
                <div className="text-sm font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  0123456789 !@#$%^&*()
                </div>
              </div>
            </div>
          </div>

          {/* Space Grotesk - Body */}
          <div className="space-y-4 bg-white/20 dark:bg-white/10 rounded-lg p-6 border border-white/20 dark:border-white/10">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-[#26282b] dark:text-[#eaeaea]">Space Grotesk</Label>
                <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">--font-body</span>
              </div>
              <Input
                value="'Space Grotesk', system-ui, -apple-system, sans-serif"
                readOnly
                className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
              />
              <p className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60">
                Used for body text, UI elements, and general content
              </p>
            </div>
            <div className="space-y-3 pt-4 border-t border-white/20 dark:border-white/10">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  The Quick Brown Fox
                </div>
                <div className="text-lg font-semibold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  Jumps Over The Lazy Dog
                </div>
                <div className="text-base font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </div>
                <div className="text-sm font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  0123456789 !@#$%^&*()
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Font Sizes */}
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

      {/* Typography Scale Preview */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-[#26282b] dark:text-[#eaeaea]">Typography Scale Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Headings with Nohemi */}
          <div className="space-y-4 bg-white/20 dark:bg-white/10 rounded-lg p-6 border border-white/20 dark:border-white/10">
            <h4 className="text-sm font-semibold text-[#26282b] dark:text-[#eaeaea] mb-4">Headings (Nohemi)</h4>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Display / 4xl</div>
                <div className="text-4xl font-black text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Display Heading
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Heading 1 / 3xl</div>
                <div className="text-3xl font-bold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Heading One
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Heading 2 / 2xl</div>
                <div className="text-2xl font-bold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Heading Two
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Heading 3 / xl</div>
                <div className="text-xl font-semibold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Heading Three
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Heading 4 / lg</div>
                <div className="text-lg font-semibold text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Heading Four
                </div>
              </div>
            </div>
          </div>

          {/* Body Text with Space Grotesk */}
          <div className="space-y-4 bg-white/20 dark:bg-white/10 rounded-lg p-6 border border-white/20 dark:border-white/10">
            <h4 className="text-sm font-semibold text-[#26282b] dark:text-[#eaeaea] mb-4">Body Text (Space Grotesk)</h4>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Body Large / lg</div>
                <div className="text-lg font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  The quick brown fox jumps over the lazy dog. This is body large text.
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Body / base</div>
                <div className="text-base font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  The quick brown fox jumps over the lazy dog. This is regular body text.
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Body Small / sm</div>
                <div className="text-sm font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  The quick brown fox jumps over the lazy dog. This is small body text.
                </div>
              </div>
              <div>
                <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">Caption / xs</div>
                <div className="text-xs font-normal text-[#26282b] dark:text-[#eaeaea]" style={{ fontFamily: 'var(--font-body)' }}>
                  The quick brown fox jumps over the lazy dog. This is caption text.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpacingEditor = () => (
    <div className="space-y-6 mt-6">
      {/* Border Radius - Fire Design System */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-2 text-[#26282b] dark:text-[#eaeaea]">Border Radius</h3>
        <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
          Fire design system border radius values
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { cssVar: '--radius', value: '0.5rem', label: 'Base Radius', description: 'Default border radius' },
            { cssVar: '--radius-sm', value: 'calc(var(--radius) - 2px)', label: 'Small', description: '0.375rem (8px - 2px)' },
            { cssVar: '--radius-md', value: 'var(--radius)', label: 'Medium', description: '0.5rem (8px)' },
            { cssVar: '--radius-lg', value: 'calc(var(--radius) + 2px)', label: 'Large', description: '0.625rem (8px + 2px)' },
            { cssVar: '--radius-xl', value: 'calc(var(--radius) + 6px)', label: 'Extra Large', description: '0.875rem (8px + 6px)' },
            { cssVar: '--radius-full', value: '9999px', label: 'Full', description: 'Fully rounded (pill/circle)' },
          ].map(({ cssVar, value, label, description }) => (
            <div key={cssVar} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-[#26282b] dark:text-[#eaeaea]">{label}</Label>
                <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{cssVar}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div 
                  className="h-16 w-16 bg-gradient-to-br from-[#ff8475] to-[#e04850] border-2 border-white/30 dark:border-white/20 shadow-lg flex-shrink-0 flex items-center justify-center"
                  style={{ 
                    borderRadius: value === '0.5rem' ? '0.5rem' : 
                                 value.includes('calc') && value.includes('- 2px') ? '0.375rem' :
                                 value.includes('calc') && value.includes('+ 2px') ? '0.625rem' :
                                 value.includes('calc') && value.includes('+ 6px') ? '0.875rem' :
                                 value === '9999px' ? '9999px' : '0.5rem'
                  }}
                >
                  <div className="text-xs font-bold text-white">R</div>
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    value={cssVar}
                    readOnly
                    className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                  />
                  <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{value}</div>
                  {description && (
                    <div className="text-xs text-[#26282b]/50 dark:text-[#eaeaea]/50">{description}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacing Scale - Fire Design System */}
      <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
        <h3 className="text-lg font-semibold mb-2 text-[#26282b] dark:text-[#eaeaea]">Spacing Scale</h3>
        <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
          Fire design system spacing values for consistent layout
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { cssVar: '--spacing-xs', value: '0.25rem', label: 'Extra Small', pixels: '4px', usage: 'Tight spacing, icon padding' },
            { cssVar: '--spacing-sm', value: '0.5rem', label: 'Small', pixels: '8px', usage: 'Compact spacing, button padding' },
            { cssVar: '--spacing-md', value: '1rem', label: 'Medium', pixels: '16px', usage: 'Default spacing, card padding' },
            { cssVar: '--spacing-lg', value: '1.5rem', label: 'Large', pixels: '24px', usage: 'Comfortable spacing, section gaps' },
            { cssVar: '--spacing-xl', value: '2rem', label: 'Extra Large', pixels: '32px', usage: 'Wide spacing, major sections' },
            { cssVar: '--spacing-2xl', value: '3rem', label: '2X Large', pixels: '48px', usage: 'Maximum spacing, page sections' },
          ].map(({ cssVar, value, label, pixels, usage }) => (
            <div key={cssVar} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold text-[#26282b] dark:text-[#eaeaea]">{label}</Label>
                  <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mt-0.5">{usage}</div>
                </div>
                <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{cssVar}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div 
                    className="h-8 bg-gradient-to-r from-[#ff8475] to-[#e04850] rounded border border-white/30 dark:border-white/20 shadow-md flex-shrink-0 flex items-center justify-center"
                    style={{ width: `min(${value}, 120px)` }}
                  >
                    <span className="text-xs font-bold text-white px-1">{pixels}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      value={cssVar}
                      readOnly
                      className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                    />
                    <div className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{value} ({pixels})</div>
                  </div>
                </div>
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
            className="bg-[#ff8475]/20 hover:bg-[#ff8475]/30 border-[#ff8475]/30 text-[#ff8475] backdrop-blur-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Stage Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-[#ff8475]/10 border border-[#ff8475]/30 rounded-lg p-3 backdrop-blur-sm">
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
            {/* Standard Shadows - Fire Design System */}
            <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#26282b] dark:text-[#eaeaea]">Standard Shadows</h3>
              <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
                Fire design system standard elevation shadows for general use
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { cssVar: '--shadow-xs', value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', label: 'Extra Small', usage: 'Subtle depth, borders' },
                  { cssVar: '--shadow-sm', value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', label: 'Small', usage: 'Cards, inputs' },
                  { cssVar: '--shadow-md', value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', label: 'Medium', usage: 'Panels, modals' },
                  { cssVar: '--shadow-lg', value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', label: 'Large', usage: 'Elevated cards' },
                  { cssVar: '--shadow-xl', value: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', label: 'Extra Large', usage: 'Top-level modals' },
                ].map(({ cssVar, value, label, usage }) => (
                  <div key={cssVar} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-[#26282b] dark:text-[#eaeaea]">{label}</h4>
                      <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{cssVar}</span>
                    </div>
                    <div 
                      className="w-full h-20 rounded-lg border border-white/20 bg-white/30 dark:bg-white/10 mx-auto mb-2"
                      style={{ boxShadow: value }}
                    />
                    <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">{usage}</div>
                    <Input
                      value={cssVar}
                      readOnly
                      className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                    />
                    <div className="text-xs font-mono text-[#26282b]/50 dark:text-[#eaeaea]/50 break-all">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Neumorphic Shadows - Fire Design System */}
            <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#26282b] dark:text-[#eaeaea]">Neumorphic Shadows</h3>
              <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
                Fire design system neumorphic shadows for soft, tactile depth effects
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { 
                    cssVar: '--shadow-neu-flat', 
                    value: '5px 5px 10px var(--neu-shadow-dark), -5px -5px 10px var(--neu-shadow-light)', 
                    label: 'Flat', 
                    usage: 'Default state, neutral depth',
                    computed: '5px 5px 10px rgba(174, 174, 192, 0.4), -5px -5px 10px #ffffff'
                  },
                  { 
                    cssVar: '--shadow-neu-raised', 
                    value: '8px 8px 16px var(--neu-shadow-dark), -8px -8px 16px var(--neu-shadow-light)', 
                    label: 'Raised', 
                    usage: 'Hover state, elevated elements',
                    computed: '8px 8px 16px rgba(174, 174, 192, 0.4), -8px -8px 16px #ffffff'
                  },
                  { 
                    cssVar: '--shadow-neu-pressed', 
                    value: 'inset 4px 4px 8px var(--neu-shadow-dark), inset -4px -4px 8px var(--neu-shadow-light)', 
                    label: 'Pressed', 
                    usage: 'Active/pressed state, buttons',
                    computed: 'inset 4px 4px 8px rgba(174, 174, 192, 0.4), inset -4px -4px 8px #ffffff'
                  },
                  { 
                    cssVar: '--shadow-neu-subtle', 
                    value: '3px 3px 6px var(--neu-shadow-dark), -3px -3px 6px var(--neu-shadow-light)', 
                    label: 'Subtle', 
                    usage: 'Minimal depth, subtle elevation',
                    computed: '3px 3px 6px rgba(174, 174, 192, 0.4), -3px -3px 6px #ffffff'
                  },
                ].map(({ cssVar, value, label, usage, computed }) => (
                  <div key={cssVar} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-[#26282b] dark:text-[#eaeaea]">{label}</h4>
                      <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{cssVar}</span>
                    </div>
                    <div 
                      className="w-full h-20 rounded-lg border border-white/20 bg-white/30 dark:bg-white/10 mx-auto mb-2"
                      style={{ boxShadow: computed }}
                    />
                    <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">{usage}</div>
                    <Input
                      value={cssVar}
                      readOnly
                      className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                    />
                    <div className="text-xs font-mono text-[#26282b]/50 dark:text-[#eaeaea]/50 break-all">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Glass Effect - Fire Design System */}
            <div className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold mb-2 text-[#26282b] dark:text-[#eaeaea]">Glass Effect</h3>
              <p className="text-sm text-[#26282b]/70 dark:text-[#eaeaea]/70 mb-6">
                Fire design system glass morphism effects for modern UI elements
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    cssVar: '--glass-blur', 
                    value: 'blur(12px)', 
                    label: 'Glass Blur', 
                    usage: 'Backdrop filter blur amount',
                    preview: true
                  },
                  { 
                    cssVar: '--glass-bg', 
                    value: 'rgba(255, 255, 255, 0.7)', 
                    label: 'Glass Background', 
                    usage: 'Light mode glass background',
                    preview: true
                  },
                  { 
                    cssVar: '--glass-border', 
                    value: 'rgba(255, 255, 255, 0.2)', 
                    label: 'Glass Border', 
                    usage: 'Light mode glass border',
                    preview: true
                  },
                ].map(({ cssVar, value, label, usage, preview }) => (
                  <div key={cssVar} className="space-y-3 bg-white/20 dark:bg-white/10 rounded-lg p-4 border border-white/20 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm text-[#26282b] dark:text-[#eaeaea]">{label}</h4>
                      <span className="text-xs font-mono text-[#26282b]/60 dark:text-[#eaeaea]/60">{cssVar}</span>
                    </div>
                    {preview && (
                      <div 
                        className="w-full h-20 rounded-lg border mx-auto mb-2 flex items-center justify-center"
                        style={{ 
                          backdropFilter: cssVar === '--glass-blur' ? value : 'blur(12px)',
                          backgroundColor: cssVar === '--glass-bg' ? value : 'rgba(255, 255, 255, 0.7)',
                          borderColor: cssVar === '--glass-border' ? value : 'rgba(255, 255, 255, 0.2)',
                          borderWidth: '1px'
                        }}
                      >
                        <span className="text-xs text-[#26282b] font-medium">Glass Preview</span>
                      </div>
                    )}
                    <div className="text-xs text-[#26282b]/60 dark:text-[#eaeaea]/60 mb-1">{usage}</div>
                    <Input
                      value={cssVar}
                      readOnly
                      className="text-xs font-mono bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 text-[#26282b] dark:text-[#eaeaea]"
                    />
                    <div className="text-xs font-mono text-[#26282b]/50 dark:text-[#eaeaea]/50 break-all">{value}</div>
                  </div>
                ))}
              </div>
            </div>
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
            className="bg-[#ff8475]/20 hover:bg-[#ff8475]/30 border-[#ff8475]/30 text-[#ff8475] backdrop-blur-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            Stage
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-[#ff8475]/10 border border-[#ff8475]/30 rounded-lg p-3 backdrop-blur-sm">
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
                          ? 'bg-[#ff8475]/20 border-[#ff8475]/50 shadow-lg'
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
                          className="text-[#ff8475] hover:text-[#ff444c] hover:bg-[#ff8475]/10"
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
            className="bg-white/30 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/20 backdrop-blur-sm text-[#ff8475] hover:text-[#ff444c]"
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
                ? 'ring-2 ring-[#ff8475] bg-[#ff8475]/20 border-[#ff8475]/50 shadow-xl' 
                : 'bg-white/25 dark:bg-[#2f3235]/25 border-white/20 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/20 hover:shadow-lg'
            }`}
            onClick={() => activateTheme(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#26282b] dark:text-[#eaeaea]">{theme.name}</h3>
                <div className="flex items-center space-x-2">
                  {theme.isActive && (
                    <Badge className="text-xs bg-[#ff8475] text-white">
                      Active
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => deleteTheme(theme.id, e)}
                    className="h-6 w-6 p-0 text-[#ff8475] hover:text-[#ff444c] hover:bg-[#ff8475]/10"
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
            className="bg-[#ff8475] hover:bg-[#ff444c] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
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
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { savePreferences, isLoading: preferencesLoading } = useThemePreferences();

  const updateTokens = useCallback((newTokens: any) => {
    setTokens(newTokens);
  }, []);

  // Handle saving all changes to database
  const handleSaveAll = async () => {
    if (!isAuthenticated || !user) {
      alert('You must be logged in to save theme preferences');
      return;
    }

    try {
      // Save current tokens for the current mode, preserving the other mode
      // The savePreferences function will automatically merge with existing preferences
      await savePreferences(
        theme === 'light' ? tokens : null, // Save current tokens if in light mode
        theme === 'dark' ? tokens : null   // Save current tokens if in dark mode
      );

      // Also save to localStorage for backward compatibility
      localStorage.setItem('design-system-staged-tokens', JSON.stringify(tokens));
      
      alert('Theme preferences saved successfully! They will persist across sessions and browsers.');
    } catch (error: any) {
      console.error('Error saving theme preferences:', error);
      alert(`Failed to save theme preferences: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between mb-6" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
          <div>
            <h1 
              className="font-bold text-foreground" 
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '110px'
              }}
            >
              design.
            </h1>
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
              onClick={handleSaveAll}
              disabled={preferencesLoading || !isAuthenticated}
              className="bg-[#ff8475] hover:bg-[#ff444c] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {preferencesLoading ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Fire Theme Panel - Persistent Theme Controller */}
          <FireThemePanel />

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

          {/* Component Library Section */}
          <div className="space-y-8 mt-12" id="components">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Component Library</h2>
              <p className="text-foreground-secondary">
                Replacement components for the minimal color system. Uses typography, icons, and meters instead of heavy color coding.
              </p>
            </div>

            {/* Status Badges */}
            <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle>Status Indicators</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Text labels + icons instead of color coding. Only "attention" uses coral accent.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Standard badges */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Standard Badges</h3>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="success" />
                    <StatusBadge status="pending" />
                    <StatusBadge status="error" />
                    <StatusBadge status="warning" />
                    <StatusBadge status="info" />
                    <StatusBadge status="attention" />
                  </div>
                </div>

                {/* Custom labels */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Custom Labels</h3>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="success" label="DELIVERED" />
                    <StatusBadge status="pending" label="AWAITING APPROVAL" />
                    <StatusBadge status="error" label="CANCELLED" />
                    <StatusBadge status="attention" label="URGENT" />
                  </div>
                </div>

                {/* Without icons */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Without Icons</h3>
                  <div className="flex flex-wrap gap-3">
                    <StatusBadge status="success" showIcon={false} />
                    <StatusBadge status="attention" label="NEEDS REVIEW" showIcon={false} />
                  </div>
                </div>

                {/* Icon-only */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Icon Only (Compact)</h3>
                  <div className="flex items-center gap-3">
                    <StatusIcon status="success" />
                    <StatusIcon status="pending" />
                    <StatusIcon status="error" />
                    <StatusIcon status="warning" />
                    <StatusIcon status="info" />
                    <StatusIcon status="attention" />
                  </div>
                </div>

                {/* Usage note */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Usage:</strong> Use "attention" status sparingly — only for items that 
                    truly require immediate action. It's the only status that uses the coral accent color.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trip Progress */}
            <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle>Trip Progress Indicators</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Progress meters + typography instead of color coding. Empty → Partial → Full.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full meters with labels */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Progress Meters (Full)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="scheduled" />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="confirmed" />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="in_progress" />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="completed" />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="cancelled" />
                    </div>
                  </div>
                </div>

                {/* Inline (no meter) */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Inline (Icon + Text, No Meter)</h3>
                  <div className="flex flex-wrap gap-4">
                    <TripStatusInline status="scheduled" />
                    <TripStatusInline status="confirmed" />
                    <TripStatusInline status="in_progress" />
                    <TripStatusInline status="completed" />
                    <TripStatusInline status="cancelled" />
                  </div>
                </div>

                {/* Meter only */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Meter Only (Compact)</h3>
                  <div className="space-y-2 max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24">Scheduled</span>
                      <TripProgressBar status="scheduled" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24">Confirmed</span>
                      <TripProgressBar status="confirmed" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24">In Progress</span>
                      <TripProgressBar status="in_progress" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24">Complete</span>
                      <TripProgressBar status="completed" />
                    </div>
                  </div>
                </div>

                {/* Custom labels */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Custom Labels</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="scheduled" label="AWAITING PICKUP" />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="in_progress" label="EN ROUTE" />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <TripProgressMeter status="completed" label="DELIVERED" />
                    </div>
                  </div>
                </div>

                {/* Usage note */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Typography cues:</strong> Notice how typography alone indicates status:
                    italic for in-progress, bold for completed, strike-through for cancelled. The meter provides visual reinforcement.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Priority Indicators */}
            <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle>Priority Indicators</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Typography weight + optional meter. Coral accent ONLY for "urgent". List order is primary indicator.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full indicators with meters */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Full Indicators (Text + Meter)</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <PriorityIndicator level="urgent" label="Server outage - immediate attention" showMeter showIcon />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <PriorityIndicator level="high" label="Critical bug affecting users" showMeter />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <PriorityIndicator level="medium" label="Update documentation" showMeter />
                    </div>
                    <div className="p-3 bg-surface-muted rounded-lg">
                      <PriorityIndicator level="low" label="Refactor utility functions" showMeter />
                    </div>
                  </div>
                </div>

                {/* Without meters */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Text Only (No Meter)</h3>
                  <div className="space-y-2">
                    <PriorityIndicator level="urgent" label="Server outage" showIcon />
                    <PriorityIndicator level="high" label="Critical bug" />
                    <PriorityIndicator level="medium" label="Update docs" />
                    <PriorityIndicator level="low" label="Refactor utils" />
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Badge Style (Compact)</h3>
                  <div className="flex flex-wrap gap-3">
                    <PriorityBadge level="urgent" />
                    <PriorityBadge level="high" />
                    <PriorityBadge level="medium" />
                    <PriorityBadge level="low" />
                  </div>
                </div>

                {/* Text-only inline */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Inline Text (Minimal)</h3>
                  <div className="flex flex-wrap gap-3">
                    <PriorityText level="urgent" />
                    <PriorityText level="high" />
                    <PriorityText level="medium" />
                    <PriorityText level="low" />
                  </div>
                </div>

                {/* Task list example */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Task List Example (Order + Typography)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="font-extrabold text-primary uppercase text-sm">URGENT</div>
                        <div className="text-foreground">Fix database connection issue</div>
                      </div>
                      <PriorityBadge level="urgent" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="font-extrabold uppercase text-sm">HIGH</div>
                        <div className="text-foreground">Update payment gateway</div>
                      </div>
                      <PriorityBadge level="high" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">Medium</div>
                        <div className="text-foreground">Refactor user service</div>
                      </div>
                      <PriorityBadge level="medium" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                      <div className="space-y-1">
                        <div className="font-light text-muted-foreground text-sm">Low</div>
                        <div className="text-foreground-secondary">Update code comments</div>
                      </div>
                      <PriorityBadge level="low" />
                    </div>
                  </div>
                </div>

                {/* Usage note */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-foreground-secondary">
                    <strong className="text-foreground">Important:</strong> List ORDER is the primary priority indicator.
                    High-priority items should always be at the top. These components provide secondary visual reinforcement.
                    Use "urgent" level sparingly — only for true emergencies requiring immediate action.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Before/After Comparison */}
            <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle>Before/After Migration Examples</CardTitle>
                <p className="text-sm text-foreground-secondary">
                  Side-by-side comparison showing the old color-coded approach vs. minimal color system.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status comparison */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Status Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-muted rounded-lg">
                      <div className="text-xs font-semibold mb-3 text-muted-foreground">❌ BEFORE (Color-coded)</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</span>
                        <span className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</span>
                        <span className="px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Warning</span>
                        <span className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Info</span>
                      </div>
                    </div>
                    <div className="p-4 bg-surface-muted rounded-lg">
                      <div className="text-xs font-semibold mb-3 text-muted-foreground">✅ AFTER (Minimal Color)</div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge status="success" />
                        <StatusBadge status="error" />
                        <StatusBadge status="warning" />
                        <StatusBadge status="info" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip status comparison */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Trip Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface-muted rounded-lg">
                      <div className="text-xs font-semibold mb-3 text-muted-foreground">❌ BEFORE (Color-coded)</div>
                      <div className="space-y-2">
                        <div className="px-3 py-2 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Scheduled</div>
                        <div className="px-3 py-2 rounded-md text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</div>
                        <div className="px-3 py-2 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</div>
                      </div>
                    </div>
                    <div className="p-4 bg-surface-muted rounded-lg">
                      <div className="text-xs font-semibold mb-3 text-muted-foreground">✅ AFTER (Minimal Color)</div>
                      <div className="space-y-3">
                        <TripProgressMeter status="scheduled" />
                        <TripProgressMeter status="in_progress" />
                        <TripProgressMeter status="completed" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Design Principles */}
            <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle>Design Principles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">1. Use Color Sparingly</h4>
                    <p className="text-foreground-secondary">
                      Coral accent (primary) is reserved for urgent/attention states only. Everything else uses 
                      typography, layout, and neutral colors (foreground, muted, border).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">2. Typography as Primary Signal</h4>
                    <p className="text-foreground-secondary">
                      Use font weight, caps, italics, and strike-through to convey meaning. Bold = important, 
                      light = less important, ALL CAPS = urgent, italic = in-progress.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">3. Layout & Order</h4>
                    <p className="text-foreground-secondary">
                      Position is meaning. High-priority items at top, completed items at bottom. 
                      Let the user's natural reading pattern do the work.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">4. Visual Reinforcement</h4>
                    <p className="text-foreground-secondary">
                      Icons, meters, and badges provide secondary reinforcement. They support, not replace, 
                      the primary signals (typography and order).
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">5. Accessible by Default</h4>
                    <p className="text-foreground-secondary">
                      Text labels + proper semantic HTML work for everyone. Screen readers get meaningful content, 
                      not just color differences.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}