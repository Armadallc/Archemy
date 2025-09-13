import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, MapPin, User, Car, Calendar, LogOut, AlertTriangle, Phone, Shield, Lock, Navigation, MessageCircle, Radio } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Trip {
  id: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  scheduled_pickup_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  passenger_count: number;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  tripType?: string;
}

export default function MobilePreview() {
  const [activeTab, setActiveTab] = useState<'auth' | 'trips' | 'schedule' | 'profile'>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(12 * 60 * 60 * 1000);
  const [driverCredentials, setDriverCredentials] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: trips = [] } = useQuery({
    queryKey: ['/api/trips/driver/driver_1749740891490'],
    enabled: isAuthenticated,
  });

  // Use driver-specific trips directly
  const driverTrips = (trips as any[]).filter((trip: any) => 
    trip.status === 'scheduled' || trip.status === 'confirmed'
  );

  const tripUpdateMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
      return apiRequest(`/api/trips/${tripId}/status`, 'PATCH', { 
        status,
        timestamp: new Date().toISOString(),
        notes: `Status updated via mobile app to ${status}`,
        location: { latitude: 35.2271, longitude: -80.8431 } // Mock Charlotte location
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips/driver/driver_1749740891490'] });
    },
  });

  const tripConfirmMutation = useMutation({
    mutationFn: async (tripId: string) => {
      return apiRequest(`/api/trips/${tripId}/confirm`, 'POST', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trips/driver/driver_1749740891490'] });
    },
  });

  const handleDriverLogin = async () => {
    if (!driverCredentials.email || !driverCredentials.password) return;
    
    setLoginLoading(true);
    try {
      // Demo login automatically authenticates and enables trip fetching
      console.log('Mobile demo login attempt:', driverCredentials.email);
      
      setIsAuthenticated(true);
      setActiveTab('trips');
      
      // Force refetch trips after authentication
      queryClient.invalidateQueries({ queryKey: ['/api/trips/driver/driver_1749740891490'] });
      
      const interval = setInterval(() => {
        setSessionTimeout(prev => {
          if (prev <= 1000) {
            setIsAuthenticated(false);
            setActiveTab('auth');
            clearInterval(interval);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    } catch (error) {
      console.error('Mobile login error:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmergencyAlert = () => {
    alert('🚨 EMERGENCY ALERT SENT\n\nDispatch has been notified of your emergency situation. They will contact you shortly.\n\nAlert ID: emergency_' + Date.now());
  };

  const formatSessionTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const updateTripStatus = (tripId: string, newStatus: Trip['status']) => {
    tripUpdateMutation.mutate({ tripId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-orange-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Process 1: Driver Authentication & Session Management
  const AuthenticationScreen = () => (
    <div className="h-full flex flex-col justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Car className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Monarch Driver</h1>
        <p className="text-gray-600">Transport Management System</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <Input
            type="email"
            placeholder="Enter your email"
            value={driverCredentials.email}
            onChange={(e) => setDriverCredentials(prev => ({ ...prev, email: e.target.value }))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <Input
            type="password"
            placeholder="Enter your password"
            value={driverCredentials.password}
            onChange={(e) => setDriverCredentials(prev => ({ ...prev, password: e.target.value }))}
            className="w-full"
          />
        </div>

        <Button 
          onClick={handleDriverLogin}
          disabled={loginLoading}
          className="w-full h-12 text-base font-semibold"
        >
          {loginLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        <Button 
          variant="outline"
          onClick={() => {
            setDriverCredentials({ email: 'driver@monarch.com', password: 'demo123' });
          }}
          className="w-full"
        >
          Demo Login
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Secure Authentication</span>
          </div>
          <p className="text-xs text-green-700 mt-1">12-hour session timeout for driver safety</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <Phone className="w-4 h-4" />
            <span className="text-sm">Emergency: 555-DISPATCH</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Process 2 & 3: Trip Assignment & Status Management
  const TripsScreen = () => (
    <div className="h-full overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">My Trips</h2>
          <Badge variant="outline">{trips.filter((t: Trip) => t.status !== 'completed').length} Active</Badge>
        </div>
        <Button 
          onClick={handleEmergencyAlert}
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          Emergency
        </Button>
      </div>

      {isAuthenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Session expires in: {formatSessionTime(sessionTimeout)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {driverTrips.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No trips assigned</p>
            <p className="text-gray-400 text-sm">Check back later or contact dispatch</p>
          </div>
        ) : (
          driverTrips.map((trip: Trip) => (
            <Card key={trip.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      Trip #{trip.id.slice(-6)}
                    </span>
                    {trip.tripType && (
                      <Badge variant="secondary" className="text-xs">
                        {trip.tripType}
                      </Badge>
                    )}
                  </div>
                  <Badge className={getStatusColor(trip.status)}>
                    {trip.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      From: {trip.pickup_location || trip.pickupAddress || 'Location pending'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      To: {trip.dropoff_location || trip.dropoffAddress || 'Destination pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">
                      Pickup: {formatTime(trip.scheduled_pickup_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-gray-700">
                      Passengers: {trip.passenger_count}
                    </span>
                  </div>
                  {trip.notes && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {trip.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {trip.status === 'scheduled' && (
                    <>
                      <div className="flex gap-2 mb-2">
                        <Button
                          onClick={() => {
                            tripConfirmMutation.mutate(trip.id);
                            alert('✅ Trip Confirmed!\n\nYou have confirmed this trip assignment. The user who created this trip has been notified that you are ready for pickup.');
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={tripConfirmMutation.isPending}
                        >
                          Confirm Trip
                        </Button>
                        <Button
                          onClick={() => updateTripStatus(trip.id, 'cancelled')}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          disabled={tripUpdateMutation.isPending}
                        >
                          Cancel
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateTripStatus(trip.id, 'in_progress')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={tripUpdateMutation.isPending}
                        >
                          Start Trip
                        </Button>
                      </div>
                      
                      {/* Navigation & Communication for Scheduled Trips */}
                      <div className="flex gap-1">
                        <Button
                          onClick={() => {
                            const destination = trip.pickup_location || trip.pickupAddress || '';
                            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Navigate
                        </Button>
                        <Button
                          onClick={() => {
                            window.location.href = 'tel:555-DISPATCH';
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                        >
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                        <Button
                          onClick={() => {
                            alert('Opening PTT Radio Channel\n\nConnecting to: Monarch-Dispatch\n\nThis would launch Zello app in production.');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                        >
                          <Radio className="w-3 h-3 mr-1" />
                          PTT
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {trip.status === 'in_progress' && (
                    <>
                      <Button
                        onClick={() => updateTripStatus(trip.id, 'completed')}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={tripUpdateMutation.isPending}
                      >
                        Complete Trip
                      </Button>
                      
                      {/* Live Trip Communication */}
                      <div className="flex gap-1">
                        <Button
                          onClick={() => {
                            alert('💬 Chat Message Sent\n\n"En route to destination. ETA 15 minutes."\n\nReal-time chat would be available in production.');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                        <Button
                          onClick={() => {
                            alert('📍 Location Shared\n\nCurrent GPS coordinates sent to dispatch.\n\nReal-time tracking active.');
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Share Location
                        </Button>
                        <Button
                          onClick={handleEmergencyAlert}
                          size="sm"
                          className="flex-1 text-xs bg-red-600 hover:bg-red-700"
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          SOS
                        </Button>
                      </div>
                    </>
                  )}

                  {trip.status === 'completed' && (
                    <div className="text-center">
                      <div className="text-green-600 font-medium py-2">
                        ✓ Trip Completed
                      </div>
                      <div className="text-xs text-gray-500">
                        GPS tracking stopped • Final location recorded
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const ScheduleScreen = () => (
    <div className="h-full p-4">
      <h2 className="text-xl font-semibold mb-4">Schedule</h2>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Today's Schedule</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Shift: 8:00 AM - 5:00 PM</p>
              <p>Break: 12:00 PM - 1:00 PM</p>
              <p>Status: Active</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="h-full p-4">
      <h2 className="text-xl font-semibold mb-4">Profile</h2>
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Demo Driver</h3>
                <p className="text-sm text-gray-600">driver@monarch.com</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span>Monarch Competency</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vehicle:</span>
                <span>Ford Transit - VEH001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service Area:</span>
                <span>Charlotte Metro</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process 4: Emergency Communication */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleEmergencyAlert}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Send Emergency Alert
            </Button>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Dispatch: 555-DISPATCH</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600" />
                <span>Supervisor: 555-SUPER</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600" />
                <span>Emergency: 911</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => {
            setIsAuthenticated(false);
            setActiveTab('auth');
          }}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-lg font-semibold text-center">
          Monarch Driver Mobile App
        </h1>
        <p className="text-sm text-blue-100 text-center">
          Critical Process Demonstration
        </p>
      </div>

      <div className="h-96 overflow-hidden">
        {activeTab === 'auth' && <AuthenticationScreen />}
        {activeTab === 'trips' && <TripsScreen />}
        {activeTab === 'schedule' && <ScheduleScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>

      {isAuthenticated && (
        <div className="flex border-t bg-gray-50">
          {[
            { id: 'trips', label: 'Trips', icon: Car },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
            { id: 'profile', label: 'Profile', icon: User },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 py-3 px-2 text-xs font-medium flex flex-col items-center gap-1 ${
                activeTab === id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="bg-gray-100 p-3 text-xs text-gray-600">
        <div className="text-center mb-2">
          <strong>Trip Notification Workflow:</strong>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>✓ User creates trip → Driver notified</div>
          <div>✓ Driver confirms → User notified</div>
          <div>✓ Driver starts → All parties notified</div>
          <div>✓ Driver completes → All parties notified</div>
        </div>
        <div className="text-center mt-2 text-xs">
          <strong>Status Flow:</strong> Scheduled → Confirmed → In Progress → Completed
        </div>
      </div>
    </div>
  );
}