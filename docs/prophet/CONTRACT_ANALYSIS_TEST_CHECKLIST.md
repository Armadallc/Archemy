# Contract Analysis - Quick Test Checklist

**Feature:** Contract Analysis Modal  
**Location:** Prophet Calculator → Treatment Facilities  
**Date:** 2025-12-21

---

# Contract Analysis - Quick Test Checklist

**Feature:** Contract Analysis Modal  
**Location:** Prophet Calculator → Treatment Facilities  
**Date:** 2025-12-21

---

## 🧪 Quick Test List

### 1. Feature Flag Tests
- [x] - [ ] Feature flag disabled → "Analyze Contract" button hidden
- [x] - [ ] Feature flag enabled → "Analyze Contract" button visible
- [x] - [ ] Toggle flag off → button disappears immediately
- [x] - [ ] Toggle flag on → button appears immediately

### 2. Modal Opening/Closing - 
	**I want to apply the same bokeh blur effect to the basckground when this modal opens. Apply the ease-in/ease-out settings we applied to other popovers. It should be a glabal setting. 
- [x] - [ ] Click "Analyze Contract" → modal opens
- [x] - [ ] Click X button → modal closes
- [x] - [ ] Click Cancel → modal closes
- [x] - [ ] Click outside modal → modal closes (if configured)
- [x] - [ ] Modal shows correct facility name in title

### 3. Tab Navigation
- [x] - [ ] All 4 tabs render: Overhead, Terms, Comparison, Summary
- [x] - [ ] Click tab → content switches correctly
- [x] - [ ] Tab state persists when switching tabs
- [ ] - [ ] Active tab highlighted correctly - does not highlight

### 4. Facility Overhead Tab
- [x] - [ ] Personnel costs inputs accept numbers
- [x] - [ ] Transportation costs inputs accept numbers
- [x] - [ ] EditableField components work (click to edit)
- [x] - [ ] Values save when switching tabs
- [x] - [ ] All 9 cost categories present (even if not all shown yet)

### 5. Contract Terms Tab
- [x] - [ ] Billing method dropdown works
- [x] - [ ] Monthly Fee method → shows monthly fee input
- [x] - [ ] Per Trip method → shows per trip rate input
- [x] - [ ] Hybrid method → shows base fee + included trips + additional rate
- [x] - [ ] Contract term input accepts numbers
- [x] - [ ] Values save correctly

### 6. A/B Comparison Tab
- [x] - [ ] Scenario dropdown populates with scenarios
- [x] - [ ] Select scenario → comparison appears
- [x] - [ ] Provider side shows: Revenue, Costs, Margin, Margin %
- [x] - [ ] Facility side shows: Current Costs, Proposed Costs, Savings, Savings %
- [x] - [ ] Mutual Benefit Score displays (0-100)
- [x] - [ ] Recommendation text displays
- [x] - [ ] Benefit levels show correctly (high/medium/low)
- [ ] - [ ] Pros/Cons generate correctly - I dont see anything explicitly called Pros or Cons

### 7. Summary Tab
- [x] - [ ] Total Monthly Overhead calculates correctly
- [x] - [ ] Transportation Burden calculates correctly
- [x] - [ ] Transportation Burden % calculates correctly
- [x] - [ ] Contract terms display correctly
- [x] - [ ] Comparison count shows if comparisons exist

### 8. Store Functions (Manual Calculation Tests) - we can test all of these when the rest of the additional cost categories are implemented
- [ ] - [ ] `calculateTotalFacilityOverhead()` → sums all 9 categories
- [ ] - [ ] `calculateTransportationBurden()` → sums transportation category only
- [ ] - [ ] `calculateTransportationBurdenPercentage()` → (transportation / total) × 100
- [ ] - [ ] `calculateProviderRevenue()` → monthly_fee method returns monthlyFee
- [ ] - [ ] `calculateProviderRevenue()` → per_trip method returns (rate × trips)
- [ ] - [ ] `calculateProviderRevenue()` → hybrid method returns (base + additional)
- [ ] - [ ] `calculateProviderMargin()` → (revenue - costs) and percentage
- [ ] - [ ] `calculateFacilitySavings()` → (current - proposed) and percentage
- [ ] - [ ] `calculateMutualBenefitScore()` → returns 0-100 score
- [ ] - [ ] `generateProsCons()` → generates appropriate pros/cons
- [ ] - [ ] `calculateContractComparison()` → returns full comparison object

### 9. Data Persistence
    - [ ] - [ ] Click "Save Analysis" → data saves to facility - It appears to save, but please clarify what you mean by save to facility. Save to facilty how? 
- [x] - [ ] Close modal → reopen → data persists
- [x] - [ ] Refresh page → analysis data still there
- [x] - [ ] Analysis saves to localStorage (via Zustand persist)
- [ ] - [ ] Analysis syncs to Supabase (if sync enabled) - where is sync option? 

### 10. Integration Tests
- [x] - [ ] Prophet calculator still works after feature added
- [x] - [ ] Other tabs (Costs, Codes, Scenarios) still work
- [x] - [ ] No console errors when opening modal
- [x] - [ ] No console errors when switching tabs
- [x] - [ ] No console errors when saving
- [x] - [ ] No React Fast Refresh errors
- [x] - [ ] No nested button warnings

### 11. Edge Cases
- [x] - [ ] Empty facility overhead costs → calculations handle 0 values
- [ ] - [ ] No scenarios exist → comparison tab handles gracefully - test later when i delete scenarios and can test
- [x] - [ ] Negative values in inputs → handled correctly
- [x] - [ ] Very large numbers → display correctly
- [x] - [ ] Multiple facilities → each has independent analysis
- [ ] - [ ] Delete facility → analysis removed - will test later when we delete scenarios

### 12. UI/UX Tests
- [x] - [ ] Modal is responsive (mobile/tablet/desktop)
- [x] - [ ] Tabs are accessible (keyboard navigation)
- [x] - [ ] Inputs are accessible (screen readers)
- [x] - [ ] Loading states (if any) display correctly
- [x] - [ ] Error states (if any) display correctly
- [x] - [ ] Styling matches design system
