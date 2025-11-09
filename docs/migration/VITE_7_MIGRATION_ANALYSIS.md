# Vite 7 Migration Analysis & Requirements

**Date:** 2025-01-27  
**Current Vite Version:** 5.4.14  
**Target Version:** 7.2.2 (via `npm audit fix --force`)  
**Node.js Version:** v22.18.0 ✅ (Requires 20.19+ or 22.12+)

---

## ✅ Pre-Migration Checklist

### System Requirements
- [x] **Node.js Version:** v22.18.0 (meets requirement of 20.19+ or 22.12+)
- [x] **TypeScript Config:** Already compatible (ES2022, ESNext, bundler resolution)
- [x] **No Sass Files:** No `.scss` or `.sass` files found (legacy Sass API not an issue)
- [x] **No splitVendorChunkPlugin:** Not used in current config

---

## 🔍 Current Configuration Analysis

### Current Dependencies
```json
{
  "vite": "^5.4.14",
  "@vitejs/plugin-react": "^4.3.2",  // Currently: 4.7.0 installed
  "drizzle-kit": "^0.30.4",          // Currently: 0.30.6 installed
  "esbuild": "^0.25.0"
}
```

### Current Vite Config (`vite.config.ts`)
- ✅ Uses `defineConfig` (compatible)
- ✅ Uses `@vitejs/plugin-react` (needs version check)
- ✅ Uses `@replit/vite-plugin-cartographer` (conditional, needs compatibility check)
- ✅ Uses `@replit/vite-plugin-runtime-error-modal` (needs compatibility check)
- ✅ Uses `import.meta.dirname` (ESM - compatible)
- ✅ Uses path aliases (compatible)
- ✅ Uses `server.fs.strict` (compatible)

---

## 📋 Breaking Changes in Vite 7

### 1. **Node.js Version Requirement**
- **Requirement:** Node.js 20.19+ or 22.12+
- **Status:** ✅ **PASS** - Current: v22.18.0

### 2. **ESM-Only Distribution**
- **Change:** Vite 7 is ESM-only
- **Impact:** Your project already uses `"type": "module"` in `package.json` ✅
- **Status:** ✅ **COMPATIBLE**

### 3. **Default Browser Target Change**
- **Old:** `'modules'`
- **New:** `'baseline-widely-available'`
- **Minimum Browsers:**
  - Chrome 107+
  - Edge 107+
  - Firefox 104+
  - Safari 16+
- **Impact:** May affect older browser support
- **Action Required:** Test in target browsers
- **Status:** ⚠️ **REVIEW NEEDED** - Check if you need to support older browsers

### 4. **Legacy Sass API Removed**
- **Status:** ✅ **NOT APPLICABLE** - No Sass files found

### 5. **splitVendorChunkPlugin Removed**
- **Status:** ✅ **NOT APPLICABLE** - Not used in config

### 6. **Plugin Compatibility**
- **@vitejs/plugin-react:** Version 4.7.0 installed, needs Vite 7 compatible version
- **@replit/vite-plugin-cartographer:** Unknown compatibility (conditional usage)
- **@replit/vite-plugin-runtime-error-modal:** Unknown compatibility

---

## 🔧 Required Updates

### 1. Core Dependencies
```bash
# Will be updated by npm audit fix --force:
vite: 5.4.14 → 7.2.2
drizzle-kit: 0.30.4 → 0.31.6
esbuild: 0.25.0 → (updated via vite)
```

### 2. Plugin Updates Needed
```bash
# Verified compatible:
@vitejs/plugin-react: 4.3.2 → 5.1.0 (✅ Supports Vite 7.0.0+)
@replit/vite-plugin-cartographer: 0.2.7 → (⚠️ Unknown, but conditional usage)
@replit/vite-plugin-runtime-error-modal: 0.0.3 → (⚠️ Unknown, but conditional usage)
```

### 3. TypeScript Config
- ✅ Already compatible (ES2022, ESNext, bundler resolution)
- ✅ Uses `"moduleResolution": "bundler"` (correct for Vite 7)

