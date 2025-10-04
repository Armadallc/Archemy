import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { FileText, Save, Download, Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHierarchy } from '../hooks/useHierarchy';

// Transport service codes for mental health transportation
const TRANSPORT_CODES = [
  { value: 'T2003', label: 'T2003 - Non-Emergency Transportation', rate: 30.00 },
  { value: 'T2004', label: 'T2004 - Non-Medical Transportation', rate: 25.00 },
  { value: 'A0120', label: 'A0120 - Non-Emergency Transport', rate: 35.00 },
];

// CMHS waiver modifiers
const CMHS_MODIFIERS = [
  { value: 'U1', label: 'U1 - Medicaid Level of Care 1' },
  { value: 'U2', label: 'U2 - Medicaid Level of Care 2' },
  { value: 'U3', label: 'U3 - Medicaid Level of Care 3' },
  { value: 'U4', label: 'U4 - Medicaid Level of Care 4' },
  { value: 'U5', label: 'U5 - Medicaid Level of Care 5' },
  { value: 'U6', label: 'U6 - Medicaid Level of Care 6' },
  { value: 'U7', label: 'U7 - Medicaid Level of Care 7' },
  { value: 'U8', label: 'U8 - Medicaid Level of Care 8' },
  { value: 'U9', label: 'U9 - Medicaid Level of Care 9' },
  { value: 'QM', label: 'QM - Ambulance Service' },
  { value: 'TK', label: 'TK - Extra Patient or Passenger' },
];

