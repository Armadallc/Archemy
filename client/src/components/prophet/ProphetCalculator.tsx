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
import { RollbackManager } from '../../utils/rollback-manager';
import { useAuth } from '../../hooks/useAuth';
import { HeaderScopeSelector } from '../HeaderScopeSelector';

export function ProphetCalculator() {
  const { user } = useAuth();
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

  // Feature flag check - hide page header when unified header is enabled
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  return (
    <div className="space-y-6">
      {/* Header - Only show if unified header is disabled (fallback) */}
      {!ENABLE_UNIFIED_HEADER && (
        <div className="flex-shrink-0 mb-6">
          <div className="px-6 py-6 rounded-lg card-neu flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px', boxShadow: '8px 8px 16px 0px rgba(30, 32, 35, 0.6), -8px -8px 16px 0px rgba(30, 32, 35, 0.05)' }}>
          <div>
            <h1 
              className="font-bold" 
              style={{ 
                fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                fontSize: '110px',
                fontWeight: 700,
                color: '#a5c8ca'
              }}
            >
              prophet.
            </h1>
          </div>
          
          {/* Sync Status & Actions */}
        <div className="flex items-center gap-6">
          {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
            <HeaderScopeSelector />
          )}
          <div className="flex items-center gap-6 text-sm">
            {pendingSync ? (
              <Badge variant="outline" className="gap-1 card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <CloudOff className="h-3 w-3" style={{ color: '#a5c8ca' }} />
                <span style={{ color: '#a5c8ca' }}>Unsaved</span>
              </Badge>
            ) : lastSyncedAt ? (
              <Badge variant="outline" className="gap-1 card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <Cloud className="h-3 w-3" style={{ color: '#a5c8ca' }} />
                <span style={{ color: '#a5c8ca' }}>Synced</span>
              </Badge>
            ) : null}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => syncToSupabase()}
            className="card-neu-flat hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            <Save className="h-4 w-4 mr-1" style={{ color: '#a5c8ca' }} />
            <span style={{ color: '#a5c8ca' }}>Save</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => syncFromSupabase()}
            className="card-neu-flat hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            <RefreshCw className="h-4 w-4 mr-1" style={{ color: '#a5c8ca' }} />
            <span style={{ color: '#a5c8ca' }}>Sync</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            className="card-neu-flat hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            <Download className="h-4 w-4 mr-1" style={{ color: '#a5c8ca' }} />
            <span style={{ color: '#a5c8ca' }}>Export</span>
          </Button>
        </div>
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="w-full justify-start card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <TabsTrigger value="costs" className="gap-6" style={{ color: '#a5c8ca' }}>
            <DollarSign className="h-4 w-4" style={{ color: '#a5c8ca' }} />
            Cost Structure
          </TabsTrigger>
          <TabsTrigger value="codes" className="gap-6" style={{ color: '#a5c8ca' }}>
            <FileCode className="h-4 w-4" style={{ color: '#a5c8ca' }} />
            Service Codes
          </TabsTrigger>
          <TabsTrigger value="facilities" className="gap-6" style={{ color: '#a5c8ca' }}>
            <Building2 className="h-4 w-4" style={{ color: '#a5c8ca' }} />
            Treatment Facilities
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-6" style={{ color: '#a5c8ca' }}>
            <BarChart3 className="h-4 w-4" style={{ color: '#a5c8ca' }} />
            Scenarios
          </TabsTrigger>
        </TabsList>

        {/* Quick Stats - Moved from header */}
        <Card className="mt-6 card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-4 gap-6">
              <div className="flex items-center gap-6 p-6 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <DollarSign className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                    ${totalMonthlyOverhead.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Monthly Overhead</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-6 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <Building2 className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                    {totalFacilities}/3
                  </div>
                  <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Facilities</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-6 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <BarChart3 className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                    {totalScenarios}
                  </div>
                  <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Scenarios</div>
                </div>
              </div>
              
              <div className="flex items-center gap-6 p-6 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <FileCode className="h-5 w-5" style={{ color: '#a5c8ca' }} />
                <div>
                  <div className="text-lg font-bold" style={{ color: '#a5c8ca' }}>
                    {serviceCodes.length}
                  </div>
                  <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                    Service Codes {customCodes > 0 && `(${customCodes} custom)`}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="costs" className="mt-6">
          <CostStructureManager />
        </TabsContent>

        <TabsContent value="codes" className="mt-6">
          <ServiceCodeLibrary />
        </TabsContent>

        <TabsContent value="facilities" className="mt-6">
          <TreatmentFacilitiesManager />
        </TabsContent>

        <TabsContent value="scenarios" className="mt-6">
          <ScenarioBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}


