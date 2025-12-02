"use client";

import React, { useState } from "react";
import { useFireTheme, PaletteColor } from "./fire-theme-provider";
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

// Dropdown selector for a slot
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

// Preview card
function PreviewCard({ mode }: { mode: "light" | "dark" }) {
  const { theme, palette } = useFireTheme();
  const slots = theme[mode];

  return (
    <div
      className="p-4 rounded-lg"
      style={{ backgroundColor: palette[slots.background] }}
    >
      <div
        className="p-3 rounded-md mb-2"
        style={{
          backgroundColor: palette[slots.card],
          color: palette[slots.cardText],
        }}
      >
        <div className="font-semibold text-sm">Card Title</div>
        <div className="text-xs opacity-80">Card content</div>
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded text-xs font-medium"
          style={{
            backgroundColor: palette[slots.accent],
            color: palette[slots.background],
          }}
        >
          Button
        </button>
        <span
          className="text-xs self-center"
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
  const { theme, setSlot, loadPreset, reset, exportCSS, palette, presetNames } =
    useFireTheme();
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

      {/* Presets */}
      <div>
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Presets
        </div>
        <div className="flex flex-wrap gap-2">
          {presetNames.map((name) => (
            <button
              key={name}
              onClick={() => loadPreset(name)}
              className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

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

      {/* Slot Selectors */}
      <div className="space-y-1 border-t border-border pt-4">
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

