# Using the Design System Editor to Change CSS Variables

## Overview

The `design-system.tsx` page allows you to edit design tokens (colors, typography, spacing) and have those changes **immediately applied** to CSS variables in your UI.

## How It Works

1. **Token Updates**: When you change a value in the editor, it updates the design tokens state
2. **CSS Variable Mapping**: The editor maps design token paths to CSS variable names
3. **Real-time Updates**: CSS variables are updated in the DOM using `document.documentElement.style.setProperty()`
4. **Theme Support**: Changes are applied to the current theme (light/dark mode)

## Current Mappings

### Colors

| Design Token Path | CSS Variable | Description |
|------------------|--------------|-------------|
| `colors.semantic.background.primary` | `--background` | Main background color |
| `colors.semantic.text.primary` | `--foreground` | Main text color |
| `colors.semantic.background.secondary` | `--card` | Card background |
| `colors.primary.500` | `--primary` | Primary brand color |
| `colors.error.500` | `--destructive` | Error/destructive color |
| `colors.info.500` | `--accent` | Accent color |
| `colors.semantic.border.primary` | `--border` | Border color |

### Typography

| Design Token Path | CSS Variable | Description |
|------------------|--------------|-------------|
| `typography.fontFamily.sans` | `--font-sans` | Sans-serif font stack |
| `typography.fontFamily.mono` | `--font-mono` | Monospace font stack |

### Spacing

| Design Token Path | CSS Variable | Description |
|------------------|--------------|-------------|
| `spacing.borderRadius.base` | `--radius` | Base border radius |

## Adding New Mappings

To add new CSS variable mappings, edit the `getCssVariableName()` function in `design-system.tsx`:

```typescript
const getCssVariableName = (path: string): string | null => {
  const mapping: Record<string, string> = {
    // Add your new mapping here
    'colors.semantic.your.new.path': '--your-css-variable',
    // ...
  };
  
  return mapping[path] || null;
};
```

## How to Use

1. **Navigate to Design System Page**: Go to `/design-system` (if route exists) or access the component directly
2. **Select a Category**: Choose Colors, Typography, or Spacing tab
3. **Edit Values**: Change any value in the input fields
4. **See Changes**: CSS variables are updated immediately in the DOM
5. **Switch Themes**: Toggle between light/dark mode to see theme-specific changes

## Example: Changing Primary Color

1. Go to the **Colors** tab
2. Find `colors.primary.500` (or `colors.semantic` section)
3. Change the hex value (e.g., from `#0ea5e9` to `#cc33ab`)
4. The `--primary` CSS variable is updated immediately
5. All components using `var(--primary)` will reflect the change

## Example: Changing Border Radius

1. Go to the **Spacing** tab
2. Find `spacing.borderRadius.base`
3. Change the value (e.g., from `0.5rem` to `1rem`)
4. The `--radius` CSS variable is updated
5. All components using `var(--radius)` will have the new border radius

## Limitations

- **Not Persistent**: Changes are only in memory and will be lost on page refresh
- **Limited Mappings**: Only mapped design tokens update CSS variables
- **Theme Handling**: Dark mode changes require a `<style>` element injection

## Future Enhancements

- **Save to LocalStorage**: Persist changes across sessions
- **Export/Import**: Save themes as JSON files
- **More Mappings**: Add all CSS variables to the mapping
- **Backend Integration**: Save themes to database for multi-user support
- **Color Picker**: Replace text inputs with visual color pickers
- **Live Preview**: Show changes in a preview panel

## Technical Details

### Light Mode Updates
```typescript
document.documentElement.style.setProperty('--primary', '#cc33ab');
```

### Dark Mode Updates
For dark mode, a `<style>` element is injected into the `<head>`:
```html
<style id="dark-mode-custom-styles">
.dark {
  --primary: #cc33ab;
}
</style>
```

This allows dark mode overrides without modifying the original CSS file.

