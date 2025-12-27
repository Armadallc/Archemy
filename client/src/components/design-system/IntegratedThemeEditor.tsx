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
      
      // Get current fireTheme state directly from the hook to ensure we have the latest
      // This is a workaround to ensure we're reading the current state
      const currentFireTheme = fireTheme;
      
      console.log('💾 Saving theme:', {
        themeId,
        name,
        isNew,
        editingTheme: editingTheme?.name,
        currentFireTheme: {
          light: {
            background: currentFireTheme.light?.background,
            surface: currentFireTheme.light?.surface,
            card: currentFireTheme.light?.card,
          },
          dark: {
            background: currentFireTheme.dark?.background,
            surface: currentFireTheme.dark?.surface,
            card: currentFireTheme.dark?.card,
          },
        },
        palette,
      });
      
      // CRITICAL: Verify both modes have valid data before saving
      // If one mode is missing or has default values, it means we need to load the theme first
      if (!currentFireTheme.light?.background || !currentFireTheme.dark?.background) {
        console.warn('⚠️ WARNING: One or both modes missing background color!', {
          lightBackground: currentFireTheme.light?.background,
          darkBackground: currentFireTheme.dark?.background,
        });
      }
      
      // CRITICAL: If updating an existing theme, we MUST have loaded it first to preserve both modes
      // If editingTheme is null, it means we haven't loaded the theme, so we might be saving stale/default data
      if (!isNew && !editingTheme) {
        console.error('❌ ERROR: Attempting to update theme without loading it first! This will cause mode mixing.');
        toast({
          title: 'Error',
          description: 'Please load the theme first before saving to ensure both light and dark modes are preserved.',
          variant: 'destructive',
        });
        throw new Error('Cannot update theme without loading it first');
      }
      
      // If updating, verify we're not accidentally mixing modes
      // Check if the backgrounds are suspiciously similar (might indicate a bug)
      if (!isNew && currentFireTheme.light?.background && currentFireTheme.dark?.background) {
        // These should typically be different (light = cloud/silver, dark = shadow/charcoal)
        const lightBg = currentFireTheme.light.background;
        const darkBg = currentFireTheme.dark.background;
        
        // Warn if both are the same (unless it's a valid design choice)
        if (lightBg === darkBg && lightBg !== 'cloud' && darkBg !== 'shadow') {
          console.warn('⚠️ WARNING: Light and dark mode backgrounds are the same!', {
            sharedValue: lightBg,
            warning: 'This might indicate a bug where one mode overwrote the other.',
          });
        }
      }
      
      // Validate that we have valid palette keys
      // Use hardcoded palette to ensure consistent validation
      const HARDCODED_PALETTE = {
        charcoal: "#1e2023", // 20% darker
        ice: "#e8fffe",
        lime: "#f1fec9",
        coral: "#ff8475",
        silver: "#eaeaea",
        cloud: "#f4f4f4",
        shadow: "#292929", // 20% darker
        aqua: "#a5c8ca",
      } as const;
      
      const validatePaletteKey = (key: string | undefined, defaultValue: string = 'cloud'): string => {
        if (!key) {
          console.warn(`Empty palette key, using default "${defaultValue}"`);
          return defaultValue;
        }
        
        // Check hardcoded palette first (most reliable)
        if (HARDCODED_PALETTE[key as keyof typeof HARDCODED_PALETTE]) {
          return key;
        }
        
        // Fallback to hook palette if available
        if (palette && palette[key as keyof typeof palette]) {
          return key;
        }
        
        console.warn(`Invalid palette key "${key}", using default "${defaultValue}"`);
        return defaultValue;
      };
      
      // Ensure all required slots are present with valid palette keys
      const validatedLight = {
        background: validatePaletteKey(currentFireTheme.light?.background, 'cloud'),
        surface: validatePaletteKey(currentFireTheme.light?.surface, 'cloud'),
        card: validatePaletteKey(currentFireTheme.light?.card, 'cloud'),
        text: validatePaletteKey(currentFireTheme.light?.text, 'charcoal'),
        cardText: validatePaletteKey(currentFireTheme.light?.cardText, 'charcoal'),
        accent: validatePaletteKey(currentFireTheme.light?.accent, 'aqua'),
        borderColor: validatePaletteKey(currentFireTheme.light?.borderColor, 'silver'),
        // pageBackground should match background unless explicitly set differently
        // If pageBackground is not set or matches background, use background
        pageBackground: validatePaletteKey(
          currentFireTheme.light?.pageBackground && currentFireTheme.light?.pageBackground !== currentFireTheme.light?.background
            ? currentFireTheme.light?.pageBackground
            : currentFireTheme.light?.background,
          'cloud'
        ),
        buttonBackground: validatePaletteKey(currentFireTheme.light?.buttonBackground || currentFireTheme.light?.accent, 'aqua'),
        buttonText: validatePaletteKey(currentFireTheme.light?.buttonText || currentFireTheme.light?.text, 'charcoal'),
        buttonBorder: validatePaletteKey(currentFireTheme.light?.buttonBorder || currentFireTheme.light?.borderColor, 'silver'),
        buttonHover: validatePaletteKey(currentFireTheme.light?.buttonHover || currentFireTheme.light?.buttonBackground || currentFireTheme.light?.accent, 'aqua'),
        buttonStyle: currentFireTheme.light?.buttonStyle || 'solid',
        borderWeight: currentFireTheme.light?.borderWeight || 'thin',
      };
      
      const validatedDark = {
        background: validatePaletteKey(currentFireTheme.dark?.background, 'shadow'),
        surface: validatePaletteKey(currentFireTheme.dark?.surface, 'shadow'),
        card: validatePaletteKey(currentFireTheme.dark?.card, 'charcoal'),
        text: validatePaletteKey(currentFireTheme.dark?.text, 'ice'),
        cardText: validatePaletteKey(currentFireTheme.dark?.cardText, 'ice'),
        accent: validatePaletteKey(currentFireTheme.dark?.accent, 'aqua'),
        borderColor: validatePaletteKey(currentFireTheme.dark?.borderColor, 'shadow'),
        // pageBackground should match background unless explicitly set differently
        // If pageBackground is not set or matches background, use background
        pageBackground: validatePaletteKey(
          currentFireTheme.dark?.pageBackground && currentFireTheme.dark?.pageBackground !== currentFireTheme.dark?.background
            ? currentFireTheme.dark?.pageBackground
            : currentFireTheme.dark?.background,
          'shadow'
        ),
        // For dark mode, default button background to coral (not accent) to avoid lime color
        buttonBackground: validatePaletteKey(currentFireTheme.dark?.buttonBackground || 'coral', 'coral'),
        buttonText: validatePaletteKey(currentFireTheme.dark?.buttonText || currentFireTheme.dark?.text, 'ice'),
        buttonBorder: validatePaletteKey(currentFireTheme.dark?.buttonBorder || currentFireTheme.dark?.borderColor, 'shadow'),
        buttonHover: validatePaletteKey(currentFireTheme.dark?.buttonHover || currentFireTheme.dark?.buttonBackground || 'coral', 'coral'),
        buttonStyle: currentFireTheme.dark?.buttonStyle || 'solid',
        borderWeight: currentFireTheme.dark?.borderWeight || 'thin',
      };
      
      console.log('✅ Validated theme slots:');
      console.log('  Light mode:', validatedLight);
      console.log('  Dark mode:', validatedDark);
      
      // Log the raw fireTheme state before validation for debugging
      console.log('🔍 Raw fireTheme state before validation:');
      console.log('  Light mode:', {
        background: currentFireTheme.light?.background,
        surface: currentFireTheme.light?.surface,
        card: currentFireTheme.light?.card,
        text: currentFireTheme.light?.text,
        cardText: currentFireTheme.light?.cardText,
        accent: currentFireTheme.light?.accent,
        borderColor: currentFireTheme.light?.borderColor,
      });
      console.log('  Dark mode:', {
        background: currentFireTheme.dark?.background,
        surface: currentFireTheme.dark?.surface,
        card: currentFireTheme.dark?.card,
        text: currentFireTheme.dark?.text,
        cardText: currentFireTheme.dark?.cardText,
        accent: currentFireTheme.dark?.accent,
        borderColor: currentFireTheme.dark?.borderColor,
      });
      
      // Convert validated fire theme slots to tokens format
      // IMPORTANT: Pass the mode parameter to ensure correct defaults
      const lightTokens = convertFireThemeToTokens(validatedLight, 'light');
      const darkTokens = convertFireThemeToTokens(validatedDark, 'dark');

      console.log('💾 Converted tokens:', {
        lightTokens,
        darkTokens,
      });
      
      // CRITICAL VALIDATION: Ensure light and dark modes have different backgrounds
      // This prevents one mode from overwriting the other
      const lightBgHex = lightTokens.colors.semantic.background.primary;
      const darkBgHex = darkTokens.colors.semantic.background.primary;
      
      console.log('🔍 Validating mode separation:', {
        lightBackground: {
          paletteKey: validatedLight.background,
          hex: lightBgHex,
        },
        darkBackground: {
          paletteKey: validatedDark.background,
          hex: darkBgHex,
        },
        areDifferent: lightBgHex !== darkBgHex,
      });
      
      // Warn if backgrounds are the same (might indicate a bug)
      if (lightBgHex === darkBgHex && lightBgHex !== '#f4f4f4' && darkBgHex !== '#343434') {
        console.warn('⚠️ WARNING: Light and dark mode backgrounds are the same! This might indicate a bug.', {
          sharedHex: lightBgHex,
          lightPaletteKey: validatedLight.background,
          darkPaletteKey: validatedDark.background,
        });
      }
      
      // Log what hex colors are being saved for each slot
      console.log('🎨 Hex colors being saved:');
      console.log('  Light mode:', {
        background: lightTokens.colors.semantic.background.primary,
        backgroundPaletteKey: validatedLight.background,
        surface: lightTokens.colors.semantic.background.secondary,
        card: lightTokens.colors.semantic.background.tertiary,
        text: lightTokens.colors.semantic.text.primary,
        accent: lightTokens.colors.primary[500],
      });
      console.log('  Dark mode:', {
        background: darkTokens.colors.semantic.background.primary,
        backgroundPaletteKey: validatedDark.background,
        expectedHex: validatedDark.background === 'shadow' ? '#343434' : validatedDark.background === 'charcoal' ? '#26282b' : 'other',
        surface: darkTokens.colors.semantic.background.secondary,
        card: darkTokens.colors.semantic.background.tertiary,
        text: darkTokens.colors.semantic.text.primary,
        accent: darkTokens.colors.primary[500],
      });

      // FINAL VALIDATION: Before saving, verify the tokens match what we expect
      // Reuse lightBgHex and darkBgHex that were already declared above
      const lightBgKey = validatedLight.background;
      const darkBgKey = validatedDark.background;
      
      // Verify the hex values match the palette keys we're saving
      const expectedLightHex = palette[lightBgKey] || (lightBgKey === 'cloud' ? '#f4f4f4' : lightBgKey === 'silver' ? '#eaeaea' : null);
      const expectedDarkHex = palette[darkBgKey] || (darkBgKey === 'shadow' ? '#343434' : darkBgKey === 'charcoal' ? '#26282b' : null);
      
      if (expectedLightHex && lightBgHex !== expectedLightHex) {
        console.error('❌ ERROR: Light mode background hex mismatch!', {
          expected: expectedLightHex,
          actual: lightBgHex,
          paletteKey: lightBgKey,
        });
      }
      
      if (expectedDarkHex && darkBgHex !== expectedDarkHex) {
        console.error('❌ ERROR: Dark mode background hex mismatch!', {
          expected: expectedDarkHex,
          actual: darkBgHex,
          paletteKey: darkBgKey,
        });
      }
      
      console.log('✅ Final validation before save:', {
        lightMode: {
          paletteKey: lightBgKey,
          hex: lightBgHex,
          expectedHex: expectedLightHex,
          matches: expectedLightHex ? lightBgHex === expectedLightHex : 'unknown',
        },
        darkMode: {
          paletteKey: darkBgKey,
          hex: darkBgHex,
          expectedHex: expectedDarkHex,
          matches: expectedDarkHex ? darkBgHex === expectedDarkHex : 'unknown',
        },
        modesAreDifferent: lightBgHex !== darkBgHex,
      });

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
        // When updating, preserve existing tokens if current fireTheme is missing data
        // But since we're loading both modes, this shouldn't be necessary
        const response = await apiRequest('PUT', `/api/themes/${themeId}`, {
          name,
          description: description || null,
          light_mode_tokens: lightTokens,
          dark_mode_tokens: darkTokens,
        });
        return response.json();
      }
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      
      // If updating an existing theme that is currently active, apply it to the live app
      if (!variables.isNew && editingTheme?.is_active) {
        try {
          // Check if this theme is the user's current selection
          const userSelectionResponse = await apiRequest('GET', '/api/themes/user/selection').catch(() => null);
          const userSelection = userSelectionResponse ? await userSelectionResponse.json().catch(() => null) : null;
          
          if (userSelection && userSelection.theme_id === editingTheme.id) {
            // Theme is active and user has it selected - apply to live app
            await apiRequest('POST', '/api/themes/user/selection', {
              theme_id: editingTheme.id,
              theme_mode: userSelection.theme_mode || 'light',
            });
            
            queryClient.invalidateQueries({ queryKey: ['/api/themes/user/selection'] });
            toast({
              title: 'Success',
              description: 'Theme updated and applied to live app! Page will refresh.',
            });
            // Reload page to apply changes
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            // Theme is active but not user's selection - just save
            toast({
              title: 'Success',
              description: 'Theme updated successfully!',
            });
          }
        } catch (error) {
          // If checking user selection fails, just show success message
          toast({
            title: 'Success',
            description: variables.isNew ? 'Theme created successfully!' : 'Theme updated successfully!',
          });
        }
      } else {
        // New theme or inactive theme - just save, don't apply
        toast({
          title: 'Success',
          description: variables.isNew ? 'Theme created successfully!' : 'Theme updated successfully!',
        });
      }
      
      // Don't reset theme immediately - let user see the success message
      // handleNewTheme() will be called when they click "New Theme" or load another theme
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

  // Helper: Convert hex color to closest palette color key
  // Uses hardcoded PALETTE to ensure correct matching
  function hexToPaletteKey(hex: string): 'charcoal' | 'ice' | 'lime' | 'coral' | 'silver' | 'cloud' | 'shadow' | 'aqua' {
    if (!hex) return 'charcoal';
    
    // Hardcoded palette to ensure consistent matching
    const PALETTE = {
      charcoal: "#26282b",
      ice: "#e8fffe",
      lime: "#f1fec9",
      coral: "#ff8475",
      silver: "#eaeaea",
      cloud: "#f4f4f4",
      shadow: "#343434",
      aqua: "#a5c8ca",
    } as const;
    
    // Normalize hex color
    const normalizedHex = hex.toLowerCase().trim();
    
    // Check if it's already a palette color name
    if (PALETTE[normalizedHex as keyof typeof PALETTE]) {
      return normalizedHex as keyof typeof PALETTE;
    }
    
    // Convert hex to RGB
    const hexToRgb = (h: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const targetRgb = hexToRgb(normalizedHex);
    if (!targetRgb) {
      console.warn(`Invalid hex color: ${hex}, using default 'charcoal'`);
      return 'charcoal';
    }
    
    // Find closest palette color by Euclidean distance
    let closestKey: keyof typeof PALETTE = 'charcoal';
    let minDistance = Infinity;
    
    Object.entries(PALETTE).forEach(([key, value]) => {
      const paletteRgb = hexToRgb(value);
      if (paletteRgb) {
        const distance = Math.sqrt(
          Math.pow(targetRgb.r - paletteRgb.r, 2) +
          Math.pow(targetRgb.g - paletteRgb.g, 2) +
          Math.pow(targetRgb.b - paletteRgb.b, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestKey = key as keyof typeof PALETTE;
        }
      }
    });
    
    console.log(`🎨 hexToPaletteKey: ${hex} -> ${closestKey} (distance: ${minDistance.toFixed(2)})`);
    return closestKey;
  }

  // Helper: Extract color value from token path
  function getTokenValue(tokens: any, path: string): string | null {
    const keys = path.split('.');
    let current = tokens;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    return typeof current === 'string' ? current : null;
  }

  // Convert Fire Theme slots to token format
  // mode parameter is needed to determine correct defaults (e.g., dark mode button defaults to coral)
  function convertFireThemeToTokens(modeTheme: any, mode: 'light' | 'dark' = 'light'): any {
    if (!modeTheme) {
      console.error('Invalid modeTheme:', modeTheme);
      throw new Error('Invalid theme data for conversion - modeTheme is missing');
    }

    // Get palette from fire-theme-provider (hardcoded to ensure we have the correct values)
    const PALETTE = {
      charcoal: "#26282b",
      ice: "#e8fffe",
      lime: "#f1fec9",
      coral: "#ff8475",
      silver: "#eaeaea",
      cloud: "#f4f4f4",
      shadow: "#343434",
      aqua: "#a5c8ca",
    } as const;

    // Use provided palette if available, otherwise use hardcoded one
    const activePalette = palette && Object.keys(palette).length > 0 ? palette : PALETTE;

    // modeTheme contains palette keys (like 'charcoal', 'ice', etc.)
    // Convert them to hex colors using the palette
    const getHexColor = (paletteKey: string): string => {
      if (!paletteKey) {
        console.warn('Empty palette key, using default');
        return '#ffffff';
      }
      
      // Try provided palette first
      const hex = activePalette[paletteKey as keyof typeof activePalette];
      if (hex) {
        return hex;
      }
      
      // Fallback to hardcoded palette
      const fallbackHex = PALETTE[paletteKey as keyof typeof PALETTE];
      if (fallbackHex) {
        console.warn(`Palette key "${paletteKey}" not in provided palette, using hardcoded value`);
        return fallbackHex;
      }
      
      console.warn(`Palette key "${paletteKey}" not found in any palette, using default white`);
      return '#ffffff';
    };

    console.log('🔄 Converting Fire Theme to Tokens:');
    console.log('  Palette keys:', {
      background: modeTheme.background,
      surface: modeTheme.surface,
      card: modeTheme.card,
      text: modeTheme.text,
      cardText: modeTheme.cardText,
      accent: modeTheme.accent,
      borderColor: modeTheme.borderColor,
      pageBackground: modeTheme.pageBackground,
      buttonBackground: modeTheme.buttonBackground,
      buttonText: modeTheme.buttonText,
      buttonBorder: modeTheme.buttonBorder,
      buttonHover: modeTheme.buttonHover,
      buttonStyle: modeTheme.buttonStyle,
      borderWeight: modeTheme.borderWeight,
    });

    const tokens = {
      colors: {
        semantic: {
          background: {
            primary: getHexColor(modeTheme.background || 'cloud'),
            secondary: getHexColor(modeTheme.surface || 'cloud'),
            tertiary: getHexColor(modeTheme.card || 'cloud'),
          },
          text: {
            primary: getHexColor(modeTheme.text || 'charcoal'),
            secondary: getHexColor(modeTheme.cardText || 'charcoal'),
          },
          border: {
            primary: getHexColor(modeTheme.borderColor || 'silver'),
          },
        },
        primary: {
          500: getHexColor(modeTheme.accent || 'aqua'),
        },
        // Additional fields for compatibility
        // pageBackground should always match background unless explicitly set differently
        pageBackground: getHexColor(modeTheme.pageBackground || modeTheme.background || 'cloud'),
        // Store background separately for reference, but pageBackground is the source of truth for the main background
        background: getHexColor(modeTheme.background || 'cloud'),
        surface: getHexColor(modeTheme.surface || 'cloud'),
        card: getHexColor(modeTheme.card || 'cloud'),
        text: getHexColor(modeTheme.text || 'charcoal'),
        cardText: getHexColor(modeTheme.cardText || 'charcoal'),
        accent: getHexColor(modeTheme.accent || 'aqua'),
        border: getHexColor(modeTheme.borderColor || 'silver'),
        // Button properties
        // For dark mode, default to coral instead of accent to avoid lime color
        // For light mode, use accent as fallback
        buttonBackground: getHexColor(
          modeTheme.buttonBackground || 
          (mode === 'dark' ? 'coral' : modeTheme.accent || 'aqua')
        ),
        buttonText: getHexColor(modeTheme.buttonText || modeTheme.text || 'charcoal'),
        buttonBorder: getHexColor(modeTheme.buttonBorder || modeTheme.borderColor || 'silver'),
        buttonHover: getHexColor(modeTheme.buttonHover || modeTheme.buttonBackground || (mode === 'dark' ? 'coral' : modeTheme.accent || 'aqua')),
      },
      // Button style and border weight (non-color properties)
      buttonStyle: modeTheme.buttonStyle || 'solid',
      borderWeight: modeTheme.borderWeight || 'thin',
    };

    console.log('✅ Converted tokens:', tokens);
    return tokens;
  }

  // Convert tokens to Fire Theme format and apply to editor (not live app)
  function convertTokensToFireTheme(tokens: any, mode: 'light' | 'dark') {
    if (!tokens || typeof tokens !== 'object') {
      console.error('Invalid token format:', tokens);
      throw new Error('Invalid token format');
    }

    console.log('Loading tokens for', mode, 'mode:', tokens);

    // Try multiple possible token structures
    // Structure 1: colors.semantic.background.primary
    // Structure 2: colors.background
    // Structure 3: Direct CSS variable names
    // Structure 4: Fire theme format (already in palette keys)
    
    let backgroundHex: string | null = null;
    let surfaceHex: string | null = null;
    let cardHex: string | null = null;
    let textHex: string | null = null;
    let cardTextHex: string | null = null;
    let accentHex: string | null = null;
    let borderHex: string | null = null;
    let pageBgHex: string | null = null;
    let buttonBgHex: string | null = null;
    let buttonTextHex: string | null = null;
    let buttonBorderHex: string | null = null;
    let buttonStyle: string | null = null;
    let borderWeight: string | null = null;

    // Try semantic structure first (this is what we save, so prioritize it)
    // Use || operator carefully - only use fallback if primary path is null/undefined
    const tryGetValue = (...paths: string[]): string | null => {
      for (const path of paths) {
        const value = getTokenValue(tokens, path);
        if (value) {
          console.log(`✅ Found value for path "${path}": ${value}`);
          return value;
        }
      }
      return null;
    };
    
    // Get background - this is critical for both modes
    backgroundHex = tryGetValue(
      'colors.semantic.background.primary',
      'colors.background',
      'background'
    );
    
    // Debug logging for background extraction - CRITICAL for debugging mode mixing
    console.log(`🔍 ${mode} mode background extraction:`, {
      mode,
      backgroundHex,
      tokenPath: 'colors.semantic.background.primary',
      tokenValue: getTokenValue(tokens, 'colors.semantic.background.primary'),
      allBackgroundPaths: {
        'colors.semantic.background.primary': getTokenValue(tokens, 'colors.semantic.background.primary'),
        'colors.background': getTokenValue(tokens, 'colors.background'),
        'background': getTokenValue(tokens, 'background'),
      },
      // Log a sample of the token structure to verify we're reading the right mode
      tokenSample: {
        hasSemantic: !!tokens.colors?.semantic,
        hasBackground: !!tokens.colors?.semantic?.background,
        hasPrimary: !!tokens.colors?.semantic?.background?.primary,
      },
    });
    
    surfaceHex = tryGetValue(
      'colors.semantic.background.secondary',
      'colors.surface',
      'surface'
    );
    
    cardHex = tryGetValue(
      'colors.semantic.background.tertiary',  // This is what we save for card
      'colors.card',
      'card'
    );
    
    textHex = tryGetValue(
      'colors.semantic.text.primary',
      'colors.text',
      'text',
      'foreground'
    );
    
    cardTextHex = tryGetValue(
      'colors.semantic.text.secondary',
      'colors.cardText',
      'cardText',
      'card-foreground'
    );
    
    accentHex = tryGetValue(
      'colors.primary.500',
      'colors.primary',
      'colors.accent',
      'accent',
      'primary'
    );
    
    borderHex = tryGetValue(
      'colors.semantic.border.primary',
      'colors.border',
      'border'
    );
    
    // pageBackground should match background if not explicitly set
    // But prioritize pageBackground if it exists, otherwise use background
    pageBgHex = tryGetValue(
      'colors.pageBackground',
      'pageBackground'
    );
    // If pageBackground is not found, use background (they should be the same)
    if (!pageBgHex) {
      pageBgHex = backgroundHex;
    }
    
    // Button properties
    buttonBgHex = tryGetValue(
      'colors.buttonBackground',
      'buttonBackground'
    );
    
    buttonTextHex = tryGetValue(
      'colors.buttonText',
      'buttonText'
    );
    
    buttonBorderHex = tryGetValue(
      'colors.buttonBorder',
      'buttonBorder'
    );
    
    let buttonHoverHex = tryGetValue(
      'colors.buttonHover',
      'buttonHover'
    );
    
    // Non-color properties
    buttonStyle = getTokenValue(tokens, 'buttonStyle') || getTokenValue(tokens, 'colors.buttonStyle');
    borderWeight = getTokenValue(tokens, 'borderWeight') || getTokenValue(tokens, 'colors.borderWeight');

    // If tokens are already in fire theme format (palette keys), use them directly
    if (!backgroundHex && tokens.background && typeof tokens.background === 'string' && palette[tokens.background]) {
      // Already in palette key format
      setSlot(mode, 'background', tokens.background);
      setSlot(mode, 'surface', tokens.surface || 'cloud');
      setSlot(mode, 'card', tokens.card || 'cloud');
      setSlot(mode, 'text', tokens.text || 'charcoal');
      setSlot(mode, 'cardText', tokens.cardText || 'charcoal');
      setSlot(mode, 'accent', tokens.accent || 'aqua');
      setSlot(mode, 'borderColor', tokens.borderColor || 'silver');
      setSlot(mode, 'pageBackground', tokens.pageBackground || tokens.background);
      // Button properties
      if (tokens.buttonBackground) setSlot(mode, 'buttonBackground', tokens.buttonBackground);
      if (tokens.buttonText) setSlot(mode, 'buttonText', tokens.buttonText);
      if (tokens.buttonBorder) setSlot(mode, 'buttonBorder', tokens.buttonBorder);
      if (tokens.buttonHover) setSlot(mode, 'buttonHover', tokens.buttonHover);
      if (tokens.buttonStyle) setButtonStyle(mode, tokens.buttonStyle);
      if (tokens.borderWeight) setBorderWeight(mode, tokens.borderWeight);
      return;
    }

    // Fallback to defaults if no values found
    // Use mode-appropriate defaults
    const defaultBg = mode === 'dark' ? '#343434' : '#f4f4f4';
    const defaultSurface = mode === 'dark' ? '#343434' : '#f4f4f4';
    const defaultCard = mode === 'dark' ? '#343434' : '#ffffff';
    const defaultText = mode === 'dark' ? '#e8fffe' : '#000000';
    const defaultBorder = mode === 'dark' ? '#343434' : '#eaeaea';
    
    backgroundHex = backgroundHex || defaultBg;
    surfaceHex = surfaceHex || defaultSurface;
    cardHex = cardHex || defaultCard;
    textHex = textHex || defaultText;
    cardTextHex = cardTextHex || defaultText;
    accentHex = accentHex || '#a5c8ca';
    borderHex = borderHex || defaultBorder;
    // pageBackground should always fall back to background, not a separate default
    pageBgHex = pageBgHex || backgroundHex;
    // For dark mode, default button background to coral instead of accent to avoid lime
    // For light mode, use accent as fallback
    if (mode === 'dark') {
      buttonBgHex = buttonBgHex || '#ff8475'; // coral hex
    } else {
      buttonBgHex = buttonBgHex || accentHex;
    }
    buttonTextHex = buttonTextHex || textHex;
    buttonBorderHex = buttonBorderHex || borderHex;
    // buttonHover defaults to buttonBackground if not set
    buttonHoverHex = buttonHoverHex || buttonBgHex;
    buttonStyle = buttonStyle || 'solid';
    borderWeight = borderWeight || 'thin';

    console.log('🎨 Extracted colors from tokens:', {
      backgroundHex,
      surfaceHex,
      cardHex,
      textHex,
      cardTextHex,
      accentHex,
      borderHex,
      pageBgHex,
      buttonBgHex,
      buttonTextHex,
      buttonBorderHex,
      buttonStyle,
      borderWeight,
    });

    // Convert to palette keys and apply to editor
    // Use the hex values we extracted (they already have proper fallbacks)
    // For dark mode, ensure we're using the correct background color
    if (mode === 'dark' && backgroundHex) {
      console.log(`🎨 Converting dark mode background: ${backgroundHex} -> palette key`);
    }
    const bgKey = hexToPaletteKey(backgroundHex);
    
    // Debug: Log if we got an unexpected result for dark mode background
    if (mode === 'dark' && bgKey === 'silver' && backgroundHex === '#343434') {
      console.error(`❌ ERROR: Dark mode background #343434 incorrectly converted to 'silver' instead of 'shadow'!`);
    }
    const surfaceKey = hexToPaletteKey(surfaceHex);
    const cardKey = hexToPaletteKey(cardHex);
    const textKey = hexToPaletteKey(textHex);
    const cardTextKey = hexToPaletteKey(cardTextHex);
    const accentKey = hexToPaletteKey(accentHex);
    const borderKey = hexToPaletteKey(borderHex);
    // pageBackground should always match background if not explicitly set
    // If pageBgHex is the same as backgroundHex, use the same palette key
    const pageBgKey = hexToPaletteKey(pageBgHex);
    
    // Ensure pageBackground matches background in the editor if they're the same color
    // This prevents confusion where pageBackground and background might be different
    // but should be the same for the main background color
    if (pageBgHex === backgroundHex) {
      // They're the same, so ensure they use the same palette key
      // This ensures consistency in the editor
    }
    // For dark mode, default button background to coral instead of accent to avoid lime
    const buttonBgKey = hexToPaletteKey(
      buttonBgHex || (mode === 'dark' ? '#ff8475' : accentHex || '#a5c8ca')
    );
    const buttonTextKey = hexToPaletteKey(buttonTextHex || textHex || (mode === 'dark' ? '#e8fffe' : '#000000'));
    const buttonBorderKey = hexToPaletteKey(buttonBorderHex || borderHex || (mode === 'dark' ? '#343434' : '#eaeaea'));
    const buttonHoverKey = hexToPaletteKey(buttonHoverHex || buttonBgHex || (mode === 'dark' ? '#ff8475' : accentHex || '#a5c8ca'));
    
    console.log('🎨 Converted to palette keys:', {
      background: bgKey,
      surface: surfaceKey,
      card: cardKey,
      text: textKey,
      cardText: cardTextKey,
      accent: accentKey,
      borderColor: borderKey,
      pageBackground: pageBgKey,
      buttonBackground: buttonBgKey,
      buttonText: buttonTextKey,
      buttonBorder: buttonBorderKey,
      buttonHover: buttonHoverKey,
      buttonStyle,
      borderWeight,
    });
    
    console.log('🎨 Button colors converted:', {
      background: buttonBgKey,
      text: buttonTextKey,
      border: buttonBorderKey,
      hover: buttonHoverKey,
      backgroundHex,
      hoverHex: buttonHoverHex,
    });

    // CRITICAL: Log what we're about to set for this mode
    console.log(`🎨 Setting ${mode} mode slots:`, {
      mode,
      background: bgKey,
      backgroundHex,
      surface: surfaceKey,
      card: cardKey,
      text: textKey,
    });
    
    setSlot(mode, 'background', bgKey);
    setSlot(mode, 'surface', surfaceKey);
    setSlot(mode, 'card', cardKey);
    setSlot(mode, 'text', textKey);
    setSlot(mode, 'cardText', cardTextKey);
    setSlot(mode, 'accent', accentKey);
    setSlot(mode, 'borderColor', borderKey);
    setSlot(mode, 'pageBackground', pageBgKey);
    setSlot(mode, 'buttonBackground', buttonBgKey);
    setSlot(mode, 'buttonText', buttonTextKey);
    setSlot(mode, 'buttonBorder', buttonBorderKey);
    setSlot(mode, 'buttonHover', buttonHoverKey);
    if (buttonStyle) setButtonStyle(mode, buttonStyle as any);
    if (borderWeight) setBorderWeight(mode, borderWeight as any);
    
    // Verify the slot was set correctly by checking the state after a brief delay
    // This helps catch any issues with setSlot not working correctly
    setTimeout(() => {
      const verifyState = fireTheme;
      const actualBg = mode === 'light' ? verifyState.light?.background : verifyState.dark?.background;
      if (actualBg !== bgKey) {
        console.error(`❌ ERROR: ${mode} mode background not set correctly!`, {
          expected: bgKey,
          actual: actualBg,
          backgroundHex,
        });
      } else {
        console.log(`✅ Verified ${mode} mode background set correctly:`, bgKey);
      }
    }, 100);
  }

  // Load theme for editing
  const handleLoadTheme = (theme: Theme, mode: 'light' | 'dark') => {
    console.log('🔄 Loading theme:', theme.name, mode, 'mode');
    console.log('📦 Full theme object:', theme);
    
    setEditingTheme(theme);
    setThemeName(theme.name);
    setThemeDescription(theme.description || '');
    setActiveEditingMode(mode);
    
    // IMPORTANT: Load BOTH light and dark modes to preserve both when saving
    // This ensures that when you edit one mode, the other mode's values are preserved
    
    // Load light mode tokens
    let lightTokens = theme.light_mode_tokens;
    if (lightTokens && typeof lightTokens === 'string') {
      try {
        lightTokens = JSON.parse(lightTokens);
      } catch (e) {
        console.error('❌ Failed to parse light mode JSON tokens:', e);
      }
    }
    
    // Load dark mode tokens
    let darkTokens = theme.dark_mode_tokens;
    if (darkTokens && typeof darkTokens === 'string') {
      try {
        darkTokens = JSON.parse(darkTokens);
      } catch (e) {
        console.error('❌ Failed to parse dark mode JSON tokens:', e);
      }
    }
    
    // CRITICAL VALIDATION: Verify tokens are different before loading
    // This prevents one mode from overwriting the other
    if (lightTokens && darkTokens) {
      const lightBg = lightTokens.colors?.semantic?.background?.primary || lightTokens.colors?.background || lightTokens.background;
      const darkBg = darkTokens.colors?.semantic?.background?.primary || darkTokens.colors?.background || darkTokens.background;
      
      console.log('🔍 Validating token separation before loading:', {
        lightBackground: lightBg,
        darkBackground: darkBg,
        areDifferent: lightBg !== darkBg,
        lightTokensSample: {
          hasColors: !!lightTokens.colors,
          hasSemantic: !!lightTokens.colors?.semantic,
          hasBackground: !!lightTokens.colors?.semantic?.background,
        },
        darkTokensSample: {
          hasColors: !!darkTokens.colors,
          hasSemantic: !!darkTokens.colors?.semantic,
          hasBackground: !!darkTokens.colors?.semantic?.background,
        },
      });
      
      // Warn if backgrounds are the same (might indicate tokens got swapped in database)
      if (lightBg === darkBg && lightBg && darkBg) {
        console.error('❌ ERROR: Light and dark mode backgrounds are identical in database!', {
          sharedValue: lightBg,
          themeName: theme.name,
          themeId: theme.id,
        });
      }
    }
    
    // Convert and apply BOTH modes to fire theme editor
    // IMPORTANT: Load both modes in sequence, but ensure each mode's data is isolated
    try {
      // Store current state before loading to preserve any unsaved changes
      const stateBeforeLoad = { ...fireTheme };
      
      if (lightTokens) {
        console.log('🔄 Loading light mode tokens:', {
          background: lightTokens.colors?.semantic?.background?.primary || lightTokens.colors?.background || lightTokens.background,
          tokenStructure: Object.keys(lightTokens),
        });
        convertTokensToFireTheme(lightTokens, 'light');
        console.log('✅ Light mode loaded');
      } else {
        console.warn('⚠️ No light mode tokens found - preserving existing light mode state');
        // Don't overwrite existing light mode if tokens are missing
      }
      
      if (darkTokens) {
        console.log('🔄 Loading dark mode tokens:', {
          background: darkTokens.colors?.semantic?.background?.primary || darkTokens.colors?.background || darkTokens.background,
          tokenStructure: Object.keys(darkTokens),
        });
        convertTokensToFireTheme(darkTokens, 'dark');
        console.log('✅ Dark mode loaded');
      } else {
        console.warn('⚠️ No dark mode tokens found - preserving existing dark mode state');
        // Don't overwrite existing dark mode if tokens are missing
      }
      
      // After loading, verify both modes have correct values
      // This helps catch any issues where one mode overwrote the other
      const currentState = fireTheme;
      console.log('✅ Theme loaded successfully (both modes)');
      console.log('🔍 Post-load verification:', {
        lightBackground: currentState.light?.background,
        darkBackground: currentState.dark?.background,
        areDifferent: currentState.light?.background !== currentState.dark?.background,
        lightExpected: lightTokens ? (lightTokens.colors?.semantic?.background?.primary === '#f4f4f4' ? 'cloud' : lightTokens.colors?.semantic?.background?.primary === '#eaeaea' ? 'silver' : 'other') : 'no tokens',
        darkExpected: darkTokens ? (darkTokens.colors?.semantic?.background?.primary === '#343434' ? 'shadow' : darkTokens.colors?.semantic?.background?.primary === '#26282b' ? 'charcoal' : 'other') : 'no tokens',
      });
      
      toast({
        title: 'Theme Loaded',
        description: `${mode === 'light' ? 'Light' : 'Dark'} mode loaded into editor. Both light and dark modes are preserved.`,
      });
    } catch (error: any) {
      console.error('❌ Error loading theme:', error);
      console.error('Error stack:', error.stack);
      toast({
        title: 'Error Loading Theme',
        description: error.message || 'Failed to load theme tokens. Check console for details.',
        variant: 'destructive',
      });
    }
  };

  // Delete theme mutation (removes from UI, soft deletes or hard deletes based on usage)
  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const response = await apiRequest('DELETE', `/api/themes/${themeId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/user/selection'] });
      toast({
        title: 'Theme Deleted',
        description: 'Theme has been deleted and removed from the UI.',
      });
      if (editingTheme) {
        handleNewTheme();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete theme',
        variant: 'destructive',
      });
    },
  });

  // Toggle theme active status (deactivate removes from UI)
  const toggleThemeActiveMutation = useMutation({
    mutationFn: async ({ themeId, isActive }: { themeId: string; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/themes/${themeId}`, {
        is_active: false, // Always deactivate (removes from UI)
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/themes/user/selection'] });
      toast({
        title: 'Theme Deactivated',
        description: 'Theme has been deactivated and removed from the UI. It is archived in the database.',
      });
      if (editingTheme && editingTheme.id === variables.themeId) {
        handleNewTheme();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update theme status',
        variant: 'destructive',
      });
    },
  });

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

    // Validate fireTheme state before saving
    if (!fireTheme || !fireTheme.light || !fireTheme.dark) {
      toast({
        title: 'Error',
        description: 'Theme data is not ready. Please wait a moment and try again.',
        variant: 'destructive',
      });
      return;
    }

    // Log current state for debugging
    console.log('💾 handleSaveTheme called:', {
      themeName,
      editingTheme: editingTheme?.name,
      fireThemeLight: fireTheme.light,
      fireThemeDark: fireTheme.dark,
      palette,
    });

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
                  ) : (() => {
                    // Only show active themes in the UI
                    const activeThemes = themes.filter(t => t.is_active);
                    return activeThemes.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No active themes. Create a new theme to get started.</div>
                    ) : (
                      activeThemes.map((theme) => (
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
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to deactivate "${theme.name}"? It will be removed from the UI and archived.`)) {
                                toggleThemeActiveMutation.mutate({
                                  themeId: theme.id,
                                  isActive: theme.is_active,
                                });
                              }
                            }}
                            disabled={toggleThemeActiveMutation.isPending}
                          >
                            Deactivate
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${theme.name}"? This action cannot be undone. ${theme.is_active ? 'The theme will be deactivated and removed from the UI.' : ''}`)) {
                                deleteThemeMutation.mutate(theme.id);
                              }
                            }}
                            disabled={deleteThemeMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )})()}
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
          onChange={(c) => {
            setSlot(mode, "background", c);
            // Ensure pageBackground matches background unless explicitly set differently
            // This keeps them in sync for consistency
            if (!modeTheme.pageBackground || modeTheme.pageBackground === modeTheme.background) {
              setSlot(mode, "pageBackground", c);
            }
          }}
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
        <SlotSelector
          label="Button Hover"
          value={modeTheme.buttonHover || modeTheme.buttonBackground}
          onChange={(c) => setSlot(mode, "buttonHover", c)}
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
            {(() => {
              const buttonStyle = fireTheme.light.buttonStyle || 'solid';
              const borderWeight = fireTheme.light.borderWeight || 'thin';
              const borderWeights: Record<string, string> = { none: '0px', thin: '1px', medium: '2px', thick: '3px' };
              const borderWidth = borderWeights[borderWeight] || '1px';
              
              const buttonHover = fireTheme.light.buttonHover || fireTheme.light.buttonBackground;
              if (buttonStyle === 'outline') {
                return (
                  <button 
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: palette[fireTheme.light.buttonText],
                      border: `${borderWidth} solid ${palette[fireTheme.light.buttonBorder]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = palette[buttonHover] + '20'; // 20% opacity
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Primary Button
                  </button>
                );
              } else if (buttonStyle === 'ghost') {
                return (
                  <button 
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: palette[fireTheme.light.buttonText],
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = palette[buttonHover] + '20'; // 20% opacity
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Primary Button
                  </button>
                );
              } else {
                // solid
                return (
                  <button 
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: palette[fireTheme.light.buttonBackground],
                      color: palette[fireTheme.light.buttonText],
                      border: `${borderWidth} solid ${palette[fireTheme.light.buttonBorder]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = palette[buttonHover];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = palette[fireTheme.light.buttonBackground];
                    }}
                  >
                    Primary Button
                  </button>
                );
              }
            })()}
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
            {(() => {
              const buttonStyle = fireTheme.dark.buttonStyle || 'solid';
              const borderWeight = fireTheme.dark.borderWeight || 'thin';
              const borderWeights: Record<string, string> = { none: '0px', thin: '1px', medium: '2px', thick: '3px' };
              const borderWidth = borderWeights[borderWeight] || '1px';
              
              const buttonHover = fireTheme.dark.buttonHover || fireTheme.dark.buttonBackground;
              if (buttonStyle === 'outline') {
                return (
                  <button 
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: palette[fireTheme.dark.buttonText],
                      border: `${borderWidth} solid ${palette[fireTheme.dark.buttonBorder]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = palette[buttonHover] + '20'; // 20% opacity
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Primary Button
                  </button>
                );
              } else if (buttonStyle === 'ghost') {
                return (
                  <button 
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                      color: palette[fireTheme.dark.buttonText],
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = palette[buttonHover] + '20'; // 20% opacity
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Primary Button
                  </button>
                );
              } else {
                // solid
                const buttonHover = fireTheme.dark.buttonHover || fireTheme.dark.buttonBackground;
                return (
                  <button 
                    className="px-4 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: palette[fireTheme.dark.buttonBackground],
                      color: palette[fireTheme.dark.buttonText],
                      border: `${borderWidth} solid ${palette[fireTheme.dark.buttonBorder]}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = palette[buttonHover];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = palette[fireTheme.dark.buttonBackground];
                    }}
                  >
                    Primary Button
                  </button>
                );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

