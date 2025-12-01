/**
 * ThemeController.tsx
 * 
 * Interactive theme controller for admins to customize colors and themes in real-time.
 * Allows assigning Fire palette colors to theme slots with live preview.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Copy, Check } from 'lucide-react';

// Get CSS variable value from computed styles
const getCssVariable = (varName: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
};

// Get core colors dynamically (fallback to hardcoded values if CSS vars not available)
const getCoreColors = () => {
  const getVar = (varName: string, fallback: string) => {
    const value = getCssVariable(varName);
    return value || fallback;
  };

  return {
    charcoal: { 
      hex: getVar('--color-charcoal', '#26282b'), 
      name: 'Charcoal',
      var: '--color-charcoal'
    },
    ice: { 
      hex: getVar('--color-ice', '#e8fffe'), 
      name: 'Ice',
      var: '--color-ice'
    },
    lime: { 
      hex: getVar('--color-lime', '#f1fec9'), 
      name: 'Lime',
      var: '--color-lime'
    },
    coral: { 
      hex: getVar('--color-coral', '#ff555d'), 
      name: 'Coral',
      var: '--color-coral'
    },
    silver: { 
      hex: getVar('--color-silver', '#eaeaea'), 
      name: 'Silver',
      var: '--color-silver'
    },
    cloud: { 
      hex: getVar('--color-cloud', '#f4f4f4'), 
      name: 'Cloud',
      var: '--color-cloud'
    },
  } as const;
};

// Type for color keys
type ColorKey = 'charcoal' | 'ice' | 'lime' | 'coral' | 'silver' | 'cloud';


// Theme slots - what you're actually designing
interface ThemeSlots {
  background: ColorKey;
  card: ColorKey;
  cardText: ColorKey;
  text: ColorKey;
  accent: ColorKey;
  accentText: ColorKey;
}

// Preset themes
const PRESETS: Record<string, ThemeSlots> = {
  'Lime Light': {
    background: 'lime',
    card: 'charcoal',
    cardText: 'lime',
    text: 'charcoal',
    accent: 'coral',
    accentText: 'cloud',
  },
  'Charcoal Dark': {
    background: 'charcoal',
    card: 'lime',
    cardText: 'charcoal',
    text: 'cloud',
    accent: 'coral',
    accentText: 'cloud',
  },
  'Ice Coral': {
    background: 'ice',
    card: 'coral',
    cardText: 'cloud',
    text: 'charcoal',
    accent: 'charcoal',
    accentText: 'ice',
  },
  'Cloud Minimal': {
    background: 'cloud',
    card: 'charcoal',
    cardText: 'cloud',
    text: 'charcoal',
    accent: 'coral',
    accentText: 'cloud',
  },
  'Lime Ice': {
    background: 'ice',
    card: 'lime',
    cardText: 'charcoal',
    text: 'charcoal',
    accent: 'coral',
    accentText: 'cloud',
  },
  'Dark Mode': {
    background: 'charcoal',
    card: 'silver',
    cardText: 'charcoal',
    text: 'cloud',
    accent: 'coral',
    accentText: 'cloud',
  },
};

// Apply theme to CSS variables
const applyTheme = (slots: ThemeSlots, coreColors: ReturnType<typeof getCoreColors>) => {
  if (typeof window === 'undefined') return;
  
  const root = document.documentElement;
  
  // Map slots to CSS variables
  root.style.setProperty('--background', coreColors[slots.background].hex);
  root.style.setProperty('--foreground', coreColors[slots.text].hex);
  root.style.setProperty('--card', coreColors[slots.card].hex);
  root.style.setProperty('--card-foreground', coreColors[slots.cardText].hex);
  root.style.setProperty('--primary', coreColors[slots.accent].hex);
  root.style.setProperty('--primary-foreground', coreColors[slots.accentText].hex);
  root.style.setProperty('--accent', coreColors[slots.accent].hex);
  root.style.setProperty('--accent-foreground', coreColors[slots.accentText].hex);
  
  // Surface colors
  root.style.setProperty('--surface', coreColors[slots.card].hex);
  root.style.setProperty('--surface-elevated', coreColors[slots.card].hex);
  
  // Muted (slightly different from card)
  root.style.setProperty('--muted', coreColors[slots.background].hex);
  root.style.setProperty('--muted-foreground', coreColors[slots.text].hex);
  
  // Popover
  root.style.setProperty('--popover', coreColors[slots.card].hex);
  root.style.setProperty('--popover-foreground', coreColors[slots.cardText].hex);
  
  // Border - derive from card color
  const borderColor = slots.card === 'charcoal' ? '#464a4f' : '#d4d7da';
  root.style.setProperty('--border', borderColor);
  root.style.setProperty('--input', coreColors[slots.card].hex);
  root.style.setProperty('--ring', coreColors[slots.accent].hex);
};

// Color picker button
const ColorButton = ({ 
  colorKey, 
  isSelected, 
  onClick,
  coreColors
}: { 
  colorKey: ColorKey; 
  isSelected: boolean; 
  onClick: () => void;
  coreColors: ReturnType<typeof getCoreColors>;
}) => {
  const color = coreColors[colorKey];
  return (
    <button
      onClick={onClick}
      className={`
        w-12 h-12 rounded-lg border-2 transition-all
        ${isSelected ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'}
        hover:scale-110
      `}
      style={{ backgroundColor: color.hex }}
      title={color.name}
      aria-label={`Select ${color.name} color`}
    />
  );
};

// Slot selector row
const SlotSelector = ({
  label,
  description,
  value,
  onChange,
  coreColors,
}: {
  label: string;
  description: string;
  value: ColorKey;
  onChange: (color: ColorKey) => void;
  coreColors: ReturnType<typeof getCoreColors>;
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20">
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <div className="flex gap-2">
        {(Object.keys(coreColors) as ColorKey[]).map((colorKey) => (
          <ColorButton
            key={colorKey}
            colorKey={colorKey}
            isSelected={value === colorKey}
            onClick={() => onChange(colorKey)}
            coreColors={coreColors}
          />
        ))}
      </div>
    </div>
  );
};

// Live preview component
const LivePreview = ({ 
  slots, 
  coreColors 
}: { 
  slots: ThemeSlots;
  coreColors: ReturnType<typeof getCoreColors>;
}) => {
  const bg = coreColors[slots.background].hex;
  const card = coreColors[slots.card].hex;
  const cardText = coreColors[slots.cardText].hex;
  const text = coreColors[slots.text].hex;
  const accent = coreColors[slots.accent].hex;
  const accentText = coreColors[slots.accentText].hex;

  return (
    <div 
      className="rounded-xl p-6 min-h-[300px]"
      style={{ backgroundColor: bg }}
    >
      <h3 className="text-lg font-bold mb-4" style={{ color: text }}>
        Live Preview
      </h3>
      
      {/* Cards row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: card }}
        >
          <div className="font-semibold mb-1" style={{ color: cardText }}>Card Title</div>
          <div className="text-sm opacity-80" style={{ color: cardText }}>
            Card content goes here
          </div>
        </div>
        <div 
          className="p-4 rounded-lg"
          style={{ backgroundColor: card }}
        >
          <div className="font-semibold mb-1" style={{ color: cardText }}>Stats Card</div>
          <div className="text-2xl font-bold" style={{ color: cardText }}>42</div>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3 mb-4">
        <button 
          className="px-4 py-2 rounded-md font-medium"
          style={{ backgroundColor: accent, color: accentText }}
        >
          Primary Action
        </button>
        <button 
          className="px-4 py-2 rounded-md font-medium border"
          style={{ 
            backgroundColor: 'transparent', 
            color: text,
            borderColor: text + '40'
          }}
        >
          Secondary
        </button>
      </div>
      
      {/* Text samples */}
      <p className="text-sm" style={{ color: text }}>
        Body text appears like this. <span style={{ color: accent }}>Links are accented.</span>
      </p>
    </div>
  );
};

