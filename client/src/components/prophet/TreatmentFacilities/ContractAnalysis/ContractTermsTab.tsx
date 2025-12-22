/**
 * Contract Terms Tab
 * Input form for contract structure (billing method, fees, terms)
 */

import React from 'react';
import { ContractAnalysis } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { EditableField } from '../../shared/EditableField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';

interface ContractTermsTabProps {
  analysis: ContractAnalysis;
  onUpdate: (updates: Partial<ContractAnalysis>) => void;
}

export function ContractTermsTab({
  analysis,
  onUpdate,
}: ContractTermsTabProps) {
  const { contractTerms } = analysis;

  const handleBillingMethodChange = (method: 'monthly_fee' | 'per_trip' | 'hybrid') => {
    onUpdate({
      contractTerms: {
        ...contractTerms,
        billingMethod: method,
      },
    });
  };

  const handleContractTermsUpdate = (field: keyof typeof contractTerms, value: number | string) => {
    onUpdate({
      contractTerms: {
        ...contractTerms,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Billing Method</Label>
            <Select
              value={contractTerms.billingMethod}
              onValueChange={handleBillingMethodChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly_fee">Monthly Fee</SelectItem>
                <SelectItem value="per_trip">Per Trip</SelectItem>
                <SelectItem value="hybrid">Hybrid (Base + Per Trip)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contractTerms.billingMethod === 'monthly_fee' && (
            <div className="space-y-2">
              <Label className="text-xs">Monthly Fee</Label>
              <EditableField
                value={contractTerms.monthlyFee || 0}
                onChange={(v) => handleContractTermsUpdate('monthlyFee', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          )}

          {contractTerms.billingMethod === 'per_trip' && (
            <div className="space-y-2">
              <Label className="text-xs">Per Trip Rate</Label>
              <EditableField
                value={contractTerms.perTripRate || 0}
                onChange={(v) => handleContractTermsUpdate('perTripRate', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          )}

          {contractTerms.billingMethod === 'hybrid' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Monthly Base Fee</Label>
                <EditableField
                  value={contractTerms.monthlyFee || 0}
                  onChange={(v) => handleContractTermsUpdate('monthlyFee', Number(v) || 0)}
                  type="number"
                  prefix="$"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Included Trips</Label>
                <EditableField
                  value={contractTerms.includedTrips || 0}
                  onChange={(v) => handleContractTermsUpdate('includedTrips', Number(v) || 0)}
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Additional Trip Rate</Label>
                <EditableField
                  value={contractTerms.additionalTripRate || 0}
                  onChange={(v) => handleContractTermsUpdate('additionalTripRate', Number(v) || 0)}
                  type="number"
                  prefix="$"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Contract Term (months)</Label>
            <EditableField
              value={contractTerms.contractTerm}
              onChange={(v) => handleContractTermsUpdate('contractTerm', Number(v) || 12)}
              type="number"
              suffix=" months"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
