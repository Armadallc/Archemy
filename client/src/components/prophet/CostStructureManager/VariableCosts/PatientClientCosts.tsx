/**
 * Patient/Client Related Variable Costs Component
 * Trip-specific supplies, meals, accommodations, tolls, wait time
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { Package, Utensils, Hotel, MapPin, Clock } from 'lucide-react';

export function PatientClientCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const patientClient = costStructure.variable.patientClient || {
    tripSpecificSuppliesPerTrip: 0,
    patientMealsPerTrip: 0,
    accommodationCostsPerTrip: 0,
    tollsParkingPerMonth: 0,
    waitTimeCompensationPerHour: 20,
    avgWaitTimeHoursPerMonth: 0,
  };

  const updatePatientClient = (updates: Partial<typeof patientClient>) => {
    updateVariableCosts({
      patientClient: {
        ...patientClient,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Trip-specific and client-related variable costs
      </div>

      {/* Per-Trip Costs */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Per-Trip Costs
        </h4>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Package className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Trip-Specific Supplies</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Wheelchair/bariatric equipment rental</div>
            </div>
          </div>
          <EditableField
            value={patientClient.tripSpecificSuppliesPerTrip}
            onChange={(v) => updatePatientClient({ tripSpecificSuppliesPerTrip: Number(v) })}
            type="currency"
            suffix="/trip"
            min={0}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Utensils className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Patient Meals/Snacks</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>For long transports</div>
            </div>
          </div>
          <EditableField
            value={patientClient.patientMealsPerTrip}
            onChange={(v) => updatePatientClient({ patientMealsPerTrip: Number(v) })}
            type="currency"
            suffix="/trip"
            min={0}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Hotel className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Accommodation Costs</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>For multi-day/out-of-state transports</div>
            </div>
          </div>
          <EditableField
            value={patientClient.accommodationCostsPerTrip}
            onChange={(v) => updatePatientClient({ accommodationCostsPerTrip: Number(v) })}
            type="currency"
            suffix="/trip"
            min={0}
          />
        </div>
      </div>

      {/* Monthly Costs */}
      <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Monthly Costs
        </h4>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <MapPin className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Tolls/Parking</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Actual incurred monthly</div>
            </div>
          </div>
          <EditableField
            value={patientClient.tollsParkingPerMonth}
            onChange={(v) => updatePatientClient({ tollsParkingPerMonth: Number(v) })}
            type="currency"
            suffix="/month"
            min={0}
          />
        </div>

        <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Wait Time Compensation
            </h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Rate:</span>
              <EditableField
                value={patientClient.waitTimeCompensationPerHour}
                onChange={(v) => updatePatientClient({ waitTimeCompensationPerHour: Number(v) })}
                type="currency"
                suffix="/hr"
                min={0}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Avg Hours/Month:</span>
              <EditableField
                value={patientClient.avgWaitTimeHoursPerMonth}
                onChange={(v) => updatePatientClient({ avgWaitTimeHoursPerMonth: Number(v) })}
                type="number"
                suffix=" hrs"
                min={0}
                step={0.5}
              />
            </div>
            {patientClient.avgWaitTimeHoursPerMonth > 0 && (
              <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                Monthly Cost: ${(patientClient.waitTimeCompensationPerHour * patientClient.avgWaitTimeHoursPerMonth).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

