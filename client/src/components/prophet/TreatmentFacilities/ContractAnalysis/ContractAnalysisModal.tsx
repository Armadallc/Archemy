/**
 * Contract Analysis Modal
 * A/B comparison tool for analyzing transportation service contracts
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { Button } from '../../../ui/button';
import { useProphetStore } from '../../hooks/useProphetStore';
import { TreatmentFacility, ContractAnalysis } from '../../types';
import { FacilityOverheadTab } from './FacilityOverheadTab';
import { ContractTermsTab } from './ContractTermsTab';
import { ABComparisonTab } from './ABComparisonTab';
import { SummaryTab } from './SummaryTab';
import { X } from 'lucide-react';

interface ContractAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: TreatmentFacility;
}

export function ContractAnalysisModal({
  open,
  onOpenChange,
  facility,
}: ContractAnalysisModalProps) {
  const { updateFacilityContractAnalysis, facilities } = useProphetStore();
  const [activeTab, setActiveTab] = useState('overhead');
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);

  // Load or initialize analysis
  useEffect(() => {
    if (open && facility) {
      // Always get the latest facility data from store
      const currentFacility = facilities.find((f) => f.id === facility.id);
      if (currentFacility?.contractAnalysis) {
        // Load existing saved analysis
        setAnalysis(currentFacility.contractAnalysis);
        // Restore selected comparison if it exists
        if (currentFacility.contractAnalysis.selectedComparisonId) {
          // Comparison will be recalculated when tab is viewed
        }
      } else {
        // Initialize new analysis
        const newAnalysis: ContractAnalysis = {
          facilityId: facility.id,
          facilityName: facility.name,
          overheadCosts: {
            personnel: {
              directCareStaff: 0,
              indirectCareStaff: 0,
              clinicalSupervision: 0,
              payrollTaxesBenefits: 0,
              benefitsPackage: 0,
              trainingCredentialing: 0,
              recruitmentRetention: 0,
            },
            facility: {
              leaseMortgage: 0,
              propertyInsurance: 0,
              utilities: 0,
              repairMaintenance: 0,
              janitorialHousekeeping: 0,
              securitySystems: 0,
              adaCompliance: 0,
            },
            administrative: {
              officeEquipment: 0,
              softwareLicensing: 0,
              officeSupplies: 0,
              technologyInfrastructure: 0,
              legalAccounting: 0,
              licensingAccreditation: 0,
            },
            clinical: {
              medicalEquipment: 0,
              clinicalSupplies: 0,
              labTestingServices: 0,
              credentialingCosts: 0,
            },
            transportation: {
              staffTimeAllocation: 0,
              vehicleExpenses: 0,
              liabilityCoverage: 0,
              opportunityCost: 0,
              schedulingInefficiencies: 0,
              complianceRisk: 0,
            },
            insurance: {
              generalLiability: 0,
              professionalLiability: 0,
              autoLiability: 0,
              workersCompensation: 0,
              cyberLiability: 0,
              directorOfficerInsurance: 0,
            },
            compliance: {
              bhaLicensing: 0,
              qualityAssurance: 0,
              backgroundChecks: 0,
              hipaaCompliance: 0,
              medicaidAudits: 0,
            },
            programSpecific: {
              clientSupplies: 0,
              foodServices: 0,
              activitiesProgramming: 0,
              communityIntegration: 0,
            },
            capital: {
              itEquipment: 0,
              furnitureFixtures: 0,
              specializedEquipment: 0,
              buildingImprovements: 0,
            },
          },
          contractTerms: {
            billingMethod: 'monthly_fee',
            monthlyFee: 0,
            contractTerm: 12,
          },
          comparisons: [],
          selectedComparisonId: null,
          totalFacilityOverhead: 0,
          transportationBurdenPercentage: 0,
          potentialSavings: 0,
          providerProfitability: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: '',
        };
        setAnalysis(newAnalysis);
      }
    }
  }, [open, facility, facilities]); // Include facilities in dependencies to reload when data changes, [open, facility, facilities]);

  const handleSave = () => {
    if (analysis) {
      updateFacilityContractAnalysis(facility.id, analysis);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!analysis) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: 'var(--card)',
          color: 'var(--card-foreground)',
        }}
      >
        <DialogHeader>
          <DialogTitle>Contract Analysis: {facility.name}</DialogTitle>
          <DialogDescription>
            Analyze transportation service contracts and compare scenarios
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overhead">Facility Overhead</TabsTrigger>
            <TabsTrigger value="terms">Contract Terms</TabsTrigger>
            <TabsTrigger value="comparison">A/B Comparison</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="overhead" className="mt-4">
            <FacilityOverheadTab
              analysis={analysis}
              onUpdate={(updates) => setAnalysis({ ...analysis, ...updates })}
            />
          </TabsContent>

          <TabsContent value="terms" className="mt-4">
            <ContractTermsTab
              analysis={analysis}
              onUpdate={(updates) => setAnalysis({ ...analysis, ...updates })}
            />
          </TabsContent>

          <TabsContent value="comparison" className="mt-4">
            <ABComparisonTab
              facility={facility}
              analysis={analysis}
              onUpdate={(updates) => setAnalysis({ ...analysis, ...updates })}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <SummaryTab
              facility={facility}
              analysis={analysis}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
