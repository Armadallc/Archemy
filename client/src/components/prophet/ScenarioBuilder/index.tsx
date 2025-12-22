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
import { BusinessScenario, TripScenario, BillingMethod, TripServiceType, ServiceCategory, ServiceCode } from '../types';

interface TripRowProps {
  trip: TripScenario;
  onUpdate: (updates: Partial<TripScenario>) => void;
  onDelete: () => void;
  serviceCodes: ServiceCode[];
}

function TripRow({ trip, onUpdate, onDelete, serviceCodes }: TripRowProps) {
  // Filter service codes by selected category
  const categoryCodes = trip.category 
    ? serviceCodes.filter(code => code.category === trip.category && !code.isBlocked)
    : [];
  
  // Get selected service code
  const selectedCode = trip.selectedCodeId 
    ? serviceCodes.find(code => code.id === trip.selectedCodeId)
    : null;
  
  // Calculate revenue for this trip
  // Formula: Service/Month × Clients × Multiplier × (Base Rate + Avg Miles × Mileage Rate)
  const multiplier = trip.multiplier !== undefined ? trip.multiplier : (trip.roundTrip ? 2 : 1);
  const clients = trip.clients || 1; // Default to 1 if not set
  let revenue = 0;
  
  if (trip.billingMethod === 'contract' && trip.contractFee) {
    revenue = trip.contractFee;
  } else if (trip.billingMethod === 'medicaid' || trip.billingMethod === 'nmt') {
    const effectiveTrips = trip.requiresWaiver
      ? trip.tripsPerMonth * clients * (trip.percentWithWaiver / 100)
      : trip.tripsPerMonth * clients;
    revenue = effectiveTrips * (trip.baseRatePerTrip + (trip.avgMiles * trip.mileageRate)) * multiplier;
  } else if (trip.billingMethod === 'mileage') {
    revenue = trip.tripsPerMonth * clients * trip.avgMiles * 0.49 * multiplier;
  }
  
  // Handle billing code selection - auto-load rates
  const handleCodeSelect = (codeId: string) => {
    const code = serviceCodes.find(c => c.id === codeId);
    if (code) {
      onUpdate({
        selectedCodeId: codeId,
        selectedModifier: code.modifier || undefined, // Set modifier from code
        baseRatePerTrip: code.baseRate || 0,
        mileageRate: code.mileageRate || 0,
        // Update billing method based on category
        billingMethod: code.category === 'NMT' ? 'nmt' : 'medicaid',
      });
    }
  }

  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="grid grid-cols-7 gap-4 mb-4">
        {/* Trip Name */}
        <div className="space-y-1">
          <Label className="text-xs">Trip Name</Label>
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" style={{ color: 'var(--primary)' }} />
            <Input
              value={trip.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="h-7 text-sm font-medium flex-1"
              placeholder="Trip name..."
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            />
          </div>
        </div>
        
        {/* Category Selector */}
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <select
            value={trip.category || ''}
            onChange={(e) => {
              const category = e.target.value ? e.target.value as ServiceCategory : undefined;
              onUpdate({ 
                category,
                selectedCodeId: undefined, // Clear code when category changes
                selectedModifier: undefined, // Clear modifier when category changes
              });
            }}
            className="w-full h-7 text-xs rounded border px-2"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
            title="Select trip category"
          >
            <option value="">Select Category</option>
            <option value="BHST">BHST</option>
            <option value="NEMT">NEMT</option>
            <option value="NMT">NMT</option>
            <option value="Behavioral">Behavioral</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        {/* Billing Code Selector - only show if category is selected */}
        {trip.category ? (
          <div className="space-y-1">
            <Label className="text-xs">Billing Code</Label>
            <select
              value={trip.selectedCodeId || ''}
              onChange={(e) => {
                if (e.target.value) {
                  handleCodeSelect(e.target.value);
                } else {
                  onUpdate({ selectedCodeId: undefined, selectedModifier: undefined });
                }
              }}
              className="w-full h-7 text-xs rounded border px-2"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              title="Select billing code"
            >
              <option value="">Select Code</option>
              {categoryCodes.map((code) => (
                <option key={code.id} value={code.id}>
                  {code.code}{code.modifier ? `-${code.modifier}` : ''} - {code.description}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div></div>
        )}
        
        {/* Modifier Selector - only show if billing code is selected */}
        {trip.selectedCodeId && selectedCode ? (
          <div className="space-y-1">
            <Label className="text-xs">Modifier</Label>
            <select
              value={trip.selectedModifier || selectedCode.modifier || ''}
              onChange={(e) => onUpdate({ selectedModifier: e.target.value || undefined })}
              className="w-full h-7 text-xs rounded border px-2"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              title="Modifier (for reference only)"
            >
              <option value="">{selectedCode.modifier || 'None'}</option>
              {selectedCode.modifier && (
                <option value={selectedCode.modifier}>{selectedCode.modifier}</option>
              )}
            </select>
          </div>
        ) : (
          <div></div>
        )}
        
        {/* Empty space */}
        <div></div>
        <div></div>
        
        {/* Revenue and Delete - Far Right */}
        <div className="space-y-1 flex items-end justify-end">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold" style={{ color: 'var(--color-lime)' }}>
              ${revenue.toFixed(2)}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>/mo</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-status-error" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
            {trip.isBlocked && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Blocked
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {/* Service/Month */}
        <div className="space-y-1">
          <Label className="text-xs">Service/Month</Label>
          <EditableField
            value={trip.tripsPerMonth}
            onChange={(v) => onUpdate({ tripsPerMonth: Number(v) })}
            type="number"
            min={0}
          />
        </div>
        
        {/* Clients */}
        <div className="space-y-1">
          <Label className="text-xs">Clients</Label>
          <EditableField
            value={trip.clients || 1}
            onChange={(v) => onUpdate({ clients: Number(v) || 1 })}
            type="number"
            min={1}
          />
        </div>

        {/* Multiplier */}
        <div className="space-y-1">
          <Label className="text-xs">Multiplier</Label>
          <EditableField
            value={trip.multiplier !== undefined ? trip.multiplier : (trip.roundTrip ? 2 : 1)}
            onChange={(v) => {
              const multiplier = Number(v) || 1;
              onUpdate({ 
                multiplier,
                roundTrip: multiplier > 1, // Keep roundTrip for backward compatibility
              });
            }}
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            suffix="×"
          />
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
            title="Select billing method"
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

      {/* Selected Code Info */}
      {selectedCode && (
        <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <span style={{ color: 'var(--primary)' }}>
              <strong>Code:</strong> {selectedCode.code}{selectedCode.modifier ? `-${selectedCode.modifier}` : ''}
            </span>
            <span style={{ color: 'var(--muted-foreground)' }}>
              <strong>Rate:</strong> ${selectedCode.baseRate.toFixed(2)}/{selectedCode.unit}
            </span>
            {selectedCode.mileageRate && (
              <span style={{ color: 'var(--muted-foreground)' }}>
                <strong>Mileage:</strong> ${selectedCode.mileageRate.toFixed(2)}/mi
              </span>
            )}
          </div>
        </div>
      )}
      
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
              (Only {Math.round((trip.tripsPerMonth * (trip.clients || 1)) * (trip.percentWithWaiver / 100))} trips billable)
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
      serviceType: 'BHST', // Keep for backward compatibility
      category: undefined, // No default category - user must select
      selectedCodeId: undefined, // No default code - user must select
      selectedModifier: undefined, // No default modifier
      tripsPerMonth: 10,
      clients: 1, // Default to 1 client
      roundTrip: true, // Keep for backward compatibility
      multiplier: 2, // Default multiplier
      avgMiles: 15,
      billingMethod: 'medicaid',
      baseRatePerTrip: 0, // Will be set when code is selected
      mileageRate: 0, // Will be set when code is selected
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
    ? activeScenario.trips.reduce((sum, t) => {
        const clients = t.clients || 1;
        const multiplier = t.multiplier !== undefined ? t.multiplier : (t.roundTrip ? 2 : 1);
        return sum + (t.tripsPerMonth * clients * t.avgMiles * multiplier);
      }, 0)
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
            <div key={scenario.id} className="relative inline-flex items-center gap-1">
              <Button
                variant={activeScenarioId === scenario.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveScenario(scenario.id)}
                style={activeScenarioId === scenario.id ? {
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                } : {}}
              >
                <FileText className="h-3 w-3 mr-1" />
                {scenario.name}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-status-error/20 text-status-error"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this scenario?')) {
                    deleteScenario(scenario.id);
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
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
                <CardTitle className="text-lg" style={{ color: 'var(--foreground)' }}>
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
                      {activeScenario.trips.reduce((sum, t) => {
                        const clients = t.clients || 1;
                        const multiplier = t.multiplier !== undefined ? t.multiplier : (t.roundTrip ? 2 : 1);
                        return sum + t.tripsPerMonth * clients * multiplier;
                      }, 0)}
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
                    serviceCodes={serviceCodes}
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