---

## ⚠️ Potential Issues & Risks

### High Risk
1. **@replit Plugins Compatibility**
   - Unknown if `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-runtime-error-modal` support Vite 7
   - **Mitigation:** These are conditional (only in Replit environment), may not affect local dev

### Medium Risk
1. **Browser Compatibility**
   - New default targets may break support for older browsers
   - **Mitigation:** Can override `build.target` in config if needed

2. **Plugin Version Mismatches**
   - `@vitejs/plugin-react` may need explicit update
   - **Mitigation:** Update after Vite upgrade

### Low Risk
1. **Build Output Changes**
   - Vite 7 may produce slightly different build outputs
   - **Mitigation:** Test build process thoroughly

---

## 📝 Migration Steps

### Step 1: Pre-Migration Backup
```bash
# Commit current state
git add package.json package-lock.json
git commit -m "chore: backup before Vite 7 migration"
```

### Step 2: Run Force Fix
```bash
npm audit fix --force
```

### Step 3: Update Plugins (if needed)
```bash
# Update to Vite 7 compatible version (verified compatible)
npm install @vitejs/plugin-react@latest --save-dev

# Replit plugins (conditional - only used in Replit environment)
# These may not need updates if not used locally
# Test first, then update if needed:
npm install @replit/vite-plugin-cartographer@latest --save-dev
npm install @replit/vite-plugin-runtime-error-modal@latest --save-dev
```

### Step 4: Test Build
```bash
# Test production build
npm run build

# Test dev server
npm run dev
```

### Step 5: Verify Config
- Check if `vite.config.ts` needs any adjustments
- Verify path aliases still work
- Test HMR (Hot Module Replacement)

### Step 6: Browser Testing
- Test in Chrome 107+, Edge 107+, Firefox 104+, Safari 16+
- If older browser support needed, add to `vite.config.ts`:
  ```typescript
  build: {
    target: 'modules', // or specific targets
    // ... rest of config
  }
  ```

### Step 7: Rollback Plan (if issues)
```bash
# If migration fails:
git checkout package.json package-lock.json
npm install
```

---

## 🎯 Recommended Approach

### Option A: Safe Migration (Recommended)
1. ✅ Create backup commit
2. ✅ Run `npm audit fix --force`
3. ✅ Immediately test build and dev server
4. ✅ Update plugins if needed
5. ✅ Test thoroughly
6. ✅ Rollback if critical issues found

### Option B: Gradual Migration
1. Manually update `vite` to `^7.0.0` first
2. Test compatibility
3. Update plugins one by one
4. Run `npm audit fix` for remaining issues

---

## 📊 Compatibility Matrix

| Component | Current | After Fix | Status |
|-----------|---------|-----------|--------|
| Node.js | v22.18.0 | v22.18.0 | ✅ Compatible |
| Vite | 5.4.14 | 7.2.2 | ⚠️ Major upgrade |
| @vitejs/plugin-react | 4.7.0 | 5.1.0 | ✅ Compatible (supports Vite 7) |
| drizzle-kit | 0.30.6 | 0.31.6 | ⚠️ Minor upgrade |
| esbuild | 0.25.0 | ? | ✅ Auto-updated |
| @replit plugins | 0.2.7/0.0.3 | ? | ⚠️ Unknown |

---

## 🔗 Resources

- [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7)
- [Vite Migration Guide](https://vite.dev/guide/migration)
- [@vitejs/plugin-react Releases](https://github.com/vitejs/vite-plugin-react/releases)

---

## ✅ Decision Point

**Recommendation:** Proceed with Option A (Safe Migration) because:
1. ✅ Node.js version is compatible
2. ✅ Project structure is ESM-ready
3. ✅ No legacy Sass usage
4. ✅ Git backup available for quick rollback
5. ✅ Replit plugins are conditional (may not affect local dev)

**Risk Level:** Medium (due to plugin unknowns, but reversible)

**Estimated Time:** 15-30 minutes (including testing)

