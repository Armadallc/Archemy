/**
 * Administrative Variable Costs Component
 * Billing/claims processing, collections, licensing, insurance audits
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { FileText, DollarSign, FileCheck, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

export function AdministrativeCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const administrative = costStructure.variable.administrative;

  const updateAdministrative = (updates: Partial<typeof administrative>) => {
    updateVariableCosts({
      administrative: {
        ...administrative,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Administrative overhead and processing costs
      </div>

      {/* Billing/Claims Processing */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Billing/Claims Processing
          </h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Mode:</span>
            <Select
              value={administrative.billingClaimsProcessingMode}
              onValueChange={(value: 'per_claim' | 'percentage') => 
                updateAdministrative({ billingClaimsProcessingMode: value })
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
          {administrative.billingClaimsProcessingMode === 'per_claim' ? (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Per Claim:</span>
              <EditableField
                value={administrative.billingClaimsProcessingPerClaim}
                onChange={(v) => updateAdministrative({ billingClaimsProcessingPerClaim: Number(v) })}
                type="currency"
                suffix="/claim"
                min={0}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Percentage:</span>
              <EditableField
                value={administrative.billingClaimsProcessingPercentage}
                onChange={(v) => updateAdministrative({ billingClaimsProcessingPercentage: Number(v) })}
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

      {/* Collections Agency */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Collections Agency Fees
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Percentage:</span>
            <EditableField
              value={administrative.collectionsAgencyPercentage}
              onChange={(v) => updateAdministrative({ collectionsAgencyPercentage: Number(v) })}
              type="number"
              suffix="%"
              min={0}
              max={50}
              step={1}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Recovered Amount/Month:</span>
            <EditableField
              value={administrative.collectionsAgencyRecoveredAmount}
              onChange={(v) => updateAdministrative({ collectionsAgencyRecoveredAmount: Number(v) })}
              type="currency"
              suffix="/month"
              min={0}
            />
          </div>
          {administrative.collectionsAgencyRecoveredAmount > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Monthly Fee: ${(administrative.collectionsAgencyRecoveredAmount * administrative.collectionsAgencyPercentage / 100).toFixed(2)}
            </div>
          )}
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            20-35% of recovered amounts (typical)
          </div>
        </div>
      </div>

      {/* Licensing/Permit Renewals */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <FileCheck className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Licensing/Permit Renewals</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Spread monthly (annual costs / 12)</div>
          </div>
        </div>
        <EditableField
          value={administrative.licensingPermitRenewalsPerMonth}
          onChange={(v) => updateAdministrative({ licensingPermitRenewalsPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Insurance Audit Fees */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Shield className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Insurance Audit/Adjustment Fees</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>When claims occur (estimated monthly)</div>
          </div>
        </div>
        <EditableField
          value={administrative.insuranceAuditFeesPerMonth}
          onChange={(v) => updateAdministrative({ insuranceAuditFeesPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

