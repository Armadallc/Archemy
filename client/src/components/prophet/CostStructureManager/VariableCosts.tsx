/**
 * Variable Costs Component
 * Per-mile costs with EIA fuel price integration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useProphetStore } from '../hooks/useProphetStore';
import { EditableField } from '../shared/EditableField';
import { Fuel, Wrench, Shield, ToggleLeft, ToggleRight, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { Button } from '../../ui/button';

// EIA API Configuration
const EIA_API_KEY = "wKLIXuy9MEDpCEFNk7041YHKm2GZWWfgjHn3VqMf";
const EIA_BASE_URL = "https://api.eia.gov/v2/petroleum/pri/gnd/data/";

interface GasolinePrice {
  period: string;
  product: string;
  productName: string;
  area: string;
  areaName: string;
  value: string;
  units: string;
}

interface EIAResponse {
  response: {
    total: string;
    data: GasolinePrice[];
  };
}

export function VariableCosts() {
  const { costStructure, updateVariableCosts, setFuelApiPrice } = useProphetStore();
  const variable = costStructure.variable;
  const [isLoadingEIA, setIsLoadingEIA] = useState(false);
  const [eiaError, setEiaError] = useState<string | null>(null);

  // Calculate fuel cost per mile based on mode
  const calculateFuelPerMile = (price: number, mpg: number) => price / mpg;

  const apiCostPerMile = variable.fuelApiPrice 
    ? calculateFuelPerMile(variable.fuelApiPrice, variable.vehicleMpg) 
    : null;
  const manualCostPerMile = calculateFuelPerMile(variable.fuelManualPrice, variable.vehicleMpg);

  const activeFuelCost = variable.fuelMode === 'api' && apiCostPerMile
    ? apiCostPerMile
    : manualCostPerMile;

  const totalPerMile = activeFuelCost + variable.maintenancePerMile + variable.insuranceVariablePerMile;

  // Fetch EIA gasoline prices
  const fetchEIAFuelPrice = async () => {
    setIsLoadingEIA(true);
    setEiaError(null);

    try {
      // Fetch Denver, Colorado gasoline prices (Regular - EPMR)
      const url = `${EIA_BASE_URL}?api_key=${EIA_API_KEY}&frequency=weekly&data[0]=value&facets[duoarea][]=YDEN&sort[0][column]=period&sort[0][direction]=desc&length=10`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: EIAResponse = await response.json();
      
      // Get Regular prices (product code EPMR)
      const regularPrices = data.response?.data?.filter(p => p.product === "EPMR") || [];
      
      if (regularPrices.length > 0) {
        const currentPrice = parseFloat(regularPrices[0].value);
        setFuelApiPrice(currentPrice);
      } else {
        throw new Error('No regular gasoline price data found');
      }
    } catch (err) {
      console.error("Error fetching EIA data:", err);
      setEiaError(err instanceof Error ? err.message : "Failed to fetch gasoline prices");
    } finally {
      setIsLoadingEIA(false);
    }
  };

  // Auto-fetch on mount if using API mode
  useEffect(() => {
    if (variable.fuelMode === 'api' && !variable.fuelApiPrice) {
      fetchEIAFuelPrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable.fuelMode, variable.fuelApiPrice]);

  // Mode buttons
  const ModeButton = ({ mode, label }: { mode: 'api' | 'manual' | 'compare'; label: string }) => (
    <Button
      variant={variable.fuelMode === mode ? 'default' : 'outline'}
      size="sm"
      onClick={() => updateVariableCosts({ fuelMode: mode })}
      className="text-xs"
      style={variable.fuelMode === mode ? {
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
      } : {
        borderColor: 'var(--border)',
        color: 'var(--muted-foreground)',
      }}
    >
      {mode === 'api' && <ToggleRight className="h-3 w-3 mr-1" />}
      {mode === 'manual' && <ToggleLeft className="h-3 w-3 mr-1" />}
      {mode === 'compare' && <ArrowLeftRight className="h-3 w-3 mr-1" />}
      {label}
    </Button>
  );

  return (
    <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: 'var(--foreground)' }}>
          <Fuel className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          Variable Costs (Per Mile)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fuel Section with Toggle */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Fuel className="h-4 w-4" style={{ color: 'var(--color-coral)' }} />
              Fuel Costs
            </h4>
            <div className="flex gap-1">
              <ModeButton mode="api" label="EIA API" />
              <ModeButton mode="manual" label="Manual" />
              <ModeButton mode="compare" label="Compare" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* EIA API Price */}
            <div className={`p-3 rounded-md border ${variable.fuelMode === 'api' ? 'border-primary' : 'border-border/50'}`}
              style={{ backgroundColor: 'var(--surface)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  EIA API (Auto)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={fetchEIAFuelPrice}
                  disabled={isLoadingEIA}
                  title="Refresh EIA price"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingEIA ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {isLoadingEIA ? (
                  <span className="text-sm">Loading...</span>
                ) : variable.fuelApiPrice ? (
                  `$${variable.fuelApiPrice.toFixed(2)}`
                ) : (
                  '—'
                )}/gal
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                {apiCostPerMile ? `$${apiCostPerMile.toFixed(3)}/mile` : eiaError ? 'Error loading' : 'No data'}
              </div>
              {eiaError && (
                <div className="text-xs mt-1" style={{ color: 'var(--status-error)' }}>
                  {eiaError}
                </div>
              )}
              {variable.fuelMode === 'api' && (
                <div className="mt-2 text-xs font-medium" style={{ color: 'var(--color-lime)' }}>
                  ✓ ACTIVE
                </div>
              )}
            </div>

            {/* Manual Price */}
            <div className={`p-3 rounded-md border ${variable.fuelMode === 'manual' ? 'border-primary' : 'border-border/50'}`}
              style={{ backgroundColor: 'var(--surface)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Manual Entry
              </div>
              <div className="flex items-center gap-1">
                <EditableField
                  value={variable.fuelManualPrice}
                  onChange={(v) => updateVariableCosts({ fuelManualPrice: Number(v) })}
                  type="currency"
                  displayClassName="text-lg font-bold"
                />
                <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>/gal</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                ${manualCostPerMile.toFixed(3)}/mile
              </div>
              {variable.fuelMode === 'manual' && (
                <div className="mt-2 text-xs font-medium" style={{ color: 'var(--color-lime)' }}>
                  ✓ ACTIVE
                </div>
              )}
            </div>
          </div>

          {/* Compare Mode */}
          {variable.fuelMode === 'compare' && apiCostPerMile && (
            <div className="mt-3 p-3 rounded-md border" style={{ borderColor: 'var(--color-ice)', backgroundColor: 'rgba(232, 255, 254, 0.05)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-ice)' }}>
                Comparison (uses manual for calculations)
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span style={{ color: 'var(--muted-foreground)' }}>API: </span>
                  <span style={{ color: 'var(--foreground)' }}>${apiCostPerMile.toFixed(3)}/mi</span>
                </div>
                <div>
                  <span style={{ color: 'var(--muted-foreground)' }}>Manual: </span>
                  <span style={{ color: 'var(--foreground)' }}>${manualCostPerMile.toFixed(3)}/mi</span>
                </div>
                <div>
                  <span style={{ color: 'var(--muted-foreground)' }}>Diff: </span>
                  <span style={{
                    color: apiCostPerMile > manualCostPerMile ? 'var(--status-error)' : 'var(--status-success)'
                  }}>
                    {apiCostPerMile > manualCostPerMile ? '+' : ''}
                    ${(apiCostPerMile - manualCostPerMile).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle MPG */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Vehicle MPG:</span>
            <EditableField
              value={variable.vehicleMpg}
              onChange={(v) => updateVariableCosts({ vehicleMpg: Number(v) })}
              type="number"
              min={5}
              max={50}
              step={0.5}
              suffix=" mpg"
            />
          </div>
        </div>

        {/* Other Variable Costs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
                <Wrench className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Maintenance</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Per mile wear & tear</div>
              </div>
            </div>
            <EditableField
              value={variable.maintenancePerMile}
              onChange={(v) => updateVariableCosts({ maintenancePerMile: Number(v) })}
              type="currency"
              suffix="/mi"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
                <Shield className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Insurance Variable</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Mileage-based premium</div>
              </div>
            </div>
            <EditableField
              value={variable.insuranceVariablePerMile}
              onChange={(v) => updateVariableCosts({ insuranceVariablePerMile: Number(v) })}
              type="currency"
              suffix="/mi"
            />
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Total Variable Cost
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              ${totalPerMile.toFixed(3)}/mile
            </span>
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            × estimated monthly miles = variable overhead
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default VariableCosts;

