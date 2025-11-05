# HALCYON Color Mapping Template

Based on [Radix Colors "Understanding the Scale"](https://www.radix-ui.com/colors) documentation and [Aliasing Guide](https://www.radix-ui.com/colors/docs/aliasing).

---

## Radix Scale Step Mapping (Official Guidelines)

| Step | Use Case | Your Semantic Token | Light Mode | Dark Mode |
|------|----------|---------------------|------------|-----------|
| **1** | App background | `--background` | `--gray-1` or `--color-background` | `--gray-1` |
| **2** | Subtle background | `--muted`, `--card` | `--gray-2` | `--gray-2` |
| **3** | UI element background | `--popover`, `--card` | `--gray-3` | `--gray-3` |
| **4** | Hovered UI element | `--accent` (hover) | `--gray-4` | `--gray-4` |
| **5** | Active/Selected element | `--accent` (active) | `--gray-5` | `--gray-5` |
| **6** | Subtle borders | `--border` (subtle) | `--gray-6` | `--gray-6` |
| **7** | UI element borders & focus rings | `--border`, `--ring` | `--gray-7` | `--gray-7` |
| **8** | Hovered element borders | `--border` (hover) | `--gray-8` | `--gray-8` |
| **9** | Solid backgrounds (primary) | `--primary`, `--accent` | `--red-9` (light) / `--lime-9` (dark) | `--lime-9` |
| **10** | Hovered solid backgrounds | `--primary` (hover), `--accent` (hover) | `--red-10` (light) / `--lime-10` (dark) | `--lime-10` |
| **11** | Low-contrast text | `--muted-foreground` | `--gray-11` | `--gray-11` |
| **12** | High-contrast text | `--foreground` | `--gray-12` | `--gray-12` |

---

## Complete CSS Mapping Template

### Step 1: Add Your Raw Radix Scales
First, paste your generated Radix color scales into `client/src/index.css`:

```css
/* ========================================
   RAW RADIX COLOR SCALES
   Paste your generated scales here
   ======================================== */

/* Light Mode - Accent Scale (Red) */
:root, .light, .light-theme {
  --red-1: #c9c6c6;
  --red-2: #c6bdbd;
  /* ... paste all red-1 through red-12 ... */
  /* ... paste alpha variants if needed ... */
}

/* Light Mode - Gray Scale */
:root, .light, .light-theme {
  --gray-1: #c6c6c6;
  --gray-2: #bebfbe;
  /* ... paste all gray-1 through gray-12 ... */
}

/* Light Mode - Background */
:root, .light, .light-theme {
  --color-background: #bcd3cb;
}

/* Dark Mode - Accent Scale (Lime) */
.dark, .dark-theme {
  --lime-1: #22251d;
  --lime-2: #272a1f;
  /* ... paste all lime-1 through lime-12 ... */
}

/* Dark Mode - Gray Scale */
.dark, .dark-theme {
  --gray-1: #232421;
  --gray-2: #2a2a28;
  /* ... paste all gray-1 through gray-12 ... */
}

/* Dark Mode - Background */
.dark, .dark-theme {
  --color-background: #222422;
}
```

### Step 2: Map to Semantic Tokens (Shadcn/Your App)

```css
/* ========================================
   SEMANTIC TOKEN MAPPING
   Based on Radix "Understanding the Scale"
   ======================================== */

:root, .light, .light-theme {
  /* === BACKGROUNDS (Steps 1-2) === */
  --background: var(--color-background);      /* Step 1: App background */
  --muted: var(--gray-2);                      /* Step 2: Subtle background */
  --card: var(--gray-2);                       /* Step 2: Card background */
  
  /* === COMPONENT BACKGROUNDS (Steps 3-5) === */
  --popover: var(--gray-3);                    /* Step 3: UI element background */
  /* Step 4: Hover states (handled via Tailwind classes) */
  /* Step 5: Active/Selected (handled via Tailwind classes) */
  
  /* === BORDERS (Steps 6-8) === */
  --border: var(--gray-7);                     /* Step 7: UI element borders */
  --input: var(--gray-7);                      /* Step 7: Input borders */
  --ring: var(--red-7);                        /* Step 7: Focus rings (use accent) */
  
  /* === SOLID COLORS (Steps 9-10) === */
  --primary: var(--red-9);                     /* Step 9: Primary solid color */
  --primary-foreground: var(--gray-12);        /* Step 12: Text on primary */
  
  --accent: var(--red-9);                      /* Step 9: Accent solid color */
  --accent-foreground: var(--gray-12);         /* Step 12: Text on accent */
  
  /* === TEXT (Steps 11-12) === */
  --foreground: var(--gray-12);                /* Step 12: High-contrast text */
  --muted-foreground: var(--gray-11);          /* Step 11: Low-contrast text */
  --card-foreground: var(--gray-12);           /* Step 12: Card text */
  --popover-foreground: var(--gray-12);         /* Step 12: Popover text */
  
  /* === DESTRUCTIVE (Error States) === */
  --destructive: hsl(0, 84.2%, 60.2%);        /* Red for errors */
  --destructive-foreground: var(--gray-12);
  
  /* === RADIUS === */
  --radius: 0.5rem;
}

.dark, .dark-theme {
  /* === BACKGROUNDS (Steps 1-2) === */
  --background: var(--color-background);       /* Step 1: Dark app background */
  --muted: var(--gray-2);                      /* Step 2: Subtle dark background */
  --card: var(--gray-2);                       /* Step 2: Dark card background */
  
  /* === COMPONENT BACKGROUNDS (Steps 3-5) === */
  --popover: var(--gray-3);                    /* Step 3: Dark UI element background */
  
  /* === BORDERS (Steps 6-8) === */
  --border: var(--gray-7);                      /* Step 7: Dark borders */
  --input: var(--gray-7);                      /* Step 7: Dark input borders */
  --ring: var(--lime-7);                       /* Step 7: Focus rings (use lime accent) */
  
  /* === SOLID COLORS (Steps 9-10) === */
  --primary: var(--lime-9);                    /* Step 9: Dark mode primary (lime) */
  --primary-foreground: var(--gray-12);        /* Step 12: Text on primary */
  
  --accent: var(--lime-9);                     /* Step 9: Dark mode accent (lime) */
  --accent-foreground: var(--gray-12);         /* Step 12: Text on accent */
  
  /* === TEXT (Steps 11-12) === */
  --foreground: var(--gray-12);                /* Step 12: High-contrast text (light) */
  --muted-foreground: var(--gray-11);          /* Step 11: Low-contrast text */
  --card-foreground: var(--gray-12);           /* Step 12: Card text */
  --popover-foreground: var(--gray-12);        /* Step 12: Popover text */
  
  /* === DESTRUCTIVE (Error States) === */
  --destructive: hsl(0, 84.2%, 60.2%);        /* Red for errors (same in dark) */
  --destructive-foreground: var(--gray-12);
}
```

---

## Quick Reference: Use Case → Step Mapping

### When you need a color for...

| Use Case | Light Mode | Dark Mode | Notes |
|----------|------------|-----------|-------|
| **Main app background** | `--background` → `--color-background` or `--gray-1` | `--background` → `--color-background` or `--gray-1` | Use your custom background |
| **Card backgrounds** | `--card` → `--gray-2` | `--card` → `--gray-2` | Subtle component background |
| **Hover states** | `--gray-4` | `--gray-4` | Step 4 for hover |
| **Button primary** | `--primary` → `--red-9` | `--primary` → `--lime-9` | Solid button color |
| **Button hover** | `--red-10` | `--lime-10` | Step 10 for hover |
| **Borders** | `--border` → `--gray-7` | `--border` → `--gray-7` | Standard borders |
| **Focus rings** | `--ring` → `--red-7` | `--ring` → `--lime-7` | Use accent scale |
| **Text (high contrast)** | `--foreground` → `--gray-12` | `--foreground` → `--gray-12` | Main text |
| **Text (low contrast)** | `--muted-foreground` → `--gray-11` | `--muted-foreground` → `--gray-11` | Secondary text |

---

## Advanced: Use-Case Aliases (Optional)

Following Radix "Aliasing" patterns, you can create use-case specific aliases:

```css
/* Accent color use cases */
:root {
  --accent-bg: var(--red-9);              /* Solid accent background */
  --accent-bg-hover: var(--red-10);       /* Hover state */
  --accent-line: var(--red-7);            /* Borders, dividers */
  --accent-border: var(--red-8);           /* Stronger borders */
  --accent-solid: var(--red-9);           /* Primary accent */
  --accent-solid-hover: var(--red-10);    /* Hover accent */
  --accent-text: var(--red-11);           /* Accent text (low contrast) */
  --accent-contrast: var(--gray-12);      /* Text on accent (white/dark) */
}

.dark {
  --accent-bg: var(--lime-9);
  --accent-bg-hover: var(--lime-10);
  --accent-line: var(--lime-7);
  --accent-border: var(--lime-8);
  --accent-solid: var(--lime-9);
  --accent-solid-hover: var(--lime-10);
  --accent-text: var(--lime-11);
  --accent-contrast: var(--gray-12);
}
```

---

## Background Variables Recommendation

Based on Radix guidelines, you should have:

### Essential Backgrounds:
1. **`--background`** - Main app background (your `--color-background`)
2. **`--background-1` through `--background-12`** - Full scale for flexibility (from Gray scale)

### Optional but Recommended:
- `--muted` - Subtle backgrounds (Step 2)
- `--card` - Card/surface backgrounds (Step 2)
- `--popover` - Dropdown/modal backgrounds (Step 3)

### Implementation:
```css
:root {
  /* Main background */
  --background: var(--color-background);
  
  /* Full background scale (optional, for flexibility) */
  --background-1: var(--gray-1);
  --background-2: var(--gray-2);
  --background-3: var(--gray-3);
  /* ... through --background-12 */
}
```

---

## Testing Your Mappings

After applying these mappings:
1. Check contrast ratios (Radix ensures Steps 11-12 pass on Step 2 backgrounds)
2. Test hover states (Steps 4, 10)
3. Verify focus rings are visible (Step 7)
4. Check text readability (Steps 11-12 on Step 2 backgrounds)

---

## Reference Links

- [Radix Colors - Understanding the Scale](https://www.radix-ui.com/colors/docs/understanding-the-scale)
- [Radix Colors - Aliasing](https://www.radix-ui.com/colors/docs/aliasing)
- [Radix Colors - Custom Palettes](https://www.radix-ui.com/colors/docs/custom-palettes)

---

*This template follows Radix Colors official guidelines and ensures accessibility compliance.*

