# HALCYON Typography Reference

Complete typography system documentation for the HALCYON transportation management system, including font families, scales, text styles, and color integration.

---

## Overview

The HALCYON typography system uses:
- **Nohemi** - Primary body font (Regular 400, Medium 500, SemiBold 600)
- **DegularDisplay** - Headings and display text (Bold 700, Black 900)
- **Inter** - Fallback sans-serif font
- **Golden Ratio (1.618)** - Typography scale based on harmonious proportions

---

## Font Families

### Nohemi (Body Text)
```css
font-family: 'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', ...;
```
- **Use Case**: Body text, UI elements, forms, labels
- **Weights Available**: 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Style**: Modern, readable, professional

### DegularDisplay (Headings)
```css
font-family: 'DegularDisplay', 'ui-sans-serif', 'system-ui';
```
- **Use Case**: Page titles, section headers, display text
- **Weights Available**: 700 (Bold), 900 (Black)
- **Style**: Bold, impactful, attention-grabbing

### Tailwind Classes
```css
/* Body text - Nohemi */
font-sans          /* Nohemi with fallbacks */

/* Headings - DegularDisplay */
font-heading       /* DegularDisplay for headers */
```

---

## Typography Scale

### Font Sizes (rem-based, responsive)

| Token | Size | Pixels (16px base) | Use Case |
|-------|------|-------------------|----------|
| `xs` | `0.75rem` | 12px | Labels, captions |
| `sm` | `0.875rem` | 14px | Small body text |
| `base` | `1rem` | 16px | Default body text |
| `lg` | `1.125rem` | 18px | Large body text |
| `xl` | `1.25rem` | 20px | Subheadings |
| `2xl` | `1.5rem` | 24px | Section headings |
| `3xl` | `1.875rem` | 30px | Large headings |
| `4xl` | `2.25rem` | 36px | Page titles |
| `5xl` | `3rem` | 48px | Display text |
| `6xl` | `3.75rem` | 60px | Hero text |
| `7xl` | `4.5rem` | 72px | Mega display |

### Font Weights

| Token | Weight | Use Case |
|-------|--------|----------|
| `thin` | 100 | Rarely used |
| `extralight` | 200 | Rarely used |
| `light` | 300 | Subtle emphasis |
| `normal` | 400 | Body text (Nohemi Regular) |
| `medium` | 500 | Emphasis (Nohemi Medium) |
| `semibold` | 600 | Strong emphasis (Nohemi SemiBold) |
| `bold` | 700 | Headings (DegularDisplay Bold) |
| `extrabold` | 800 | Strong headings |
| `black` | 900 | Maximum emphasis (DegularDisplay Black) |

### Line Heights

| Token | Ratio | Use Case |
|-------|-------|----------|
| `none` | 1 | Tight headings |
| `tight` | 1.25 | Compact text |
| `snug` | 1.375 | Comfortable headings |
| `normal` | 1.5 | Body text (default) |
| `relaxed` | 1.625 | Spacious body text |
| `loose` | 2 | Very spacious |

### Letter Spacing

| Token | Value | Use Case |
|-------|-------|----------|
| `tighter` | `-0.05em` | Large display text |
| `tight` | `-0.025em` | Headings |
| `normal` | `0em` | Default |
| `wide` | `0.025em` | Labels, uppercase |
| `wider` | `0.05em` | Spaced labels |
| `widest` | `0.1em` | Uppercase captions |

---

## Predefined Text Styles

### Display Styles (DegularDisplay)

```css
/* Mega Headers - Page Titles */
.text-mega {
  font-family: 'Nohemi', 'ui-sans-serif', 'system-ui', ...;
  font-weight: 600;  /* Nohemi SemiBold */
  font-size: 64px;
  line-height: 0.9;
  letter-spacing: -0.02em;
  text-transform: uppercase;
}

/* XL Display */
.text-xl-display {
  font-family: 'Nohemi', 'ui-sans-serif', 'system-ui', ...;
  font-weight: 500;  /* Nohemi Medium */
  font-size: 48px;
  line-height: 0.95;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

/* Section Headers */
.text-brutalist-h1 {
  font-family: var(--font-primary);
  font-weight: 700;
  font-size: 36px;
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-transform: uppercase;
}

.text-brutalist-h2 {
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 28px;
  line-height: 1.2;
  text-transform: uppercase;
}
```

