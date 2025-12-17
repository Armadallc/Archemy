/**
 * Facility Form Component
 * Modal form for adding/editing treatment facilities
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { 
  TreatmentFacility, 
  FacilityType, 
  WaiverType,
  FACILITY_TYPE_LABELS,
  WAIVER_TYPE_LABELS,
} from '../types';
import { Building2, Users, FileCheck, Car, Clock, MapPin } from 'lucide-react';
import { Badge } from '../../ui/badge';

interface FacilityFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (facility: Omit<TreatmentFacility, 'id' | 'slot' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: TreatmentFacility;
}

const defaultFormData = {
  name: '',
  type: 'sober_living' as FacilityType,
  census: {
    bedCapacity: 24,
    currentPopulation: 0,
    occupancyRate: 0,
  },
  paymentStructure: {
    acceptsCash: false,
    acceptsMedicaid: true,
    acceptsPrivateInsurance: false,
  },
  waivers: {
    hasWaivers: false,
    types: [] as WaiverType[],
    clientsWithWaivers: 0,
    waiverPercentage: 0,
  },
  operations: {
    hours: { open: '06:00', close: '22:00' },
    location: {
      address: '',
      city: '',
      zipCode: '',
      avgMilesToDestinations: 15,
    },
  },
  transport: {
    scheduledTripsPerWeek: 0,
    tripsPerClient: 2,
    peakHours: ['08:00', '14:00', '18:00'],
    distribution: {
      medical: 40,
      therapy: 30,
      community: 20,
      legal: 10,
    },
  },
  billingCodes: [],
};

export function FacilityForm({ open, onClose, onSave, initialData }: FacilityFormProps) {
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        type: initialData.type,
        census: { ...initialData.census },
        paymentStructure: { ...initialData.paymentStructure },
        waivers: { ...initialData.waivers },
        operations: {
          hours: { ...initialData.operations.hours },
          location: { ...initialData.operations.location },
        },
        transport: {
          ...initialData.transport,
          distribution: { ...initialData.transport.distribution },
        },
        billingCodes: [...initialData.billingCodes],
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [initialData, open]);

  const handleSave = () => {
    // Calculate derived values
    const occupancyRate = formData.census.bedCapacity > 0
      ? (formData.census.currentPopulation / formData.census.bedCapacity) * 100
      : 0;
    const waiverPercentage = formData.census.currentPopulation > 0
      ? (formData.waivers.clientsWithWaivers / formData.census.currentPopulation) * 100
      : 0;

    onSave({
      ...formData,
      census: {
        ...formData.census,
        occupancyRate,
      },
      waivers: {
        ...formData.waivers,
        waiverPercentage,
      },
    });
    onClose();
  };

  const toggleWaiverType = (type: WaiverType) => {
    const types = formData.waivers.types.includes(type)
      ? formData.waivers.types.filter((t) => t !== type)
      : [...formData.waivers.types, type];
    setFormData({
      ...formData,
      waivers: {
        ...formData.waivers,
        types,
        hasWaivers: types.length > 0,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--card)' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Building2 className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            {initialData ? 'Edit Facility' : 'Add Treatment Facility'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Basic Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sunrise Recovery"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label>Facility Type</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]).map((type) => (
                    <Button
                      key={type}
                      variant={formData.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, type })}
                      style={formData.type === type ? {
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                      } : {}}
                    >
                      {FACILITY_TYPE_LABELS[type]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Census */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Users className="h-4 w-4" style={{ color: 'var(--color-lime)' }} />
              Census
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedCapacity">Bed Capacity</Label>
                <Input
                  id="bedCapacity"
                  type="number"
                  value={formData.census.bedCapacity}
                  onChange={(e) => setFormData({
                    ...formData,
                    census: { ...formData.census, bedCapacity: parseInt(e.target.value) || 0 }
                  })}
                  min={1}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentPopulation">Current Population</Label>
                <Input
                  id="currentPopulation"
                  type="number"
                  value={formData.census.currentPopulation}
                  onChange={(e) => setFormData({
                    ...formData,
                    census: { ...formData.census, currentPopulation: parseInt(e.target.value) || 0 }
                  })}
                  min={0}
                  max={formData.census.bedCapacity}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>

          {/* Payment Structure */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <FileCheck className="h-4 w-4" style={{ color: 'var(--color-ice)' }} />
              Payment Structure
            </h4>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="acceptsCash"
                  checked={formData.paymentStructure.acceptsCash}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    paymentStructure: { ...formData.paymentStructure, acceptsCash: v }
                  })}
                />
                <Label htmlFor="acceptsCash">Cash</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="acceptsMedicaid"
                  checked={formData.paymentStructure.acceptsMedicaid}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    paymentStructure: { ...formData.paymentStructure, acceptsMedicaid: v }
                  })}
                />
                <Label htmlFor="acceptsMedicaid">Medicaid</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="acceptsPrivateInsurance"
                  checked={formData.paymentStructure.acceptsPrivateInsurance}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    paymentStructure: { ...formData.paymentStructure, acceptsPrivateInsurance: v }
                  })}
                />
                <Label htmlFor="acceptsPrivateInsurance">Private Insurance</Label>
              </div>
            </div>
          </div>

          {/* Waivers */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              HCBS Waivers
            </h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(WAIVER_TYPE_LABELS) as WaiverType[]).map((type) => (
                <Badge
                  key={type}
                  variant={formData.waivers.types.includes(type) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleWaiverType(type)}
                  style={formData.waivers.types.includes(type) ? {
                    backgroundColor: 'var(--color-lime)',
                    color: 'var(--color-charcoal)',
                  } : {}}
                >
                  {WAIVER_TYPE_LABELS[type]}
                </Badge>
              ))}
            </div>
            {formData.waivers.types.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="clientsWithWaivers">Clients with Waivers</Label>
                <Input
                  id="clientsWithWaivers"
                  type="number"
                  value={formData.waivers.clientsWithWaivers}
                  onChange={(e) => setFormData({
                    ...formData,
                    waivers: { ...formData.waivers, clientsWithWaivers: parseInt(e.target.value) || 0 }
                  })}
                  min={0}
                  max={formData.census.currentPopulation}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <MapPin className="h-4 w-4" style={{ color: 'var(--color-coral)' }} />
              Location
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.operations.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    operations: {
                      ...formData.operations,
                      location: { ...formData.operations.location, city: e.target.value }
                    }
                  })}
                  placeholder="Denver"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.operations.location.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    operations: {
                      ...formData.operations,
                      location: { ...formData.operations.location, zipCode: e.target.value }
                    }
                  })}
                  placeholder="80202"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgMiles">Avg. Miles to Destinations</Label>
                <Input
                  id="avgMiles"
                  type="number"
                  value={formData.operations.location.avgMilesToDestinations}
                  onChange={(e) => setFormData({
                    ...formData,
                    operations: {
                      ...formData.operations,
                      location: { ...formData.operations.location, avgMilesToDestinations: parseInt(e.target.value) || 0 }
                    }
                  })}
                  min={1}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>

          {/* Transport */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Car className="h-4 w-4" style={{ color: 'var(--primary)' }} />
              Transport Needs
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tripsPerWeek">Scheduled Trips/Week</Label>
                <Input
                  id="tripsPerWeek"
                  type="number"
                  value={formData.transport.scheduledTripsPerWeek}
                  onChange={(e) => setFormData({
                    ...formData,
                    transport: { ...formData.transport, scheduledTripsPerWeek: parseInt(e.target.value) || 0 }
                  })}
                  min={0}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tripsPerClient">Trips/Client (avg)</Label>
                <Input
                  id="tripsPerClient"
                  type="number"
                  value={formData.transport.tripsPerClient}
                  onChange={(e) => setFormData({
                    ...formData,
                    transport: { ...formData.transport, tripsPerClient: parseFloat(e.target.value) || 0 }
                  })}
                  min={0}
                  step={0.5}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
            
            {/* Trip Distribution */}
            <div className="space-y-2">
              <Label>Trip Type Distribution (%)</Label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Medical</Label>
                  <Input
                    type="number"
                    value={formData.transport.distribution.medical}
                    onChange={(e) => setFormData({
                      ...formData,
                      transport: {
                        ...formData.transport,
                        distribution: { ...formData.transport.distribution, medical: parseInt(e.target.value) || 0 }
                      }
                    })}
                    min={0}
                    max={100}
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Therapy</Label>
                  <Input
                    type="number"
                    value={formData.transport.distribution.therapy}
                    onChange={(e) => setFormData({
                      ...formData,
                      transport: {
                        ...formData.transport,
                        distribution: { ...formData.transport.distribution, therapy: parseInt(e.target.value) || 0 }
                      }
                    })}
                    min={0}
                    max={100}
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Community</Label>
                  <Input
                    type="number"
                    value={formData.transport.distribution.community}
                    onChange={(e) => setFormData({
                      ...formData,
                      transport: {
                        ...formData.transport,
                        distribution: { ...formData.transport.distribution, community: parseInt(e.target.value) || 0 }
                      }
                    })}
                    min={0}
                    max={100}
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Legal</Label>
                  <Input
                    type="number"
                    value={formData.transport.distribution.legal}
                    onChange={(e) => setFormData({
                      ...formData,
                      transport: {
                        ...formData.transport,
                        distribution: { ...formData.transport.distribution, legal: parseInt(e.target.value) || 0 }
                      }
                    })}
                    min={0}
                    max={100}
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Clock className="h-4 w-4" style={{ color: 'var(--color-silver)' }} />
              Operating Hours
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openTime">Opens</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.operations.hours.open}
                  onChange={(e) => setFormData({
                    ...formData,
                    operations: {
                      ...formData.operations,
                      hours: { ...formData.operations.hours, open: e.target.value }
                    }
                  })}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeTime">Closes</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.operations.hours.close}
                  onChange={(e) => setFormData({
                    ...formData,
                    operations: {
                      ...formData.operations,
                      hours: { ...formData.operations.hours, close: e.target.value }
                    }
                  })}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name}
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {initialData ? 'Update Facility' : 'Add Facility'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FacilityForm;














