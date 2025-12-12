"use client";

import React, { useState } from "react";
import { useFireTheme, PaletteColor, ButtonStyle, BorderWeight } from "./fire-theme-provider";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Copy, RotateCcw, Check } from "lucide-react";

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

// Dropdown selector for a color slot
function SlotSelector({
  label,
  value,
  onChange,
  palette,
}: {
  label: string;
  value: PaletteColor;
  onChange: (color: PaletteColor) => void;
  palette: Record<string, string>;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex gap-1">
        {(Object.keys(palette) as PaletteColor[]).map((colorKey) => (
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

// Button style selector
function ButtonStyleSelector({
  value,
  onChange,
  options,
}: {
  value: ButtonStyle;
  onChange: (style: ButtonStyle) => void;
  options: ButtonStyle[];
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
  value: BorderWeight;
  onChange: (weight: BorderWeight) => void;
  options: BorderWeight[];
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

// Preview card
function PreviewCard({ mode }: { mode: "light" | "dark" }) {
  const { theme, palette } = useFireTheme();
  const slots = theme[mode];

  // Button style based on theme setting
  const getButtonStyle = () => {
    const base = "px-3 py-1 rounded text-xs font-medium transition-all";
    switch (slots.buttonStyle) {
      case "solid":
        return {
          className: base,
          style: {
            backgroundColor: palette[slots.buttonBackground],
            color: palette[slots.buttonText],
            border: "none",
          },
        };
      case "outline":
        return {
          className: base,
          style: {
            backgroundColor: "transparent",
            color: palette[slots.buttonBorder],
            border: `2px solid ${palette[slots.buttonBorder]}`,
          },
        };
      case "ghost":
        return {
          className: base,
          style: {
            backgroundColor: "transparent",
            color: palette[slots.buttonBackground],
            border: "none",
          },
        };
      default:
        // Fallback to solid style
        return {
          className: base,
          style: {
            backgroundColor: palette[slots.buttonBackground] || palette.coral,
            color: palette[slots.buttonText] || palette.ice,
            border: "none",
          },
        };
    }
  };

  const buttonProps = getButtonStyle() || {
    className: "px-3 py-1 rounded text-xs font-medium transition-all",
    style: { backgroundColor: palette.coral, color: palette.ice, border: "none" }
  };

  // Border weight mapping
  const borderWeights = { none: "0px", thin: "1px", medium: "2px", thick: "3px" };

  return (
    <div
      className="p-4 rounded-lg"
      style={{ 
        backgroundColor: palette[slots.background],
        border: `${borderWeights[slots.borderWeight]} solid ${palette[slots.borderColor]}`,
      }}
    >
      <div
        className="p-3 rounded-md mb-2"
        style={{
          backgroundColor: palette[slots.card],
          color: palette[slots.cardText],
          border: `${borderWeights[slots.borderWeight]} solid ${palette[slots.borderColor]}`,
        }}
      >
        <div className="font-semibold text-sm">Card Title</div>
        <div className="text-xs opacity-80">Card content</div>
      </div>
      <div className="flex gap-2 items-center">
        <button className={buttonProps.className} style={buttonProps.style}>
          {slots.buttonStyle === "solid" ? "Solid" : slots.buttonStyle === "outline" ? "Outline" : "Ghost"}
        </button>
        <span
          className="text-xs"
          style={{ color: palette[slots.text] }}
        >
          Body text
        </span>
      </div>
    </div>
  );
}

// Main panel component
export function FireThemePanel() {
  const { 
    theme, 
    setSlot, 
    setButtonStyle, 
    setBorderWeight,
    loadPreset, 
    reset, 
    exportCSS, 
    palette, 
    presetNames,
    buttonStyles,
    borderWeights,
  } = useFireTheme();
  const { theme: colorMode, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [editingMode, setEditingMode] = useState<"light" | "dark">("light");

  const handleCopyCSS = () => {
    navigator.clipboard.writeText(exportCSS());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🔥 Fire Theme</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title={colorMode === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {colorMode === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={reset}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyCSS}
            className="p-2 rounded-md hover:bg-muted transition-colors"
            title="Copy CSS"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Presets removed - now available in Theme Management panel */}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setEditingMode("light")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            editingMode === "light"
              ? "bg-foreground text-background"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <Sun className="w-4 h-4 inline mr-2" />
          Light Mode
        </button>
        <button
          onClick={() => setEditingMode("dark")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            editingMode === "dark"
              ? "bg-foreground text-background"
              : "bg-muted hover:bg-muted/80"
          }`}
        >
          <Moon className="w-4 h-4 inline mr-2" />
          Dark Mode
        </button>
      </div>

      {/* Surface & Layout Colors */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Surfaces & Layout
        </div>
        <SlotSelector
          label="Page Background"
          value={theme[editingMode].pageBackground}
          onChange={(c) => setSlot(editingMode, "pageBackground", c)}
          palette={palette}
        />
        <SlotSelector
          label="Background"
          value={theme[editingMode].background}
          onChange={(c) => setSlot(editingMode, "background", c)}
          palette={palette}
        />
        <SlotSelector
          label="Surface"
          value={theme[editingMode].surface}
          onChange={(c) => setSlot(editingMode, "surface", c)}
          palette={palette}
        />
        <SlotSelector
          label="Card"
          value={theme[editingMode].card}
          onChange={(c) => setSlot(editingMode, "card", c)}
          palette={palette}
        />
        <SlotSelector
          label="Card Text"
          value={theme[editingMode].cardText}
          onChange={(c) => setSlot(editingMode, "cardText", c)}
          palette={palette}
        />
        <SlotSelector
          label="Body Text"
          value={theme[editingMode].text}
          onChange={(c) => setSlot(editingMode, "text", c)}
          palette={palette}
        />
        <SlotSelector
          label="Accent"
          value={theme[editingMode].accent}
          onChange={(c) => setSlot(editingMode, "accent", c)}
          palette={palette}
        />
      </div>

      {/* Button Controls - NEW */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Buttons
        </div>
        <ButtonStyleSelector
          value={theme[editingMode].buttonStyle}
          onChange={(style) => setButtonStyle(editingMode, style)}
          options={buttonStyles}
        />
        <SlotSelector
          label="Button Fill"
          value={theme[editingMode].buttonBackground}
          onChange={(c) => setSlot(editingMode, "buttonBackground", c)}
          palette={palette}
        />
        <SlotSelector
          label="Button Text"
          value={theme[editingMode].buttonText}
          onChange={(c) => setSlot(editingMode, "buttonText", c)}
          palette={palette}
        />
        <SlotSelector
          label="Button Border"
          value={theme[editingMode].buttonBorder}
          onChange={(c) => setSlot(editingMode, "buttonBorder", c)}
          palette={palette}
        />
      </div>

      {/* Border Controls - NEW */}
      <div className="space-y-1 border-t border-border pt-4">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Borders
        </div>
        <BorderWeightSelector
          value={theme[editingMode].borderWeight}
          onChange={(weight) => setBorderWeight(editingMode, weight)}
          options={borderWeights}
        />
        <SlotSelector
          label="Border Color"
          value={theme[editingMode].borderColor}
          onChange={(c) => setSlot(editingMode, "borderColor", c)}
          palette={palette}
        />
      </div>

      {/* Live Previews */}
      <div className="border-t border-border pt-4">
        <div className="text-sm font-medium text-muted-foreground mb-3">
          Live Preview
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Light</div>
            <PreviewCard mode="light" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Dark</div>
            <PreviewCard mode="dark" />
          </div>
        </div>
      </div>

      {/* Current Values */}
      <div className="border-t border-border pt-4">
        <div className="text-xs text-muted-foreground">
          Editing: <span className="font-mono">{editingMode}</span> mode — 
          Changes apply globally and persist
        </div>
      </div>
    </div>
  );
}

export default FireThemePanel;

