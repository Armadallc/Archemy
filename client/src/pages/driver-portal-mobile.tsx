import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, MapPin, Phone, User, Calendar, CheckCircle, PlayCircle, XCircle, Navigation, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '../lib/queryClient';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addWeeks, subWeeks, addMonths, subMonths, isSameMonth } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

function DriverLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('alex@monarch.com');
  const [password, setPassword] = useState('drive123');
  const [isLogging, setIsLogging] = useState(false);

  const handleLogin = async () => {
    setIsLogging(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        alert('Login failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Login error: ' + error);
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-100">
      <div className="bg-white p-8 border border-stone-300 max-w-md w-full mx-4">
        <div className="w-16 h-16 bg-orange-400 mx-auto mb-4 flex items-center justify-center">
          <div className="w-8 h-8 bg-white"></div>
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-6 text-center">Driver Portal Login</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 focus:outline-none focus:border-orange-400"
              disabled={isLogging}
              placeholder="Enter your email"
              aria-label="Email address"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 focus:outline-none focus:border-orange-400"
              disabled={isLogging}
              placeholder="Enter your password"
              aria-label="Password"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLogging}
            className="w-full bg-stone-800 hover:bg-stone-700 disabled:bg-stone-400 text-white font-medium py-3 transition-colors"
          >
            {isLogging ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DriverTrip {
  id: string;
  clientName: string;
  clientPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledPickupTime: string;
  status: 'order' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tripType: string;
  passengerCount: number;
  notes?: string;
  recurring_trip_id?: string;
}

export default function DriverPortalMobile() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const queryClient = useQueryClient();
  const authToken = localStorage.getItem('auth_token');
  const [selectedTab, setSelectedTab] = useState<'today' | 'calendar'>('today');
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Only enable trip fetching if user is authenticated as a driver
  const isDriverAuthenticated = Boolean(user && user.role === 'driver');

  // Fetch driver trips
  const { data: trips = [], isLoading, refetch, error } = useQuery<DriverTrip[]>({
    queryKey: ['/api/mobile/trips/driver'],
    queryFn: async () => {
      if (!isDriverAuthenticated) return [];
      const response = await apiRequest('GET', '/api/mobile/trips/driver');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      // Transform trips to match DriverTrip interface
      return data.map((trip: any) => ({
        id: trip.id,
        clientName: trip.clientName || trip.client_name || (trip.clients ? `${trip.clients.first_name || ''} ${trip.clients.last_name || ''}`.trim() : 'Unknown Client'),
        clientPhone: trip.clientPhone || trip.client_phone || '',
        pickupLocation: trip.pickupLocation || trip.pickup_address || '',
        dropoffLocation: trip.dropoffLocation || trip.dropoff_address || '',
        scheduledPickupTime: trip.scheduledPickupTime || trip.scheduled_pickup_time || '',
        status: trip.status || 'scheduled',
        tripType: trip.tripType || trip.trip_type || 'one_way',
        passengerCount: trip.passengerCount || trip.passenger_count || 1,
        notes: trip.notes || trip.notes || undefined,
        recurring_trip_id: trip.recurring_trip_id
      }));
    },
    enabled: isDriverAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ tripId, status }: { tripId: string; status: string }) => {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      // Include auth token as fallback if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/mobile/driver/trips/${tripId}/status`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/driver/trips'] });
    },
  });

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

  // Calendar helper functions
  const getCalendarDays = () => {
    if (calendarView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const getTripsForDay = (day: Date) => {
    return trips.filter(trip => 
      isSameDay(new Date(trip.scheduledPickupTime), day)
    );
  };

  const getCalendarPeriodTrips = () => {
    if (calendarView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return trips.filter(trip => {
        const tripDate = new Date(trip.scheduledPickupTime);
        return tripDate >= start && tripDate <= end;
      });
    } else {
      return trips.filter(trip => 
        isSameMonth(new Date(trip.scheduledPickupTime), currentDate)
      );
    }
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (calendarView === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'order': return <AlertTriangle className="h-4 w-4" style={{ color: '#F59E0B' }} />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-orange-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'order': return 'bg-amber-500';
      case 'scheduled': return 'bg-orange-400';
      case 'in_progress': return 'bg-blue-400';
      case 'completed': return 'bg-green-600';
      case 'cancelled': return 'bg-stone-400';
      default: return 'bg-stone-400';
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
      case 'scheduled': return 'Start Trip';
      case 'in_progress': return 'Complete Trip';
      case 'completed': return 'Completed';
      default: return 'Update Status';
    }
  };

  // Confirm order mutation
  const confirmOrderMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/confirm-order`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to confirm order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/driver/trips'] });
      refetch();
    },
  });

  // Decline order mutation
  const declineOrderMutation = useMutation({
    mutationFn: async ({ tripId, reason }: { tripId: string; reason: string }) => {
      const response = await apiRequest('POST', `/api/trips/${tripId}/decline-order`, {
        reason
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to decline order');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/driver/trips'] });
      refetch();
    },
  });

  const [showDeclineDialog, setShowDeclineDialog] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');

  const handleConfirmOrder = (tripId: string) => {
    confirmOrderMutation.mutate(tripId);
  };

  const handleDeclineOrder = (tripId: string) => {
    if (!declineReason) {
      alert('Please select a reason for declining');
      return;
    }
    declineOrderMutation.mutate({ tripId, reason: declineReason });
    setShowDeclineDialog(null);
    setDeclineReason('');
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
      const response = await fetch(`/api/mobile/driver/trips/${tripId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!response.ok) {
        throw new Error(`Failed to cancel trip: ${response.statusText}`);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/mobile/driver/trips'] });
      setShowCancelConfirm(null);
    } catch (error) {
      console.error('Failed to cancel trip:', error);
    }
  };

  // Show authentication message if user is not a driver
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-stone-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isDriverAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="bg-white p-8 border border-stone-300 max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-orange-400 mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white"></div>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-6 text-center">Driver Portal Access Required</h2>
          <p className="text-stone-600 mb-4 text-center">Please log in with a driver account to access the mobile portal.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white font-medium py-3 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-stone-200 border-b border-stone-300">
          <div className="flex justify-between items-center p-6">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Driver Portal</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => refetch()}
                className="bg-stone-600 hover:bg-stone-700 text-white font-medium px-3 py-2 text-sm transition-colors duration-200"
              >
                Refresh
              </button>
              <button 
                onClick={() => logout()}
                className="bg-orange-400 hover:bg-orange-500 text-white font-medium px-3 py-2 text-sm transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Trip Summary Cards */}
          <div className="grid grid-cols-3 gap-4 px-6 pb-6">
            <div className="bg-orange-100 p-4 text-center border border-orange-200">
              <div className="w-8 h-8 bg-orange-400 flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-4 bg-white"></div>
              </div>
              <div className="text-xl font-bold text-stone-900">{todayTrips.length}</div>
              <div className="text-xs text-orange-700 font-medium">Today</div>
            </div>
            <div className="bg-green-100 p-4 text-center border border-green-200">
              <div className="w-8 h-8 bg-green-600 flex items-center justify-center mx-auto mb-2">
                <div className="w-3 h-3 border-2 border-white rounded-full bg-green-600"></div>
              </div>
              <div className="text-xl font-bold text-stone-900">{completedTrips.length}</div>
              <div className="text-xs text-green-700 font-medium">Done</div>
            </div>
            <div className="bg-stone-200 p-4 text-center border border-stone-300">
              <div className="w-8 h-8 bg-stone-600 flex items-center justify-center mx-auto mb-2">
                <div className="w-4 h-1 bg-white"></div>
              </div>
              <div className="text-xl font-bold text-stone-900">
                {selectedTab === 'calendar' ? getCalendarPeriodTrips().length : trips.length}
              </div>
              <div className="text-xs text-stone-700 font-medium">
                {selectedTab === 'calendar' ? (calendarView === 'week' ? 'Week' : 'Month') : 'Total'}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-t border-stone-300">
            <button
              onClick={() => setSelectedTab('today')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${
                selectedTab === 'today'
                  ? 'text-stone-900 bg-stone-200 border-b-2 border-orange-400'
                  : 'text-stone-600 bg-stone-100 hover:text-stone-900 hover:bg-stone-150'
              }`}
            >
              Today ({todayTrips.length})
            </button>
            <button
              onClick={() => setSelectedTab('calendar')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${
                selectedTab === 'calendar'
                  ? 'text-stone-900 bg-stone-200 border-b-2 border-orange-400'
                  : 'text-stone-600 bg-stone-100 hover:text-stone-900 hover:bg-stone-150'
              }`}
            >
              Calendar ({getCalendarPeriodTrips().length})
            </button>
          </div>
        </div>

        {/* Main Content */}
        {selectedTab === 'today' ? (
          <div className="p-6 space-y-4">
            {todayTrips.length === 0 ? (
              <div className="bg-stone-50 p-8 text-center border border-stone-200">
                <div className="w-16 h-16 bg-stone-300 mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-stone-500"></div>
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">
                  No trips today
                </h3>
                <p className="text-sm text-stone-600">
                  Your schedule is clear
                </p>
              </div>
            ) : (
              todayTrips.sort((a, b) => new Date(a.scheduledPickupTime).getTime() - new Date(b.scheduledPickupTime).getTime()).map((trip) => (
              <div key={trip.id} className="bg-white border border-stone-200 overflow-hidden">
                <div className="p-0">
                  {/* Trip Summary */}
                  <div
                    className="p-6 cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => setSelectedTrip(selectedTrip === trip.id ? null : trip.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${getStatusColor(trip.status)}`}></div>
                        <span className="font-bold text-stone-900 text-lg">
                          {trip.clientName}
                        </span>
                      </div>
                      <div className={`px-3 py-1 text-xs font-medium rounded-full ${
                        trip.status === 'order' ? 'bg-amber-100 text-amber-800' :
                        trip.status === 'scheduled' ? 'bg-orange-100 text-orange-800' :
                        trip.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-stone-100 text-stone-800'
                      }`}>
                        {trip.status === 'order' ? 'ORDER' : trip.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-stone-600 font-medium mb-3">
                      {formatDateTime(trip.scheduledPickupTime)}
                    </div>
                    
                    <div className="text-sm text-stone-800 font-medium">
                      {trip.pickupLocation} → {trip.dropoffLocation}
                    </div>
                  </div>

                  {/* Expanded Trip Details */}
                  {selectedTrip === trip.id && (
                    <div className="border-t card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none', borderTop: '1px solid var(--border-muted)' }}>
                      <div className="p-6 space-y-4">
                        {/* Client Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-stone-600"></div>
                          <span className="text-sm text-stone-900 font-medium">
                            {trip.clientPhone}
                          </span>
                        </div>

                        {/* Trip Details */}
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-stone-600 font-medium">Passengers:</span>
                            <span className="text-stone-900 font-bold">{trip.passengerCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-stone-600 font-medium">Type:</span>
                            <span className="text-stone-900 font-bold">{trip.tripType.replace('_', ' ')}</span>
                          </div>
                        </div>

                        {trip.notes && (
                          <div className="text-sm bg-orange-50 p-3 border-l-4 border-orange-300">
                            <span className="text-orange-700 font-medium">Notes: </span>
                            <span className="text-stone-900">{trip.notes}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                          {/* Order Status: Show Confirm/Decline buttons */}
                          {trip.status === 'order' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmOrder(trip.id);
                                }}
                                className="flex-1 card-neu hover:card-neu text-white font-semibold py-3 px-6 transition-all disabled:opacity-50"
                                style={{ 
                                  backgroundColor: '#3bfec9',
                                  border: 'none',
                                  boxShadow: '0 0 12px rgba(59, 254, 201, 0.3)'
                                }}
                                disabled={confirmOrderMutation.isPending}
                              >
                                {confirmOrderMutation.isPending ? 'Confirming...' : 'Confirm Order'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeclineDialog(trip.id);
                                }}
                                className="flex-1 card-neu hover:card-neu text-white font-semibold py-3 px-6 transition-all"
                                style={{ 
                                  backgroundColor: '#e04850',
                                  border: 'none',
                                  boxShadow: '0 0 12px rgba(224, 72, 80, 0.3)'
                                }}
                              >
                                Decline
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/trips/${trip.id}`, '_blank');
                                }}
                                className="card-neu hover:card-neu text-foreground font-semibold py-3 px-4 transition-all"
                                style={{ 
                                  backgroundColor: 'var(--background)',
                                  border: 'none',
                                  boxShadow: 'var(--shadow-neu-flat)'
                                }}
                                title="View trip details"
                              >
                                <MapPin className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Main Status Button */}
                              {getNextStatus(trip.status) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(trip.id, getNextStatus(trip.status)!);
                                  }}
                                  className="flex-1 card-neu hover:card-neu text-white font-semibold py-3 px-6 transition-all disabled:opacity-50"
                                  style={{ 
                                    backgroundColor: 'var(--primary)',
                                    border: 'none',
                                    boxShadow: 'var(--shadow-neu-raised)'
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  {updateStatusMutation.isPending ? 'Updating...' : getStatusButtonText(trip.status)}
                                </button>
                              )}

                              {/* Navigation Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openNavigation(trip.dropoffLocation);
                                }}
                                className="card-neu hover:card-neu text-white font-semibold py-3 px-4 transition-all"
                                style={{ 
                                  backgroundColor: '#3bfec9',
                                  border: 'none',
                                  boxShadow: 'var(--shadow-neu-raised)'
                                }}
                                title="Open navigation to dropoff location"
                                aria-label="Open navigation to dropoff location"
                              >
                                <Navigation className="h-4 w-4" />
                              </button>

                              {/* View Details Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/trips/${trip.id}`, '_blank');
                                }}
                                className="card-neu hover:card-neu text-foreground font-semibold py-3 px-4 transition-all"
                                style={{ 
                                  backgroundColor: 'var(--background)',
                                  border: 'none',
                                  boxShadow: 'var(--shadow-neu-flat)'
                                }}
                                title="View trip details"
                              >
                                <MapPin className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                        
                        {/* Decline Dialog */}
                        {showDeclineDialog === trip.id && (
                          <div className="mt-4 p-4 card-neu rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                            <h4 className="font-semibold text-foreground mb-3">Select Decline Reason</h4>
                            <select
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              className="w-full p-2 mb-3 card-neu-flat rounded-md text-foreground"
                              style={{ backgroundColor: 'var(--background)', border: 'none' }}
                            >
                              <option value="">Select a reason...</option>
                              <option value="conflict">Conflict</option>
                              <option value="day_off">Day Off</option>
                              <option value="unavailable">Unavailable</option>
                              <option value="vehicle_issue">Vehicle Issue</option>
                              <option value="personal_emergency">Personal Emergency</option>
                              <option value="too_far">Too Far</option>
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeclineOrder(trip.id);
                                }}
                                className="flex-1 card-neu hover:card-neu text-white font-semibold py-2 px-4 transition-all"
                                style={{ 
                                  backgroundColor: '#e04850',
                                  border: 'none',
                                  boxShadow: 'var(--shadow-neu-raised)'
                                }}
                                disabled={!declineReason || declineOrderMutation.isPending}
                              >
                                {declineOrderMutation.isPending ? 'Declining...' : 'Submit Decline'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeclineDialog(null);
                                  setDeclineReason('');
                                }}
                                className="card-neu hover:card-neu text-foreground font-semibold py-2 px-4 transition-all"
                                style={{ 
                                  backgroundColor: 'var(--background)',
                                  border: 'none',
                                  boxShadow: 'var(--shadow-neu-flat)'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        ) : (
          <div className="p-6 bg-stone-100">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateCalendar('prev')}
                  className="bg-stone-300 hover:bg-stone-400 text-stone-800 font-medium p-2 transition-colors"
                  title="Previous month"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-bold text-stone-900 text-lg">
                  {calendarView === 'week' 
                    ? format(currentDate, 'MMM d, yyyy')
                    : format(currentDate, 'MMMM yyyy')
                  }
                </h3>
                <button
                  onClick={() => navigateCalendar('next')}
                  className="bg-stone-300 hover:bg-stone-400 text-stone-800 font-medium p-2 transition-colors"
                  title="Next month"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex bg-stone-200 border border-stone-300">
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-4 py-2 text-xs font-semibold transition-colors ${
                    calendarView === 'week'
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-4 py-2 text-xs font-semibold transition-colors ${
                    calendarView === 'month'
                      ? 'bg-stone-800 text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-300'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className={`grid gap-1 ${calendarView === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-stone-600 py-3">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {getCalendarDays().map((day) => {
                const dayTrips = getTripsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => dayTrips.length > 0 && setSelectedDay(day)}
                    className={`
                      relative aspect-square border
                      ${isCurrentMonth ? 'bg-white border-stone-200' : 'bg-stone-50 border-stone-150'}
                      ${dayTrips.length > 0 ? 'cursor-pointer hover:bg-stone-50' : ''}
                      ${isToday ? 'border-orange-400 border-2' : ''}
                      transition-colors
                    `}
                  >
                    <div className="p-2 h-full flex flex-col">
                      <span className={`text-sm font-semibold ${
                        isCurrentMonth ? 'text-stone-900' : 'text-stone-400'
                      } ${isToday ? 'text-orange-600' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayTrips.length > 0 && (
                        <div className="flex-1 flex items-center justify-center">
                          <div className="w-6 h-6 bg-orange-400 flex items-center justify-center">
                            <span className="text-xs text-white font-bold">
                              {dayTrips.length}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day Detail Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm max-h-96 overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {format(selectedDay, 'EEEE, MMM d')}
                    </h3>
                    <Button
                      onClick={() => setSelectedDay(null)}
                      variant="outline"
                      size="sm"
                      className="px-2"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {getTripsForDay(selectedDay).map((trip) => (
                    <div key={trip.id} className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(new Date(trip.scheduledPickupTime), 'h:mm a')}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {trip.clientName}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {trip.tripType === 'one_way' ? 'OW' : 'RT'}
                          </Badge>
                          <div className={`w-2 h-2 rounded-full ${
                            trip.status === 'scheduled' ? 'bg-blue-500' :
                            trip.status === 'in_progress' ? 'bg-orange-500' :
                            trip.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-stone-300 w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-orange-400 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white"></div>
                </div>
                <h3 className="text-lg font-bold text-stone-900">
                  Cancel Trip?
                </h3>
              </div>
              <p className="text-sm text-stone-600 mb-6">
                Are you sure you want to cancel this trip? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-900 font-medium py-2 px-4 transition-colors"
                >
                  Keep Trip
                </button>
                <button
                  onClick={() => handleCancelTrip(showCancelConfirm)}
                  className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-medium py-2 px-4 transition-colors"
                >
                  Cancel Trip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}