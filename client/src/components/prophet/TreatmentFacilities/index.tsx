/**
 * Treatment Facilities Module
 * Main component for managing 3 treatment facility slots
 */

import React, { useState } from 'react';
import { FacilityCard } from './FacilityCard';
import { FacilityForm } from './FacilityForm';
import { ContractAnalysisModal } from './ContractAnalysis/ContractAnalysisModal';
import { useProphetStore } from '../hooks/useProphetStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { TreatmentFacility } from '../types';
import { Building2, Users, FileCheck, Car, DollarSign, TrendingUp } from 'lucide-react';
import { useFeatureFlag } from '../../../hooks/use-permissions';

export function TreatmentFacilitiesManager() {
  const { facilities, addFacility, updateFacility, deleteFacility, calculateFacilityRevenue } = useProphetStore();
  const { isEnabled: isContractAnalysisEnabled } = useFeatureFlag('contract_analysis');
  const [formOpen, setFormOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<TreatmentFacility | undefined>();
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [analyzingFacility, setAnalyzingFacility] = useState<TreatmentFacility | undefined>();

  const handleAdd = () => {
    setEditingFacility(undefined);
    setFormOpen(true);
  };

  const handleEdit = (facility: TreatmentFacility) => {
    setEditingFacility(facility);
    setFormOpen(true);
  };

  const handleSave = (data: Omit<TreatmentFacility, 'id' | 'slot' | 'createdAt' | 'updatedAt'>) => {
    if (editingFacility) {
      updateFacility(editingFacility.id, data);
    } else {
      addFacility(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this facility?')) {
      deleteFacility(id);
    }
  };

  const handleAnalyze = (facility: TreatmentFacility) => {
    setAnalyzingFacility(facility);
    setAnalysisModalOpen(true);
  };

  // Get facilities by slot
  const facilitySlots = [1, 2, 3].map((slot) => ({
    slot: slot as 1 | 2 | 3,
    facility: facilities.find((f) => f.slot === slot),
  }));

  // Calculate combined stats
  const totalClients = facilities.reduce((sum, f) => sum + f.census.currentPopulation, 0);
  const totalWithWaivers = facilities.reduce((sum, f) => sum + f.waivers.clientsWithWaivers, 0);
  const totalWeeklyTrips = facilities.reduce((sum, f) => sum + f.transport.scheduledTripsPerWeek, 0);
  const totalMonthlyRevenue = facilities.reduce((sum, f) => sum + calculateFacilityRevenue(f.id), 0);
  const waiverPercentage = totalClients > 0 ? Math.round((totalWithWaivers / totalClients) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: '#a5c8ca' }}>
          <Building2 className="h-5 w-5" style={{ color: '#a5c8ca' }} />
          TREATMENT FACILITIES
        </h3>
      </div>

      {/* Facility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {facilitySlots.map(({ slot, facility }) => (
          <FacilityCard
            key={slot}
            slot={slot}
            facility={facility}
            onAdd={handleAdd}
            onEdit={() => facility && handleEdit(facility)}
            onDelete={() => facility && handleDelete(facility.id)}
            onAnalyze={() => facility && handleAnalyze(facility)}
          />
        ))}
      </div>

      {/* Combined Analysis */}
      {facilities.length > 0 && (
        <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardHeader className="pb-2 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: '#a5c8ca' }}>
              📊 COMBINED ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <Users className="h-5 w-5 mx-auto mb-1" style={{ color: '#a5c8ca' }} />
                <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>
                  {totalClients}
                </div>
                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  Total Clients
                </div>
              </div>

              <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <FileCheck className="h-5 w-5 mx-auto mb-1" style={{ color: '#a5c8ca' }} />
                <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>
                  {totalWithWaivers}
                </div>
                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  With Waivers ({waiverPercentage}%)
                </div>
              </div>

              <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <Car className="h-5 w-5 mx-auto mb-1" style={{ color: '#a5c8ca' }} />
                <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>
                  {totalWeeklyTrips}
                </div>
                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  Weekly Trips
                </div>
              </div>

              <div className="text-center p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <DollarSign className="h-5 w-5 mx-auto mb-1" style={{ color: '#a5c8ca' }} />
                <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>
                  ${totalMonthlyRevenue.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  Est. Monthly Revenue
                </div>
              </div>

              <div className="text-center p-3 rounded-lg border-2 card-neu-pressed" style={{ 
                backgroundColor: 'var(--background)',
                borderColor: '#a5c8ca',
                boxShadow: 'var(--shadow-neu-pressed)'
              }}>
                <TrendingUp className="h-5 w-5 mx-auto mb-1" style={{ color: '#a5c8ca' }} />
                <div className="text-xl font-bold" style={{ color: '#a5c8ca' }}>
                  {totalMonthlyRevenue > 0 ? 'Active' : '—'}
                </div>
                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
                  {facilities.length} Facility Contracts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <FacilityForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialData={editingFacility}
      />

      {/* Contract Analysis Modal */}
      {isContractAnalysisEnabled && analyzingFacility && (
        <ContractAnalysisModal
          open={analysisModalOpen}
          onOpenChange={(open) => {
            setAnalysisModalOpen(open);
            if (!open) {
              setAnalyzingFacility(undefined);
            }
          }}
          facility={analyzingFacility}
        />
      )}
    </div>
  );
}

export { FacilityCard } from './FacilityCard';
export { FacilityForm } from './FacilityForm';
export default TreatmentFacilitiesManager;















