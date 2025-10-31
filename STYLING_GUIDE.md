# HALCYON - Styling Guide

## Color Theme Format

### CSS Custom Properties (HSL Format)
All colors are defined using HSL (Hue, Saturation, Lightness) format for better maintainability and theme switching.

### Light Theme Colors
```css
:root {
  --background: hsl(0, 0%, 100%);           /* Pure white */
  --foreground: hsl(20, 14.3%, 4.1%);      /* Dark charcoal */
  --muted: hsl(60, 4.8%, 95.9%);           /* Light gray */
  --muted-foreground: hsl(25, 5.3%, 44.7%); /* Medium gray */
  --popover: hsl(0, 0%, 100%);             /* Pure white */
  --popover-foreground: hsl(20, 14.3%, 4.1%); /* Dark charcoal */
  --card: hsl(0, 0%, 100%);                /* Pure white */
  --card-foreground: hsl(20, 14.3%, 4.1%); /* Dark charcoal */
  --border: hsl(20, 5.9%, 90%);            /* Light border gray */
  --input: hsl(20, 5.9%, 90%);             /* Light input gray */
  --primary: hsl(207, 90%, 54%);           /* Bright blue */
  --primary-foreground: hsl(211, 100%, 99%); /* Near white */
  --secondary: hsl(60, 4.8%, 95.9%);       /* Light gray */
  --secondary-foreground: hsl(24, 9.8%, 10%); /* Dark text */
  --accent: hsl(60, 4.8%, 95.9%);          /* Light gray */
  --accent-foreground: hsl(24, 9.8%, 10%); /* Dark text */
  --destructive: hsl(0, 84.2%, 60.2%);     /* Red */
  --destructive-foreground: hsl(60, 9.1%, 97.8%); /* Near white */
  --ring: hsl(20, 14.3%, 4.1%);            /* Focus ring */
  --radius: 0.5rem;                        /* Border radius */
}
```

### Dark Theme Colors
```css
.dark {
  --background: hsl(240, 10%, 3.9%);       /* Very dark blue-gray */
  --foreground: hsl(0, 0%, 98%);           /* Near white */
  --muted: hsl(240, 3.7%, 15.9%);          /* Dark gray */
  --muted-foreground: hsl(240, 5%, 64.9%); /* Medium gray */
  --popover: hsl(240, 10%, 3.9%);          /* Very dark blue-gray */
  --popover-foreground: hsl(0, 0%, 98%);   /* Near white */
  --card: hsl(240, 10%, 3.9%);             /* Very dark blue-gray */
  --card-foreground: hsl(0, 0%, 98%);      /* Near white */
  --border: hsl(240, 3.7%, 15.9%);         /* Dark border */
  --input: hsl(240, 3.7%, 15.9%);          /* Dark input */
  --primary: hsl(207, 90%, 54%);           /* Bright blue (same) */
  --primary-foreground: hsl(211, 100%, 99%); /* Near white */
  --secondary: hsl(240, 3.7%, 15.9%);      /* Dark gray */
  --secondary-foreground: hsl(0, 0%, 98%); /* Near white */
  --accent: hsl(240, 3.7%, 15.9%);         /* Dark gray */
  --accent-foreground: hsl(0, 0%, 98%);    /* Near white */
  --destructive: hsl(0, 62.8%, 30.6%);     /* Dark red */
  --destructive-foreground: hsl(0, 0%, 98%); /* Near white */
  --ring: hsl(240, 4.9%, 83.9%);           /* Light focus ring */
}
```

## Trip Status Colors
```css
/* Status colors (same for light/dark themes) */
--scheduled: hsl(45, 100%, 51%);    /* Yellow */
--confirmed: hsl(207, 90%, 54%);    /* Blue */
--in-progress: hsl(36, 100%, 50%);  /* Orange */
--completed: hsl(122, 39%, 49%);    /* Green */
--cancelled: hsl(0, 84%, 60%);      /* Red */
```

## Typography & Fonts

### Font Family
```css
body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Responsive Text Sizes
```css
.text-mobile-lg { @apply text-lg md:text-xl; }
.text-mobile-base { @apply text-base md:text-lg; }
.text-mobile-sm { @apply text-sm md:text-base; }
```

## Button States & Variants

### Primary Button
```css
/* Uses --primary and --primary-foreground */
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

### Secondary Button
```css
/* Uses --secondary and --secondary-foreground */
className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
```

### Destructive Button (Warnings/Deletions)
```css
/* Uses --destructive and --destructive-foreground */
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

### Button States
- **Default**: Base colors
- **Hover**: Opacity reduced to 90% (`/90`)
- **Focus**: Ring with `--ring` color
- **Disabled**: Opacity 50% with cursor disabled

## Form Elements

### Input Fields
```css
.form-input-mobile {
  @apply px-4 py-3 text-base border rounded-lg;
  font-size: 16px; /* Prevents zoom on iOS */
}
```

### Focus States
```css
button:focus-visible, 
a:focus-visible, 
[role="button"]:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
}
```

## Status Indicators

### Badge Colors
```css
.status-scheduled { background-color: var(--scheduled); }
.status-confirmed { background-color: var(--confirmed); }
.status-in-progress { background-color: var(--in-progress); }
.status-completed { background-color: var(--completed); }
.status-cancelled { background-color: var(--cancelled); }
```

### Text Colors
```css
.text-scheduled { color: var(--scheduled); }
.text-confirmed { color: var(--confirmed); }
.text-in-progress { color: var(--in-progress); }
.text-completed { color: var(--completed); }
.text-cancelled { color: var(--cancelled); }
```

## Mobile Optimizations

### Touch Targets
```css
button, a, [role="button"] {
  min-height: 44px; /* iOS recommended */
}
```

### Mobile Components
```css
.btn-mobile {
  @apply min-h-12 px-6 py-3 text-base font-medium rounded-lg;
  touch-action: manipulation;
}

.trip-card-mobile {
  @apply p-4 rounded-lg border border-gray-200 bg-white shadow-sm;
  touch-action: manipulation;
}

.status-badge-mobile {
  @apply px-3 py-1 text-sm font-medium rounded-full;
}
```

## Layout & Spacing

### Safe Areas (for mobile devices with notches)
```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-right: env(safe-area-inset-right);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
}

.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Responsive Spacing
```css
.mobile-padding { @apply px-4 py-6; }
.mobile-optimized {
  padding: 1rem;
  max-width: 100vw;
}
```

## Usage Examples

### Creating a Status Badge
```tsx
<span className={`status-badge-mobile ${trip.status === 'completed' ? 'status-completed' : 'status-scheduled'}`}>
  {trip.status}
</span>
```

### Primary Action Button
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Schedule Trip
</Button>
```

### Destructive Action Button
```tsx
<Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete Trip
</Button>
```

### Dark Mode Toggle
The system automatically switches between light and dark themes based on the `.dark` class on the document element.

## Color Accessibility

All color combinations meet WCAG 2.1 AA contrast requirements:
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: 3:1 minimum

The primary blue (`hsl(207, 90%, 54%)`) maintains the same value in both light and dark themes for brand consistency.
