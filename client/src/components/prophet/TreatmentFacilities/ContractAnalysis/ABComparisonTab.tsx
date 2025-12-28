/**
 * A/B Comparison Tab
 * Compare facility costs vs. provider scenarios
 */

import React from 'react';
import { ContractAnalysis, TreatmentFacility } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { useProphetStore } from '../../hooks/useProphetStore';
import { Badge } from '../../../ui/badge';

interface ABComparisonTabProps {
  facility: TreatmentFacility;
  analysis: ContractAnalysis;
  onUpdate: (updates: Partial<ContractAnalysis>) => void;
}

export function ABComparisonTab({
  facility,
  analysis,
  onUpdate,
}: ABComparisonTabProps) {
  const { scenarios, calculateContractComparison } = useProphetStore();
  const [selectedScenarioId, setSelectedScenarioId] = React.useState<string>('');

  const comparison = selectedScenarioId
    ? calculateContractComparison(facility.id, selectedScenarioId)
    : null;

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    if (scenarioId && analysis) {
      const comp = calculateContractComparison(facility.id, scenarioId);
      if (comp) {
        // Update analysis with new comparison
        const existingComparisons = analysis.comparisons || [];
        const updatedComparisons = existingComparisons.filter((c) => c.scenarioId !== scenarioId);
        updatedComparisons.push(comp);

        onUpdate({
          comparisons: updatedComparisons,
          selectedComparisonId: scenarioId,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>SELECT SCENARIO TO COMPARE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#a5c8ca', opacity: 0.7 }}>Choose a Prophet Scenario</Label>
            <Select value={selectedScenarioId} onValueChange={handleScenarioSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a scenario..." />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {comparison && (
        <div className="grid grid-cols-2 gap-4">
          {/* Provider Side */}
          <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardTitle style={{ color: '#a5c8ca' }}>PROVIDER SIDE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Revenue</Label>
                <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>${comparison.providerRevenue.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Costs</Label>
                <div className="text-lg" style={{ color: '#a5c8ca' }}>${comparison.providerCosts.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Margin</Label>
                <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>
                  ${comparison.providerMargin.toLocaleString()} ({comparison.providerMarginPercentage.toFixed(1)}%)
                </div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Benefit Level</Label>
                <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                  {comparison.providerBenefitLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Facility Side */}
          <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardTitle style={{ color: '#a5c8ca' }}>FACILITY SIDE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Current Costs</Label>
                <div className="text-lg" style={{ color: '#a5c8ca' }}>${comparison.facilityCurrentCosts.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Proposed Costs</Label>
                <div className="text-lg" style={{ color: '#a5c8ca' }}>${comparison.facilityProposedCosts.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Savings</Label>
                <div className="text-lg font-semibold" style={{ color: '#a5c8ca' }}>
                  ${comparison.facilitySavings.toLocaleString()} ({comparison.facilitySavingsPercentage.toFixed(1)}%)
                </div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Benefit Level</Label>
                <Badge className="card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', color: '#a5c8ca' }}>
                  {comparison.facilityBenefitLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {comparison && (
        <>
          <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardTitle style={{ color: '#a5c8ca' }}>MUTUAL BENEFIT SCORE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Score</Label>
                <div className="text-2xl font-bold" style={{ color: '#a5c8ca' }}>{comparison.mutualBenefitScore.toFixed(0)}/100</div>
              </div>
              <div>
                <Label className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Recommendation</Label>
                <div className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>{comparison.recommendation}</div>
              </div>
            </CardContent>
          </Card>

          {/* Pros and Cons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Provider Pros/Cons */}
            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ color: '#a5c8ca' }}>PROVIDER PERSPECTIVE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparison.providerPros.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold" style={{ color: '#a5c8ca' }}>Pros</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.providerPros.map((pro, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                          <span className="mt-0.5" style={{ color: '#a5c8ca' }}>✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.providerCons.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold" style={{ color: '#a5c8ca' }}>Cons</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.providerCons.map((con, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                          <span className="mt-0.5" style={{ color: '#a5c8ca' }}>✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facility Pros/Cons */}
            <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CardTitle style={{ color: '#a5c8ca' }}>FACILITY PERSPECTIVE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparison.facilityPros.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold" style={{ color: '#a5c8ca' }}>Pros</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.facilityPros.map((pro, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                          <span className="mt-0.5" style={{ color: '#a5c8ca' }}>✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.facilityCons.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold" style={{ color: '#a5c8ca' }}>Cons</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.facilityCons.map((con, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2" style={{ color: '#a5c8ca', opacity: 0.8 }}>
                          <span className="mt-0.5" style={{ color: '#a5c8ca' }}>✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!selectedScenarioId && (
        <div className="text-sm text-center py-8" style={{ color: '#a5c8ca', opacity: 0.7 }}>
          Select a scenario to see the comparison
        </div>
      )}
    </div>
  );
}


