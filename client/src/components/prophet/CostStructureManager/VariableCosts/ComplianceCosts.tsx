/**
 * Compliance & Safety Variable Costs Component
 * Drug tests, background checks, CPR recert, vehicle inspections
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { TestTube, UserCheck, Heart, Car } from 'lucide-react';

export function ComplianceCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const compliance = costStructure.variable.compliance;

  const updateCompliance = (updates: Partial<typeof compliance>) => {
    updateVariableCosts({
      compliance: {
        ...compliance,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Compliance, safety, and certification costs
      </div>

      {/* Random Drug Tests */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <TestTube className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Random Drug Tests
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Tests/Month:</span>
            <EditableField
              value={compliance.randomDrugTestsPerMonth}
              onChange={(v) => updateCompliance({ randomDrugTestsPerMonth: Number(v) })}
              type="number"
              suffix=" tests"
              min={0}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Cost Per Test:</span>
            <EditableField
              value={compliance.randomDrugTestCost}
              onChange={(v) => updateCompliance({ randomDrugTestCost: Number(v) })}
              type="currency"
              suffix="/test"
              min={0}
            />
          </div>
          {compliance.randomDrugTestsPerMonth > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Monthly Cost: ${(compliance.randomDrugTestsPerMonth * compliance.randomDrugTestCost).toFixed(2)}
            </div>
          )}
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            $50-100/test × frequency
          </div>
        </div>
      </div>

      {/* Background Check Renewals */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <UserCheck className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Background Check Renewals</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Annual/bi-annual per driver (spread monthly)</div>
          </div>
        </div>
        <EditableField
          value={compliance.backgroundCheckRenewalsPerDriver}
          onChange={(v) => updateCompliance({ backgroundCheckRenewalsPerDriver: Number(v) })}
          type="currency"
          suffix="/driver/month"
          min={0}
        />
      </div>

      {/* CPR/First Aid Recertification */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Heart className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>CPR/First Aid Recertification</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$75-150/driver annually (≈$6-13/month)</div>
          </div>
        </div>
        <EditableField
          value={compliance.cprFirstAidRecertPerDriver}
          onChange={(v) => updateCompliance({ cprFirstAidRecertPerDriver: Number(v) })}
          type="currency"
          suffix="/driver/month"
          min={0}
        />
      </div>

      {/* Vehicle Inspection Fees */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Vehicle Inspection Fees</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Monthly/quarterly inspections (spread monthly)</div>
          </div>
        </div>
        <EditableField
          value={compliance.vehicleInspectionFeesPerMonth}
          onChange={(v) => updateCompliance({ vehicleInspectionFeesPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

