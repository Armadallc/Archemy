/**
 * Fixed Costs Component
 * Manages monthly fixed overhead expenses
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useProphetStore } from '../hooks/useProphetStore';
import { EditableField } from '../shared/EditableField';
import { Building2, Shield, FileCheck, Car, Wrench, MonitorSmartphone, TestTube, FolderOpen } from 'lucide-react';

interface CostRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (val: number) => void;
  description?: string;
  multiplier?: number;
  multiplierLabel?: string;
}

function CostRow({ icon, label, value, onChange, description, multiplier, multiplierLabel }: CostRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</div>
          {description && (
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <EditableField
          value={value}
          onChange={(v) => onChange(Number(v))}
          type="currency"
        />
        {multiplier && multiplier > 1 && (
          <span className="text-xs text-muted-foreground">
            × {multiplier} {multiplierLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function FixedCosts() {
  const { costStructure, updateFixedCosts } = useProphetStore();
  const fixed = costStructure.fixed;

  // Calculate totals
  const insuranceTotal = fixed.insuranceCommercialAuto + fixed.insuranceGeneralLiability;
  const licensingTotal = fixed.hcpfEnrollment + (fixed.countyBHSTLicense * fixed.countyCount) + fixed.pucLicense;
  const vehicleTotal = fixed.vehicleLease + fixed.maintenanceReserve;
  const operationsTotal = fixed.software + fixed.drugScreening + fixed.miscAdmin;
  const grandTotal = insuranceTotal + licensingTotal + vehicleTotal + operationsTotal;

  return (
    <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: 'var(--foreground)' }}>
          <Building2 className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          Fixed Monthly Costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insurance Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Shield className="h-4 w-4" style={{ color: 'var(--color-lime)' }} />
              Insurance
            </h4>
            <span className="text-sm font-medium" style={{ color: 'var(--color-lime)' }}>
              ${insuranceTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="Commercial Auto"
              description="Primary vehicle coverage"
              value={fixed.insuranceCommercialAuto}
              onChange={(v) => updateFixedCosts({ insuranceCommercialAuto: v })}
            />
            <CostRow
              icon={<Shield className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="General Liability"
              description="Business liability coverage"
              value={fixed.insuranceGeneralLiability}
              onChange={(v) => updateFixedCosts({ insuranceGeneralLiability: v })}
            />
          </div>
        </div>

        {/* Licensing Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <FileCheck className="h-4 w-4" style={{ color: 'var(--color-ice)' }} />
              Licensing & Compliance
            </h4>
            <span className="text-sm font-medium" style={{ color: 'var(--color-ice)' }}>
              ${licensingTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<FileCheck className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="HCPF Enrollment"
              description="Medicaid provider enrollment"
              value={fixed.hcpfEnrollment}
              onChange={(v) => updateFixedCosts({ hcpfEnrollment: v })}
            />
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--muted)' }}>
                  <FileCheck className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>County BHST License</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Per county authorization</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EditableField
                  value={fixed.countyBHSTLicense}
                  onChange={(v) => updateFixedCosts({ countyBHSTLicense: Number(v) })}
                  type="currency"
                />
                <span className="text-muted-foreground">×</span>
                <EditableField
                  value={fixed.countyCount}
                  onChange={(v) => updateFixedCosts({ countyCount: Number(v) })}
                  type="number"
                  min={1}
                  max={64}
                  step={1}
                  suffix=" counties"
                />
              </div>
            </div>
            <CostRow
              icon={<FileCheck className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="PUC License"
              description="If required for NEMT"
              value={fixed.pucLicense}
              onChange={(v) => updateFixedCosts({ pucLicense: v })}
            />
          </div>
        </div>

        {/* Vehicle Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Car className="h-4 w-4" style={{ color: 'var(--color-coral)' }} />
              Vehicle
            </h4>
            <span className="text-sm font-medium" style={{ color: 'var(--color-coral)' }}>
              ${vehicleTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<Car className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="Vehicle Lease/Payment"
              description="Monthly vehicle cost"
              value={fixed.vehicleLease}
              onChange={(v) => updateFixedCosts({ vehicleLease: v })}
            />
            <CostRow
              icon={<Wrench className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="Maintenance Reserve"
              description="Monthly set-aside"
              value={fixed.maintenanceReserve}
              onChange={(v) => updateFixedCosts({ maintenanceReserve: v })}
            />
          </div>
        </div>

        {/* Operations Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <FolderOpen className="h-4 w-4" style={{ color: 'var(--color-silver)' }} />
              Operations
            </h4>
            <span className="text-sm font-medium" style={{ color: 'var(--color-silver)' }}>
              ${operationsTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<MonitorSmartphone className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="Software & Tech"
              description="Dispatch, billing, GPS"
              value={fixed.software}
              onChange={(v) => updateFixedCosts({ software: v })}
            />
            <CostRow
              icon={<TestTube className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="Drug Screening"
              description="Random/DOT testing"
              value={fixed.drugScreening}
              onChange={(v) => updateFixedCosts({ drugScreening: v })}
            />
            <CostRow
              icon={<FolderOpen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />}
              label="Misc. Admin"
              description="Office, supplies, etc."
              value={fixed.miscAdmin}
              onChange={(v) => updateFixedCosts({ miscAdmin: v })}
            />
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t-2" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Total Fixed Costs
            </span>
            <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
              ${grandTotal.toFixed(2)}/mo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FixedCosts;














