/**
 * Facility Overhead Tab
 * Input form for all facility overhead costs (9 categories)
 */

import React from 'react';
import { ContractAnalysis } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { EditableField } from '../../shared/EditableField';

interface FacilityOverheadTabProps {
  analysis: ContractAnalysis;
  onUpdate: (updates: Partial<ContractAnalysis>) => void;
}

export function FacilityOverheadTab({
  analysis,
  onUpdate,
}: FacilityOverheadTabProps) {
  const handleOverheadUpdate = (category: keyof ContractAnalysis['overheadCosts'], field: string, value: number) => {
    onUpdate({
      overheadCosts: {
        ...analysis.overheadCosts,
        [category]: {
          ...analysis.overheadCosts[category],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Personnel Costs (55-65% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Direct Care Staff</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.directCareStaff}
                onChange={(v) => handleOverheadUpdate('personnel', 'directCareStaff', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Indirect Care Staff</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.indirectCareStaff}
                onChange={(v) => handleOverheadUpdate('personnel', 'indirectCareStaff', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Clinical Supervision</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.clinicalSupervision}
                onChange={(v) => handleOverheadUpdate('personnel', 'clinicalSupervision', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payroll Taxes & Benefits (15.9%)</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.payrollTaxesBenefits}
                onChange={(v) => handleOverheadUpdate('personnel', 'payrollTaxesBenefits', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Benefits Package</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.benefitsPackage}
                onChange={(v) => handleOverheadUpdate('personnel', 'benefitsPackage', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Training & Credentialing</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.trainingCredentialing}
                onChange={(v) => handleOverheadUpdate('personnel', 'trainingCredentialing', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recruitment & Retention</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.recruitmentRetention}
                onChange={(v) => handleOverheadUpdate('personnel', 'recruitmentRetention', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Transportation Costs (Current Burden) ⭐ KEY FOCUS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Staff Time Allocation</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.staffTimeAllocation}
                onChange={(v) => handleOverheadUpdate('transportation', 'staffTimeAllocation', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vehicle Expenses</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.vehicleExpenses}
                onChange={(v) => handleOverheadUpdate('transportation', 'vehicleExpenses', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Liability Coverage</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.liabilityCoverage}
                onChange={(v) => handleOverheadUpdate('transportation', 'liabilityCoverage', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Opportunity Cost</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.opportunityCost}
                onChange={(v) => handleOverheadUpdate('transportation', 'opportunityCost', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scheduling Inefficiencies</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.schedulingInefficiencies}
                onChange={(v) => handleOverheadUpdate('transportation', 'schedulingInefficiencies', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compliance Risk</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.complianceRisk}
                onChange={(v) => handleOverheadUpdate('transportation', 'complianceRisk', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        <p>Note: Additional cost categories (Facility, Administrative, Clinical, Insurance, Compliance, Program-Specific, Capital) will be added in the full implementation.</p>
      </div>
    </div>
  );
}
