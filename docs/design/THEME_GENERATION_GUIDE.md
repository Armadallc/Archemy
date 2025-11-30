# HALCYON Theme Generation Guide

## Recommended Approach: CSS Custom Properties + Radix Colors

Your current setup (CSS variables + Tailwind + Shadcn) is the **best approach**. Here's how to generate and apply new themes:

---

## Method 1: Radix Colors Website (Recommended)

### Steps:
1. **Visit**: https://www.radix-ui.com/colors
2. **Choose your base color** (e.g., Blue, Green, Purple)
3. **Select light/dark variant**
4. **Copy the CSS variables** it generates
5. **Paste into** `client/src/index.css` under `:root` or `.dark`

### Example - Using Radix Colors:
```css
:root {
  /* Generated from Radix Colors - Blue scale */
  --background: var(--blue1);
  --foreground: var(--blue12);
  --primary: var(--blue9);
  --primary-foreground: var(--blue12);
  /* ... etc */
}
```

---

## Method 2: Tailwind Theme Generator Tools

### Option A: Tailwind Shades Generator
- **Tool**: https://www.tailwindshades.com/
- **Input**: Your base color (hex or RGB)
- **Output**: Generates Tailwind-compatible color scale
- **Use**: Add to `tailwind.config.ts` `theme.extend.colors`

### Option B: Coolors.co + Radix Converter
1. Generate palette on **Coolors.co**
2. Use **Radix Colors** to convert to Radix format
3. Copy CSS variables

---

## Method 3: Manual CSS Variables (Current Setup)

### Your Current Structure:
```css
/* client/src/index.css */
:root {
  /* Shadcn/Radix semantic colors */
  --background: #F8F8F8;
  --foreground: #2A2B26;
  --primary: #C4E98C;
  --accent: #C4E98C;
  
  /* Radix 12-step scales */
  --background-1 through --background-12
  --interactive-1 through --interactive-12
  --solid-1 through --solid-12
  --text-1 through --text-12
}
```

### To Change Theme:
1. **Update base colors** in `:root`
2. **Regenerate 12-step scales** using Radix Colors tool
3. **Test contrast** for accessibility

---

## Method 4: SVG as Color Source (Not Recommended)

**Why not SVG:**
- SVGs use `fill`/`stroke` attributes (not ideal for theming)
- Harder to apply across components
- CSS variables are more flexible

**If you have SVG colors:**
1. Extract hex/RGB values from SVG
2. Convert to Radix format
3. Add to CSS variables

---

## Best Tools for Theme Generation

### 1. **Radix Colors** (Best for Shadcn/Radix)
- **URL**: https://www.radix-ui.com/colors
- **Why**: Generates accessible, semantic color scales
- **Output**: CSS variables ready to copy

### 2. **Tailwind Palette Generator**
- **URL**: https://www.tailwindshades.com/
- **Why**: Generates Tailwind color scales
- **Output**: Object format for `tailwind.config.ts`

### 3. **ColorBox**
- **URL**: https://www.colorbox.io/
- **Why**: Generates accessible color scales
- **Output**: Multiple formats including CSS

### 4. **Radix UI Theme Studio** (Future - may not exist yet)
- Check Radix documentation for theme generation tools

---

## Quick Theme Switch Workflow

### Step 1: Generate Colors
1. Go to **Radix Colors**
2. Pick your base color (e.g., `blue`, `green`, `purple`)
3. Select **light** or **dark** variant
4. Copy generated CSS variables

### Step 2: Update Your CSS
```css
/* client/src/index.css */
:root {
  /* Replace with Radix generated values */
  --background: var(--blue1);
  --foreground: var(--blue12);
  --primary: var(--blue9);
  --primary-foreground: var(--blue12);
  --accent: var(--blue9);
  /* ... continue with all semantic colors */
  
  /* Radix scales (copy from Radix Colors) */
  --blue1: #fbfdff;
  --blue2: #f5faff;
  --blue3: #edf6ff;
  /* ... etc through blue12 */
}
```

### Step 3: Update Tailwind Config (if needed)
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        // Your existing setup already does this!
      }
    }
  }
}
```

---

## Your Current Colors (for reference)

Based on `client/src/index.css`:
- **Primary/Accent**: `#C4E98C` (Light green)
- **Background**: `#F8F8F8` (Light gray)
- **Foreground**: `#2A2B26` (Dark gray)
- **User colors mentioned**: `#A0D2D3` (accent), `#2D2625` (gray), `#222422` (background)

### To apply your colors:
```css
:root {
  --accent: #A0D2D3;           /* Your accent color */
  --background: #222422;        /* Your background */
  --foreground: #2D2625;        /* Your text color */
  /* Generate Radix scales for these colors */
}
```

---

## Recommendation

**Use Radix Colors website** + your existing CSS variables setup. It's:
- ✅ Compatible with Shadcn UI (built on Radix)
- ✅ Generates accessible scales automatically
- ✅ Works with your current Tailwind setup
- ✅ Easy to update (just change CSS variables)

**Don't use:**
- ❌ SVG parameters (harder to manage)
- ❌ Inline color values (not themable)
- ❌ Tailwind-only colors (less flexible than CSS vars)

---

## Example: Applying New Theme

```css
/* 1. Generate on Radix Colors website */
/* 2. Copy the CSS variables */

:root {
  /* New theme - Blue variant */
  --background: var(--blue1);
  --foreground: var(--blue12);
  --primary: var(--blue9);
  --accent: var(--blue9);
  
  /* Radix scale values (from website) */
  --blue1: #fbfdff;
  --blue2: #f5faff;
  /* ... etc */
}
```

All Shadcn components will automatically use the new theme! ✨

