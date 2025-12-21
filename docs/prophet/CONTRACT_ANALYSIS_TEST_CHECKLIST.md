# Contract Analysis - Quick Test Checklist

**Feature:** Contract Analysis Modal  
**Location:** Prophet Calculator → Treatment Facilities  
**Date:** 2025-12-21

---

## 🧪 Quick Test List

### 1. Feature Flag Tests
- [ ] Feature flag disabled → "Analyze Contract" button hidden
- [ ] Feature flag enabled → "Analyze Contract" button visible
- [ ] Toggle flag off → button disappears immediately
- [ ] Toggle flag on → button appears immediately

### 2. Modal Opening/Closing
- [ ] Click "Analyze Contract" → modal opens
- [ ] Click X button → modal closes
- [ ] Click Cancel → modal closes
- [ ] Click outside modal → modal closes (if configured)
- [ ] Modal shows correct facility name in title

### 3. Tab Navigation
- [ ] All 4 tabs render: Overhead, Terms, Comparison, Summary
- [ ] Click tab → content switches correctly
- [ ] Tab state persists when switching tabs
- [ ] Active tab highlighted correctly

### 4. Facility Overhead Tab
- [ ] Personnel costs inputs accept numbers
- [ ] Transportation costs inputs accept numbers
- [ ] EditableField components work (click to edit)
- [ ] Values save when switching tabs
- [ ] All 9 cost categories present (even if not all shown yet)

### 5. Contract Terms Tab
- [ ] Billing method dropdown works
- [ ] Monthly Fee method → shows monthly fee input
- [ ] Per Trip method → shows per trip rate input
- [ ] Hybrid method → shows base fee + included trips + additional rate
- [ ] Contract term input accepts numbers
- [ ] Values save correctly

### 6. A/B Comparison Tab
- [ ] Scenario dropdown populates with scenarios
- [ ] Select scenario → comparison appears
- [ ] Provider side shows: Revenue, Costs, Margin, Margin %
- [ ] Facility side shows: Current Costs, Proposed Costs, Savings, Savings %
- [ ] Mutual Benefit Score displays (0-100)
- [ ] Recommendation text displays
- [ ] Benefit levels show correctly (high/medium/low)
- [ ] Pros/Cons generate correctly

### 7. Summary Tab
- [ ] Total Monthly Overhead calculates correctly
- [ ] Transportation Burden calculates correctly
- [ ] Transportation Burden % calculates correctly
- [ ] Contract terms display correctly
- [ ] Comparison count shows if comparisons exist

### 8. Store Functions (Manual Calculation Tests)
- [ ] `calculateTotalFacilityOverhead()` → sums all 9 categories
- [ ] `calculateTransportationBurden()` → sums transportation category only
- [ ] `calculateTransportationBurdenPercentage()` → (transportation / total) × 100
- [ ] `calculateProviderRevenue()` → monthly_fee method returns monthlyFee
- [ ] `calculateProviderRevenue()` → per_trip method returns (rate × trips)
- [ ] `calculateProviderRevenue()` → hybrid method returns (base + additional)
- [ ] `calculateProviderMargin()` → (revenue - costs) and percentage
- [ ] `calculateFacilitySavings()` → (current - proposed) and percentage
- [ ] `calculateMutualBenefitScore()` → returns 0-100 score
- [ ] `generateProsCons()` → generates appropriate pros/cons
- [ ] `calculateContractComparison()` → returns full comparison object

### 9. Data Persistence
- [ ] Click "Save Analysis" → data saves to facility
- [ ] Close modal → reopen → data persists
- [ ] Refresh page → analysis data still there
- [ ] Analysis saves to localStorage (via Zustand persist)
- [ ] Analysis syncs to Supabase (if sync enabled)

### 10. Integration Tests
- [ ] Prophet calculator still works after feature added
- [ ] Other tabs (Costs, Codes, Scenarios) still work
- [ ] No console errors when opening modal
- [ ] No console errors when switching tabs
- [ ] No console errors when saving
- [ ] No React Fast Refresh errors
- [ ] No nested button warnings

### 11. Edge Cases
- [ ] Empty facility overhead costs → calculations handle 0 values
- [ ] No scenarios exist → comparison tab handles gracefully
- [ ] Negative values in inputs → handled correctly
- [ ] Very large numbers → display correctly
- [ ] Multiple facilities → each has independent analysis
- [ ] Delete facility → analysis removed

### 12. UI/UX Tests
- [ ] Modal is responsive (mobile/tablet/desktop)
- [ ] Tabs are accessible (keyboard navigation)
- [ ] Inputs are accessible (screen readers)
- [ ] Loading states (if any) display correctly
- [ ] Error states (if any) display correctly
- [ ] Styling matches design system

---

## 🚨 Critical Tests (Must Pass)

These are the most important tests to verify:

1. ✅ **Feature flag works** - Can enable/disable instantly
2. ✅ **Modal opens/closes** - Basic functionality works
3. ✅ **Calculations are accurate** - Provider revenue, margin, savings
4. ✅ **Data persists** - Analysis saves and loads correctly
5. ✅ **Prophet calculator unaffected** - Existing functionality works

---

## 🐛 Common Issues to Check

- **Modal doesn't open:** Check feature flag is enabled
- **Calculations wrong:** Check store functions are called correctly
- **Data doesn't save:** Check `updateFacilityContractAnalysis` is called
- **Tabs don't switch:** Check Tabs component from Radix UI
- **Button doesn't show:** Check feature flag and facility exists

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Feature Flag: [ ] Enabled [ ] Disabled
Modal Opens: [ ] Yes [ ] No
Tabs Work: [ ] Yes [ ] No
Calculations: [ ] Accurate [ ] Issues: ___________
Data Persists: [ ] Yes [ ] No
Prophet Works: [ ] Yes [ ] No

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

**Quick Test Command:**
```bash
# Enable feature flag first, then:
# 1. Open /prophet
# 2. Go to Treatment Facilities tab
# 3. Click "Analyze Contract" on any facility
# 4. Test each tab
# 5. Save and verify persistence
```
