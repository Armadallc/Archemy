/**
 * Scenario Builder
 * Build and analyze business scenarios
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useProphetStore } from '../hooks/useProphetStore';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { EditableField } from '../shared/EditableField';
import {
  Calculator,
  Plus,
  Trash2,
  Car,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  Copy,
} from 'lucide-react';
import { BusinessScenario, TripScenario, BillingMethod, TripServiceType } from '../types';

interface TripRowProps {
  trip: TripScenario;
  onUpdate: (updates: Partial<TripScenario>) => void;
  onDelete: () => void;
  serviceCodes: { id: string; code: string; baseRate: number; mileageRate?: number }[];
}

function TripRow({ trip, onUpdate, onDelete, serviceCodes }: TripRowProps) {
  // Calculate revenue for this trip
  const multiplier = trip.roundTrip ? 2 : 1;
  let revenue = 0;
  
  if (trip.billingMethod === 'contract' && trip.contractFee) {
    revenue = trip.contractFee;
  } else if (trip.billingMethod === 'medicaid' || trip.billingMethod === 'nmt') {
    const effectiveTrips = trip.requiresWaiver
      ? trip.tripsPerMonth * (trip.percentWithWaiver / 100)
      : trip.tripsPerMonth;
    revenue = effectiveTrips * (trip.baseRatePerTrip + (trip.avgMiles * trip.mileageRate)) * multiplier;
  } else if (trip.billingMethod === 'mileage') {
    revenue = trip.tripsPerMonth * trip.avgMiles * 0.49 * multiplier;
  }

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          <Input
            value={trip.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-7 w-48 text-sm font-medium"
            placeholder="Trip name..."
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          />
          <Badge variant="outline" className="text-xs">{trip.serviceType}</Badge>
          {trip.isBlocked && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Blocked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold" style={{ color: 'var(--color-lime)' }}>
            ${revenue.toFixed(2)}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>/mo</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-status-error" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {/* Trips/Month */}
        <div className="space-y-1">
          <Label className="text-xs">Trips/Month</Label>
          <EditableField
            value={trip.tripsPerMonth}
            onChange={(v) => onUpdate({ tripsPerMonth: Number(v) })}
            type="number"
            min={0}
          />
        </div>

        {/* Round Trip Toggle */}
        <div className="space-y-1">
          <Label className="text-xs">Round Trip</Label>
          <Button
            variant={trip.roundTrip ? 'default' : 'outline'}
            size="sm"
            onClick={() => onUpdate({ roundTrip: !trip.roundTrip })}
            className="w-full text-xs"
            style={trip.roundTrip ? {
              backgroundColor: 'var(--color-lime)',
              color: 'var(--color-charcoal)',
            } : {}}
          >
            {trip.roundTrip ? '×2' : '×1'}
          </Button>
        </div>

        {/* Avg Miles */}
        <div className="space-y-1">
          <Label className="text-xs">Avg Miles</Label>
          <EditableField
            value={trip.avgMiles}
            onChange={(v) => onUpdate({ avgMiles: Number(v) })}
            type="number"
            min={1}
            suffix=" mi"
          />
        </div>

        {/* Billing Method */}
        <div className="space-y-1">
          <Label className="text-xs">Billing</Label>
          <select
            value={trip.billingMethod}
            onChange={(e) => onUpdate({ billingMethod: e.target.value as BillingMethod })}
            className="w-full h-7 text-xs rounded border px-2"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <option value="medicaid">Medicaid</option>
            <option value="nmt">NMT (Waiver)</option>
            <option value="contract">Contract</option>
            <option value="mileage">Mileage</option>
          </select>
        </div>

        {/* Base Rate */}
        <div className="space-y-1">
          <Label className="text-xs">Base Rate</Label>
          <EditableField
            value={trip.baseRatePerTrip}
            onChange={(v) => onUpdate({ baseRatePerTrip: Number(v) })}
            type="currency"
          />
        </div>

        {/* Mileage Rate */}
        <div className="space-y-1">
          <Label className="text-xs">Mileage Rate</Label>
          <EditableField
            value={trip.mileageRate}
            onChange={(v) => onUpdate({ mileageRate: Number(v) })}
            type="currency"
            suffix="/mi"
          />
        </div>
      </div>

      {/* Waiver requirement for NMT */}
      {trip.billingMethod === 'nmt' && (
        <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(232, 255, 254, 0.1)' }}>
          <div className="flex items-center gap-4">
            <span style={{ color: 'var(--color-ice)' }}>% with waiver:</span>
            <EditableField
              value={trip.percentWithWaiver}
              onChange={(v) => onUpdate({ percentWithWaiver: Number(v) })}
              type="number"
              min={0}
              max={100}
              suffix="%"
            />
            <span style={{ color: 'var(--muted-foreground)' }}>
              (Only {Math.round(trip.tripsPerMonth * (trip.percentWithWaiver / 100))} trips billable)
            </span>
          </div>
        </div>
      )}

      {/* Contract fee for contract billing */}
      {trip.billingMethod === 'contract' && (
        <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(59, 254, 201, 0.1)' }}>
          <div className="flex items-center gap-4">
            <span style={{ color: 'var(--color-lime)' }}>Monthly Contract Fee:</span>
            <EditableField
              value={trip.contractFee || 0}
              onChange={(v) => onUpdate({ contractFee: Number(v) })}
              type="currency"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ScenarioBuilder() {
  const {
    scenarios,
    activeScenarioId,
    addScenario,
    updateScenario,
    deleteScenario,
    setActiveScenario,
    serviceCodes,
    costStructure,
    facilities,
    calculateScenarioRevenue,
    calculateBreakEven,
  } = useProphetStore();

  const [newScenarioName, setNewScenarioName] = useState('');

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId);

  const handleAddScenario = () => {
    if (!newScenarioName.trim()) return;
    
    addScenario({
      name: newScenarioName,
      description: '',
      facilityIds: [],
      trips: [],
      costs: costStructure,
      vehicles: 1,
      drivers: 1,
      projectedMiles: 0,
      totalRevenue: 0,
      totalCosts: 0,
      netIncome: 0,
      margin: 0,
      breakEvenTrips: 0,
      tripsGap: 0,
    });
    setNewScenarioName('');
  };

  const handleAddTrip = () => {
    if (!activeScenario) return;
    
    const newTrip: TripScenario = {
      id: `trip-${Date.now()}`,
      name: 'New Trip',
      serviceType: 'BHST',
      tripsPerMonth: 10,
      roundTrip: true,
      avgMiles: 15,
      billingMethod: 'medicaid',
      baseRatePerTrip: 267.91,
      mileageRate: 6.51,
      requiresWaiver: false,
      percentWithWaiver: 0,
      estimatedRevenue: 0,
    };
    
    updateScenario(activeScenario.id, {
      trips: [...activeScenario.trips, newTrip],
    });
  };

  const handleUpdateTrip = (tripId: string, updates: Partial<TripScenario>) => {
    if (!activeScenario) return;
    updateScenario(activeScenario.id, {
      trips: activeScenario.trips.map((t) =>
        t.id === tripId ? { ...t, ...updates } : t
      ),
    });
  };

  const handleDeleteTrip = (tripId: string) => {
    if (!activeScenario) return;
    updateScenario(activeScenario.id, {
      trips: activeScenario.trips.filter((t) => t.id !== tripId),
    });
  };

  // Calculate totals for active scenario
  const totalRevenue = activeScenario ? calculateScenarioRevenue(activeScenario.id) : 0;
  const totalMiles = activeScenario
    ? activeScenario.trips.reduce((sum, t) => sum + (t.tripsPerMonth * t.avgMiles * (t.roundTrip ? 2 : 1)), 0)
    : 0;
  
  // Calculate costs
  const fixedCosts = costStructure.totalFixed || 0;
  const staffingCosts = costStructure.totalStaffing || 0;
  const variableCosts = totalMiles * (
    costStructure.variable.fuelPerMile +
    costStructure.variable.maintenancePerMile +
    costStructure.variable.insuranceVariablePerMile
  );
  const totalCosts = fixedCosts + staffingCosts + variableCosts;
  const netIncome = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

  const breakEven = activeScenario ? calculateBreakEven(activeScenario.id) : { breakEvenTrips: 0, tripsGap: 0 };

  return (
    <div className="space-y-6">
      {/* Scenario Selector */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {scenarios.map((scenario) => (
            <Button
              key={scenario.id}
              variant={activeScenarioId === scenario.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveScenario(scenario.id)}
              className="relative"
              style={activeScenarioId === scenario.id ? {
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              } : {}}
            >
              <FileText className="h-3 w-3 mr-1" />
              {scenario.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-4 w-4 p-0 hover:bg-status-error/20"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this scenario?')) {
                    deleteScenario(scenario.id);
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="New scenario name..."
            value={newScenarioName}
            onChange={(e) => setNewScenarioName(e.target.value)}
            className="w-48"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          />
          <Button
            size="sm"
            onClick={handleAddScenario}
            disabled={!newScenarioName.trim()}
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Scenario
          </Button>
        </div>
      </div>

      {activeScenario ? (
        <>
          {/* Summary Dashboard */}
          <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Calculator className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  {activeScenario.name} - Analysis
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {/* Revenue */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <DollarSign className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-lime)' }} />
                  <div className="text-2xl font-bold" style={{ color: 'var(--color-lime)' }}>
                    ${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Revenue/Month</div>
                </div>

                {/* Costs */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <TrendingDown className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--status-error)' }} />
                  <div className="text-2xl font-bold" style={{ color: 'var(--status-error)' }}>
                    ${totalCosts.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Costs/Month</div>
                </div>

                {/* Net Income */}
                <div className={`text-center p-4 rounded-lg border-2 ${netIncome >= 0 ? '' : 'border-status-error'}`}
                  style={{ 
                    backgroundColor: netIncome >= 0 ? 'rgba(59, 254, 201, 0.1)' : 'rgba(255, 85, 93, 0.1)',
                    borderColor: netIncome >= 0 ? 'var(--color-lime)' : 'var(--status-error)',
                  }}>
                  {netIncome >= 0 ? (
                    <TrendingUp className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-lime)' }} />
                  ) : (
                    <TrendingDown className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--status-error)' }} />
                  )}
                  <div className="text-2xl font-bold" style={{ 
                    color: netIncome >= 0 ? 'var(--color-lime)' : 'var(--status-error)' 
                  }}>
                    ${Math.abs(netIncome).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {netIncome >= 0 ? 'Net Income' : 'Net Loss'}
                  </div>
                </div>

                {/* Margin */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <Target className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-ice)' }} />
                  <div className="text-2xl font-bold" style={{ 
                    color: margin >= 20 ? 'var(--color-lime)' : 
                           margin >= 0 ? 'var(--status-warning)' : 'var(--status-error)'
                  }}>
                    {margin.toFixed(1)}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Margin</div>
                </div>

                {/* Break Even */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <Target className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-coral)' }} />
                  <div className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                    {breakEven.breakEvenTrips === Infinity ? '∞' : breakEven.breakEvenTrips}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Break-Even Trips</div>
                </div>

                {/* Trips Gap */}
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  {breakEven.tripsGap <= 0 ? (
                    <CheckCircle className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-lime)' }} />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--status-warning)' }} />
                  )}
                  <div className="text-2xl font-bold" style={{ 
                    color: breakEven.tripsGap <= 0 ? 'var(--color-lime)' : 'var(--status-warning)' 
                  }}>
                    {breakEven.tripsGap <= 0 ? 'Profitable' : `+${breakEven.tripsGap}`}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {breakEven.tripsGap <= 0 ? 'Above break-even' : 'Trips needed'}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Fixed:</span>
                    <span style={{ color: 'var(--foreground)' }}>${fixedCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Staffing:</span>
                    <span style={{ color: 'var(--foreground)' }}>${staffingCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted-foreground)' }}>Variable ({totalMiles.toLocaleString()} mi):</span>
                    <span style={{ color: 'var(--foreground)' }}>${variableCosts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span style={{ color: 'var(--muted-foreground)' }}>Total Trips:</span>
                    <span style={{ color: 'var(--foreground)' }}>
                      {activeScenario.trips.reduce((sum, t) => sum + t.tripsPerMonth * (t.roundTrip ? 2 : 1), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Scenarios */}
          <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <Car className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                  Trip Scenarios
                  <Badge variant="secondary">{activeScenario.trips.length} trips</Badge>
                </CardTitle>
                <Button size="sm" onClick={handleAddTrip}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Trip
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeScenario.trips.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No trip scenarios yet. Add a trip to start building your revenue model.</p>
                </div>
              ) : (
                activeScenario.trips.map((trip) => (
                  <TripRow
                    key={trip.id}
                    trip={trip}
                    onUpdate={(updates) => handleUpdateTrip(trip.id, updates)}
                    onDelete={() => handleDeleteTrip(trip.id)}
                    serviceCodes={serviceCodes.map((c) => ({
                      id: c.id,
                      code: c.code,
                      baseRate: c.baseRate,
                      mileageRate: c.mileageRate,
                    }))}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardContent className="py-12 text-center">
            <Calculator className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              No Scenario Selected
            </h3>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Create a new scenario or select an existing one to begin planning.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ScenarioBuilder;