const cms1500Schema = z.object({
  // Box 1: Insurance Type
  insuranceType: z.enum(['medicare', 'medicaid', 'champus', 'champva', 'group_health', 'feca', 'other']),
  
  // Box 1a: Insured's ID Number
  insuredId: z.string().min(1, 'Insured ID is required'),
  
  // Box 2: Patient Information
  patientLastName: z.string().min(1, 'Patient last name is required'),
  patientFirstName: z.string().min(1, 'Patient first name is required'),
  patientMiddleInitial: z.string().optional(),
  
  // Box 3: Patient Birth Date & Sex
  patientBirthDate: z.string().min(1, 'Patient birth date is required'),
  patientSex: z.enum(['M', 'F']),
  
  // Box 4: Insured's Name
  insuredLastName: z.string().min(1, 'Insured last name is required'),
  insuredFirstName: z.string().min(1, 'Insured first name is required'),
  insuredMiddleInitial: z.string().optional(),
  
  // Box 5: Patient's Address
  patientAddress: z.string().min(1, 'Patient address is required'),
  patientCity: z.string().min(1, 'Patient city is required'),
  patientState: z.string().min(1, 'Patient state is required'),
  patientZip: z.string().min(1, 'Patient ZIP code is required'),
  patientPhone: z.string().optional(),
  
  // Box 6: Patient Relationship to Insured
  patientRelationship: z.enum(['self', 'spouse', 'child', 'other']),
  
  // Box 7: Insured's Address
  insuredAddress: z.string().min(1, 'Insured address is required'),
  insuredCity: z.string().min(1, 'Insured city is required'),
  insuredState: z.string().min(1, 'Insured state is required'),
  insuredZip: z.string().min(1, 'Insured ZIP code is required'),
  insuredPhone: z.string().optional(),
  
  // Box 8: Reserved for NUCC Use
  
  // Box 9: Other Insured's Name
  otherInsuredName: z.string().optional(),
  
  // Box 9a: Other Insured's Policy Group or FECA Number
  otherInsuredPolicy: z.string().optional(),
  
  // Box 9b: Reserved for NUCC Use
  
  // Box 9c: Reserved for NUCC Use
  
  // Box 9d: Insurance Plan Name or Program Name
  otherInsurancePlan: z.string().optional(),
  
  // Box 10: Is Patient's Condition Related to
  relatedEmployment: z.boolean().default(false),
  relatedAutoAccident: z.boolean().default(false),
  relatedOtherAccident: z.boolean().default(false),
  accidentState: z.string().optional(),
  
  // Box 10d: Claim Codes
  claimCodes: z.string().optional(),
  
  // Box 11: Insured's Group Number
  insuredGroupNumber: z.string().optional(),
  
  // Box 11a: Insured's Date of Birth & Sex
  insuredBirthDate: z.string().optional(),
  insuredSex: z.enum(['M', 'F']).optional(),
  
  // Box 11b: Other Claim ID
  otherClaimId: z.string().optional(),
  
  // Box 11c: Insurance Plan Name
  insurancePlanName: z.string().optional(),
  
  // Box 11d: Is there another health benefit plan
  hasOtherHealthPlan: z.boolean().default(false),
  
  // Box 12: Patient's or Authorized Person's Signature
  patientSignature: z.string().default('Signature on File'),
  patientSignatureDate: z.string().optional(),
  
  // Box 13: Insured's or Authorized Person's Signature
  insuredSignature: z.string().default('Signature on File'),
  
  // Box 14: Date of Current Illness, Injury, or Pregnancy
  illnessDate: z.string().optional(),
  
  // Box 15: Other Date
  otherDate: z.string().optional(),
  
  // Box 16: Dates Unable to Work
  unableToWorkFrom: z.string().optional(),
  unableToWorkTo: z.string().optional(),
  
  // Box 17: Name of Referring Provider
  referringProvider: z.string().optional(),
  
  // Box 17a: Referring Provider Identifier
  referringProviderNPI: z.string().optional(),
  
  // Box 18: Hospitalization Dates
  hospitalizationFrom: z.string().optional(),
  hospitalizationTo: z.string().optional(),
  
  // Box 19: Additional Claim Information
  additionalInfo: z.string().optional(),
  
  // Box 20: Outside Lab
  outsideLab: z.boolean().default(false),
  outsideLabCharges: z.string().optional(),
  
  // Box 21: Diagnosis or Nature of Illness or Injury
  diagnosis1: z.string().optional(),
  diagnosis2: z.string().optional(),
  diagnosis3: z.string().optional(),
  diagnosis4: z.string().optional(),
  
  // Box 22: Resubmission Code
  resubmissionCode: z.string().optional(),
  originalRef: z.string().optional(),
  
  // Box 23: Prior Authorization Number
  priorAuthNumber: z.string().optional(),
  
  // Service Lines (Box 24)
  serviceLine1: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    placeOfService: z.string().optional(),
    procedureCode: z.string().optional(),
    modifier1: z.string().optional(),
    modifier2: z.string().optional(),
    modifier3: z.string().optional(),
    modifier4: z.string().optional(),
    diagnosis: z.string().optional(),
    charges: z.string().optional(),
    daysUnits: z.string().optional(),
    epsdt: z.string().optional(),
    emg: z.string().optional(),
    cob: z.string().optional(),
    renderingProviderNPI: z.string().optional(),
  }).optional(),
  
  // Box 25: Federal Tax ID Number
  federalTaxId: z.string().min(1, 'Federal Tax ID is required'),
  ssnEin: z.enum(['SSN', 'EIN']).default('EIN'),
  
  // Box 26: Patient's Account Number
  patientAccountNumber: z.string().optional(),
  
  // Box 27: Accept Assignment
  acceptAssignment: z.boolean().default(true),
  
  // Box 28: Total Charge
  totalCharge: z.string().min(1, 'Total charge is required'),
  
  // Box 29: Amount Paid
  amountPaid: z.string().optional(),
  
  // Box 30: Rsvd for NUCC Use
  
  // Box 31: Signature of Physician or Supplier
  providerSignature: z.string().default('Signature on File'),
  providerSignatureDate: z.string().optional(),
  
  // Box 32: Service Facility Information
  serviceFacilityName: z.string().optional(),
  serviceFacilityAddress: z.string().optional(),
  serviceFacilityNPI: z.string().optional(),
  
  // Box 33: Billing Provider Information
  billingProviderName: z.string().min(1, 'Billing provider name is required'),
  billingProviderAddress: z.string().min(1, 'Billing provider address is required'),
  billingProviderNPI: z.string().min(1, 'Billing provider NPI is required'),
  billingProviderPhone: z.string().optional(),
});

