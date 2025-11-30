# Better Console Typography Test

## Quick Test Script (Returns Success Message)

Copy and paste this into your browser console:

```javascript
(function() {
  const classes = [
    { class: 'text-display', label: 'Display (110px, Bold, ALL CAPS)' },
    { class: 'text-h1', label: 'H1 (68px, Bold, ALL CAPS)' },
    { class: 'text-h2', label: 'H2 (42px, SemiBold, ALL CAPS)' },
    { class: 'text-h3', label: 'H3 (26px, SemiBold, ALL CAPS)' },
    { class: 'text-body-large', label: 'Body Large (20px, Regular)' },
    { class: 'text-body', label: 'Body (16px, Regular)' },
    { class: 'text-body-small', label: 'Body Small (14px, Regular)' },
    { class: 'text-caption', label: 'Caption (12px, SemiBold, ALL CAPS)' },
  ];

  const container = document.createElement('div');
  container.style.cssText = 'padding: 20px; background: #f9fafb; border: 2px solid #e5e7eb; margin: 20px; border-radius: 8px; max-width: 800px;';
  container.innerHTML = '<h2 style="margin-bottom: 20px; font-size: 24px; font-weight: bold; color: #1f2937;">Typography Test Results</h2>';

  classes.forEach((item) => {
    const el = document.createElement('div');
    el.className = item.class;
    el.textContent = item.label;
    el.style.cssText = 'margin: 20px 0; padding: 15px; border: 1px solid #d1d5db; border-radius: 4px; background: white;';
    container.appendChild(el);
  });

  document.body.appendChild(container);
  
  return '✅ Typography test complete! Check the page for results.';
})();
```

This will:
- ✅ Return a success message (no more "undefined")
- ✅ Create a styled container with all typography examples
- ✅ Show each class with its label

## Even Better: Visit the Test Page

Instead of console testing, just visit:
**`http://localhost:5173/typography-test`**

This page shows everything in a nice format!

