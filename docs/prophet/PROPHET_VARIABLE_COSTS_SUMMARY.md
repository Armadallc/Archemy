# PROPHET Variable Costs - Quick Summary

## 📊 Current vs. Required

### ✅ Currently Implemented
- **Fuel** (per mile) - $0.15-$0.25/mile
- **Maintenance** (per mile) - $0.08-$0.15/mile  
- **Insurance Variable** (per mile) - $0.05/mile

### ❌ Missing Categories (11 Total)

1. **Direct Transport** - Tires, Repairs, Oil/Filter (per-mile), Cleaning, Supplies (per-trip)
2. **Driver/Staff Variables** - Overtime, Bonuses, Training, Temporary Drivers
3. **Patient/Client Related** - Equipment Rental, Meals, Accommodations, Tolls, Wait Time
4. **Operational Variables** - Dispatch Overtime, Phone Overage, Credit Card Fees, Fuel Surcharge
5. **Administrative Variables** - Billing/Claims Processing, Collections, Licensing, Insurance Audits
6. **Marketing/Acquisition** - Referral Commissions, Partnership Fees, Digital Ads, CRM
7. **Compliance & Safety** - Drug Tests, Background Checks, CPR Recert, Vehicle Inspections
8. **Technology Variables** - GPS/Telematics, Software Per-Trip, Data Overage, Add-ons
9. **Vehicle Specific** - Depreciation, Registration, Property Tax, Parking
10. **Hybrid-Specific** - Medicaid Billing Support, Prior Auth, HCBS Coordination, Dual-Billing
11. **Seasonal/Unexpected** - Winter Operations, Extreme Weather, Event Demand, Vehicle Downtime

---

## 🎯 Implementation Approach

### Strategy: **Grouped Structure**
Organize costs into logical categories rather than flat structure for better UI/UX.

### Phases
1. **Phase 1**: Extend type definitions (Week 1)
2. **Phase 2**: Update store & defaults (Week 1)
3. **Phase 3**: Create UI components (Week 2-3)
4. **Phase 4**: Update calculations (Week 3)
5. **Phase 5**: Summary & reporting (Week 4)

### Key Principle
**Preserve existing functionality** - All new costs are additive and optional. Existing calculations continue to work.

---

## 📁 Files to Modify

### Core Files
- `client/src/components/prophet/types.ts` - Add new cost interfaces
- `client/src/components/prophet/hooks/useProphetStore.ts` - Add defaults & calculations
- `client/src/components/prophet/CostStructureManager/VariableCosts.tsx` - Restructure UI

### New Component Files (11)
- `DirectTransportCosts.tsx`
- `DriverStaffCosts.tsx`
- `PatientClientCosts.tsx`
- `OperationalCosts.tsx`
- `AdministrativeCosts.tsx`
- `MarketingCosts.tsx`
- `ComplianceCosts.tsx`
- `TechnologyCosts.tsx`
- `VehicleSpecificCosts.tsx`
- `HybridSpecificCosts.tsx`
- `SeasonalCosts.tsx`

---

## 💡 Key Design Decisions

### UI Organization
**Recommended**: Tabs for cost categories
- Basic (Per Mile) - Always visible
- Direct Transport - Expanded by default
- Other categories - Collapsed by default

### Cost Structure
**Recommended**: Grouped interfaces
```typescript
VariableCosts {
  // Existing
  fuelPerMile, maintenancePerMile, insuranceVariablePerMile
  
  // New grouped
  directTransport: { tiresPerMile, repairsPerMile, ... }
  driverStaff: { overtimeHoursPerMonth, bonusesPerMonth, ... }
  // ... etc
}
```

### Calculation Pattern
- **Per-Mile**: `totalMiles × (sum of per-mile rates)`
- **Per-Trip**: `totalTrips × (sum of per-trip rates)`
- **Monthly**: Fixed monthly variable costs
- **Percentage**: Based on revenue/collections

---

## 📈 Example Calculation

### Scenario: 6,000 miles/month, 400 trips/month

**Per-Mile Costs**:
- Fuel: $0.20/mi × 6,000 = $1,200
- Maintenance: $0.15/mi × 6,000 = $900
- Tires: $0.03/mi × 6,000 = $180
- Repairs: $0.075/mi × 6,000 = $450
- **Subtotal**: $2,730

**Per-Trip Costs**:
- Cleaning: $10/trip × 400 = $4,000
- Supplies: $3.50/trip × 400 = $1,400
- **Subtotal**: $5,400

**Monthly Variable Costs**:
- Driver Overtime: 80 hrs × $37.50 = $3,000
- Credit Card Fees: 2.5% × $50,000 = $1,250
- **Subtotal**: $4,250

**Total Variable**: $12,380/month

---

## ✅ Success Criteria

- [ ] All 11 cost categories implemented
- [ ] Existing scenarios continue to work
- [ ] Calculations accurate and performant
- [ ] UI organized and intuitive
- [ ] Backward compatibility maintained

---

**For detailed implementation plan, see**: `docs/prophet/PROPHET_VARIABLE_COSTS_IMPLEMENTATION.md`










