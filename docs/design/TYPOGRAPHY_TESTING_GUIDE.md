# Typography Testing Guide - Golden Ratio Scale

**Date:** 2025-01-27  
**Status:** Ready to Test  
**Phase:** Phase 2 Complete ✅

---

## 🎯 What to Test

### 1. Font Loading
- [ ] All Nohemi font weights load correctly (Light 300, Regular 400, Medium 500, SemiBold 600, Bold 700)
- [ ] No font fallback errors in console
- [ ] Fonts display correctly (not showing system fonts)

### 2. Typography Scale
- [ ] `.text-display` - 110px, Bold, ALL CAPS
- [ ] `.text-h1` - 68px, Bold, ALL CAPS
- [ ] `.text-h2` - 42px, SemiBold, ALL CAPS
- [ ] `.text-h3` - 26px, SemiBold, ALL CAPS
- [ ] `.text-body-large` - 20px, Regular, normal case
- [ ] `.text-body` - 16px, Regular, normal case
- [ ] `.text-body-small` - 14px, Regular, normal case
- [ ] `.text-caption` - 12px, SemiBold, ALL CAPS

### 3. Legacy Classes (Backward Compatibility)
- [ ] `.text-mega` → maps to `.text-display`
- [ ] `.text-xl-display` → maps to `.text-h1`
- [ ] `.text-brutalist-h1` → maps to `.text-h1`
- [ ] `.text-brutalist-h2` → maps to `.text-h2`
- [ ] `.text-brutalist-body` → maps to `.text-body-large`
- [ ] `.text-brutalist-small` → maps to `.text-body-small`
- [ ] `.text-brutalist-caption` → maps to `.text-caption`

### 4. Responsive Behavior
- [ ] Desktop: All sizes display correctly
- [ ] Mobile (< 768px): 
  - `.text-display` scales to 68px
  - `.text-h1` scales to 42px
  - `.text-h2` scales to 26px
  - `.text-h3` scales to 20px

### 5. ALL CAPS Headers
- [ ] All headers (`.text-display`, `.text-h1`, `.text-h2`, `.text-h3`, `.text-caption`) are uppercase
- [ ] Body text (`.text-body-*`) is NOT uppercase

---

## 🧪 Quick Test Methods

### Method 1: Browser DevTools Console
Open browser console and run:
```javascript
// Test all typography classes
const classes = [
  'text-display',
  'text-h1',
  'text-h2',
  'text-h3',
  'text-body-large',
  'text-body',
  'text-body-small',
  'text-caption'
];

classes.forEach(cls => {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = `Testing ${cls}`;
  el.style.margin = '20px';
  el.style.border = '1px solid #ccc';
  el.style.padding = '10px';
  document.body.appendChild(el);
});
```

### Method 2: Create Test Page
Add this to any page temporarily:
```tsx
<div className="p-8 space-y-8">
  <div className="text-display">DISPLAY TEXT (110px, Bold)</div>
  <div className="text-h1">H1 HEADING (68px, Bold)</div>
  <div className="text-h2">H2 HEADING (42px, SemiBold)</div>
  <div className="text-h3">H3 HEADING (26px, SemiBold)</div>
  <div className="text-body-large">Body Large Text (20px, Regular)</div>
  <div className="text-body">Body Text (16px, Regular)</div>
  <div className="text-body-small">Body Small Text (14px, Regular)</div>
  <div className="text-caption">CAPTION TEXT (12px, SemiBold)</div>
</div>
```

### Method 3: Check Existing Pages
Visit these pages and verify typography:
1. **Dashboard** (`/dashboard`) - Check page title
2. **Calendar** (`/calendar`) - Check calendar header
3. **Trips** (`/trips`) - Check trip list headers
4. **Clients** (`/clients`) - Check client list headers
5. **Typography Reference** (`/typography-reference` or similar) - If exists

---

## 🔍 Visual Checks

### Desktop (1920px+)
- [ ] Display text (110px) is very large and bold
- [ ] H1 (68px) is large and bold
- [ ] H2 (42px) is medium-large
- [ ] H3 (26px) is medium
- [ ] Body text sizes are readable
- [ ] Golden ratio proportions look harmonious

