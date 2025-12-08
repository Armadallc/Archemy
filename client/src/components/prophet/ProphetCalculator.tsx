/**
 * PROPHET Calculator
 * Precision Revenue Outcome Planning for Healthcare Expense Tracking
 * 
 * Main component that orchestrates all PROPHET modules
 */

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useProphetStore } from './hooks/useProphetStore';
import { CostStructureManager } from './CostStructureManager';
import { ServiceCodeLibrary } from './ServiceCodeLibrary';
import { TreatmentFacilitiesManager } from './TreatmentFacilities';
import { ScenarioBuilder } from './ScenarioBuilder';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DollarSign,
  FileCode,
  Building2,
  BarChart3,
  Save,
  Cloud,
  CloudOff,
  RefreshCw,
  Download,
} from 'lucide-react';

export function ProphetCalculator() {
  const {
    activeTab,
    setActiveTab,
    lastSyncedAt,
    pendingSync,
    syncToSupabase,
    syncFromSupabase,
    costStructure,
    facilities,
    scenarios,
    serviceCodes,
  } = useProphetStore();

  // Initial sync from Supabase on mount
  useEffect(() => {
    syncFromSupabase();
  }, []);

  // Auto-save to Supabase when changes are pending (debounced)
  useEffect(() => {
    if (pendingSync) {
      const timer = setTimeout(() => {
        syncToSupabase();
      }, 5000); // 5 second debounce
      return () => clearTimeout(timer);
    }
  }, [pendingSync]);

  // Calculate summary stats
  const totalMonthlyOverhead = (costStructure.totalFixed || 0) + (costStructure.totalStaffing || 0);
  const totalFacilities = facilities.length;
  const totalScenarios = scenarios.length;
  const customCodes = serviceCodes.filter((c) => c.isCustom).length;

  const handleExport = () => {
    const data = {
      costStructure,
      facilities,
      scenarios,
      serviceCodes: serviceCodes.filter((c) => c.isCustom),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prophet-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="px-6 py-6 rounded-lg border backdrop-blur-md shadow-xl flex items-center justify-between" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', height: '150px' }}>
        <div>
          <h1 
            className="font-bold text-foreground" 
            style={{ 
              fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
              fontSize: '110px'
            }}
          >
            prophet.
          </h1>
        </div>
        
        {/* Sync Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            {pendingSync ? (
              <Badge variant="outline" className="gap-1" style={{ borderColor: 'var(--status-warning)' }}>
                <CloudOff className="h-3 w-3" style={{ color: 'var(--status-warning)' }} />
                Unsaved
              </Badge>
            ) : lastSyncedAt ? (
              <Badge variant="outline" className="gap-1" style={{ borderColor: 'var(--color-lime)' }}>
                <Cloud className="h-3 w-3" style={{ color: 'var(--color-lime)' }} />
                Synced
              </Badge>
            ) : null}
          </div>
          
          <Button variant="outline" size="sm" onClick={() => syncToSupabase()}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => syncFromSupabase()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Sync
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="w-full justify-start" style={{ backgroundColor: 'var(--muted)' }}>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Structure
          </TabsTrigger>
          <TabsTrigger value="codes" className="gap-2">
            <FileCode className="h-4 w-4" />
            Service Codes
          </TabsTrigger>
          <TabsTrigger value="facilities" className="gap-2">
            <Building2 className="h-4 w-4" />
            Treatment Facilities
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Quick Stats - Moved from header */}
        <Card className="mt-4" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <DollarSign className="h-5 w-5" style={{ color: 'var(--color-coral)' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    ${totalMonthlyOverhead.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Monthly Overhead</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <Building2 className="h-5 w-5" style={{ color: 'var(--color-ice)' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {totalFacilities}/3
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Facilities</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <BarChart3 className="h-5 w-5" style={{ color: 'var(--color-lime)' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {totalScenarios}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Scenarios</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <FileCode className="h-5 w-5" style={{ color: 'var(--color-silver)' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                    {serviceCodes.length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Service Codes {customCodes > 0 && `(${customCodes} custom)`}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="costs" className="mt-4">
          <CostStructureManager />
        </TabsContent>

        <TabsContent value="codes" className="mt-4">
          <ServiceCodeLibrary />
        </TabsContent>

        <TabsContent value="facilities" className="mt-4">
          <TreatmentFacilitiesManager />
        </TabsContent>

        <TabsContent value="scenarios" className="mt-4">
          <ScenarioBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ProphetCalculator;

