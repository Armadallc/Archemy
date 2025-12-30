# Contract Analysis Feature - Safety & Rollback Plan

**Date:** 2025-12-21  
**Status:** Active  
**Feature:** Contract Analysis Modal & Components

---

## 🛡️ Current Safety Status

### ✅ Existing Protections

1. **Backup Branch Created:**
   - Branch: `backup/prophet-calculator-fixes-20251220-224552`
   - Commit: `f394b3aa` - "fix(prophet): Resolve React Fast Refresh preamble error and nested button warning"
   - **Status:** Prophet calculator is working correctly at this point

2. **Git State:**
   - Current branch: `feature/unified-spa-layout`
   - Latest commit: `f394b3aa` (working state)
   - All fixes committed and saved

3. **Lessons Learned:**
   - ✅ No default exports in components (prevents React Fast Refresh errors)
   - ✅ Proper JSX structure (parentheses around return)
   - ✅ Named exports only
   - ✅ EditableField component is fixed and working

---

## 🔄 Rollback Strategies

### Strategy 1: Git Checkpoint System

#### Before Starting Implementation

```bash
# 1. Create a checkpoint branch
git checkout -b checkpoint/before-contract-analysis-$(date +%Y%m%d-%H%M%S)

# 2. Commit current working state
git add .
git commit -m "checkpoint: Prophet calculator working state before Contract Analysis"

# 3. Return to feature branch
git checkout feature/unified-spa-layout

# 4. Create feature branch for Contract Analysis
git checkout -b feature/contract-analysis
```

#### Quick Rollback Commands

```bash
# Option A: Revert to checkpoint (keeps history)
git checkout checkpoint/before-contract-analysis-*

# Option B: Reset to checkpoint (discards changes)
git reset --hard checkpoint/before-contract-analysis-*

# Option C: Revert to backup branch
git checkout backup/prophet-calculator-fixes-20251220-224552

# Option D: Revert specific commit
git revert <commit-hash>
```

### Strategy 2: Feature Flag System

#### Implementation

Add a feature flag to control Contract Analysis visibility:

```typescript
// In ContractAnalysisModal.tsx or FacilityCard.tsx
const { isEnabled: isContractAnalysisEnabled } = useFeatureFlag('contract_analysis');

// Only show "Analyze Contract" button if flag is enabled
{isContractAnalysisEnabled && (
  <Button onClick={handleAnalyze}>
    Analyze Contract
  </Button>
)}
```

#### Rollback via Feature Flag

```bash
# Disable feature flag in database (instant rollback)
# Via Settings UI or direct SQL:
UPDATE feature_flags 
SET is_enabled = false 
WHERE flag_name = 'contract_analysis';
```

**Benefits:**
- ✅ Instant rollback without code changes
- ✅ No need to revert commits
- ✅ Can re-enable when fixed
- ✅ Works in production

### Strategy 3: Component Isolation

#### Implementation Pattern

Keep Contract Analysis components isolated:

```typescript
// In TreatmentFacilities/index.tsx
import { ContractAnalysisModal } from './ContractAnalysis/ContractAnalysisModal';

// Wrap in error boundary
<ErrorBoundary fallback={<div>Contract Analysis unavailable</div>}>
  {showContractAnalysis && (
    <ContractAnalysisModal
      facility={selectedFacility}
      onClose={() => setShowContractAnalysis(false)}
    />
  )}
</ErrorBoundary>
```

**Benefits:**
- ✅ Errors in Contract Analysis don't break Prophet calculator
- ✅ Can disable via conditional rendering
- ✅ Easy to remove if needed

### Strategy 4: Incremental Implementation

#### Phase-by-Phase Checkpoints

1. **Phase 1: Types Only** ✅ Safe
   - Add interfaces to `types.ts`
   - **Checkpoint:** Commit after types
   - **Rollback:** Revert types commit if issues

2. **Phase 2: Store Functions** ✅ Safe
   - Add calculation functions
   - **Checkpoint:** Commit after store
   - **Rollback:** Revert store commit if issues

3. **Phase 3: Modal Shell** ✅ Safe
   - Create modal with tabs (no logic)
   - **Checkpoint:** Commit after modal shell
   - **Rollback:** Revert modal commit if issues