### Tablet (768px - 1024px)
- [ ] Typography scales appropriately
- [ ] Headers are still readable
- [ ] No text overflow

### Mobile (< 768px)
- [ ] Display scales to 68px (from 110px)
- [ ] H1 scales to 42px (from 68px)
- [ ] H2 scales to 26px (from 42px)
- [ ] H3 scales to 20px (from 26px)
- [ ] All text is readable
- [ ] No horizontal scrolling

---

## 🐛 Common Issues to Check

### Issue 1: Fonts Not Loading
**Symptom:** Text shows in system font (Arial, Helvetica)
**Check:**
- Open DevTools → Network tab
- Filter by "Font"
- Check if font files load (status 200)
- Check font file paths are correct

### Issue 2: Wrong Font Weight
**Symptom:** Text looks too light or too bold
**Check:**
- Open DevTools → Elements tab
- Inspect text element
- Check computed `font-weight` value
- Verify it matches expected weight (300, 400, 500, 600, 700)

### Issue 3: Not ALL CAPS
**Symptom:** Headers are not uppercase
**Check:**
- Open DevTools → Elements tab
- Inspect header element
- Check computed `text-transform` value
- Should be `uppercase` for headers

### Issue 4: Wrong Size
**Symptom:** Text size doesn't match expected
**Check:**
- Open DevTools → Elements tab
- Inspect text element
- Check computed `font-size` value
- Compare with expected size

### Issue 5: Legacy Classes Not Working
**Symptom:** Old classes (`.text-mega`, etc.) don't work
**Check:**
- Verify `@apply` directives are working
- Check Tailwind is processing correctly
- May need to rebuild CSS

---

## ✅ Success Criteria

- [ ] All font weights load and display correctly
- [ ] All typography classes work as expected
- [ ] Legacy classes still work (backward compatible)
- [ ] Responsive scaling works on mobile
- [ ] Headers are ALL CAPS
- [ ] Body text is normal case
- [ ] Typography looks harmonious (golden ratio)
- [ ] No console errors
- [ ] No visual regressions

---

## 📝 Test Results Template

```
Date: ___________
Browser: ___________
OS: ___________

Font Loading:
[ ] All weights load
[ ] No errors

Typography Classes:
[ ] .text-display - Size: ___px, Weight: ___, Case: ___
[ ] .text-h1 - Size: ___px, Weight: ___, Case: ___
[ ] .text-h2 - Size: ___px, Weight: ___, Case: ___
[ ] .text-h3 - Size: ___px, Weight: ___, Case: ___
[ ] .text-body-large - Size: ___px, Weight: ___, Case: ___
[ ] .text-body - Size: ___px, Weight: ___, Case: ___
[ ] .text-body-small - Size: ___px, Weight: ___, Case: ___
[ ] .text-caption - Size: ___px, Weight: ___, Case: ___

Legacy Classes:
[ ] .text-mega works
[ ] .text-xl-display works
[ ] .text-brutalist-h1 works
[ ] .text-brutalist-h2 works
[ ] .text-brutalist-body works
[ ] .text-brutalist-small works
[ ] .text-brutalist-caption works

Responsive:
[ ] Desktop looks good
[ ] Mobile looks good
[ ] Tablet looks good

Issues Found:
_________________________________
_________________________________
_________________________________

Overall: ✅ PASS / ❌ FAIL
```

---

## 🚀 Quick Start

1. **Open your browser** to `http://localhost:5173` (or your dev server)
2. **Open DevTools** (F12 or Cmd+Option+I)
3. **Check Console** for any font loading errors
4. **Navigate to a page** with headers (Dashboard, Calendar, etc.)
5. **Inspect headers** to verify:
   - Font family is "Nohemi"
   - Font weight is correct (700 for Bold, 600 for SemiBold)
   - Font size matches expected
   - Text is uppercase for headers
6. **Resize browser** to mobile width (< 768px) and verify responsive scaling
7. **Test legacy classes** if any pages use them

---

**Ready to test!** Start with Method 1 (Console test) for the quickest verification.

