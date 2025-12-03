/**
 * Public QR Verification/Signup Page
 * 
 * Clients scan QR code and enter their information to opt-in for push notifications
 * No authentication required - this is a public page
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';
import { webPushService } from '../../services/web-push-service';

interface QRCodeInfo {
  programId: string;
  programName: string;
  token: string;
}

export default function QRVerifyPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string>('');
  const [qrInfo, setQrInfo] = useState<QRCodeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Extract token from URL
  useEffect(() => {
    const path = window.location.pathname;
    // Handle both /public/qr-verify/:token and /public/qr-verify/:token* patterns
    const match = path.match(/\/public\/qr-verify\/([^/]+)/);
    if (match && match[1]) {
      setToken(match[1]);
    } else {
      setError('Invalid QR code link');
      setLoading(false);
    }
  }, []);

  // Fetch QR code info
  useEffect(() => {
    if (!token) return;

    const fetchQRInfo = async () => {
      try {
        const response = await apiRequest('GET', `/api/client-notifications/public/qr/${token}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setQrInfo(data.data);
        } else {
          setError(data.message || 'Invalid or expired QR code');
        }
      } catch (err: any) {
        console.error('Error fetching QR info:', err);
        setError('Failed to load QR code information');
      } finally {
        setLoading(false);
      }
    };

    fetchQRInfo();
  }, [token]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        setError('PIN must be exactly 4 digits');
        setSubmitting(false);
        return;
      }

      // Verify client information
      const verifyResponse = await apiRequest('POST', '/api/client-notifications/public/qr/verify', {
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        pin,
        pushEnabled: optIn
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        setError(verifyData.message || 'Verification failed');
        setSubmitting(false);
        return;
      }

      const { clientId, userId: verifiedUserId, pushSetupRequired } = verifyData.data;

      if (pushSetupRequired && optIn) {
        // Initialize web push service
        await webPushService.initialize();
        
        // Subscribe to push notifications
        try {
          await webPushService.subscribeToPush(verifiedUserId);
          setUserId(verifiedUserId);
          setSuccess(true);
        } catch (pushError: any) {
          console.error('Error subscribing to push:', pushError);
          // Check if permission was denied
          if (pushError.message?.includes('permission denied')) {
            // Show a helpful message but still mark as successful
            // The user can enable notifications in browser settings later
            console.warn('⚠️ Notification permission denied. User can enable it in browser settings.');
          }
          // Still show success even if push subscription fails
          // User can retry later by enabling notifications in browser settings
          setUserId(verifiedUserId);
          setSuccess(true);
        }
      } else {
        setUserId(verifiedUserId);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Error verifying client:', err);
      setError(err.message || 'Failed to verify. Please check your information and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600 dark:text-gray-300">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !qrInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-800">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-gray-900 dark:text-gray-100">{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    const handleRetryPushSubscription = async () => {
      if (!userId) return;
      
      try {
        await webPushService.initialize();
        await webPushService.subscribeToPush(userId);
        alert('✅ Push notifications enabled successfully!');
      } catch (error: any) {
        if (error.message?.includes('permission denied')) {
          alert('⚠️ Please enable notifications in your browser settings:\n\nChrome/Edge: Click the lock icon → Site settings → Notifications → Allow\n\nThen refresh this page and try again.');
        } else {
          alert(`Error: ${error.message || 'Failed to enable push notifications'}`);
        }
      }
    };

    const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    const needsPermission = notificationPermission !== 'granted';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <span>You're All Set!</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              You've successfully signed up for trip notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription className="text-gray-900 dark:text-gray-100">
                You'll now receive push notifications about:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Upcoming trip reminders</li>
                  <li>Driver arrival notifications</li>
                  <li>Trip status updates</li>
                  <li>Trip delays or changes</li>
                </ul>
              </AlertDescription>
            </Alert>
            {needsPermission && (
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-gray-900 dark:text-gray-100">
                  <p className="font-semibold mb-2">Enable Push Notifications</p>
                  <p className="text-sm mb-3">
                    To receive notifications, please enable them in your browser settings:
                  </p>
                  <ul className="text-xs list-disc list-inside space-y-1 mb-3">
                    <li><strong>Chrome/Edge:</strong> Click the lock icon → Site settings → Notifications → Allow</li>
                    <li><strong>Firefox:</strong> Click the lock icon → More Information → Permissions → Notifications → Allow</li>
                    <li><strong>Safari:</strong> Safari → Settings → Websites → Notifications → Allow for localhost</li>
                  </ul>
                  <Button 
                    onClick={handleRetryPushSubscription}
                    className="w-full"
                    size="sm"
                  >
                    Retry Push Notification Setup
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You can close this page. Notifications will appear on your device when trips are scheduled or updated.
            </p>
            {userId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Remember your PIN: <strong>{pin}</strong> (you may need it for future access)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Sign Up for Trip Notifications</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {qrInfo?.programName ? `Program: ${qrInfo.programName}` : 'Enter your information to receive trip notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-gray-900 dark:text-gray-100">{error}</AlertDescription>
              </Alert>
            )}

            {/* Disclosure */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm text-gray-900 dark:text-gray-100">
                <strong>What you'll receive:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Upcoming trip reminders</li>
                  <li>Driver arrival notifications</li>
                  <li>Trip status updates</li>
                  <li>Trip delays or changes</li>
                </ul>
                <p className="mt-2 text-xs">
                  You can opt out at any time by contacting your case manager.
                </p>
              </AlertDescription>
            </Alert>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-900 dark:text-gray-100">First Name *</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
                className="text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-900 dark:text-gray-100">Last Name *</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
                className="text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-gray-900 dark:text-gray-100">Phone Number (optional but recommended)</Label>
              <PhoneInput
                id="phoneNumber"
                value={phoneNumber}
                onChange={(value) => setPhoneNumber(value)}
                className="text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@email.com"
                className="text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* PIN */}
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-gray-900 dark:text-gray-100">4-Digit PIN *</Label>
              <Input
                id="pin"
                type="text"
                value={pin}
                onChange={(e) => {
                  // Only allow digits, max 4
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(value);
                }}
                required
                placeholder="1234"
                maxLength={4}
                className="text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter the 4-digit PIN provided by your case manager
              </p>
            </div>

            {/* Opt-in Checkbox */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="optIn"
                checked={optIn}
                onCheckedChange={(checked) => setOptIn(checked === true)}
              />
              <Label htmlFor="optIn" className="text-sm cursor-pointer text-gray-900 dark:text-gray-100">
                I agree to receive push notifications about my trips
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !optIn || !firstName || !lastName || !pin || pin.length !== 4}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign Up for Notifications'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

