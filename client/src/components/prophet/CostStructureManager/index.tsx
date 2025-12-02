/**
 * Cost Structure Manager
 * Main component that combines fixed, variable, and staffing costs
 */

import React from 'react';
import { FixedCosts } from './FixedCosts';
import { VariableCosts } from './VariableCosts';
import { StaffingCosts } from './StaffingCosts';
import { useProphetStore } from '../hooks/useProphetStore';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';

export function CostStructureManager() {
  const { costStructure } = useProphetStore();

  // Calculate summary totals
  const fixed = costStructure.fixed;
  const variable = costStructure.variable;
  const staffing = costStructure.staffing;

  const totalFixed = (
    fixed.insuranceCommercialAuto +
    fixed.insuranceGeneralLiability +
    fixed.hcpfEnrollment +
    (fixed.countyBHSTLicense * fixed.countyCount) +
    fixed.pucLicense +
    fixed.vehicleLease +
    fixed.maintenanceReserve +
    fixed.software +
    fixed.drugScreening +
    fixed.miscAdmin
  );

  const totalStaffing = (
    (staffing.owner.enabled ? staffing.owner.totalCost : 0) +
    (staffing.driver.enabled ? staffing.driver.totalCost * (1 + staffing.additionalDrivers) : 0) +
    (staffing.admin.enabled ? staffing.admin.totalCost : 0)
  );

  const totalPerMile = (
    variable.fuelPerMile +
    variable.maintenancePerMile +
    variable.insuranceVariablePerMile
  );

  // Monthly fixed overhead (excluding variable)
  const monthlyOverhead = totalFixed + totalStaffing;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
              <div className="flex items-center justify-center mb-1">
                <Calculator className="h-5 w-5" style={{ color: 'var(--color-ice)' }} />
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Fixed/Month</div>
              <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                ${totalFixed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-5 w-5" style={{ color: 'var(--color-lime)' }} />
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Variable/Mile</div>
              <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                ${totalPerMile.toFixed(3)}
              </div>
            </div>

            <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-5 w-5" style={{ color: 'var(--color-coral)' }} />
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Staffing/Month</div>
              <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                ${totalStaffing.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-center p-3 rounded-lg border-2" style={{ 
              backgroundColor: 'rgba(255, 85, 93, 0.1)', 
              borderColor: 'var(--primary)' 
            }}>
              <div className="flex items-center justify-center mb-1">
                <TrendingDown className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Overhead</div>
              <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                ${monthlyOverhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FixedCosts />
        <VariableCosts />
        <StaffingCosts />
      </div>
    </div>
  );
}

export { FixedCosts } from './FixedCosts';
export { VariableCosts } from './VariableCosts';
export { StaffingCosts } from './StaffingCosts';
export default CostStructureManager;

