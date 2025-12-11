/**
 * Staffing Costs Component
 * Owner, driver, and admin labor costs
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useProphetStore } from '../hooks/useProphetStore';
import { EditableField } from '../shared/EditableField';
import { Users, UserCog, Car, ClipboardList, Plus, Minus } from 'lucide-react';
import { Switch } from '../../ui/switch';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';

interface StaffRowProps {
  role: 'owner' | 'driver' | 'admin';
  icon: React.ReactNode;
  label: string;
  description: string;
}

function StaffRow({ role, icon, label, description }: StaffRowProps) {
  const { costStructure, updateStaffingCosts } = useProphetStore();
  const staff = costStructure.staffing[role];

  const handleUpdate = (field: string, value: number | boolean) => {
    updateStaffingCosts({
      [role]: {
        ...staff,
        [field]: value,
      },
    });
  };

  return (
    <div className={`p-4 rounded-lg border transition-opacity ${staff.enabled ? '' : 'opacity-50'}`}
      style={{ 
        backgroundColor: 'var(--surface)', 
        borderColor: staff.enabled ? 'var(--border)' : 'var(--border)' 
      }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
            {icon}
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${role}-enabled`} className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {staff.enabled ? 'Active' : 'Inactive'}
          </Label>
          <Switch
            id={`${role}-enabled`}
            checked={staff.enabled}
            onCheckedChange={(v) => handleUpdate('enabled', v)}
          />
        </div>
      </div>

      {staff.enabled && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Hourly Rate</span>
              <EditableField
                value={staff.hourlyRate}
                onChange={(v) => handleUpdate('hourlyRate', Number(v))}
                type="currency"
                suffix="/hr"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Hours/Month</span>
              <EditableField
                value={staff.hoursPerMonth}
                onChange={(v) => handleUpdate('hoursPerMonth', Number(v))}
                type="number"
                min={0}
                max={240}
                step={1}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Benefits %</span>
              <EditableField
                value={staff.benefitsPercentage}
                onChange={(v) => handleUpdate('benefitsPercentage', Number(v))}
                type="number"
                min={0}
                max={100}
                step={1}
                suffix="%"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center items-end">
            <div className="text-right">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Base Pay</div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                ${staff.basePay.toFixed(2)}
              </div>
            </div>
            <div className="text-right mt-2">
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Total Cost</div>
              <div className="text-lg font-bold" style={{ color: 'var(--color-lime)' }}>
                ${staff.totalCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StaffingCosts() {
  const { costStructure, updateStaffingCosts } = useProphetStore();
  const staffing = costStructure.staffing;

  // Calculate total staffing costs
  const calculateTotal = () => {
    let total = 0;
    if (staffing.owner.enabled) total += staffing.owner.totalCost;
    if (staffing.driver.enabled) {
      total += staffing.driver.totalCost * (1 + staffing.additionalDrivers);
    }
    if (staffing.admin.enabled) total += staffing.admin.totalCost;
    return total;
  };

  const totalStaffing = calculateTotal();

  return (
    <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: 'var(--foreground)' }}>
          <Users className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          Staffing Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner */}
        <StaffRow
          role="owner"
          icon={<UserCog className="h-4 w-4" style={{ color: 'var(--primary)' }} />}
          label="Owner/Operator"
          description="Primary driver & manager"
        />

        {/* Driver */}
        <StaffRow
          role="driver"
          icon={<Car className="h-4 w-4" style={{ color: 'var(--color-lime)' }} />}
          label="Driver"
          description="Full-time driver position"
        />

        {/* Additional Drivers */}
        {staffing.driver.enabled && (
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                Additional Drivers
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Same rate as primary driver
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateStaffingCosts({
                  additionalDrivers: Math.max(0, staffing.additionalDrivers - 1)
                })}
                disabled={staffing.additionalDrivers === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-bold w-8 text-center" style={{ color: 'var(--foreground)' }}>
                {staffing.additionalDrivers}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => updateStaffingCosts({
                  additionalDrivers: staffing.additionalDrivers + 1
                })}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {staffing.additionalDrivers > 0 && (
                <span className="text-sm" style={{ color: 'var(--color-lime)' }}>
                  +${(staffing.driver.totalCost * staffing.additionalDrivers).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Admin */}
        <StaffRow
          role="admin"
          icon={<ClipboardList className="h-4 w-4" style={{ color: 'var(--color-ice)' }} />}
          label="Admin/Scheduler"
          description="Part-time office support"
        />

        {/* Total */}
        <div className="pt-4 border-t-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Total Staffing Costs
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              ${totalStaffing.toFixed(2)}/mo
            </span>
          </div>
          <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
            <span>
              {[
                staffing.owner.enabled && 'Owner',
                staffing.driver.enabled && `${1 + staffing.additionalDrivers} Driver(s)`,
                staffing.admin.enabled && 'Admin',
              ].filter(Boolean).join(' + ')}
            </span>
            <span>
              {Object.values(staffing).filter((s: any) => s.enabled !== undefined && s.enabled).length} active positions
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StaffingCosts;





