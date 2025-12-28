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
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>FACILITY OVERVIEW</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Total Monthly Overhead</Label>
            <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>${totalOverhead.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Transportation Burden</Label>
            <div className="text-lg" style={{ color: '#a5c8ca' }}>${transportationBurden.toLocaleString()}</div>
          </div>
          <div>
            <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Transportation Burden %</Label>
            <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>{transportationBurdenPercentage.toFixed(1)}%</div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>CONTRACT TERMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Billing Method</Label>
            <div className="text-lg capitalize" style={{ color: '#a5c8ca' }}>{analysis.contractTerms.billingMethod.replace('_', ' ')}</div>
          </div>
          {analysis.contractTerms.billingMethod === 'monthly_fee' && (
            <div>
              <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Monthly Fee</Label>
              <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>${(analysis.contractTerms.monthlyFee || 0).toLocaleString()}</div>
            </div>
          )}
          {analysis.contractTerms.billingMethod === 'per_trip' && (
            <div>
              <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Per Trip Rate</Label>
              <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>${(analysis.contractTerms.perTripRate || 0).toLocaleString()}</div>
            </div>
          )}
          {analysis.contractTerms.billingMethod === 'hybrid' && (
            <>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Monthly Base Fee</Label>
                <div className="text-lg" style={{ color: '#a5c8ca' }}>${(analysis.contractTerms.monthlyFee || 0).toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Included Trips</Label>
                <div className="text-lg" style={{ color: '#a5c8ca' }}>{(analysis.contractTerms.includedTrips || 0).toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Additional Trip Rate</Label>
                <div className="text-lg" style={{ color: '#a5c8ca' }}>${(analysis.contractTerms.additionalTripRate || 0).toLocaleString()}</div>
              </div>
            </>
          )}
          <div>
            <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Contract Term</Label>
            <div className="text-lg" style={{ color: '#a5c8ca' }}>{analysis.contractTerms.contractTerm} months</div>
          </div>
        </CardContent>
      </Card>

      {analysis.comparisons.length > 0 && (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardTitle style={{ color: '#a5c8ca' }}>SELECTED SCENARIO COMPARISON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.7 }}>
              {analysis.comparisons.length} comparison(s) available. View the A/B Comparison tab for details.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


