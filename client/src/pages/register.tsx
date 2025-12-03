import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { PhoneInput } from "../components/ui/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Loader2, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { Link, useLocation } from "wouter";

interface RegistrationData {
  // Corporate Client Info
  corporateClientName: string;
  corporateClientAddress: string;
  corporateClientPhone: string;
  corporateClientEmail: string;
  
  // Program Info
  programName: string;
  programDescription: string;
  programAddress: string;
  
  // Admin User Info
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: RegistrationData = {
  corporateClientName: "",
  corporateClientAddress: "",
  corporateClientPhone: "",
  corporateClientEmail: "",
  programName: "",
  programDescription: "",
  programAddress: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<RegistrationData>(initialFormData);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setLocation("/login?registered=true");
    },
    onError: (error: any) => {
      setError(error.message || "Registration failed. Please try again.");
    },
  });

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const validateStep1 = () => {
    return formData.corporateClientName && 
           formData.corporateClientEmail && 
           formData.corporateClientAddress &&
           formData.programName &&
           formData.programDescription;
  };

  const validateStep2 = () => {
    return formData.adminName && 
           formData.adminEmail && 
           formData.password && 
           formData.confirmPassword &&
           formData.password === formData.confirmPassword;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) {
        setError("Please fill in all required fields");
        return;
      }
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      setError("Please fill in all required fields and ensure passwords match");
      return;
    }

    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Register Your Corporate Client
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your corporate client account and first program
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Step {step} of 2: {step === 1 ? 'Corporate Client & Program Details' : 'Admin Account'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === 1 
                ? 'Set up your corporate client information and first program'
                : 'Create your administrator account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <>
                  {/* Corporate Client Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Corporate Client Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="corporateClientName">Corporate Client Name *</Label>
                        <Input
                          id="corporateClientName"
                          type="text"
                          value={formData.corporateClientName}
                          onChange={(e) => handleInputChange('corporateClientName', e.target.value)}
                          placeholder="Your Company Name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="corporateClientEmail">Corporate Client Email *</Label>
                        <Input
                          id="corporateClientEmail"
                          type="email"
                          value={formData.corporateClientEmail}
                          onChange={(e) => handleInputChange('corporateClientEmail', e.target.value)}
                          placeholder="info@company.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="corporateClientPhone">Phone Number</Label>
                        <PhoneInput
                          id="corporateClientPhone"
                          value={formData.corporateClientPhone}
                          onChange={(value) => handleInputChange('corporateClientPhone', value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="corporateClientAddress">Address *</Label>
                        <Textarea
                          id="corporateClientAddress"
                          value={formData.corporateClientAddress}
                          onChange={(e) => handleInputChange('corporateClientAddress', e.target.value)}
                          placeholder="Full corporate client address"
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Program Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Program Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="programName">Program Name *</Label>
                        <Input
                          id="programName"
                          type="text"
                          value={formData.programName}
                          onChange={(e) => handleInputChange('programName', e.target.value)}
                          placeholder="e.g., Mental Health Program"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="programDescription">Program Description *</Label>
                        <Input
                          id="programDescription"
                          type="text"
                          value={formData.programDescription}
                          onChange={(e) => handleInputChange('programDescription', e.target.value)}
                          placeholder="Brief description of the program"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="programAddress">Program Address</Label>
                        <Textarea
                          id="programAddress"
                          value={formData.programAddress}
                          onChange={(e) => handleInputChange('programAddress', e.target.value)}
                          placeholder="Program location address"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleNext}>
                      Next Step
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Admin Account Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Administrator Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="adminName">Full Name *</Label>
                        <Input
                          id="adminName"
                          type="text"
                          value={formData.adminName}
                          onChange={(e) => handleInputChange('adminName', e.target.value)}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminEmail">Email Address *</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={formData.adminEmail}
                          onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                          placeholder="john@company.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="adminPhone">Phone Number</Label>
                        <PhoneInput
                          id="adminPhone"
                          value={formData.adminPhone}
                          onChange={(value) => handleInputChange('adminPhone', value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Create a strong password"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={registerMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Corporate Client"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}