import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, User, Mail, Phone, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

interface RegistrationData {
  // Organization Info
  organizationName: string;
  organizationAddress: string;
  organizationPhone: string;
  organizationEmail: string;
  
  // Admin User Info
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: RegistrationData = {
  organizationName: "",
  organizationAddress: "",
  organizationPhone: "",
  organizationEmail: "",
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
      setError(error.message || "Registration failed");
    },
  });

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    return formData.organizationName && 
           formData.organizationEmail && 
           formData.organizationAddress;
  };

  const validateStep2 = () => {
    return formData.adminName && 
           formData.adminEmail && 
           formData.password && 
           formData.confirmPassword &&
           formData.password === formData.confirmPassword &&
           formData.password.length >= 8;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
      setError("");
    } else if (step === 1) {
      setError("Please fill in all required organization fields");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateStep2()) {
      setError("Please fill in all required fields and ensure passwords match (minimum 8 characters)");
      return;
    }

    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Register Your Organization
          </CardTitle>
          <CardDescription>
            Join the Aethr Transport Management Network
          </CardDescription>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
          
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Step {step} of 2: {step === 1 ? 'Organization Details' : 'Admin Account'}
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Organization Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="organizationName">Organization Name *</Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      placeholder="e.g., ABC Senior Center"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="organizationEmail">Organization Email *</Label>
                    <Input
                      id="organizationEmail"
                      type="email"
                      value={formData.organizationEmail}
                      onChange={(e) => handleInputChange('organizationEmail', e.target.value)}
                      placeholder="info@organization.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="organizationPhone">Phone Number</Label>
                    <Input
                      id="organizationPhone"
                      type="tel"
                      value={formData.organizationPhone}
                      onChange={(e) => handleInputChange('organizationPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="organizationAddress">Address *</Label>
                    <Textarea
                      id="organizationAddress"
                      value={formData.organizationAddress}
                      onChange={(e) => handleInputChange('organizationAddress', e.target.value)}
                      placeholder="Full organization address"
                      required
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Administrator Account</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="adminName">Full Name *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange('adminName', e.target.value)}
                      placeholder="John Smith"
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
                      placeholder="john@organization.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="adminPhone">Phone Number</Label>
                    <Input
                      id="adminPhone"
                      type="tel"
                      value={formData.adminPhone}
                      onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Minimum 8 characters"
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
                
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <Alert variant="destructive">
                    <AlertDescription>Passwords do not match</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between pt-4">
              {step === 2 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  disabled={registerMutation.isPending}
                >
                  Back
                </Button>
              )}
              
              {step === 1 ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={registerMutation.isPending || !validateStep2()}
                  className="ml-auto bg-blue-600 hover:bg-blue-700"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Organization"
                  )}
                </Button>
              )}
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}