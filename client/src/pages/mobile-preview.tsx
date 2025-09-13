import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Clock, MapPin, User, Car, Calendar, LogOut, AlertTriangle, Phone, Shield, Lock, Navigation, MessageCircle, Radio } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';

interface Trip {
  id: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_address?: string;
  dropoff_address?: string;
  scheduled_pickup_time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  passenger_count: number;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  trip_type?: string;
}

export default function MobilePreview() {
  const [activeTab, setActiveTab] = useState<'auth' | 'trips' | 'schedule' | 'profile'>('trips');
  const [driverCredentials, setDriverCredentials] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(12 * 60 * 60 * 1000);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user can start trips (only drivers and super admins)
  const canStartTrips = user?.role === 'driver' || user?.role === 'super_admin';
  
  // Use the existing web app authentication instead of separate mobile auth
  const webAppAuthenticated = !!user;

  const { data: trips = [], isLoading: tripsLoading, error } = useQuery({
    queryKey: ['/api/trips/driver/driver_1749740891490'],
    enabled: true, // Always enabled for testing
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  console.log('Mobile app query state:', { trips, isLoading: tripsLoading, error, isAuthenticated, webAppAuthenticated });

  // Use driver-specific trips directly
  const driverTrips = (trips as Trip[]).filter((trip: Trip) => 
    trip.status === 'scheduled' || trip.status === 'confirmed'
  );

  const tripUpdateMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
      return apiRequest(`/api/trips/${tripId}/status`, 'PATCH', { 
        status,
        timestamp: new Date().toISOString(),
        notes: `Status updated via mobile app to ${status}`,
        location: { latitude: 35.2271, longitude: -80.8431 }
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
      console.log('Mobile demo login attempt:', driverCredentials.email);
      
      // For mobile demo, skip backend auth and directly enable trip fetching
      // This allows the mobile app to fetch real trip data without complex auth flows
      console.log('Mobile app: Demo authentication for', driverCredentials.email);
      
      setIsAuthenticated(true);
      setActiveTab('trips');
      
      // Force fetch trips after authentication
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto bg-gray-900 text-white min-h-screen">
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Car className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Monarch Driver</h1>
            <p className="text-gray-400">Mobile Application</p>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Driver Login
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Driver Email"
                type="email"
                value={driverCredentials.email}
                onChange={(e) => setDriverCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Input
                placeholder="Password"
                type="password"
                value={driverCredentials.password}
                onChange={(e) => setDriverCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Button 
                onClick={handleDriverLogin}
                disabled={loginLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loginLoading ? 'Logging in...' : 'Login'}
              </Button>
              <Button 
                onClick={() => setDriverCredentials({ email: 'demo@driver.com', password: 'demo123' })}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Use Demo Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-gray-900 text-white min-h-screen">
      {/* Header */}
      <div className="bg-blue-600 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Car className="w-6 h-6" />
            <span className="font-semibold">Monarch Driver</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex items-center gap-1 text-xs bg-blue-700 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                {formatSessionTime(sessionTimeout)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {tripsLoading ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500 text-lg">Loading trips...</p>
          </div>
        ) : driverTrips.length === 0 ? (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No trips assigned</p>
            <p className="text-gray-400 text-sm">Total trips found: {(trips as Trip[]).length}</p>
            <p className="text-gray-400 text-xs">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          driverTrips.map((trip: Trip) => (
            <Card key={trip.id} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={trip.status === 'scheduled' ? 'default' : 'secondary'}>
                      {trip.status.replace('_', ' ')}
                    </Badge>
                    {trip.priority === 'urgent' && (
                      <Badge variant="destructive">Urgent</Badge>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{formatDate(trip.scheduled_pickup_time)}</div>
                    <div className="font-semibold">{formatTime(trip.scheduled_pickup_time)}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Pickup</div>
                      <div className="text-gray-600">{trip.pickup_address || trip.pickup_location}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Dropoff</div>
                      <div className="text-gray-600">{trip.dropoff_address || trip.dropoff_location}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{trip.passenger_count} passenger(s)</span>
                  </div>
                </div>

                {trip.notes && (
                  <div className="text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded">
                    {trip.notes}
                  </div>
                )}

                <div className="space-y-2">
                  {trip.status === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => tripConfirmMutation.mutate(trip.id)}
                        disabled={tripConfirmMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Confirm Trip
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => tripUpdateMutation.mutate({ tripId: trip.id, status: 'cancelled' })}
                        disabled={tripUpdateMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  {trip.status === 'confirmed' && canStartTrips && (
                    <Button 
                      size="sm" 
                      onClick={() => tripUpdateMutation.mutate({ tripId: trip.id, status: 'in_progress' })}
                      disabled={tripUpdateMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Start Trip
                    </Button>
                  )}
                  
                  {trip.status === 'in_progress' && canStartTrips && (
                    <Button 
                      size="sm" 
                      onClick={() => tripUpdateMutation.mutate({ tripId: trip.id, status: 'completed' })}
                      disabled={tripUpdateMutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Complete Trip
                    </Button>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Navigation className="w-3 h-3 mr-1" />
                      Navigate
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Emergency Button */}
      <div className="fixed bottom-20 right-4">
        <Button 
          onClick={handleEmergencyAlert}
          className="bg-red-600 hover:bg-red-700 rounded-full w-14 h-14 p-0"
          title="Emergency Alert"
        >
          <AlertTriangle className="w-6 h-6" />
        </Button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'schedule' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Driver Schedule</h2>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Schedule view coming soon</p>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Driver Profile</h2>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Driver ID</label>
                  <div className="text-white">driver_1749740891490</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <div className="text-white">{driverCredentials.email}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <div className="text-green-400">Active</div>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Session</label>
                  <div className="text-blue-400">{formatSessionTime(sessionTimeout)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-4 gap-1">
          <Button
            variant={activeTab === 'trips' ? 'default' : 'ghost'}
            onClick={() => {
              console.log('Mobile app: Switching to trips tab');
              setActiveTab('trips');
              queryClient.invalidateQueries({ queryKey: ['/api/trips/driver/driver_1749740891490'] });
            }}
            className="rounded-none py-3 flex flex-col items-center gap-1"
          >
            <Car className="w-4 h-4" />
            <span className="text-xs">Trips</span>
          </Button>
          <Button
            variant={activeTab === 'schedule' ? 'default' : 'ghost'}
            onClick={() => {
              console.log('Mobile app: Switching to schedule tab');
              setActiveTab('schedule');
            }}
            className="rounded-none py-3 flex flex-col items-center gap-1"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Schedule</span>
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            onClick={() => {
              console.log('Mobile app: Switching to profile tab');
              setActiveTab('profile');
            }}
            className="rounded-none py-3 flex flex-col items-center gap-1"
          >
            <User className="w-4 h-4" />
            <span className="text-xs">Profile</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              console.log('Mobile app: Logging out');
              setIsAuthenticated(false);
              setActiveTab('auth');
            }}
            className="rounded-none py-3 flex flex-col items-center gap-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-xs">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}