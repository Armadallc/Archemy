/**
 * Fixed Costs Component
 * Manages monthly fixed overhead expenses
 */

// Force Vite to re-process this file
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
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          {icon}
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>{label}</div>
          {description && (
            <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>{description}</div>
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
          <span className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>
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
    <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <CardHeader className="pb-3 card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardTitle className="flex items-center gap-2 text-lg" style={{ color: '#a5c8ca' }}>
          <Building2 className="h-5 w-5" style={{ color: '#a5c8ca' }} />
          FIXED MONTHLY COSTS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insurance Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#a5c8ca' }}>
              <Shield className="h-4 w-4" style={{ color: '#a5c8ca' }} />
              Insurance
            </h4>
            <span className="text-sm font-medium" style={{ color: '#a5c8ca' }}>
              ${insuranceTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<Car className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
              label="Commercial Auto"
              description="Primary vehicle coverage"
              value={fixed.insuranceCommercialAuto}
              onChange={(v) => updateFixedCosts({ insuranceCommercialAuto: v })}
            />
            <CostRow
              icon={<Shield className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
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
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#a5c8ca' }}>
              <FileCheck className="h-4 w-4" style={{ color: '#a5c8ca' }} />
              Licensing & Compliance
            </h4>
            <span className="text-sm font-medium" style={{ color: '#a5c8ca' }}>
              ${licensingTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<FileCheck className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
              label="HCPF Enrollment"
              description="Medicaid provider enrollment"
              value={fixed.hcpfEnrollment}
              onChange={(v) => updateFixedCosts({ hcpfEnrollment: v })}
            />
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <FileCheck className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#a5c8ca', opacity: 0.8 }}>County BHST License</div>
                  <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.7 }}>Per county authorization</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EditableField
                  value={fixed.countyBHSTLicense}
                  onChange={(v) => updateFixedCosts({ countyBHSTLicense: Number(v) })}
                  type="currency"
                />
                <span style={{ color: '#a5c8ca', opacity: 0.7 }}>×</span>
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
              icon={<FileCheck className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
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
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#a5c8ca' }}>
              <Car className="h-4 w-4" style={{ color: '#a5c8ca' }} />
              Vehicle
            </h4>
            <span className="text-sm font-medium" style={{ color: '#a5c8ca' }}>
              ${vehicleTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<Car className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
              label="Vehicle Lease/Payment"
              description="Monthly vehicle cost"
              value={fixed.vehicleLease}
              onChange={(v) => updateFixedCosts({ vehicleLease: v })}
            />
            <CostRow
              icon={<Wrench className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
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
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#a5c8ca' }}>
              <FolderOpen className="h-4 w-4" style={{ color: '#a5c8ca' }} />
              Operations
            </h4>
            <span className="text-sm font-medium" style={{ color: '#a5c8ca' }}>
              ${operationsTotal.toFixed(2)}/mo
            </span>
          </div>
          <div className="pl-6 space-y-1">
            <CostRow
              icon={<MonitorSmartphone className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
              label="Software & Tech"
              description="Dispatch, billing, GPS"
              value={fixed.software}
              onChange={(v) => updateFixedCosts({ software: v })}
            />
            <CostRow
              icon={<TestTube className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
              label="Drug Screening"
              description="Random/DOT testing"
              value={fixed.drugScreening}
              onChange={(v) => updateFixedCosts({ drugScreening: v })}
            />
            <CostRow
              icon={<FolderOpen className="h-4 w-4" style={{ color: '#a5c8ca', opacity: 0.7 }} />}
              label="Misc. Admin"
              description="Office, supplies, etc."
              value={fixed.miscAdmin}
              onChange={(v) => updateFixedCosts({ miscAdmin: v })}
            />
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t-2" style={{ borderColor: 'rgba(165, 200, 202, 0.2)' }}>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: '#a5c8ca' }}>
              Total Fixed Costs
            </span>
            <span className="text-xl font-bold" style={{ color: '#a5c8ca' }}>
              ${grandTotal.toFixed(2)}/mo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