// Main component
export const ThemeController = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<ThemeSlots>(PRESETS['Lime Light']);
  const [customPresets, setCustomPresets] = useState<Record<string, ThemeSlots>>({});
  const [presetName, setPresetName] = useState('');
  const [copied, setCopied] = useState(false);
  const [coreColors] = useState(() => getCoreColors());

  // Check if user is admin
  const isAdmin = user?.role === 'super_admin' || user?.role === 'corporate_admin';

  // Apply theme whenever slots change
  useEffect(() => {
    if (isAdmin) {
      applyTheme(slots, coreColors);
    }
  }, [slots, isAdmin, coreColors]);

  // Restore original theme on unmount (optional - you might want to persist changes)
  useEffect(() => {
    return () => {
      // Optionally restore original theme
      // For now, we'll let changes persist
    };
  }, []);

  const updateSlot = (slot: keyof ThemeSlots, color: ColorKey) => {
    setSlots(prev => ({ ...prev, [slot]: color }));
  };

  const savePreset = () => {
    if (presetName.trim()) {
      setCustomPresets(prev => ({
        ...prev,
        [presetName]: { ...slots }
      }));
      setPresetName('');
      toast({
        title: 'Preset saved',
        description: `Theme "${presetName}" has been saved.`,
      });
    }
  };

  const exportCSS = async () => {
    const css = `/* Theme: Custom */
:root {
  --background: ${coreColors[slots.background].hex};
  --foreground: ${coreColors[slots.text].hex};
  --card: ${coreColors[slots.card].hex};
  --card-foreground: ${coreColors[slots.cardText].hex};
  --primary: ${coreColors[slots.accent].hex};
  --primary-foreground: ${coreColors[slots.accentText].hex};
  --accent: ${coreColors[slots.accent].hex};
  --accent-foreground: ${coreColors[slots.accentText].hex};
  --surface: ${coreColors[slots.card].hex};
  --popover: ${coreColors[slots.card].hex};
  --popover-foreground: ${coreColors[slots.cardText].hex};
}`;
    
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      toast({
        title: 'CSS copied!',
        description: 'Theme CSS has been copied to your clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const allPresets = { ...PRESETS, ...customPresets };

  // Don't render if user is not admin
  if (!isAdmin) {
    return (
      <Card className="bg-card/25 backdrop-blur-md border border-border/20 shadow-xl">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            Theme Controller is only available to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/25 backdrop-blur-md border border-border/20 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground">Theme Controller</CardTitle>
          <Button
            onClick={exportCSS}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Export CSS
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Presets */}
        <div className="mb-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Quick Presets</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(allPresets).map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                onClick={() => setSlots(allPresets[name])}
                className="bg-background/10 hover:bg-background/20"
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-4">Color Assignments</div>
            
            <SlotSelector
              label="Background"
              description="Page background color"
              value={slots.background}
              onChange={(c) => updateSlot('background', c)}
              coreColors={coreColors}
            />
            <SlotSelector
              label="Card Background"
              description="Cards, panels, modals"
              value={slots.card}
              onChange={(c) => updateSlot('card', c)}
              coreColors={coreColors}
            />
            <SlotSelector
              label="Card Text"
              description="Text inside cards"
              value={slots.cardText}
              onChange={(c) => updateSlot('cardText', c)}
              coreColors={coreColors}
            />
            <SlotSelector
              label="Body Text"
              description="Main page text"
              value={slots.text}
              onChange={(c) => updateSlot('text', c)}
              coreColors={coreColors}
            />
            <SlotSelector
              label="Accent"
              description="Buttons, links, highlights"
              value={slots.accent}
              onChange={(c) => updateSlot('accent', c)}
              coreColors={coreColors}
            />
            <SlotSelector
              label="Accent Text"
              description="Text on accent backgrounds"
              value={slots.accentText}
              onChange={(c) => updateSlot('accentText', c)}
              coreColors={coreColors}
            />

            {/* Save custom preset */}
            <div className="mt-6 flex gap-2">
              <Input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    savePreset();
                  }
                }}
              />
              <Button
                onClick={savePreset}
                className="bg-accent hover:bg-accent-hover text-accent-foreground"
              >
                Save Preset
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-4">Live Preview</div>
            <LivePreview slots={slots} coreColors={coreColors} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeController;

