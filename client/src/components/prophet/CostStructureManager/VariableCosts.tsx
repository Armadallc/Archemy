/**
 * Variable Costs Component
 * Tabbed interface for all variable cost categories
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useProphetStore } from '../hooks/useProphetStore';
import { Fuel } from 'lucide-react';
import {
  BasicVariableCosts,
  DirectTransportCosts,
  DriverStaffCosts,
  PatientClientCosts,
  OperationalCosts,
  AdministrativeCosts,
  MarketingCosts,
  ComplianceCosts,
  TechnologyCosts,
  VehicleSpecificCosts,
  HybridSpecificCosts,
  SeasonalCosts,
} from './VariableCosts/index';

export function VariableCosts() {
  const { costStructure } = useProphetStore();
  const variable = costStructure.variable;

  // Calculate total per-mile (for summary display)
  const calculateFuelPerMile = (price: number, mpg: number) => price / mpg;
  const apiCostPerMile = variable.fuelApiPrice 
    ? calculateFuelPerMile(variable.fuelApiPrice, variable.vehicleMpg) 
    : null;
  const manualCostPerMile = calculateFuelPerMile(variable.fuelManualPrice, variable.vehicleMpg);
  const activeFuelCost = variable.fuelMode === 'api' && apiCostPerMile
    ? apiCostPerMile
    : manualCostPerMile;
  const totalPerMile = activeFuelCost + 
    variable.maintenancePerMile + 
    variable.insuranceVariablePerMile +
    (variable.directTransport?.tiresPerMile || 0) +
    (variable.directTransport?.repairsPerMile || 0) +
    (variable.directTransport?.oilFilterPerMile || 0) +
    (variable.vehicleSpecific?.depreciationPerMile || 0);

  return (
    <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <CardHeader className="pb-3 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#a5c8ca' }}>
          <Fuel className="h-5 w-5" style={{ color: '#a5c8ca' }} />
          VARIABLE COSTS
        </CardTitle>
        <div className="text-xs mt-1" style={{ color: '#a5c8ca', opacity: 0.7 }}>
          Total Per-Mile: <span className="font-bold" style={{ color: '#a5c8ca' }}>${totalPerMile.toFixed(3)}/mile</span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 gap-1 mb-8 card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <TabsTrigger value="basic" className="text-xs" style={{ color: '#a5c8ca' }}>Basic</TabsTrigger>
            <TabsTrigger value="direct" className="text-xs" style={{ color: '#a5c8ca' }}>Direct</TabsTrigger>
            <TabsTrigger value="driver" className="text-xs" style={{ color: '#a5c8ca' }}>Driver</TabsTrigger>
            <TabsTrigger value="patient" className="text-xs" style={{ color: '#a5c8ca' }}>Patient</TabsTrigger>
            <TabsTrigger value="operational" className="text-xs" style={{ color: '#a5c8ca' }}>Operational</TabsTrigger>
            <TabsTrigger value="admin" className="text-xs" style={{ color: '#a5c8ca' }}>Admin</TabsTrigger>
            <TabsTrigger value="marketing" className="text-xs" style={{ color: '#a5c8ca' }}>Marketing</TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs" style={{ color: '#a5c8ca' }}>Compliance</TabsTrigger>
            <TabsTrigger value="technology" className="text-xs" style={{ color: '#a5c8ca' }}>Technology</TabsTrigger>
            <TabsTrigger value="vehicle" className="text-xs" style={{ color: '#a5c8ca' }}>Vehicle</TabsTrigger>
            <TabsTrigger value="hybrid" className="text-xs" style={{ color: '#a5c8ca' }}>Hybrid</TabsTrigger>
            <TabsTrigger value="seasonal" className="text-xs" style={{ color: '#a5c8ca' }}>Seasonal</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-0 space-y-4">
            <BasicVariableCosts />
          </TabsContent>

          <TabsContent value="direct" className="mt-0 space-y-4">
            <DirectTransportCosts />
          </TabsContent>

          <TabsContent value="driver" className="mt-0 space-y-4">
            <DriverStaffCosts />
          </TabsContent>

          <TabsContent value="patient" className="mt-0 space-y-4">
            <PatientClientCosts />
          </TabsContent>

          <TabsContent value="operational" className="mt-0 space-y-4">
            <OperationalCosts />
          </TabsContent>

          <TabsContent value="admin" className="mt-0 space-y-4">
            <AdministrativeCosts />
          </TabsContent>

          <TabsContent value="marketing" className="mt-0 space-y-4">
            <MarketingCosts />
          </TabsContent>

          <TabsContent value="compliance" className="mt-0 space-y-4">
            <ComplianceCosts />
          </TabsContent>

          <TabsContent value="technology" className="mt-0 space-y-4">
            <TechnologyCosts />
          </TabsContent>

          <TabsContent value="vehicle" className="mt-0 space-y-4">
            <VehicleSpecificCosts />
          </TabsContent>

          <TabsContent value="hybrid" className="mt-0 space-y-4">
            <HybridSpecificCosts />
          </TabsContent>

          <TabsContent value="seasonal" className="mt-0 space-y-4">
            <SeasonalCosts />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default VariableCosts;

