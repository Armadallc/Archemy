/**
 * Summary Tab
 * Overview of the analysis with key metrics
 */

import React from 'react';
import { ContractAnalysis, TreatmentFacility } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { useProphetStore } from '../../hooks/useProphetStore';

interface SummaryTabProps {
  facility: TreatmentFacility;
  analysis: ContractAnalysis;
}

export function SummaryTab({
  facility,
  analysis,
}: SummaryTabProps) {
  const {
    calculateTotalFacilityOverhead,
    calculateTransportationBurden,
    calculateTransportationBurdenPercentage,
  } = useProphetStore();

  const totalOverhead = calculateTotalFacilityOverhead(analysis.overheadCosts);
  const transportationBurden = calculateTransportationBurden(analysis.overheadCosts);
  const transportationBurdenPercentage = calculateTransportationBurdenPercentage(analysis.overheadCosts);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facility Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Total Monthly Overhead</Label>
            <div className="text-lg font-semibold">${totalOverhead.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Transportation Burden</Label>
            <div className="text-lg">${transportationBurden.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Transportation Burden %</Label>
            <div className="text-lg font-semibold">{transportationBurdenPercentage.toFixed(1)}%</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Billing Method</Label>
            <div className="text-lg capitalize">{analysis.contractTerms.billingMethod.replace('_', ' ')}</div>
          </div>
          {analysis.contractTerms.billingMethod === 'monthly_fee' && (
            <div>
              <Label className="text-xs text-muted-foreground">Monthly Fee</Label>
              <div className="text-lg font-semibold">${(analysis.contractTerms.monthlyFee || 0).toLocaleString()}</div>
            </div>
          )}
          {analysis.contractTerms.billingMethod === 'per_trip' && (
            <div>
              <Label className="text-xs text-muted-foreground">Per Trip Rate</Label>
              <div className="text-lg font-semibold">${(analysis.contractTerms.perTripRate || 0).toLocaleString()}</div>
            </div>
          )}
          {analysis.contractTerms.billingMethod === 'hybrid' && (
            <>
              <div>
                <Label className="text-xs text-muted-foreground">Monthly Base Fee</Label>
                <div className="text-lg">${(analysis.contractTerms.monthlyFee || 0).toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Included Trips</Label>
                <div className="text-lg">{(analysis.contractTerms.includedTrips || 0).toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Additional Trip Rate</Label>
                <div className="text-lg">${(analysis.contractTerms.additionalTripRate || 0).toLocaleString()}</div>
              </div>
            </>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Contract Term</Label>
            <div className="text-lg">{analysis.contractTerms.contractTerm} months</div>
          </div>
        </CardContent>
      </Card>

      {analysis.comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Scenario Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {analysis.comparisons.length} comparison(s) available. View the A/B Comparison tab for details.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
