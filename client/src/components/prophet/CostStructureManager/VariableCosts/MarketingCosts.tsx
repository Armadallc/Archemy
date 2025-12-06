/**
 * Marketing/Acquisition Variable Costs Component
 * Referral commissions, facility partnerships, digital advertising, CRM
 */

import React from 'react';
import { useProphetStore } from '../../hooks/useProphetStore';
import { EditableField } from '../../shared/EditableField';
import { UserPlus, Building2, Megaphone, Database } from 'lucide-react';

export function MarketingCosts() {
  const { costStructure, updateVariableCosts } = useProphetStore();
  const marketing = costStructure.variable.marketing;

  const updateMarketing = (updates: Partial<typeof marketing>) => {
    updateVariableCosts({
      marketing: {
        ...marketing,
        ...updates,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Customer acquisition and marketing expenses
      </div>

      {/* Referral Commissions */}
      <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Referral Commissions
          </h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Per Client:</span>
            <EditableField
              value={marketing.referralCommissionsPerClient}
              onChange={(v) => updateMarketing({ referralCommissionsPerClient: Number(v) })}
              type="currency"
              suffix="/client"
              min={0}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Monthly Referrals:</span>
            <EditableField
              value={marketing.referralCommissionsCount}
              onChange={(v) => updateMarketing({ referralCommissionsCount: Number(v) })}
              type="number"
              suffix=" clients"
              min={0}
              step={1}
            />
          </div>
          {marketing.referralCommissionsCount > 0 && (
            <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
              Monthly Cost: ${(marketing.referralCommissionsPerClient * marketing.referralCommissionsCount).toFixed(2)}
            </div>
          )}
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            $25-100/referred client (typical)
          </div>
        </div>
      </div>

      {/* Facility Partnership Fees */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Building2 className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Facility Partnership Fees</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Revenue share or per-client fees</div>
          </div>
        </div>
        <EditableField
          value={marketing.facilityPartnershipFeePerMonth}
          onChange={(v) => updateMarketing({ facilityPartnershipFeePerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* Digital Advertising */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Megaphone className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Digital Advertising</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Google/Facebook ads (pay-per-click)</div>
          </div>
        </div>
        <EditableField
          value={marketing.digitalAdvertisingPerMonth}
          onChange={(v) => updateMarketing({ digitalAdvertisingPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>

      {/* CRM/Lists */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            <Database className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>CRM/Lists</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Per lead or per contact</div>
          </div>
        </div>
        <EditableField
          value={marketing.crmListsPerMonth}
          onChange={(v) => updateMarketing({ crmListsPerMonth: Number(v) })}
          type="currency"
          suffix="/month"
          min={0}
        />
      </div>
    </div>
  );
}

