/**
 * Operational Variable Costs Component
 * Dispatch overtime, phone overage, credit card fees, fuel surcharge, subcontractors, emergency roadside
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { Phone, CreditCard, Fuel, Users, Wrench } from 'lucide-react';

export function OperationalCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const operational = costStructure.variable.operational || {
    dispatchOvertimeHoursPerMonth: 0,
    dispatchOvertimeRate: 30,
    phoneCommunicationOveragePerMonth: 0,
    creditCardProcessingPercentage: 2.75,
    fuelSurchargeThreshold: 4.00,
    fuelSurchargePercentage: 5,
    subcontractorPaymentsPerMonth: 0,
    emergencyRoadsidePerMonth: 0,
  };

  const updateOperational = (updates: Partial<typeof operational>) => {
    updateVariableCosts({
      operational: {
        ...operational,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Operational overhead and variable expenses
      </div>

      {/* Dispatch Overtime */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Phone className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Dispatch Overtime</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Extra hours during high volume</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditableField
            value={operational.dispatchOvertimeHoursPerMonth}
            onChange={(v) => updateOperational({ dispatchOvertimeHoursPerMonth: Number(v) })}
            type="number"
            suffix=" hrs"
            min={0}
            step={1}
          />
          <span className="text-xs text-muted-foreground">×</span>
          <EditableField
            value={operational.dispatchOvertimeRate}
            onChange={(v) => updateOperational({ dispatchOvertimeRate: Number(v) })}
            type="currency"
            suffix="/hr"
            min={0}
          />
        </div>
      </div>

      {/* Phone/Communication Overage */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Phone className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Phone/Communication Overage</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Exceeding base plan</div>
          </div>
        </div>
        <EditableField
          value={operational.phoneCommunicationOveragePerMonth}
          onChange={(v) => updateOperational({ phoneCommunicationOveragePerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Credit Card Processing Fees */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Credit Card Processing Fees
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Percentage:</span>
            <EditableField
              value={operational.creditCardProcessingPercentage}
              onChange={(v) => updateOperational({ creditCardProcessingPercentage: Number(v) })}
              type="number"
              suffix="%"
              min={0}
              max={10}
              step={0.1}
            />
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Applied to private pay revenue (2.5-3.5% typical)
          </div>
        </div>
      </div>

      {/* Fuel Surcharge */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Fuel className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Fuel Surcharge
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Threshold:</span>
            <EditableField
              value={operational.fuelSurchargeThreshold}
              onChange={(v) => updateOperational({ fuelSurchargeThreshold: Number(v) })}
              type="currency"
              suffix="/gal"
              min={0}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Surcharge %:</span>
            <EditableField
              value={operational.fuelSurchargePercentage}
              onChange={(v) => updateOperational({ fuelSurchargePercentage: Number(v) })}
              type="number"
              suffix="%"
              min={0}
              max={20}
              step={0.5}
            />
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Applied when fuel price exceeds threshold
          </div>
        </div>
      </div>

      {/* Subcontractor Payments */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Users className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Subcontractor Payments</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>For overflow capacity</div>
          </div>
        </div>
        <EditableField
          value={operational.subcontractorPaymentsPerMonth}
          onChange={(v) => updateOperational({ subcontractorPaymentsPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Emergency Roadside */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Wrench className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Emergency Roadside</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Tows/jump-starts beyond AAA coverage</div>
          </div>
        </div>
        <EditableField
          value={operational.emergencyRoadsidePerMonth}
          onChange={(v) => updateOperational({ emergencyRoadsidePerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

