/**
 * Facility Overhead Tab
 * Input form for all facility overhead costs (9 categories)
 */

import React from 'react';
import { ContractAnalysis } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Label } from '../../../ui/label';
import { EditableField } from '../../shared/EditableField';

interface FacilityOverheadTabProps {
  analysis: ContractAnalysis;
  onUpdate: (updates: Partial<ContractAnalysis>) => void;
}

export function FacilityOverheadTab({
  analysis,
  onUpdate,
}: FacilityOverheadTabProps) {
  const handleOverheadUpdate = (category: keyof ContractAnalysis['overheadCosts'], field: string, value: number) => {
    onUpdate({
      overheadCosts: {
        ...analysis.overheadCosts,
        [category]: {
          ...analysis.overheadCosts[category],
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Personnel Costs (55-65% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Direct Care Staff</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.directCareStaff}
                onChange={(v) => handleOverheadUpdate('personnel', 'directCareStaff', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Indirect Care Staff</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.indirectCareStaff}
                onChange={(v) => handleOverheadUpdate('personnel', 'indirectCareStaff', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Clinical Supervision</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.clinicalSupervision}
                onChange={(v) => handleOverheadUpdate('personnel', 'clinicalSupervision', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payroll Taxes & Benefits (15.9%)</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.payrollTaxesBenefits}
                onChange={(v) => handleOverheadUpdate('personnel', 'payrollTaxesBenefits', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Benefits Package</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.benefitsPackage}
                onChange={(v) => handleOverheadUpdate('personnel', 'benefitsPackage', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Training & Credentialing</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.trainingCredentialing}
                onChange={(v) => handleOverheadUpdate('personnel', 'trainingCredentialing', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Recruitment & Retention</Label>
              <EditableField
                value={analysis.overheadCosts.personnel.recruitmentRetention}
                onChange={(v) => handleOverheadUpdate('personnel', 'recruitmentRetention', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Facility Expenses (15-25% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Lease/Mortgage</Label>
              <EditableField
                value={analysis.overheadCosts.facility.leaseMortgage}
                onChange={(v) => handleOverheadUpdate('facility', 'leaseMortgage', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Property Insurance</Label>
              <EditableField
                value={analysis.overheadCosts.facility.propertyInsurance}
                onChange={(v) => handleOverheadUpdate('facility', 'propertyInsurance', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Utilities</Label>
              <EditableField
                value={analysis.overheadCosts.facility.utilities}
                onChange={(v) => handleOverheadUpdate('facility', 'utilities', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Repair & Maintenance</Label>
              <EditableField
                value={analysis.overheadCosts.facility.repairMaintenance}
                onChange={(v) => handleOverheadUpdate('facility', 'repairMaintenance', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Janitorial & Housekeeping</Label>
              <EditableField
                value={analysis.overheadCosts.facility.janitorialHousekeeping}
                onChange={(v) => handleOverheadUpdate('facility', 'janitorialHousekeeping', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Security Systems</Label>
              <EditableField
                value={analysis.overheadCosts.facility.securitySystems}
                onChange={(v) => handleOverheadUpdate('facility', 'securitySystems', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ADA Compliance</Label>
              <EditableField
                value={analysis.overheadCosts.facility.adaCompliance}
                onChange={(v) => handleOverheadUpdate('facility', 'adaCompliance', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Administrative Expenses (8-12% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Office Equipment</Label>
              <EditableField
                value={analysis.overheadCosts.administrative.officeEquipment}
                onChange={(v) => handleOverheadUpdate('administrative', 'officeEquipment', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Software Licensing</Label>
              <EditableField
                value={analysis.overheadCosts.administrative.softwareLicensing}
                onChange={(v) => handleOverheadUpdate('administrative', 'softwareLicensing', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Office Supplies</Label>
              <EditableField
                value={analysis.overheadCosts.administrative.officeSupplies}
                onChange={(v) => handleOverheadUpdate('administrative', 'officeSupplies', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Technology Infrastructure</Label>
              <EditableField
                value={analysis.overheadCosts.administrative.technologyInfrastructure}
                onChange={(v) => handleOverheadUpdate('administrative', 'technologyInfrastructure', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Legal & Accounting</Label>
              <EditableField
                value={analysis.overheadCosts.administrative.legalAccounting}
                onChange={(v) => handleOverheadUpdate('administrative', 'legalAccounting', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Licensing & Accreditation</Label>
              <EditableField
                value={analysis.overheadCosts.administrative.licensingAccreditation}
                onChange={(v) => handleOverheadUpdate('administrative', 'licensingAccreditation', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Clinical Operations (5-10% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Medical Equipment</Label>
              <EditableField
                value={analysis.overheadCosts.clinical.medicalEquipment}
                onChange={(v) => handleOverheadUpdate('clinical', 'medicalEquipment', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Clinical Supplies</Label>
              <EditableField
                value={analysis.overheadCosts.clinical.clinicalSupplies}
                onChange={(v) => handleOverheadUpdate('clinical', 'clinicalSupplies', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lab Testing Services</Label>
              <EditableField
                value={analysis.overheadCosts.clinical.labTestingServices}
                onChange={(v) => handleOverheadUpdate('clinical', 'labTestingServices', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Credentialing Costs</Label>
              <EditableField
                value={analysis.overheadCosts.clinical.credentialingCosts}
                onChange={(v) => handleOverheadUpdate('clinical', 'credentialingCosts', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Transportation Costs (Current Burden) ⭐ KEY FOCUS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Staff Time Allocation</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.staffTimeAllocation}
                onChange={(v) => handleOverheadUpdate('transportation', 'staffTimeAllocation', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vehicle Expenses</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.vehicleExpenses}
                onChange={(v) => handleOverheadUpdate('transportation', 'vehicleExpenses', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Liability Coverage</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.liabilityCoverage}
                onChange={(v) => handleOverheadUpdate('transportation', 'liabilityCoverage', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Opportunity Cost</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.opportunityCost}
                onChange={(v) => handleOverheadUpdate('transportation', 'opportunityCost', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Scheduling Inefficiencies</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.schedulingInefficiencies}
                onChange={(v) => handleOverheadUpdate('transportation', 'schedulingInefficiencies', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Compliance Risk</Label>
              <EditableField
                value={analysis.overheadCosts.transportation.complianceRisk}
                onChange={(v) => handleOverheadUpdate('transportation', 'complianceRisk', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Insurance & Risk (5-8% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">General Liability</Label>
              <EditableField
                value={analysis.overheadCosts.insurance.generalLiability}
                onChange={(v) => handleOverheadUpdate('insurance', 'generalLiability', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Professional Liability</Label>
              <EditableField
                value={analysis.overheadCosts.insurance.professionalLiability}
                onChange={(v) => handleOverheadUpdate('insurance', 'professionalLiability', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Auto Liability</Label>
              <EditableField
                value={analysis.overheadCosts.insurance.autoLiability}
                onChange={(v) => handleOverheadUpdate('insurance', 'autoLiability', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Workers Compensation</Label>
              <EditableField
                value={analysis.overheadCosts.insurance.workersCompensation}
                onChange={(v) => handleOverheadUpdate('insurance', 'workersCompensation', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cyber Liability</Label>
              <EditableField
                value={analysis.overheadCosts.insurance.cyberLiability}
                onChange={(v) => handleOverheadUpdate('insurance', 'cyberLiability', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Director & Officer Insurance</Label>
              <EditableField
                value={analysis.overheadCosts.insurance.directorOfficerInsurance}
                onChange={(v) => handleOverheadUpdate('insurance', 'directorOfficerInsurance', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Regulatory Compliance (3-5% of overhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">BHA Licensing</Label>
              <EditableField
                value={analysis.overheadCosts.compliance.bhaLicensing}
                onChange={(v) => handleOverheadUpdate('compliance', 'bhaLicensing', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quality Assurance</Label>
              <EditableField
                value={analysis.overheadCosts.compliance.qualityAssurance}
                onChange={(v) => handleOverheadUpdate('compliance', 'qualityAssurance', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Background Checks</Label>
              <EditableField
                value={analysis.overheadCosts.compliance.backgroundChecks}
                onChange={(v) => handleOverheadUpdate('compliance', 'backgroundChecks', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">HIPAA Compliance</Label>
              <EditableField
                value={analysis.overheadCosts.compliance.hipaaCompliance}
                onChange={(v) => handleOverheadUpdate('compliance', 'hipaaCompliance', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Medicaid Audits</Label>
              <EditableField
                value={analysis.overheadCosts.compliance.medicaidAudits}
                onChange={(v) => handleOverheadUpdate('compliance', 'medicaidAudits', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Program-Specific Costs (Variable)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Client Supplies</Label>
              <EditableField
                value={analysis.overheadCosts.programSpecific.clientSupplies}
                onChange={(v) => handleOverheadUpdate('programSpecific', 'clientSupplies', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Food Services</Label>
              <EditableField
                value={analysis.overheadCosts.programSpecific.foodServices}
                onChange={(v) => handleOverheadUpdate('programSpecific', 'foodServices', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Activities & Programming</Label>
              <EditableField
                value={analysis.overheadCosts.programSpecific.activitiesProgramming}
                onChange={(v) => handleOverheadUpdate('programSpecific', 'activitiesProgramming', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Community Integration</Label>
              <EditableField
                value={analysis.overheadCosts.programSpecific.communityIntegration}
                onChange={(v) => handleOverheadUpdate('programSpecific', 'communityIntegration', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Capital Overhead (2-5% amortized)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">IT Equipment</Label>
              <EditableField
                value={analysis.overheadCosts.capital.itEquipment}
                onChange={(v) => handleOverheadUpdate('capital', 'itEquipment', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Furniture & Fixtures</Label>
              <EditableField
                value={analysis.overheadCosts.capital.furnitureFixtures}
                onChange={(v) => handleOverheadUpdate('capital', 'furnitureFixtures', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Specialized Equipment</Label>
              <EditableField
                value={analysis.overheadCosts.capital.specializedEquipment}
                onChange={(v) => handleOverheadUpdate('capital', 'specializedEquipment', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Building Improvements</Label>
              <EditableField
                value={analysis.overheadCosts.capital.buildingImprovements}
                onChange={(v) => handleOverheadUpdate('capital', 'buildingImprovements', Number(v) || 0)}
                type="number"
                prefix="$"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