### Body Styles (Nohemi)

```css
/* Body Text */
.text-brutalist-body {
  font-family: var(--font-primary);  /* Nohemi */
  font-weight: 500;
  font-size: 18px;
  line-height: 1.4;
}

.text-brutalist-small {
  font-family: var(--font-primary);
  font-weight: 500;
  font-size: 14px;
  line-height: 1.3;
}

/* Caption */
.text-brutalist-caption {
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
```

### TypeScript Tokens (Alternative)

You can also use the TypeScript typography tokens from `client/src/design-system/tokens/typography.ts`:

```typescript
import { typography } from '@/design-system/tokens/typography';

// Usage
<div style={{ fontSize: typography.fontSize.xl }}>
  Large text
</div>

<div style={{ ...typography.textStyles['heading-lg'] }}>
  Heading
</div>
```

**Available Text Style Tokens:**
- `display-2xl`, `display-xl`, `display-lg`, `display-md`, `display-sm`, `display-xs`
- `heading-xl`, `heading-lg`, `heading-md`, `heading-sm`, `heading-xs`
- `body-xl`, `body-lg`, `body-md`, `body-sm`, `body-xs`
- `label-lg`, `label-md`, `label-sm`
- `caption-lg`, `caption-md`, `caption-sm`

---

## Typography + Color Integration

### How Typography Works with Colors

Typography and colors work together through **semantic color tokens**:

