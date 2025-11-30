# Implementing Design System Changes in the Main UI

## Overview

The Design System Editor allows you to **stage** and **test** design token changes before committing them to the main application. This guide explains the complete workflow from staging changes to implementing them permanently.

---

## How CSS Variables Work

### Current Architecture

The main UI uses **CSS custom properties (variables)** defined in `client/src/index.css`:

```css
:root {
  --background: #f5f5f5;
  --foreground: #131320;
  --primary: #cc33ab;
  --card: #fafffb;
  /* ... etc */
}

.dark {
  --background: #17171c;
  --foreground: #eeeff2;
  /* ... etc */
}
```

These variables are used throughout the app via:
- **Tailwind classes**: `bg-background`, `text-foreground`, `border-border`
- **Inline styles**: `style={{ backgroundColor: 'var(--primary)' }}`
- **Component props**: Shadcn UI components automatically use these variables

### Why This Works

When you change a CSS variable, **all components using that variable update automatically**. This is the power of CSS custom properties - they cascade through the entire application.

---

## Complete Workflow

### Step 1: Stage Changes in Design System Editor

1. **Navigate to Design System** (`/design-system`)
2. **Edit Design Tokens**:
   - Open the "Design Tokens" section
   - Modify colors, typography, spacing, etc.
   - Changes update CSS variables **in real-time** (you'll see them in Live Preview)
3. **Save/Stage Changes**:
   - Click "Save" in the Token Editor
   - Changes are saved to `localStorage` as `design-system-staged-tokens`
   - This allows you to test changes without losing them

### Step 2: Test Changes

1. **Use Live Preview**:
   - See how changes affect buttons, cards, inputs, badges
   - Switch between light/dark themes
   - Test different viewport sizes

2. **Navigate to Other Pages**:
   - Changes are applied **globally** via CSS variables
   - Visit `/users`, `/trips`, `/activity-feed`, etc.
   - Verify changes look good across the app

3. **Test Both Themes**:
   - Toggle between light and dark mode
   - Ensure both themes work correctly

### Step 3: Create a Theme (Optional)

1. **Go to Theme Manager**:
   - Click "Create Theme" with a descriptive name
   - This captures your current token configuration
   - Useful for:
     - Saving multiple variations
     - Reverting to previous states
     - Sharing configurations with team

2. **Export Theme** (Optional):
   - Click export on a theme card
   - Download as JSON for backup or sharing

### Step 4: Implement Changes Permanently

**Current Method: Manual CSS Update**

Since the Design System Editor stages changes in `localStorage`, you need to manually update `client/src/index.css` to make changes permanent:

#### Option A: Copy from Staged Tokens

1. **Open Browser DevTools**:
   ```javascript
   // In browser console
   const staged = localStorage.getItem('design-system-staged-tokens');
   console.log(JSON.parse(staged));
   ```

2. **Map Design Tokens to CSS Variables**:
   - Use the mapping from `USING_DESIGN_SYSTEM_EDITOR.md`
   - Example:
     ```javascript
     // Design Token: colors.semantic.background.primary
     // CSS Variable: --background
     ```

3. **Update `client/src/index.css`**:
   ```css
   :root {
     --background: #YOUR_NEW_VALUE;
     --foreground: #YOUR_NEW_VALUE;
     /* ... etc */
   }
   
   .dark {
     --background: #YOUR_NEW_DARK_VALUE;
     --foreground: #YOUR_NEW_DARK_VALUE;
     /* ... etc */
   }
   ```

#### Option B: Export Theme and Use Script

1. **Export Theme from Theme Manager**
2. **Create/Use Migration Script** (Future Enhancement):
   ```typescript
   // This would be a future feature
   // Script to automatically update index.css from exported theme
   ```

---

## CSS Variable Mapping Reference

### Current Mappings (from Design System Editor)

| Design Token Path | CSS Variable | Light Mode | Dark Mode |
|------------------|--------------|------------|-----------|
| `colors.semantic.background.primary` | `--background` | `#f5f5f5` | `#17171c` |
| `colors.semantic.text.primary` | `--foreground` | `#131320` | `#eeeff2` |
| `colors.semantic.background.secondary` | `--card` | `#fafffb` | `#20222d` |
| `colors.semantic.text.secondary` | `--card-foreground` | `#131320` | `#eeeff2` |
| `colors.primary.500` | `--primary` | `#cc33ab` | `#cc33ab` |
| `colors.error.500` | `--destructive` | `#cc5833` | `#cc5833` |
| `colors.info.500` | `--accent` | `#33ccad` | `#33ccad` |
| `colors.semantic.border.primary` | `--border` | `#e1e5e7` | `#383854` |
| `spacing.borderRadius.base` | `--radius` | `0.5rem` | `0.5rem` |

### Typography Mappings

| Design Token Path | CSS Variable | Current Value |
|------------------|--------------|---------------|
| `typography.fontFamily.sans` | `--font-sans` | `Nohemi, sans-serif` |
| `typography.fontFamily.serif` | `--font-serif` | `ui-serif, Georgia, ...` |
| `typography.fontFamily.mono` | `--font-mono` | `Fira Code, monospace` |

---

## Example: Changing Primary Color

### Scenario
You want to change the primary color from `#cc33ab` to `#ff555d` (the Dev Lab accent color).

### Steps

1. **In Design System Editor**:
   - Navigate to Design Tokens → Colors → Primary
   - Change `colors.primary.500` to `#ff555d`
   - Click "Save"
   - Test in Live Preview

2. **Verify Changes**:
   - Navigate to other pages
   - Check buttons, links, badges using primary color
   - Test both light and dark modes

3. **Update `client/src/index.css`**:
   ```css
   :root {
     --primary: #ff555d;  /* Changed from #cc33ab */
     --primary-foreground: #ffffff;
     --ring: #ff555d;  /* Focus rings should match */
     --chart-1: #ff555d;  /* If used in charts */
     --sidebar-primary: #ff555d;
     --sidebar-ring: #ff555d;
   }
   
   .dark {
     --primary: #ff555d;  /* Same for dark mode */
     --primary-foreground: #ffffff;
     --ring: #ff555d;
     --chart-1: #ff555d;
     --sidebar-primary: #ff555d;
     --sidebar-ring: #ff555d;
   }
   ```

4. **Commit Changes**:
   ```bash
   git add client/src/index.css
   git commit -m "Update primary color to #ff555d"
   ```

---

## Best Practices

### 1. **Always Test Before Committing**
- Use Live Preview extensively
- Navigate to multiple pages
- Test both light and dark themes
- Check on different screen sizes

### 2. **Use Theme Manager for Variations**
- Create themes for different color schemes
- Export themes as backups
- Name themes descriptively (e.g., "Corporate Blue", "High Contrast")

### 3. **Maintain Consistency**
- When changing primary color, update related variables:
  - `--primary`
  - `--ring` (focus rings)
  - `--chart-1` (if used)
  - `--sidebar-primary`
  - `--sidebar-ring`

### 4. **Document Changes**
- Add comments in `index.css` for major changes
- Note why changes were made
- Reference design decisions

### 5. **Version Control**
- Commit CSS changes separately from other code
- Use descriptive commit messages
- Consider creating a changelog for design system updates

---

## Future Enhancements (Potential)

### Automated CSS Update Script
A script could be created to automatically update `index.css` from staged tokens:

```typescript
// scripts/apply-design-tokens.ts
// Reads from localStorage or exported theme JSON
// Automatically updates index.css
```

### Design System API
A backend API could:
- Store design tokens in database
- Allow per-corporate-client themes
- Provide API endpoints for theme management

### Real-time Theme Switching
Currently, theme changes require page refresh. Future enhancement:
- Hot-reload CSS variables
- Instant theme switching without refresh

---

## Troubleshooting

### Changes Not Appearing

1. **Check localStorage**:
   ```javascript
   localStorage.getItem('design-system-staged-tokens')
   ```

2. **Verify CSS Variable Names**:
   - Ensure variable names match exactly
   - Check for typos in `index.css`

3. **Clear Browser Cache**:
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

4. **Check Component Usage**:
   - Some components might use hardcoded colors
   - Search for hardcoded hex values in components

### Staged Changes Lost

1. **Check localStorage**:
   - Staged tokens: `design-system-staged-tokens`
   - Staged components: `design-system-staged-components`
   - Themes: `design-system-themes`

2. **Export Before Clearing**:
   - Always export themes before clearing browser data
   - Use "Export All" in Theme Manager

### Dark Mode Not Updating

1. **Check `.dark` Class**:
   - Ensure `.dark` class is applied to root element
   - Verify theme toggle is working

2. **Verify Both Modes Updated**:
   - Update both `:root` and `.dark` in `index.css`

---

## Quick Reference

### Key Files
- **Design System Editor**: `client/src/pages/design-system.tsx`
- **CSS Variables**: `client/src/index.css`
- **Token Mapping**: `docs/design-system/USING_DESIGN_SYSTEM_EDITOR.md`

### localStorage Keys
- `design-system-staged-tokens` - Current token changes
- `design-system-staged-components` - Component builder data
- `design-system-themes` - Saved themes

### CSS Variable Locations
- Light mode: `:root` in `client/src/index.css` (lines 85-154)
- Dark mode: `.dark` in `client/src/index.css` (lines 156-230)

---

## Summary

**Current Workflow:**
1. Edit tokens in Design System Editor → Staged in localStorage
2. Test changes across the app
3. Manually update `client/src/index.css` with new values
4. Commit changes to git

**Key Insight:**
The Design System Editor is a **staging and testing tool**. It updates CSS variables in real-time for preview, but permanent changes require updating the source CSS file. This gives you the safety of testing before committing.

