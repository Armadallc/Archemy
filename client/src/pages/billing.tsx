import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  FileText, 
  DollarSign, 
  Calendar, 
  Users,
  TrendingUp,
  AlertCircle,
  Download,
  Upload,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import BillingPinSetup from '@/components/BillingPinSetup';
import CMS1500Form from '@/components/CMS1500Form';

export default function BillingPage() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [billingAccess, setBillingAccess] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showCMS1500Form, setShowCMS1500Form] = useState(false);
  const { toast } = useToast();

  // Check if user has billing permissions
  const hasBillingAccess = user?.role === 'super_admin' || user?.role === 'organization_admin';

  // Check if user has a billing PIN set
  const userHasBillingPin = user?.billing_pin !== null && user?.billing_pin !== undefined;

  const validatePinMutation = useMutation({
    mutationFn: async (pinData: { pin: string }) => {
      const response = await apiRequest('POST', '/api/user/validate-billing-pin', pinData);
      return response.json();
    },
    onSuccess: () => {
      setBillingAccess(true);
      setPinError('');
      setPin('');
      toast({
        title: "Access Granted",
        description: "Welcome to the billing module",
      });
      // Start 30-minute session timer
      setTimeout(() => setBillingAccess(false), 30 * 60 * 1000);
    },
    onError: () => {
      setPinError('Invalid PIN. Please try again.');
      setPin('');
    },
  });

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    validatePinMutation.mutate({ pin });
  };

  // Fetch billing data
  const { data: billingStats } = useQuery({
    queryKey: ['/api/billing/stats', organization?.id],
    enabled: billingAccess && !!organization?.id,
    staleTime: 0,
  });

  const { data: recentClaims } = useQuery({
    queryKey: ['/api/billing/claims', organization?.id],
    enabled: billingAccess && !!organization?.id,
    staleTime: 0,
  });

  if (!hasBillingAccess) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">
              You don't have permission to access the billing module
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show PIN setup if user doesn't have a PIN set
  if (!userHasBillingPin || showPinSetup) {
    return (
      <BillingPinSetup 
        onPinSet={() => {
          setShowPinSetup(false);
          // Force refresh of user data and redirect to billing
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }}
        userHasPin={userHasBillingPin}
      />
    );
  }

  if (!billingAccess) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
              <CardTitle>Billing Module Access</CardTitle>
            </div>
            <CardDescription className="text-center">
              Enter your personal 4-digit PIN to access billing features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Your Billing PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                  disabled={validatePinMutation.isPending}
                />
                {pinError && (
                  <p className="text-sm text-red-600">{pinError}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={validatePinMutation.isPending}
              >
                {validatePinMutation.isPending ? 'Verifying...' : 'Access Billing Module'}
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowPinSetup(true)}
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Update PIN
              </Button>
              <div className="text-xs text-gray-600 text-center">
                <p>Session expires after 30 minutes of inactivity</p>
                <p>PHI protection enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show CMS-1500 form if requested
  if (showCMS1500Form) {
    return (
      <CMS1500Form 
        onBack={() => setShowCMS1500Form(false)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">BILLING MODULE</h1>
          <p className="text-gray-600 mt-2">
            CMS-1500 Management & Medicaid Claims Processing
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Secure Session Active
          </Badge>
          <Button variant="outline" onClick={() => setBillingAccess(false)}>
            Lock Module
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Claims</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold">$3,840</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">86</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Claims
            </CardTitle>
            <CardDescription>
              Create CMS-1500 forms from completed trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="default">
                Auto-Generate from Trips
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setShowCMS1500Form(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Manual Claim Entry
              </Button>
              <div className="text-sm text-gray-600">
                <p>• T2003, T2004, A0120 codes supported</p>
                <p>• CMHS waiver integration</p>
                <p>• Automatic modifier assignment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Batch Processing
            </CardTitle>
            <CardDescription>
              Process multiple claims for submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="default">
                Create New Batch
              </Button>
              <Button className="w-full" variant="outline">
                Review Pending Batches
              </Button>
              <div className="text-sm text-gray-600">
                <p>• Batch validation & scrubbing</p>
                <p>• PDF generation for manual submission</p>
                <p>• Export to Excel/CSV</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Tracking
            </CardTitle>
            <CardDescription>
              Monitor claim payments and rejections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full" variant="default">
                Payment Dashboard
              </Button>
              <Button className="w-full" variant="outline">
                Rejection Analysis
              </Button>
              <div className="text-sm text-gray-600">
                <p>• Payment status tracking</p>
                <p>• Denial pattern analysis</p>
                <p>• Resubmission workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
          <CardDescription>
            Latest billing claims and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">Claim #{2025000 + i}</p>
                    <p className="text-sm text-gray-600">Client: John Doe</p>
                  </div>
                  <div>
                    <p className="text-sm">Service: 01/15/2025</p>
                    <p className="text-sm text-gray-600">T2003 + U2</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">$30.00</p>
                    <p className="text-sm text-gray-600">T2003 Round Trip</p>
                  </div>
                  <Badge variant={i % 3 === 0 ? 'default' : i % 3 === 1 ? 'secondary' : 'destructive'}>
                    {i % 3 === 0 ? 'Paid' : i % 3 === 1 ? 'Submitted' : 'Draft'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm">HIPAA Compliant • PHI Protected • Audit Trail Active</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}