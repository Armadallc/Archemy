/**
 * Hybrid-Specific Variable Costs Component
 * Medicaid billing support, prior auth, HCBS waiver coordination, private pay collection, dual-billing
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { FileText, CheckCircle, Users, DollarSign, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

export function HybridSpecificCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const hybridSpecific = costStructure.variable.hybridSpecific;

  const updateHybridSpecific = (updates: Partial<typeof hybridSpecific>) => {
    updateVariableCosts({
      hybridSpecific: {
        ...hybridSpecific,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Hybrid NMT/Private Pay operation-specific costs
      </div>

      {/* Medicaid Billing Support */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Medicaid Billing Support
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Mode:</span>
            <Select
              value={hybridSpecific.medicaidBillingSupportMode}
              onValueChange={(value: 'per_claim' | 'percentage') => 
                updateHybridSpecific({ medicaidBillingSupportMode: value })
              }
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_claim">Per Claim</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hybridSpecific.medicaidBillingSupportMode === 'per_claim' ? (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Per Claim:</span>
              <EditableField
                value={hybridSpecific.medicaidBillingSupportPerClaim}
                onChange={(v) => updateHybridSpecific({ medicaidBillingSupportPerClaim: Number(v) })}
                type="currency"
                suffix="/claim"
                min={0}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Percentage:</span>
              <EditableField
                value={hybridSpecific.medicaidBillingSupportPercentage}
                onChange={(v) => updateHybridSpecific({ medicaidBillingSupportPercentage: Number(v) })}
                type="number"
                suffix="%"
                min={0}
                max={10}
                step={0.1}
              />
            </div>
          )}
        </div>
      </div>

      {/* Prior Authorization */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Prior Authorization Assistance
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Per Request:</span>
            <EditableField
              value={hybridSpecific.priorAuthorizationPerRequest}
              onChange={(v) => updateHybridSpecific({ priorAuthorizationPerRequest: Number(v) })}
              type="currency"
              suffix="/request"
              min={0}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Requests/Month:</span>
            <EditableField
              value={hybridSpecific.priorAuthorizationCountPerMonth}
              onChange={(v) => updateHybridSpecific({ priorAuthorizationCountPerMonth: Number(v) })}
              type="number"
              suffix=" requests"
              min={0}
              step={1}
            />
          </div>
          {hybridSpecific.priorAuthorizationCountPerMonth > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Monthly Cost: ${(hybridSpecific.priorAuthorizationPerRequest * hybridSpecific.priorAuthorizationCountPerMonth).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* HCBS Waiver Coordination */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            HCBS Waiver Coordination
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Hours/Month:</span>
            <EditableField
              value={hybridSpecific.hcbsWaiverCoordinationHoursPerMonth}
              onChange={(v) => updateHybridSpecific({ hcbsWaiverCoordinationHoursPerMonth: Number(v) })}
              type="number"
              suffix=" hrs"
              min={0}
              step={0.5}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Rate:</span>
            <EditableField
              value={hybridSpecific.hcbsWaiverCoordinationRate}
              onChange={(v) => updateHybridSpecific({ hcbsWaiverCoordinationRate: Number(v) })}
              type="currency"
              suffix="/hr"
              min={0}
            />
          </div>
          {hybridSpecific.hcbsWaiverCoordinationHoursPerMonth > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Monthly Cost: ${(hybridSpecific.hcbsWaiverCoordinationHoursPerMonth * hybridSpecific.hcbsWaiverCoordinationRate).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Private Pay Collection */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Private Pay Collection Efforts
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Hours/Month:</span>
            <EditableField
              value={hybridSpecific.privatePayCollectionHoursPerMonth}
              onChange={(v) => updateHybridSpecific({ privatePayCollectionHoursPerMonth: Number(v) })}
              type="number"
              suffix=" hrs"
              min={0}
              step={0.5}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Rate:</span>
            <EditableField
              value={hybridSpecific.privatePayCollectionRate}
              onChange={(v) => updateHybridSpecific({ privatePayCollectionRate: Number(v) })}
              type="currency"
              suffix="/hr"
              min={0}
            />
          </div>
          {hybridSpecific.privatePayCollectionHoursPerMonth > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Monthly Cost: ${(hybridSpecific.privatePayCollectionHoursPerMonth * hybridSpecific.privatePayCollectionRate).toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Dual-Billing System Maintenance */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Settings className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Dual-Billing System Maintenance</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Managing two revenue streams</div>
          </div>
        </div>
        <EditableField
          value={hybridSpecific.dualBillingSystemMaintenancePerMonth}
          onChange={(v) => updateHybridSpecific({ dualBillingSystemMaintenancePerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

