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
      <Card>
        <CardHeader>
          <CardTitle>Select Scenario to Compare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Choose a Prophet Scenario</Label>
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
          <Card>
            <CardHeader>
              <CardTitle>Provider Side</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Revenue</Label>
                <div className="text-lg font-semibold">${comparison.providerRevenue.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Costs</Label>
                <div className="text-lg">${comparison.providerCosts.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Margin</Label>
                <div className={`text-lg font-semibold ${comparison.providerMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparison.providerMargin.toLocaleString()} ({comparison.providerMarginPercentage.toFixed(1)}%)
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Benefit Level</Label>
                <Badge variant={comparison.providerBenefitLevel === 'high' ? 'default' : comparison.providerBenefitLevel === 'medium' ? 'secondary' : 'outline'}>
                  {comparison.providerBenefitLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Facility Side */}
          <Card>
            <CardHeader>
              <CardTitle>Facility Side</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Current Costs</Label>
                <div className="text-lg">${comparison.facilityCurrentCosts.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Proposed Costs</Label>
                <div className="text-lg">${comparison.facilityProposedCosts.toLocaleString()}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Savings</Label>
                <div className={`text-lg font-semibold ${comparison.facilitySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${comparison.facilitySavings.toLocaleString()} ({comparison.facilitySavingsPercentage.toFixed(1)}%)
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Benefit Level</Label>
                <Badge variant={comparison.facilityBenefitLevel === 'high' ? 'default' : comparison.facilityBenefitLevel === 'medium' ? 'secondary' : 'outline'}>
                  {comparison.facilityBenefitLevel}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {comparison && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Mutual Benefit Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Score</Label>
                <div className="text-2xl font-bold">{comparison.mutualBenefitScore.toFixed(0)}/100</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Recommendation</Label>
                <div className="text-sm">{comparison.recommendation}</div>
              </div>
            </CardContent>
          </Card>

          {/* Pros and Cons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Provider Pros/Cons */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Perspective</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparison.providerPros.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-green-600">Pros</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.providerPros.map((pro, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.providerCons.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-red-600">Cons</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.providerCons.map((con, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Facility Pros/Cons */}
            <Card>
              <CardHeader>
                <CardTitle>Facility Perspective</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparison.facilityPros.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-green-600">Pros</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.facilityPros.map((pro, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {comparison.facilityCons.length > 0 && (
                  <div>
                    <Label className="text-xs font-semibold text-red-600">Cons</Label>
                    <ul className="mt-2 space-y-1">
                      {comparison.facilityCons.map((con, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">✗</span>
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
        <div className="text-sm text-muted-foreground text-center py-8">
          Select a scenario to see the comparison
        </div>
      )}
    </div>
  );
}
