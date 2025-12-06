/**
 * Seasonal/Unexpected Variable Costs Component
 * Winter operations, extreme weather, event-based demand, vehicle downtime
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { Snowflake, Cloud, Calendar, Car } from 'lucide-react';

export function SeasonalCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const seasonal = costStructure.variable.seasonal;

  const updateSeasonal = (updates: Partial<typeof seasonal>) => {
    updateVariableCosts({
      seasonal: {
        ...seasonal,
        ...updates,
      },
    });
  };

  // Check if current month is a winter month
  const currentMonth = new Date().getMonth(); // 0-11
  const isWinterMonth = seasonal.winterOperationsMonths.includes(currentMonth);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Seasonal and irregular/unexpected costs
      </div>

      {/* Winter Operations */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Snowflake className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Winter Operations
          </h4>
          {isWinterMonth && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-ice)', color: 'var(--foreground)' }}>
              ACTIVE
            </span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Monthly Cost:</span>
            <EditableField
              value={seasonal.winterOperationsPerMonth}
              onChange={(v) => updateSeasonal({ winterOperationsPerMonth: Number(v) })}
              type="currency"
              suffix="/month"
              min={0}
            />
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Applied during: Nov, Dec, Jan, Feb, Mar
          </div>
          {isWinterMonth && seasonal.winterOperationsPerMonth > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--color-lime)' }}>
              ✓ Currently active this month
            </div>
          )}
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Snow tires, chains, extra cleaning
          </div>
        </div>
      </div>

      {/* Extreme Weather Costs */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Cloud className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Extreme Weather Costs</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Idling time, rerouting (estimated monthly)</div>
          </div>
        </div>
        <EditableField
          value={seasonal.extremeWeatherCostsPerMonth}
          onChange={(v) => updateSeasonal({ extremeWeatherCostsPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Event-Based Demand */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Calendar className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Event-Based Demand</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Extra staffing for conferences/events</div>
          </div>
        </div>
        <EditableField
          value={seasonal.eventBasedDemandPerMonth}
          onChange={(v) => updateSeasonal({ eventBasedDemandPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Vehicle Downtime Replacement */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Vehicle Downtime Replacement</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Rental vehicles (estimated monthly)</div>
          </div>
        </div>
        <EditableField
          value={seasonal.vehicleDowntimeReplacementPerMonth}
          onChange={(v) => updateSeasonal({ vehicleDowntimeReplacementPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

