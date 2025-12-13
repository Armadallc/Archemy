/**
 * Treatment Facilities Module
 * Main component for managing 3 treatment facility slots
 */

import React, { useState } from 'react';
import { FacilityCard } from './FacilityCard';
import { FacilityForm } from './FacilityForm';
import { useProphetStore } from '../hooks/useProphetStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { TreatmentFacility } from '../types';
import { Building2, Users, FileCheck, Car, DollarSign, TrendingUp } from 'lucide-react';

export function TreatmentFacilitiesManager() {
  const { facilities, addFacility, updateFacility, deleteFacility, calculateFacilityRevenue } = useProphetStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<TreatmentFacility | undefined>();

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
    // TODO: Open analysis modal
    console.log('Analyze facility:', facility.name);
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
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Building2 className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          Treatment Facilities
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
        <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
              📊 COMBINED ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <Users className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-lime)' }} />
                <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {totalClients}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Total Clients
                </div>
              </div>

              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <FileCheck className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-ice)' }} />
                <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {totalWithWaivers}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  With Waivers ({waiverPercentage}%)
                </div>
              </div>

              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <Car className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--color-coral)' }} />
                <div className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  {totalWeeklyTrips}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Weekly Trips
                </div>
              </div>

              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                <DollarSign className="h-5 w-5 mx-auto mb-1" style={{ color: 'var(--status-success)' }} />
                <div className="text-xl font-bold" style={{ color: 'var(--status-success)' }}>
                  ${totalMonthlyRevenue.toLocaleString()}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Est. Monthly Revenue
                </div>
              </div>

              <div className="text-center p-3 rounded-lg border-2" style={{ 
                backgroundColor: totalMonthlyRevenue > 0 ? 'rgba(59, 254, 201, 0.1)' : 'var(--muted)',
                borderColor: totalMonthlyRevenue > 0 ? 'var(--color-lime)' : 'var(--border)',
              }}>
                <TrendingUp className="h-5 w-5 mx-auto mb-1" style={{ 
                  color: totalMonthlyRevenue > 0 ? 'var(--color-lime)' : 'var(--muted-foreground)' 
                }} />
                <div className="text-xl font-bold" style={{ 
                  color: totalMonthlyRevenue > 0 ? 'var(--color-lime)' : 'var(--muted-foreground)' 
                }}>
                  {totalMonthlyRevenue > 0 ? 'Active' : '—'}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
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
    </div>
  );
}

export { FacilityCard } from './FacilityCard';
export { FacilityForm } from './FacilityForm';
export default TreatmentFacilitiesManager;










