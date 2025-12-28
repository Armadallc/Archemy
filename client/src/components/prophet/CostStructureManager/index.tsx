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

  // Calculate total per-mile variable costs (including new direct transport per-mile costs)
  const totalPerMile = (
    variable.fuelPerMile +
    variable.maintenancePerMile +
    variable.insuranceVariablePerMile +
    (variable.directTransport?.tiresPerMile || 0) +
    (variable.directTransport?.repairsPerMile || 0) +
    (variable.directTransport?.oilFilterPerMile || 0) +
    (variable.vehicleSpecific?.depreciationPerMile || 0)
  );

  // Monthly fixed overhead (excluding variable)
  const monthlyOverhead = totalFixed + totalStaffing;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardContent className="py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <div className="flex items-center justify-center mb-1">
                <Calculator className="h-5 w-5" style={{ color: '#a5c8ca' }} />
              </div>
              <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Fixed/Month</div>
              <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                ${totalFixed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-5 w-5" style={{ color: '#a5c8ca' }} />
              </div>
              <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Variable/Mile</div>
              <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                ${totalPerMile.toFixed(3)}
              </div>
            </div>

            <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-5 w-5" style={{ color: '#a5c8ca' }} />
              </div>
              <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Staffing/Month</div>
              <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                ${totalStaffing.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="text-center p-3 rounded-lg card-neu-pressed border-2" style={{ 
              backgroundColor: 'var(--background)', 
              borderColor: '#a5c8ca',
              boxShadow: 'var(--shadow-neu-pressed)'
            }}>
              <div className="flex items-center justify-center mb-1">
                <TrendingDown className="h-5 w-5" style={{ color: '#a5c8ca' }} />
              </div>
              <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Total Overhead</div>
              <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                ${monthlyOverhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Components */}
      <div className="space-y-8">
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

