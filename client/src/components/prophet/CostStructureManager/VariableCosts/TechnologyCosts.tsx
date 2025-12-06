/**
 * Technology Variable Costs Component
 * GPS/Telematics, ride management software, data overage, software add-ons
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { MapPin, Monitor, Wifi, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

export function TechnologyCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const technology = costStructure.variable.technology;

  const updateTechnology = (updates: Partial<typeof technology>) => {
    updateVariableCosts({
      technology: {
        ...technology,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Technology and software variable costs
      </div>

      {/* GPS/Telematics */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <MapPin className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>GPS/Telematics</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$15-40/vehicle/month</div>
          </div>
        </div>
        <EditableField
          value={technology.gpsTelematicsPerVehicle}
          onChange={(v) => updateTechnology({ gpsTelematicsPerVehicle: Number(v) })}
          type="currency"
          suffix="/vehicle/month"
          min={0}
        />
      </div>

      {/* Ride Management Software */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Ride Management Software
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Mode:</span>
            <Select
              value={technology.rideManagementSoftwareMode}
              onValueChange={(value: 'per_trip' | 'per_month') => 
                updateTechnology({ rideManagementSoftwareMode: value })
              }
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_trip">Per Trip</SelectItem>
                <SelectItem value="per_month">Per Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {technology.rideManagementSoftwareMode === 'per_trip' ? (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Per Trip:</span>
              <EditableField
                value={technology.rideManagementSoftwarePerTrip}
                onChange={(v) => updateTechnology({ rideManagementSoftwarePerTrip: Number(v) })}
                type="currency"
                suffix="/trip"
                min={0}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Monthly:</span>
              <EditableField
                value={technology.rideManagementSoftwareMonthly}
                onChange={(v) => updateTechnology({ rideManagementSoftwareMonthly: Number(v) })}
                type="currency"
                suffix="/month"
                min={0}
              />
            </div>
          )}
        </div>
      </div>

      {/* Data Overage */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Wifi className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Data Overage</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Mobile hotspots/tablet data</div>
          </div>
        </div>
        <EditableField
          value={technology.dataOveragePerMonth}
          onChange={(v) => updateTechnology({ dataOveragePerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Software Add-ons */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Settings className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Software Add-ons</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Extra features as needed</div>
          </div>
        </div>
        <EditableField
          value={technology.softwareAddonsPerMonth}
          onChange={(v) => updateTechnology({ softwareAddonsPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

