/**
 * Vehicle Specific Variable Costs Component
 * Depreciation, registration, property tax, parking/storage
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { Car, FileText, Receipt, MapPin } from 'lucide-react';

export function VehicleSpecificCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const vehicleSpecific = costStructure.variable.vehicleSpecific;

  const updateVehicleSpecific = (updates: Partial<typeof vehicleSpecific>) => {
    updateVariableCosts({
      vehicleSpecific: {
        ...vehicleSpecific,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Per active vehicle costs (spread monthly)
      </div>

      {/* Depreciation */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Depreciation</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Miles-based depreciation</div>
          </div>
        </div>
        <EditableField
          value={vehicleSpecific.depreciationPerMile}
          onChange={(v) => updateVehicleSpecific({ depreciationPerMile: Number(v) })}
          type="currency"
          suffix="/mi"
          min={0}
          step={0.001}
        />
      </div>

      {/* Registration Fees */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <FileText className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Registration Fees</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Annual prorated monthly</div>
          </div>
        </div>
        <EditableField
          value={vehicleSpecific.registrationFeesPerVehicle}
          onChange={(v) => updateVehicleSpecific({ registrationFeesPerVehicle: Number(v) })}
          type="currency"
          suffix="/vehicle/month"
          min={0}
        />
      </div>

      {/* Personal Property Tax */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Receipt className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Personal Property Tax</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Monthly accrual</div>
          </div>
        </div>
        <EditableField
          value={vehicleSpecific.personalPropertyTaxPerVehicle}
          onChange={(v) => updateVehicleSpecific({ personalPropertyTaxPerVehicle: Number(v) })}
          type="currency"
          suffix="/vehicle/month"
          min={0}
        />
      </div>

      {/* Parking/Storage */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <MapPin className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Parking/Storage</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>If not company-owned</div>
          </div>
        </div>
        <EditableField
          value={vehicleSpecific.parkingStoragePerVehicle}
          onChange={(v) => updateVehicleSpecific({ parkingStoragePerVehicle: Number(v) })}
          type="currency"
          suffix="/vehicle/month"
          min={0}
        />
      </div>
    </div>
  );
}

