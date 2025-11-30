# Dashboard Height Measurements

Run this in your browser console while on the dashboard page (`/`):

```javascript
// Measure Row 2 - Fleet Status Widget (2nd element)
const row2El = document.querySelector('#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(2)');
if (row2El) {
  const rect2 = row2El.getBoundingClientRect();
  console.log('📏 ROW 2 - Fleet Status Widget:');
  console.log(`   Height: ${rect2.height.toFixed(0)}px`);
  console.log(`   Width: ${rect2.width.toFixed(0)}px`);
} else {
  console.log('❌ Row 2 element not found');
}

// Measure Row 3 - Revenue Widget (3rd element)
const row3El = document.querySelector('#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(3)');
if (row3El) {
  const rect3 = row3El.getBoundingClientRect();
  console.log('📏 ROW 3 - Revenue Widget:');
  console.log(`   Height: ${rect3.height.toFixed(0)}px`);
  console.log(`   Width: ${rect3.width.toFixed(0)}px`);
} else {
  console.log('❌ Row 3 element not found');
}

// Also measure Live Operations for reference
const row1El = document.querySelector('#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(1)');
if (row1El) {
  const rect1 = row1El.getBoundingClientRect();
  console.log('📏 ROW 1 - Live Operations (for reference):');
  console.log(`   Height: ${rect1.height.toFixed(0)}px`);
  console.log(`   Width: ${rect1.width.toFixed(0)}px`);
}
```

Once you have the heights, share them and I'll update the scratch wireframes to match exactly!