4. **Phase 4: Tab Components** ⚠️ More Complex
   - Implement each tab separately
   - **Checkpoint:** After each tab
   - **Rollback:** Revert specific tab if issues

---

## 🚨 Emergency Rollback Procedures

### Scenario 1: React Fast Refresh Error Returns

**Symptoms:**
- `@vitejs/plugin-react can't detect preamble` error
- Prophet calculator page won't load

**Immediate Actions:**

1. **Stop Development Server:**
   ```bash
   # Kill Vite dev server
   pkill -f vite
   ```

2. **Clear All Caches:**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite .vite dist client/dist
   
   # Clear browser cache (manual)
   # Chrome: DevTools > Application > Clear storage
   ```

3. **Check for Default Exports:**
   ```bash
   # Find any default exports in new files
   grep -r "export default" client/src/components/prophet/TreatmentFacilities/ContractAnalysis/
   ```

4. **Revert to Checkpoint:**
   ```bash
   git checkout checkpoint/before-contract-analysis-*
   # OR
   git reset --hard backup/prophet-calculator-fixes-20251220-224552
   ```

5. **Restart Dev Server:**
   ```bash
   npx vite
   ```

### Scenario 2: Prophet Calculator Breaks

**Symptoms:**
- Prophet calculator page errors
- Existing scenarios don't load
- Cost structure broken

**Immediate Actions:**

1. **Disable Feature Flag:**
   ```bash
   # Via SQL or Settings UI
   UPDATE feature_flags SET is_enabled = false WHERE flag_name = 'contract_analysis';
   ```

2. **Remove Contract Analysis Components:**
   ```bash
   # Comment out imports in TreatmentFacilities/index.tsx
   # Comment out button in FacilityCard.tsx
   ```

3. **Revert Recent Commits:**
   ```bash
   # See recent commits
   git log --oneline -5
   
   # Revert specific commit
   git revert <commit-hash>
   ```

### Scenario 3: Type Errors or Build Failures

**Symptoms:**
- TypeScript compilation errors
- Build fails
- Type mismatches

**Immediate Actions:**

1. **Check Type Definitions:**
   ```bash
   # Run type check
   npx tsc --noEmit
   ```

2. **Revert Types Commit:**
   ```bash
   # If types are the issue
   git revert <types-commit-hash>
   ```

3. **Gradual Type Addition:**
   - Add types one interface at a time
   - Test after each addition

---

## ✅ Pre-Implementation Checklist

Before starting Contract Analysis implementation:

- [ ] **Create checkpoint branch:**
  ```bash
  git checkout -b checkpoint/before-contract-analysis-$(date +%Y%m%d-%H%M%S)
  git commit -m "checkpoint: Before Contract Analysis implementation"
  git checkout feature/unified-spa-layout
  ```

- [ ] **Verify Prophet calculator works:**
  - [ ] Navigate to `/prophet`
  - [ ] All tabs load correctly
  - [ ] Scenarios work
  - [ ] Facilities work
  - [ ] No console errors

- [ ] **Create feature branch:**
  ```bash
  git checkout -b feature/contract-analysis
  ```

- [ ] **Document current state:**
  - [ ] Note working commit hash
  - [ ] List files that will be modified
  - [ ] Note dependencies

- [ ] **Set up feature flag (optional):**
  ```sql
  INSERT INTO feature_flags (id, flag_name, is_enabled, description)
  VALUES (gen_random_uuid(), 'contract_analysis', false, 'Contract Analysis feature for Prophet calculator');
  ```

---

## 🔍 Testing Checkpoints

### After Each Phase

1. **Types Phase:**
   - [ ] `npx tsc --noEmit` passes
   - [ ] No build errors
   - [ ] Prophet calculator still works

2. **Store Phase:**
   - [ ] Store functions compile
   - [ ] No runtime errors
   - [ ] Prophet calculator still works

3. **Modal Shell Phase:**
   - [ ] Modal opens (even if empty)
   - [ ] Modal closes
   - [ ] No console errors
   - [ ] Prophet calculator still works

4. **Each Tab Phase:**
   - [ ] Tab renders
   - [ ] Inputs work
   - [ ] No console errors
   - [ ] Prophet calculator still works

### Final Testing

- [ ] All 4 tabs work
- [ ] Calculations are accurate
- [ ] Analysis saves correctly
- [ ] No React Fast Refresh errors
- [ ] No nested button warnings
- [ ] Works in normal window
- [ ] Works in incognito window
- [ ] Prophet calculator unaffected

---

## 📋 Rollback Decision Tree

```
Problem Detected?
│
├─ React Fast Refresh Error?
│  ├─ Yes → Check for default exports
│  │        Clear caches
│  │        Revert to checkpoint
│  │
│  └─ No → Continue
│
├─ Prophet Calculator Broken?
│  ├─ Yes → Disable feature flag
│  │        Comment out components
│  │        Revert commits
│  │
│  └─ No → Continue
│
├─ Type Errors?
│  ├─ Yes → Revert types commit
│  │        Add types incrementally
│  │
│  └─ No → Continue
│
└─ Build Fails?
   ├─ Yes → Check TypeScript errors
   │        Revert problematic commit
   │
   └─ No → Continue
