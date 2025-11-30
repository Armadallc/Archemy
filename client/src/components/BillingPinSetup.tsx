import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

interface BillingPinSetupProps {
  onPinSet: () => void;
  userHasPin: boolean;
}

export default function BillingPinSetup({ onPinSet, userHasPin }: BillingPinSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setPinMutation = useMutation({
    mutationFn: async (pinData: { pin: string }) => {
      const response = await apiRequest('POST', '/api/user/billing-pin', pinData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "PIN Set Successfully",
        description: "Your billing PIN has been securely saved.",
      });
      // Force refresh of user data to get updated user info
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
      // Wait a moment for the user data to update before calling onPinSet
      setTimeout(() => {
        onPinSet();
      }, 500);
    },
    onError: (error) => {
      setError('Failed to set PIN. Please try again.');
      console.error('PIN setup error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!pin || pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must contain only numbers');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    // Check for common weak PINs
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321'];
    if (weakPins.includes(pin)) {
      setError('Please choose a more secure PIN (avoid repeated digits or sequential numbers)');
      return;
    }

    setPinMutation.mutate({ pin });
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 justify-center">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle>
              {userHasPin ? 'Update Billing PIN' : 'Set Up Billing PIN'}
            </CardTitle>
          </div>
          <CardDescription className="text-center">
            {userHasPin 
              ? 'Create a new 4-digit PIN to access the billing module'
              : 'Create a secure 4-digit PIN to access the billing module'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">New 4-Digit PIN</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? "text" : "password"}
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type={showPin ? "text" : "password"}
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={setPinMutation.isPending}
            >
              {setPinMutation.isPending ? 'Setting PIN...' : 'Set Billing PIN'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-2">PIN Security Requirements:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Must be exactly 4 digits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Cannot be repeated digits (1111, 2222, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Cannot be sequential (1234, 4321, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  PIN is encrypted and stored securely
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}