| Text Use Case | Color Token | Light Mode | Dark Mode | Contrast Ratio |
|---------------|-------------|------------|-----------|----------------|
| **High-contrast text** | `--foreground` | `--gray-12` (#202023) | `--gray-12` (#eeeeef) | ✅ WCAG AAA |
| **Low-contrast text** | `--muted-foreground` | `--gray-11` (#57575b) | `--gray-11` (#b6b6bc) | ✅ WCAG AA |
| **Text on primary** | `--primary-foreground` | `--gray-12` (white/dark) | `--gray-12` (light) | ✅ WCAG AAA |
| **Text on accent** | `--accent-foreground` | `--gray-12` (white/dark) | `--gray-12` (light) | ✅ WCAG AAA |
| **Card text** | `--card-foreground` | `--gray-12` | `--gray-12` | ✅ WCAG AAA |
| **Disabled text** | Custom | `--gray-8` (#acacb1) | `--gray-7` (#535358) | ⚠️ Disabled state |

### Tailwind Classes for Typography + Color

```tsx
// High-contrast text (default)
<h1 className="text-foreground">Heading</h1>

// Low-contrast text (secondary info)
<p className="text-muted-foreground">Secondary text</p>

// Text on colored backgrounds
<button className="bg-primary text-primary-foreground">Button</button>

// Card text
<div className="bg-card text-card-foreground">Card content</div>

// Combining typography scale + color
<h2 className="text-brutalist-h1 text-foreground">Section Title</h2>
<p className="text-brutalist-body text-muted-foreground">Body text</p>
```

### CSS Custom Properties Integration

```css
/* Typography with color variables */
:root {
  /* Text colors for typography */
  --text-primary: var(--foreground);           /* High contrast */
  --text-secondary: var(--muted-foreground);   /* Low contrast */
  --text-disabled: var(--gray-8);              /* Disabled state */
}

/* Example: Heading with color */
.heading-primary {
  font-family: var(--font-heading);  /* DegularDisplay */
  font-weight: 700;
  font-size: 36px;
  color: var(--foreground);          /* Uses gray-12 */
  line-height: 1.1;
}

/* Example: Body text with color */
.body-primary {
  font-family: var(--font-sans);     /* Nohemi */
  font-weight: 400;
  font-size: 18px;
  color: var(--foreground);          /* Uses gray-12 */
  line-height: 1.5;
}

.body-secondary {
  font-family: var(--font-sans);
  font-weight: 400;
  font-size: 16px;
  color: var(--muted-foreground);   /* Uses gray-11 */
  line-height: 1.5;
}
```

---

## Quick Reference Guide

### Common Typography + Color Combinations

| Element | Font | Size | Weight | Color | Tailwind Classes |
|---------|------|------|--------|-------|------------------|
| **Page Title** | DegularDisplay | 64px | 900 | `--foreground` | `text-mega text-foreground` |
| **Section Header** | DegularDisplay | 36px | 700 | `--foreground` | `text-brutalist-h1 text-foreground` |
| **Subsection Header** | DegularDisplay | 28px | 600 | `--foreground` | `text-brutalist-h2 text-foreground` |
| **Body Text** | Nohemi | 18px | 500 | `--foreground` | `text-brutalist-body text-foreground` |
| **Small Text** | Nohemi | 14px | 500 | `--foreground` | `text-brutalist-small text-foreground` |
| **Secondary Text** | Nohemi | 16px | 400 | `--muted-foreground` | `text-base text-muted-foreground` |
| **Label** | Nohemi | 14px | 500 | `--muted-foreground` | `text-sm font-medium text-muted-foreground` |
| **Caption** | Nohemi | 12px | 600 | `--muted-foreground` | `text-brutalist-caption text-muted-foreground` |
| **Button Text** | Nohemi | 16px | 600 | `--primary-foreground` | `text-base font-semibold text-primary-foreground` |
| **Disabled Text** | Nohemi | 14px | 400 | `--gray-8` | `text-sm text-gray-8` |

### Typography Scale Reference (px values)

```
64px  ← Mega Headers (text-mega)
48px  ← XL Display (text-xl-display)
36px  ← H1 Headings (text-brutalist-h1)
28px  ← H2 Headings (text-brutalist-h2)
20px  ← Subheadings
18px  ← Body Text (text-brutalist-body)
16px  ← Base Body (text-base)
14px  ← Small Text (text-brutalist-small)
12px  ← Captions (text-brutalist-caption)
```

---

## Accessibility Guidelines

### Contrast Requirements

1. **High-contrast text** (`--foreground` = `--gray-12`)
   - ✅ WCAG AAA: 7:1 contrast ratio
   - Use for: Headings, primary body text, important information

2. **Low-contrast text** (`--muted-foreground` = `--gray-11`)
   - ✅ WCAG AA: 4.5:1 contrast ratio
   - Use for: Secondary text, labels, captions, less important info

3. **Text on colored backgrounds**
   - Use `--primary-foreground` or `--accent-foreground` (typically `--gray-12`)
   - Ensure 4.5:1 minimum contrast ratio

### Font Size Guidelines

- **Minimum body text**: 16px (prevents zoom on iOS)
- **Mobile-optimized**: 18px for body text
- **Touch targets**: 44px minimum height (iOS recommendation)

### Font Weight Guidelines

- **Headings**: 600-900 (Bold to Black)
- **Body text**: 400-500 (Regular to Medium)
- **Labels**: 500-600 (Medium to SemiBold)
- **Avoid**: 100-300 (too thin, poor readability)

---

## Applying New Color Themes to Typography

When applying a new color theme (like Bauhaus Blue):

### Step 1: Update Text Colors in CSS

```css
:root, .light, .light-theme {
  /* Typography colors use gray scale */
  --foreground: var(--gray-12);          /* High-contrast text */
  --muted-foreground: var(--gray-11);    /* Low-contrast text */
}

.dark, .dark-theme {
  /* Same tokens, different gray scale values */
  --foreground: var(--gray-12);          /* Light text on dark */
  --muted-foreground: var(--gray-11);     /* Slightly lighter gray */
}
```

### Step 2: Typography Stays the Same

**Typography does NOT change** when you switch color themes:
- ✅ Font families (Nohemi, DegularDisplay) remain the same
- ✅ Font sizes remain the same
- ✅ Font weights remain the same
- ✅ Line heights remain the same
- ✅ Only **text colors** change via `--foreground` and `--muted-foreground`

### Step 3: Test Contrast

After applying a new color theme, verify:
1. `--foreground` on `--background` has sufficient contrast
2. `--muted-foreground` on `--background` meets WCAG AA
3. Text on colored buttons (`--primary-foreground`) is readable

---

## Integration with Scratch Page

The typography system can be referenced on the scratch page (`/scratch`) alongside the color mapping reference. This allows you to:

1. **See typography examples** with current color theme
2. **Test contrast** with different background colors
3. **Copy token names** for use in commands
4. **Reference font sizes and weights** quickly

---

*Last Updated: Based on current HALCYON design system*