```

---

## 🎯 Safe Implementation Order

### Recommended Approach

1. **Start with Feature Flag:**
   - Create flag (disabled by default)
   - Wrap feature in flag check
   - Can disable instantly if issues

2. **Incremental Commits:**
   - Commit after each phase
   - Test after each commit
   - Easy to revert specific phase

3. **Isolated Components:**
   - Keep in separate directory
   - Use error boundaries
   - Don't modify existing components unnecessarily

4. **Test Frequently:**
   - After each file change
   - After each commit
   - In both normal and incognito windows

---

## 📝 Rollback Commands Reference

### Quick Reference

```bash
# Create checkpoint
git checkout -b checkpoint/before-contract-analysis-$(date +%Y%m%d-%H%M%S)
git commit -m "checkpoint: Before Contract Analysis"

# Return to feature branch
git checkout feature/unified-spa-layout

# Create feature branch
git checkout -b feature/contract-analysis

# Revert to checkpoint (keeps history)
git checkout checkpoint/before-contract-analysis-*

# Reset to checkpoint (discards changes)
git reset --hard checkpoint/before-contract-analysis-*

# Revert to backup branch
git checkout backup/prophet-calculator-fixes-20251220-224552

# Revert specific commit
git revert <commit-hash>

# See recent commits
git log --oneline -10

# Clear Vite cache
rm -rf node_modules/.vite .vite dist client/dist

# Check for default exports
grep -r "export default" client/src/components/prophet/TreatmentFacilities/ContractAnalysis/
```

---

## 🚀 Post-Implementation Safety

### After Feature is Complete

1. **Create Final Checkpoint:**
   ```bash
   git checkout -b checkpoint/contract-analysis-complete-$(date +%Y%m%d-%H%M%S)
   git commit -m "checkpoint: Contract Analysis feature complete"
   ```

2. **Enable Feature Flag:**
   ```sql
   UPDATE feature_flags 
   SET is_enabled = true 
   WHERE flag_name = 'contract_analysis';
   ```

3. **Monitor for Issues:**
   - Watch for errors in production
   - Monitor user feedback
   - Keep feature flag ready for instant disable

4. **Document:**
   - Update implementation plan
   - Note any issues encountered
   - Document rollback procedures used

---

## 📞 Emergency Contacts

### If Critical Issues Occur

1. **Immediate:** Disable feature flag
2. **Short-term:** Revert to checkpoint
3. **Long-term:** Review and fix issues

### Recovery Priority

1. **Priority 1:** Restore Prophet calculator functionality
2. **Priority 2:** Fix Contract Analysis issues
3. **Priority 3:** Re-implement with fixes

---

## ✅ Success Criteria

The implementation is safe when:

- [ ] Prophet calculator works before starting
- [ ] Checkpoint branch created
- [ ] Feature flag created (disabled)
- [ ] Incremental commits planned
- [ ] Rollback procedures understood
- [ ] Testing checkpoints defined

---

**Last Updated:** 2025-12-21  
**Status:** Ready for Implementation  
**Next Step:** Create checkpoint branch and begin Phase 1



