/**
 * Driver/Staff Variable Costs Component
 * Overtime, bonuses, training, temporary drivers
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { Users, Clock, Award, Calendar, UserPlus, GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

export function DriverStaffCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const driverStaff = costStructure.variable.driverStaff || {
    perTripDriverPay: 0,
    perTripDriverPayMode: 'per_trip' as const,
    overtimeHoursPerMonth: 0,
    overtimeRateMultiplier: 1.5,
    driverBonusesPerMonth: 0,
    additionalShiftsPerMonth: 0,
    temporaryDriverFeePerHour: 37.50,
    trainingHoursPerMonth: 0,
    trainingRatePerHour: 25,
  };

  const updateDriverStaff = (updates: Partial<typeof driverStaff>) => {
    updateVariableCosts({
      driverStaff: {
        ...driverStaff,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Variable driver and staff costs beyond base staffing
      </div>

      {/* Per-Trip Driver Pay */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Per-Trip Driver Pay
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Mode:</span>
            <Select
              value={driverStaff.perTripDriverPayMode}
              onValueChange={(value: 'per_trip' | 'per_mile') => 
                updateDriverStaff({ perTripDriverPayMode: value })
              }
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_trip">Per Trip</SelectItem>
                <SelectItem value="per_mile">Per Mile</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Rate ({driverStaff.perTripDriverPayMode === 'per_trip' ? '/trip' : '/mile'}):
            </span>
            <EditableField
              value={driverStaff.perTripDriverPay}
              onChange={(v) => updateDriverStaff({ perTripDriverPay: Number(v) })}
              type="currency"
              suffix={driverStaff.perTripDriverPayMode === 'per_trip' ? '/trip' : '/mi'}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Overtime */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Clock className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Overtime Hours</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Hours/month × {driverStaff.overtimeRateMultiplier}x rate</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditableField
            value={driverStaff.overtimeHoursPerMonth}
            onChange={(v) => updateDriverStaff({ overtimeHoursPerMonth: Number(v) })}
            type="number"
            suffix=" hrs"
            min={0}
            step={1}
          />
          <span className="text-xs text-muted-foreground">×</span>
          <EditableField
            value={driverStaff.overtimeRateMultiplier}
            onChange={(v) => updateDriverStaff({ overtimeRateMultiplier: Number(v) })}
            type="number"
            suffix="x"
            min={1}
            max={3}
            step={0.1}
          />
        </div>
      </div>

      {/* Driver Bonuses */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Award className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Driver Bonuses/Incentives</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Performance-based monthly</div>
          </div>
        </div>
        <EditableField
          value={driverStaff.driverBonusesPerMonth}
          onChange={(v) => updateDriverStaff({ driverBonusesPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Additional Shifts */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Calendar className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Additional Shifts</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Extra hours beyond base schedule</div>
          </div>
        </div>
        <EditableField
          value={driverStaff.additionalShiftsPerMonth}
          onChange={(v) => updateDriverStaff({ additionalShiftsPerMonth: Number(v) })}
          type="number"
          suffix=" shifts"
          min={0}
          step={1}
        />
      </div>

      {/* Temporary/Relief Drivers */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <UserPlus className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Temporary Driver Fee</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$25-50/hour premium</div>
          </div>
        </div>
        <EditableField
          value={driverStaff.temporaryDriverFeePerHour}
          onChange={(v) => updateDriverStaff({ temporaryDriverFeePerHour: Number(v) })}
          type="currency"
          suffix="/hr"
          min={0}
        />
      </div>

      {/* Training */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <GraduationCap className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Training Hours</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>New driver onboarding</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditableField
            value={driverStaff.trainingHoursPerMonth}
            onChange={(v) => updateDriverStaff({ trainingHoursPerMonth: Number(v) })}
            type="number"
            suffix=" hrs"
            min={0}
            step={1}
          />
          <span className="text-xs text-muted-foreground">×</span>
          <EditableField
            value={driverStaff.trainingRatePerHour}
            onChange={(v) => updateDriverStaff({ trainingRatePerHour: Number(v) })}
            type="currency"
            suffix="/hr"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

