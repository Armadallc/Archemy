import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MapPin, Phone, User, Calendar, CheckCircle, PlayCircle, XCircle, Navigation, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';

interface DriverTrip {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledPickupTime: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tripType: string;
  passengerCount: number;
  notes?: string;
}

export default function DriverPortal() {
  console.log('🚗 DriverPortal component rendering...');
  const queryClient = useQueryClient();
  const [selectedView, setSelectedView] = useState<'today' | 'all' | 'completed'>('today');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);

  // Fetch driver trips
  const { data: trips = [], isLoading, refetch, error } = useQuery<DriverTrip[]>({
    queryKey: ['/api/mobile/driver/trips'],
    queryFn: async () => {
      const response = await fetch('/api/mobile/driver/trips', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    refetchInterval: 30000,
    retry: 1,
    retryDelay: 2000,
    enabled: true,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Debug logging
  useEffect(() => {
    console.log('🚗 Driver portal mounted');
    console.log('🚗 Query state:', { isLoading, tripsCount: trips.length, error: error ? String(error) : 'none' });
    if (error) {
      console.error('🚗 Driver portal query error:', error);
    }
  }, [isLoading, trips, error]);

  // Force immediate data fetch on mount
  useEffect(() => {
    console.log('🚗 Forcing initial refetch...');
    const timer = setTimeout(() => {
      refetch();
    }, 1000); // Wait 1 second after mount
    return () => clearTimeout(timer);
  }, []);

  // Trip status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
      const response = await fetch(`/api/mobile/driver/trips/${tripId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update trip status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/driver/trips'] });
      setSelectedTrip(null);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scheduled': return 'in_progress';
      case 'in_progress': return 'completed';
      default: return null;
    }
  };

  const getStatusButtonText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Confirm Trip';
      case 'in_progress': return 'End Trip';
      case 'completed': return 'Completed';
      default: return 'Update Status';
    }
  };

  const openNavigation = (address: string) => {
    // Create navigation URL for default maps app
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let navigationUrl = '';
    
    if (isIOS) {
      navigationUrl = `maps://maps.apple.com/?daddr=${encodedAddress}`;
    } else if (isAndroid) {
      navigationUrl = `geo:0,0?q=${encodedAddress}`;
    } else {
      // Fallback to Google Maps web
      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }
    
    window.open(navigationUrl, '_blank');
  };

  const handleCancelTrip = async (tripId: string) => {
    try {
      await apiRequest(`/api/mobile/driver/trips/${tripId}/status`, {
        method: 'POST',
        body: { status: 'cancelled' }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/driver/trips'] });
      setShowCancelConfirm(null);
    } catch (error) {
      console.error('Failed to cancel trip:', error);
    }
  };

  const getNextStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'scheduled': return 'Start Trip';
      case 'in_progress': return 'Complete Trip';
      default: return null;
    }
  };

  const handleStatusUpdate = (tripId: string, newStatus: string) => {
    updateStatusMutation.mutate({ tripId, status: newStatus });
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };

  const todayTrips = trips.filter(trip => {
    const tripDate = new Date(trip.scheduledPickupTime);
    const today = new Date();
    return tripDate.toDateString() === today.toDateString();
  });

  const completedTrips = trips.filter(trip => trip.status === 'completed');

  // Get current view trips
  const getCurrentViewTrips = () => {
    switch (selectedView) {
      case 'today':
        return todayTrips.sort((a, b) => new Date(a.scheduledPickupTime).getTime() - new Date(b.scheduledPickupTime).getTime());
      case 'all':
        return trips;
      case 'completed':
        return completedTrips;
      default:
        return todayTrips;
    }
  };

  const currentTrips = getCurrentViewTrips();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading trips...</p>
        </div>
      </div>
    );
  }

  // Show test data if there's an error to verify component rendering
  const testTrips = [
    {
      id: 'test_1',
      clientName: 'John Smith',
      clientPhone: '(704) 555-1001',
      pickupLocation: '100 N Tryon St, Charlotte, NC',
      dropoffLocation: 'Charlotte Community Health Center',
      scheduledPickupTime: '2025-06-16T09:00:00',
      status: 'scheduled' as const,
      tripType: 'one_way',
      passengerCount: 1,
      notes: 'Test trip for driver portal verification'
    }
  ];

  const displayTrips = error ? testTrips : trips;

  if (error && trips.length === 0) {
    console.log('🚗 Showing error state with test data');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Debug info */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-sm">
        <strong>Debug:</strong> Loading: {isLoading.toString()}, Trips: {trips.length}, Error: {error ? String(error) : 'none'}
      </div>
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Driver Portal</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage your assigned trips</p>
            </div>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Today's Trips */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  All Trips ({displayTrips.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {displayTrips.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No trips found
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {displayTrips.map((trip) => (
                        <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(trip.status)}
                                  <Badge className={getStatusColor(trip.status)}>
                                    {trip.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDateTime(trip.scheduledPickupTime)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span className="font-medium">{trip.clientName}</span>
                                <Phone className="h-4 w-4 text-gray-500 ml-2" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{trip.clientPhone}</span>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                                <div className="flex-1">
                                  <div className="text-sm">
                                    <div className="font-medium">From: {trip.pickupLocation}</div>
                                    <div className="text-gray-600 dark:text-gray-400">To: {trip.dropoffLocation}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {selectedTrip === trip.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center">
                                  <div className="space-y-1">
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Passengers: {trip.passengerCount}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      Type: {trip.tripType.replace('_', ' ')}
                                    </div>
                                    {trip.notes && (
                                      <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Notes: {trip.notes}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {getNextStatus(trip.status) && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(trip.id, getNextStatus(trip.status)!);
                                      }}
                                      disabled={updateStatusMutation.isPending}
                                      className="ml-4"
                                    >
                                      {updateStatusMutation.isPending ? 'Updating...' : getNextStatusText(trip.status)}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Trip Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Trip Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Trips:</span>
                    <span className="font-semibold">{trips.length}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Today:</span>
                    <span className="font-semibold">{todayTrips.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Upcoming:</span>
                    <span className="font-semibold">{upcomingTrips.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="font-semibold">{completedTrips.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Trips */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {upcomingTrips.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No upcoming trips
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTrips.slice(0, 5).map((trip) => (
                        <div key={trip.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-sm">{trip.clientName}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDateTime(trip.scheduledPickupTime)}
                              </div>
                            </div>
                            <Badge className={getStatusColor(trip.status)} variant="secondary">
                              {trip.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}