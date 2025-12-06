/**
 * Direct Transport Variable Costs Component
 * Per-mile and per-trip direct transport costs
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { Wrench, Droplets, Car, Sparkles, Package } from 'lucide-react';

export function DirectTransportCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const directTransport = costStructure.variable.directTransport || {
    tiresPerMile: 0,
    repairsPerMile: 0,
    oilFilterPerMile: 0,
    vehicleCleaningPerTrip: 0,
    disposableSuppliesPerTrip: 0,
  };

  const updateDirectTransport = (updates: Partial<typeof directTransport>) => {
    updateVariableCosts({
      directTransport: {
        ...directTransport,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Additional per-mile and per-trip direct transport costs
      </div>

      {/* Per-Mile Costs */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Per-Mile Costs
        </h4>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Tires</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$0.02-$0.04/mile</div>
            </div>
          </div>
          <EditableField
            value={directTransport.tiresPerMile}
            onChange={(v) => updateDirectTransport({ tiresPerMile: Number(v) })}
            type="currency"
            suffix="/mi"
            min={0}
            step={0.001}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Wrench className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Repairs</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$0.05-$0.10/mile</div>
            </div>
          </div>
          <EditableField
            value={directTransport.repairsPerMile}
            onChange={(v) => updateDirectTransport({ repairsPerMile: Number(v) })}
            type="currency"
            suffix="/mi"
            min={0}
            step={0.001}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Droplets className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Oil/Filter Changes</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$0.01-$0.02/mile</div>
            </div>
          </div>
          <EditableField
            value={directTransport.oilFilterPerMile}
            onChange={(v) => updateDirectTransport({ oilFilterPerMile: Number(v) })}
            type="currency"
            suffix="/mi"
            min={0}
            step={0.001}
          />
        </div>
      </div>

      {/* Per-Trip Costs */}
      <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Per-Trip Costs
        </h4>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Sparkles className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Vehicle Cleaning/Sanitization</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$5-15/trip (behavioral health)</div>
            </div>
          </div>
          <EditableField
            value={directTransport.vehicleCleaningPerTrip}
            onChange={(v) => updateDirectTransport({ vehicleCleaningPerTrip: Number(v) })}
            type="currency"
            suffix="/trip"
            min={0}
            step={0.5}
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
              <Package className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Disposable Supplies</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>$2-5/trip (masks, sanitizer, seat covers)</div>
            </div>
          </div>
          <EditableField
            value={directTransport.disposableSuppliesPerTrip}
            onChange={(v) => updateDirectTransport({ disposableSuppliesPerTrip: Number(v) })}
            type="currency"
            suffix="/trip"
            min={0}
            step={0.5}
          />
        </div>
      </div>
    </div>
  );
}

