# Bundle Optimization Plan

**Date:** 2025-01-27  
**Current Bundle Size:** 2,833.23 kB (571.60 kB gzipped)  
**Target:** < 1,500 kB (300 kB gzipped)  
**Strategy:** Code splitting + Lazy loading

---

## 📊 Current Analysis

### Bundle Composition
- **Main Bundle:** 2,833.23 kB (571.60 kB gzipped)
- **CSS:** 121.47 kB (24.91 kB gzipped)
- **Modules:** 2,306 modules transformed

### Issues Identified
1. All pages imported statically in `main-layout.tsx`
2. No vendor chunk separation
3. Large dependencies bundled together
4. No route-based code splitting

---

## 🎯 Optimization Strategy

### 1. Manual Chunking (Vite Config)
- **vendor:** React, React-DOM, React Query
- **ui:** UI component library (Radix, Lucide)
- **utils:** Utility libraries
- **supabase:** Supabase client

### 2. Route-Based Lazy Loading
- Convert all page imports to `React.lazy()`
- Split by route/feature
- Load pages on-demand

### 3. Component Lazy Loading
- Heavy components (dashboards, calendars)
- Large third-party components

---

## 📋 Implementation Steps

1. ✅ Update `vite.config.ts` with manual chunking
2. ✅ Convert page imports to lazy loading in `main-layout.tsx`
3. ✅ Add Suspense boundaries
4. ✅ Test build output
5. ✅ Measure improvements

---

## 🎯 Expected Results

- **Initial Load:** ~500-800 kB (main bundle)
- **Route Chunks:** 100-300 kB each (loaded on-demand)
- **Vendor Chunks:** Separated for better caching
- **Total Improvement:** 50-70% reduction in initial bundle

---

**Starting optimization...**

