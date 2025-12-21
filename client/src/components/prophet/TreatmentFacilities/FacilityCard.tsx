/**
 * Facility Card Component
 * Displays a treatment facility slot
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Building2, 
  Users, 
  FileCheck, 
  Car, 
  Clock,
  MapPin,
  Edit,
  Trash2,
  BarChart3,
  Plus
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { TreatmentFacility, FACILITY_TYPE_LABELS, WAIVER_TYPE_LABELS } from '../types';
import { useFeatureFlag } from '../../../hooks/use-permissions';

interface FacilityCardProps {
  facility?: TreatmentFacility;
  slot: 1 | 2 | 3;
  onEdit: () => void;
  onDelete: () => void;
  onAdd: () => void;
  onAnalyze: () => void;
}

export function FacilityCard({ facility, slot, onEdit, onDelete, onAdd, onAnalyze }: FacilityCardProps) {
  const { isEnabled: isContractAnalysisEnabled } = useFeatureFlag('contract_analysis');
  
  // Empty slot
  if (!facility) {
    return (
      <Card 
        className="h-full border-dashed cursor-pointer hover:border-primary transition-colors"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        onClick={onAdd}
      >
        <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] gap-4">
          <div className="p-4 rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
            <Plus className="h-8 w-8" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <div className="text-center">
            <p className="font-medium" style={{ color: 'var(--foreground)' }}>
              Facility {slot}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Click to add a treatment facility
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate occupancy
  const occupancyRate = facility.census.bedCapacity > 0 
    ? Math.round((facility.census.currentPopulation / facility.census.bedCapacity) * 100) 
    : 0;

  // Calculate waiver percentage
  const waiverPercentage = facility.census.currentPopulation > 0
    ? Math.round((facility.waivers.clientsWithWaivers / facility.census.currentPopulation) * 100)
    : 0;

  return (
    <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Building2 className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              {facility.name}
            </CardTitle>
            <Badge 
              variant="outline" 
              className="mt-1 text-xs"
              style={{
                backgroundColor: 'rgba(232, 255, 254, 0.1)',
                borderColor: 'var(--color-ice)',
                color: 'var(--color-ice)',
              }}
            >
              {FACILITY_TYPE_LABELS[facility.type]}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEdit}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-status-error" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Census */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" style={{ color: 'var(--color-lime)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Census</span>
            </div>
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
              {facility.census.currentPopulation}/{facility.census.bedCapacity}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${occupancyRate}%`,
                backgroundColor: occupancyRate > 90 ? 'var(--status-error)' : 
                                 occupancyRate > 70 ? 'var(--status-warning)' : 'var(--color-lime)',
              }}
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {occupancyRate}% occupancy
          </span>
        </div>

        {/* Waivers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" style={{ color: 'var(--color-ice)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Waivers</span>
          </div>
          {facility.waivers.hasWaivers ? (
            <div className="pl-6">
              <div className="flex flex-wrap gap-1">
                {facility.waivers.types.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {facility.waivers.clientsWithWaivers}
                  </Badge>
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {waiverPercentage}% of clients
              </span>
            </div>
          ) : (
            <span className="text-xs pl-6" style={{ color: 'var(--muted-foreground)' }}>
              No waiver clients
            </span>
          )}
        </div>

        {/* Transport */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4" style={{ color: 'var(--color-coral)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Transport</span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
              {facility.transport.scheduledTripsPerWeek}/wk
            </span>
          </div>
          <div className="pl-6 flex items-center gap-2">
            <Clock className="h-3 w-3" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Peak: {facility.transport.peakHours.join(', ')}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <MapPin className="h-3 w-3" />
          {facility.operations.location.city} • ~{facility.operations.location.avgMilesToDestinations} mi avg
        </div>

        {/* Actions */}
        {isContractAnalysisEnabled && (
          <div className="mt-2 space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAnalyze}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {facility.contractAnalysis ? 'View Analysis' : 'Analyze Contract'}
            </Button>
            {facility.contractAnalysis && (
              <div className="text-xs text-center" style={{ color: 'var(--muted-foreground)' }}>
                Analysis saved {facility.contractAnalysis.updatedAt 
                  ? new Date(facility.contractAnalysis.updatedAt).toLocaleDateString()
                  : ''}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FacilityCard;