type CMS1500FormData = z.infer<typeof cms1500Schema>;

interface CMS1500FormProps {
  onBack?: () => void;
  initialData?: Partial<CMS1500FormData>;
  formId?: string; // For editing existing forms
  clientId?: string; // For auto-population
  tripId?: string; // For auto-population
  tripData?: {
    clientName: string;
    serviceDate: string;
    pickupAddress: string;
    dropoffAddress: string;
    mileage: number;
    duration: number;
  };
}

export default function CMS1500Form({ onBack, initialData, formId, clientId, tripId, tripData }: CMS1500FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  
  // Load existing form data if editing
  const { data: existingForm, isLoading: isLoadingForm } = useQuery({
    queryKey: ['cms1500-form', formId],
    queryFn: async () => {
      if (!formId || (!selectedProgram && !selectedCorporateClient)) return null;
      
      let endpoint = `/api/cms1500/forms`;
      if (level === 'program' && selectedProgram) {
        endpoint = `/api/cms1500/forms/program/${selectedProgram}/${formId}`;
      } else if (level === 'client' && selectedCorporateClient) {
        endpoint = `/api/cms1500/forms/corporate-client/${selectedCorporateClient}/${formId}`;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to load form');
      return response.json();
    },
    enabled: !!formId && !!(selectedProgram || selectedCorporateClient),
  });

  const form = useForm<CMS1500FormData>({
    resolver: zodResolver(cms1500Schema),
    defaultValues: {
      insuranceType: 'medicaid',
      patientRelationship: 'self',
      patientSex: 'M',
      ssnEin: 'EIN',
      acceptAssignment: true,
      patientSignature: 'Signature on File',
      insuredSignature: 'Signature on File',
      providerSignature: 'Signature on File',
      relatedEmployment: false,
      relatedAutoAccident: false,
      relatedOtherAccident: false,
      hasOtherHealthPlan: false,
      outsideLab: false,
      serviceLine1: {
        placeOfService: '41', // Ambulance - Land
        procedureCode: 'T2003',
        modifier1: 'U2',
      },
      // Default billing provider info
      billingProviderName: 'Monarch Competency Transport',
      billingProviderAddress: '5245 Lowell Blvd, Denver, CO 80221',
      billingProviderNPI: '1234567890',
      billingProviderPhone: '(555) 999-8888',
      federalTaxId: '12-3456789',
      totalCharge: '30.00',
      ...initialData,
    },
  });

  // Load existing form data into form
  useEffect(() => {
    if (existingForm && !isLoadingForm) {
      // Map the database fields to form fields
      const formData = {
        insuranceType: existingForm.insurance_type || 'medicaid',
        insuredId: existingForm.insured_id || '',
        patientLastName: existingForm.patient_last_name || '',
        patientFirstName: existingForm.patient_first_name || '',
        patientMiddleInitial: existingForm.patient_middle_initial || '',
        patientBirthDate: existingForm.patient_birth_date || '',
        patientSex: existingForm.patient_sex || 'M',
        insuredLastName: existingForm.insured_last_name || '',
        insuredFirstName: existingForm.insured_first_name || '',
        insuredMiddleInitial: existingForm.insured_middle_initial || '',
        patientAddress: existingForm.patient_address || '',
        patientCity: existingForm.patient_city || '',
        patientState: existingForm.patient_state || 'CO',
        patientZip: existingForm.patient_zip || '',
        patientPhone: existingForm.patient_phone || '',
        patientRelationship: existingForm.patient_relationship || 'self',
        insuredAddress: existingForm.insured_address || '',
        insuredCity: existingForm.insured_city || '',
        insuredState: existingForm.insured_state || 'CO',
        insuredZip: existingForm.insured_zip || '',
        insuredPhone: existingForm.insured_phone || '',
        federalTaxId: existingForm.federal_tax_id || '12-3456789',
        totalCharge: existingForm.total_charge?.toString() || '30.00',
        billingProviderName: existingForm.billing_provider_name || 'Monarch Competency Transport',
        billingProviderAddress: existingForm.billing_provider_address || '5245 Lowell Blvd, Denver, CO 80221',
        billingProviderNPI: existingForm.billing_provider_npi || '1234567890',
        billingProviderPhone: existingForm.billing_provider_phone || '(555) 999-8888',
        // Service line data
        serviceLine1: existingForm.serviceLines?.[0] ? {
          dateFrom: existingForm.serviceLines[0].date_from || '',
          dateTo: existingForm.serviceLines[0].date_to || '',
          placeOfService: existingForm.serviceLines[0].place_of_service || '41',
          procedureCode: existingForm.serviceLines[0].procedure_code || 'T2003',
          modifier1: existingForm.serviceLines[0].modifier_1 || 'U2',
          modifier2: existingForm.serviceLines[0].modifier_2 || '',
          modifier3: existingForm.serviceLines[0].modifier_3 || '',
          modifier4: existingForm.serviceLines[0].modifier_4 || '',
          diagnosis: existingForm.serviceLines[0].diagnosis_pointer || 'A',
          charges: existingForm.serviceLines[0].charges?.toString() || '30.00',
          daysUnits: existingForm.serviceLines[0].days_or_units?.toString() || '1',
        } : form.getValues('serviceLine1'),
      };
      
      // Reset form with loaded data
      form.reset(formData);
    }
  }, [existingForm, isLoadingForm, form]);

  // Save form mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CMS1500FormData) => {
      if (!selectedProgram && !selectedCorporateClient) throw new Error('Program or Corporate Client not found');
      
      // Convert form data to database format
      const formDataForApi = {
        insurance_type: data.insuranceType,
        insured_id: data.insuredId,
        patient_last_name: data.patientLastName,
        patient_first_name: data.patientFirstName,
        patient_middle_initial: data.patientMiddleInitial,
        patient_birth_date: data.patientBirthDate,
        patient_sex: data.patientSex,
        insured_last_name: data.insuredLastName,
        insured_first_name: data.insuredFirstName,
        insured_middle_initial: data.insuredMiddleInitial,
        patient_address: data.patientAddress,
        patient_city: data.patientCity,
        patient_state: data.patientState,
        patient_zip: data.patientZip,
        patient_phone: data.patientPhone,
        patient_relationship: data.patientRelationship,
        insured_address: data.insuredAddress,
        insured_city: data.insuredCity,
        insured_state: data.insuredState,
        insured_zip: data.insuredZip,
        insured_phone: data.insuredPhone,
        federal_tax_id: data.federalTaxId,
        total_charge: parseFloat(data.totalCharge || '30.00'),
        billing_provider_name: data.billingProviderName,
        billing_provider_address: data.billingProviderAddress,
        billing_provider_npi: data.billingProviderNPI,
        billing_provider_phone: data.billingProviderPhone,
        client_id: clientId || null,
        trip_id: tripId || null,
        // Service line data
        serviceLine1: data.serviceLine1 ? {
          date_from: data.serviceLine1.dateFrom,
          date_to: data.serviceLine1.dateTo,
          place_of_service: data.serviceLine1.placeOfService,
          procedure_code: data.serviceLine1.procedureCode,
          modifier_1: data.serviceLine1.modifier1,
          modifier_2: data.serviceLine1.modifier2,
          modifier_3: data.serviceLine1.modifier3,
          modifier_4: data.serviceLine1.modifier4,
          diagnosis_pointer: data.serviceLine1.diagnosis,
          charges: parseFloat(data.serviceLine1.charges || '30.00'),
          days_or_units: parseInt(data.serviceLine1.daysUnits || '1'),
        } : null,
      };
      
      const url = formId 
        ? (level === 'program' && selectedProgram 
            ? `/api/cms1500/forms/program/${selectedProgram}/${formId}`
            : `/api/cms1500/forms/corporate-client/${selectedCorporateClient}/${formId}`)
        : (level === 'program' && selectedProgram 
            ? `/api/cms1500/forms/program/${selectedProgram}`
            : `/api/cms1500/forms/corporate-client/${selectedCorporateClient}`);
      
      const response = await fetch(url, {
        method: formId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataForApi),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save form');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Form Saved",
        description: "CMS-1500 form has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['cms1500-forms'] });
      if (onBack) onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const onSubmit = async (data: CMS1500FormData) => {
    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(data);
    } catch (error) {
      console.error('Error saving CMS-1500 form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // This would generate a PDF of the form
    alert('PDF download functionality would be implemented here');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              CMS-1500 Claim Form
            </h1>
            <p className="text-gray-600">Health Insurance Claim Form</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Header Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                HEALTH INSURANCE CLAIM FORM
              </CardTitle>
              <p className="text-sm text-center text-gray-600">
                APPROVED BY NATIONAL UNIFORM CLAIM COMMITTEE (NUCC) 02/12
              </p>
            </CardHeader>
          </Card>

          {/* Insurance Type & Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Patient & Insurance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Box 1: Insurance Type */}
                <FormField
                  control={form.control}
                  name="insuranceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1. Type of Insurance</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select insurance type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="medicare">Medicare</SelectItem>
                          <SelectItem value="medicaid">Medicaid</SelectItem>
                          <SelectItem value="champus">CHAMPUS</SelectItem>
                          <SelectItem value="champva">CHAMPVA</SelectItem>
                          <SelectItem value="group_health">Group Health Plan</SelectItem>
                          <SelectItem value="feca">FECA</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Box 1a: Insured's ID Number */}
                <FormField
                  control={form.control}
                  name="insuredId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1a. Insured's ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter insured's ID number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Box 2: Patient Name */}
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="patientLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>2. Patient's Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientMiddleInitial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MI</FormLabel>
                        <FormControl>
                          <Input placeholder="MI" maxLength={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Box 3: Patient Birth Date & Sex */}
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="patientBirthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>3. Patient's Birth Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientSex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="M">Male</SelectItem>
                            <SelectItem value="F">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Box 5: Patient's Address */}
                <FormField
                  control={form.control}
                  name="patientAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>5. Patient's Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="patientCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="patientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Box 6: Patient Relationship to Insured */}
                <FormField
                  control={form.control}
                  name="patientRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>6. Patient Relationship to Insured</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="self">Self</SelectItem>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>

            {/* Right Column */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Box 24: Service Line Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold">24. Service Line Information</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="serviceLine1.dateFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceLine1.dateTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date To</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="serviceLine1.placeOfService"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Place of Service</FormLabel>
                          <FormControl>
                            <Input placeholder="41 (Ambulance)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceLine1.procedureCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Procedure Code</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TRANSPORT_CODES.map(code => (
                                <SelectItem key={code.value} value={code.value}>
                                  {code.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="serviceLine1.modifier1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modifier 1</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CMHS_MODIFIERS.map(mod => (
                                <SelectItem key={mod.value} value={mod.value}>
                                  {mod.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceLine1.modifier2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modifier 2</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CMHS_MODIFIERS.map(mod => (
                                <SelectItem key={mod.value} value={mod.value}>
                                  {mod.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="serviceLine1.charges"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Charges</FormLabel>
                          <FormControl>
                            <Input placeholder="$30.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="serviceLine1.daysUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Days/Units</FormLabel>
                          <FormControl>
                            <Input placeholder="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Box 25: Federal Tax ID */}
                <FormField
                  control={form.control}
                  name="federalTaxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>25. Federal Tax ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="XX-XXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Box 28: Total Charge */}
                <FormField
                  control={form.control}
                  name="totalCharge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>28. Total Charge</FormLabel>
                      <FormControl>
                        <Input placeholder="$30.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Box 33: Billing Provider */}
                <FormField
                  control={form.control}
                  name="billingProviderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>33. Billing Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Provider name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingProviderNPI"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Provider NPI</FormLabel>
                      <FormControl>
                        <Input placeholder="NPI number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Form'}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}