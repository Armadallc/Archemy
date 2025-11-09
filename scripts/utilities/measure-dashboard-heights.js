// Run this in browser console on the dashboard page to measure element heights

// Measure Row 2, Element 2 (Fleet Status)
const element1 = document.querySelector('#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(2)');
if (element1) {
  const rect1 = element1.getBoundingClientRect();
  console.log('📏 Row 2, Element 2 (Fleet Status):');
  console.log(`   Height: ${rect1.height.toFixed(0)}px`);
  console.log(`   Width: ${rect1.width.toFixed(0)}px`);
  console.log(`   Top: ${rect1.top.toFixed(0)}px`);
  console.log(`   Left: ${rect1.left.toFixed(0)}px`);
} else {
  console.log('❌ Element 1 not found');
}

// Measure Row 3, Element 3 (Revenue Widget)
const element2 = document.querySelector('#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(3)');
if (element2) {
  const rect2 = element2.getBoundingClientRect();
  console.log('📏 Row 3, Element 3 (Revenue Widget):');
  console.log(`   Height: ${rect2.height.toFixed(0)}px`);
  console.log(`   Width: ${rect2.width.toFixed(0)}px`);
  console.log(`   Top: ${rect2.top.toFixed(0)}px`);
  console.log(`   Left: ${rect2.left.toFixed(0)}px`);
} else {
  console.log('❌ Element 2 not found');
}

// Also measure Live Operations for comparison
const liveOps = document.querySelector('#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(1)');
if (liveOps) {
  const rect3 = liveOps.getBoundingClientRect();
  console.log('📏 Row 1, Element 1 (Live Operations):');
  console.log(`   Height: ${rect3.height.toFixed(0)}px`);
  console.log(`   Width: ${rect3.width.toFixed(0)}px`);
}

