# Dev Lab Styling Reference

## Overview

The Dev Lab page uses a distinct glass morphism design system separate from the main application. This document serves as a reference for all Dev Lab-specific styling conventions, color variables, and component patterns.

## Design Philosophy

**Glass Morphism** - A modern UI design trend featuring:
- Frosted glass appearance with backdrop blur
- Semi-transparent surfaces
- Subtle borders with transparency
- Soft shadows for depth
- Smooth transitions and interactions

## Color Palette

### Light Mode

```css
--dev-lab-background: #eaeaea;
--dev-lab-card-surface: #ffffff;
--dev-lab-muted-secondary: #f5f5f5;
--dev-lab-accent: #ff555d;
--dev-lab-text-primary: #26282b;
```

### Dark Mode

```css
--dev-lab-background-dark: #26282b;
--dev-lab-card-surface-dark: #2f3235;
--dev-lab-muted-secondary-dark: #383b3e;
--dev-lab-accent-dark: #ff555d;
--dev-lab-text-primary-dark: #eaeaea;
```

## Glass Morphism Classes

### Base Classes

#### `.dev-lab-glass-light`
Light mode glass morphism effect:
- Background: `rgba(255, 255, 255, 0.25)`
- Backdrop blur: `10px`
- Border: `1px solid rgba(255, 255, 255, 0.18)`
- Shadow: `0 8px 32px 0 rgba(31, 38, 135, 0.37)`

#### `.dev-lab-glass-dark`
Dark mode glass morphism effect:
- Background: `rgba(47, 50, 53, 0.25)`
- Backdrop blur: `10px`
- Border: `1px solid rgba(255, 255, 255, 0.1)`
- Shadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`

### Utility Classes

#### `.dev-lab-container`
Main container with gradient background:
- Light: `bg-gradient-to-br from-[#eaeaea] to-[#f5f5f5]`
- Dark: `bg-gradient-to-br from-[#26282b] to-[#383b3e]`

#### `.dev-lab-accent-button`
Accent-colored buttons with hover effects:
- Background: `#ff555d`
- Hover: `#ff444c`
- Shadow: `0 0 20px rgba(255, 85, 93, 0.3)`
- Transition: `scale-105` on hover

#### `.dev-lab-text-primary`
Primary text color:
- Light: `#26282b`
- Dark: `#eaeaea`

#### `.dev-lab-text-muted`
Muted text color:
- Light: `#26282b/80`
- Dark: `#eaeaea/80`

## Component Patterns

### Cards & Panels

```tsx
<Card className="dev-lab-glass-light dark:dev-lab-glass-dark rounded-xl border border-white/20 dark:border-white/10 shadow-xl">
  {/* Card content */}
</Card>
```

### Buttons

```tsx
<Button className="dev-lab-accent-button text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg">
  Click me
</Button>
```

### Typography

```tsx
<h1 className="dev-lab-text-primary text-3xl font-bold">
  Heading
</h1>

<p className="dev-lab-text-muted">
  Body text
</p>
```

### Containers

```tsx
<div className="dev-lab-container min-h-screen p-6">
  {/* Page content */}
</div>
```

## Implementation Guidelines

### Scope
- **Only apply to Dev Lab page** (`/dev-lab`)
- **Do not affect** other pages in the application
- Use scoped classes prefixed with `dev-lab-`

### Responsive Design
- Maintain mobile-first approach
- Ensure glass effects work on all screen sizes
- Test backdrop-filter support

### Performance
- Use CSS transforms for animations (GPU-accelerated)
- Minimize backdrop-filter usage where possible
- Test performance on lower-end devices

### Accessibility
- Maintain proper color contrast ratios
- Ensure text is readable on glass backgrounds
- Test with screen readers

## Browser Support

### Backdrop Filter
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support (v103+)
- Safari: ✅ Full support
- Fallback: Solid backgrounds for unsupported browsers

## Usage Examples

### Main Container
```tsx
<div className="dev-lab-container min-h-screen p-6">
  {/* Dev Lab content */}
</div>
```

### Card with Glass Effect
```tsx
<Card className="dev-lab-glass-light dark:dev-lab-glass-dark rounded-xl p-6 border border-white/20 dark:border-white/10 shadow-xl">
  <CardHeader>
    <CardTitle className="dev-lab-text-primary">Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="dev-lab-text-muted">Content</p>
  </CardContent>
</Card>
```

### Accent Button
```tsx
<Button className="bg-[#ff555d] hover:bg-[#ff444c] text-white px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-xl">
  Action
</Button>
```

## Maintenance

### When to Update
- New design requirements
- Color palette changes
- Performance optimizations
- Browser compatibility updates

### Version History
- **v1.0** (2025-01-25): Initial glass morphism implementation

## Related Files

- `client/src/pages/dev-lab.tsx` - Main Dev Lab page component
- `client/src/index.css` - Global CSS with Dev Lab classes
- `client/src/components/dev-lab/` - Dev Lab-specific components

