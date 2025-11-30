# Console Typography Test Script

**Better version with feedback!**

## Why you see "undefined"

The `undefined` you see is just the return value of `forEach` - it doesn't mean the code failed! The elements are still being created and added to the page.

## Better Test Script (with feedback)

Copy and paste this into your browser console:

```javascript
// Better typography test with feedback
const classes = [
  { class: 'text-display', label: 'Display (110px, Bold, ALL CAPS)' },
  { class: 'text-h1', label: 'H1 (68px, Bold, ALL CAPS)' },
  { class: 'text-h2', label: 'H2 (42px, SemiBold, ALL CAPS)' },
  { class: 'text-h3', label: 'H3 (26px, SemiBold, ALL CAPS)' },
  { class: 'text-body-large', label: 'Body Large (20px, Regular, Normal)' },
  { class: 'text-body', label: 'Body (16px, Regular, Normal)' },
  { class: 'text-body-small', label: 'Body Small (14px, Regular, Normal)' },
  { class: 'text-caption', label: 'Caption (12px, SemiBold, ALL CAPS)' },
];

// Create container
const container = document.createElement('div');
container.style.cssText = 'padding: 20px; background: #f9fafb; border: 2px solid #e5e7eb; margin: 20px; border-radius: 8px;';
container.innerHTML = '<h2 style="margin-bottom: 20px; font-size: 24px; font-weight: bold;">Typography Test Results</h2>';

// Create elements
const results = [];
classes.forEach((item) => {
  const el = document.createElement('div');
  el.className = item.class;
  el.textContent = item.label;
  el.style.cssText = 'margin: 20px 0; padding: 15px; border: 1px solid #d1d5db; border-radius: 4px; background: white;';
  
  container.appendChild(el);
  
  // Check computed styles
  const computed = window.getComputedStyle(el);
  results.push({
    class: item.class,
    fontSize: computed.fontSize,
    fontWeight: computed.fontWeight,
    textTransform: computed.textTransform,
    fontFamily: computed.fontFamily,
  });
});

document.body.appendChild(container);

// Log results
console.log('✅ Typography test complete!');
console.log('📊 Computed styles:', results);
console.log('👀 Check the page for visual results');

// Return results for inspection
results;
```

## Quick One-Liner (Simpler)

If you just want to see the elements without feedback:

```javascript
['text-display','text-h1','text-h2','text-h3','text-body-large','text-body','text-body-small','text-caption'].forEach(c=>{const e=document.createElement('div');e.className=c;e.textContent=`Testing ${c}`;e.style.cssText='margin:20px;border:1px solid #ccc;padding:10px';document.body.appendChild(e)});console.log('✅ Test elements created!');
```

## Best Option: Use the Test Page

Instead of console testing, visit:
**`http://localhost:5173/typography-test`**

This page shows:
- ✅ All typography classes with labels
- ✅ Legacy class compatibility
- ✅ Font weight tests (300, 400, 500, 600, 700)
- ✅ Responsive behavior notes
- ✅ Visual examples

## What to Check

1. **Font Family**: Should be "Nohemi" (not Arial/Helvetica)
2. **Font Sizes**: Match expected values (110px, 68px, 42px, etc.)
3. **Font Weights**: 700 for Bold, 600 for SemiBold, 400 for Regular
4. **Text Transform**: "uppercase" for headers, "none" for body
5. **Visual**: Headers should be ALL CAPS, body text should be normal case

## Troubleshooting

### If fonts don't load:
- Check Network tab → Filter by "Font"
- Verify font files exist in `/public/fonts/`
- Check console for 404 errors

### If classes don't work:
- Check if CSS is loaded (Elements tab → Styles panel)
- Verify Tailwind is processing `@apply` directives
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### If sizes are wrong:
- Check computed styles in DevTools
- Verify responsive breakpoints (< 768px)
- Check for CSS conflicts

