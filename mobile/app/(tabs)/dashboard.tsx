import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../services/logger';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../contexts/NotificationContext';
import AvailabilityPopup from '../../components/AvailabilityPopup';
import TripCalendar from '../../components/TripCalendar';
import NeumorphicView from '../../components/NeumorphicView';
import { Platform } from 'react-native';

type ViewMode = 'day' | 'week' | 'month';

interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  actual_return_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed' | 'no_show';
  trip_type: string;
  passenger_count: number;
  notes?: string;
  special_requirements?: string;
  is_group_trip?: boolean;
  client_group_id?: string;
  client_group_name?: string;
  // Telematics Phase 1 fields
  appointment_time?: string | null;
  trip_purpose?: string | null;
  trip_code?: string | null;
  trip_modifier?: string | null;
  programs?: {
    name: string;
    corporate_clients?: {
      name: string;
    };
  };
  clients?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  pickup_locations?: {
    name: string;
    address: string;
  };
  dropoff_locations?: {
    name: string;
    address: string;
  };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useNotifications();
  const [showAvailabilityPopup, setShowAvailabilityPopup] = useState(false);
  const [hasShownPostLoginPopup, setHasShownPostLoginPopup] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch driver profile to check availability
  const { data: driverProfile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => apiClient.getDriverProfile(),
    enabled: user?.role === 'driver',
  });

  // Show popup after login for drivers (only once)
  useEffect(() => {
    if (user?.role === 'driver' && !hasShownPostLoginPopup && driverProfile) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowAvailabilityPopup(true);
        setHasShownPostLoginPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.role, hasShownPostLoginPopup, driverProfile]);

  const { data: trips = [], isLoading, error: tripsError, refetch } = useQuery<Trip[]>({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
    onError: (error) => {
      console.error('❌ [Dashboard] Error fetching trips:', error);
      logger.error('Failed to fetch driver trips', 'DashboardScreen', { 
        error: error instanceof Error ? error.message : String(error),
        userId: user?.id 
      });
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Debug: Log trip data to see what we're receiving
  React.useEffect(() => {
    if (trips.length > 0 && __DEV__) {
      const groupTrips = trips.filter(t => t.is_group_trip);
      if (groupTrips.length > 0) {
        console.log('🔍 [Dashboard] Group trips data:', groupTrips.map(t => ({
          id: t.id,
          is_group_trip: t.is_group_trip,
          client_group_id: t.client_group_id,
          client_group_name: t.client_group_name,
          client_name: t.client_name,
          clients: t.clients
        })));
      }
    }
  }, [trips]);
  
  // Log errors for debugging
  React.useEffect(() => {
    if (tripsError) {
      console.error('🚨 [Dashboard] Trips query error:', {
        error: tripsError,
        message: tripsError instanceof Error ? tripsError.message : String(tripsError),
        userId: user?.id,
        userEmail: user?.email,
      });
    }
  }, [tripsError, user]);

  // Filter trips for today (handle timezone properly)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTrips = trips.filter((trip) => {
    if (!trip.scheduled_pickup_time) return false;
    try {
      const tripDate = new Date(trip.scheduled_pickup_time);
      // Compare dates only (ignore time for today's filter)
      const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = tripDateOnly.getTime() === todayDateOnly.getTime();
      
      // Debug logging (only in development)
      if (__DEV__ && isToday) {
        console.log('📅 Trip matches today:', {
          tripId: trip.id,
          scheduledTime: trip.scheduled_pickup_time,
          tripDate: tripDateOnly.toISOString(),
          todayDate: todayDateOnly.toISOString(),
        });
      }
      
      return isToday;
    } catch (error) {
      console.error('Error parsing trip date:', trip.scheduled_pickup_time, error);
      return false;
    }
  });
  
  // Debug: Log trip filtering results
  if (__DEV__) {
    console.log('📊 Trip filtering:', {
      totalTrips: trips.length,
      todayTrips: todayTrips.length,
      today: today.toISOString(),
      sampleTripDates: trips.slice(0, 3).map(t => ({
        id: t.id,
        scheduled: t.scheduled_pickup_time,
        status: t.status,
      })),
    });
  }

  // Get trip statistics for TODAY only (matching the "Today's Trips" section below)
  const getDriverStats = () => {
    // Use todayTrips instead of all trips to match the "Today's Trips" section
    const totalTrips = todayTrips.length;
    const completedTrips = todayTrips.filter(t => t.status === 'completed').length;
    const inProgressTrips = todayTrips.filter(t => t.status === 'in_progress').length;
    const scheduledTrips = todayTrips.filter(t => t.status === 'scheduled' || t.status === 'confirmed').length;
    
    return { totalTrips, completedTrips, inProgressTrips, scheduledTrips };
  };

  const stats = getDriverStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleTripPress = (tripId: string) => {
    router.push(`/(tabs)/trip-details?tripId=${tripId}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };


  // Detect dark theme for neumorphic styling
  const isDark = theme.mode === 'dark' || 
    (theme.mode === 'system' && theme.colors.background === '#292929');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    header: {
      backgroundColor: theme.colors.card,
      // Remove border, use shadows instead
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
    },
    notificationBell: {
      position: 'relative',
      padding: 8,
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: theme.colors.card,
    },
    badgeText: {
      ...theme.typography.caption,
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 11,
    },
    headerStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 16,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statNumber: {
      ...theme.typography.body,
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 16,
      // Add subtle glow for accent color
      ...(Platform.OS === 'web' && {
        textShadow: `0 0 8px ${theme.colors.primary}40, 0 0 12px ${theme.colors.primary}20`,
      } as any),
    },
    statLabel: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      fontSize: 11,
      marginTop: 2,
    },
    viewModeSelector: {
      backgroundColor: theme.colors.card,
      // Remove border, use shadows instead
      padding: 16,
      paddingVertical: 12,
      overflow: 'visible', // Allow content to be visible
    },
    viewModeButtons: {
      flexDirection: 'row',
      backgroundColor: theme.colors.background,
      padding: 4,
      borderRadius: 12,
      minHeight: 44, // Ensure minimum height for touch targets
      overflow: 'visible', // Allow buttons to be visible
      // Remove nested NeumorphicView, use regular View with background
    },
    viewModeButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40, // Ensure minimum height for touch targets
      overflow: 'visible', // Allow shadows to be visible
    },
    viewModeButtonActive: {
      // Active state handled by NeumorphicView style change
    },
    viewModeButtonText: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
    },
    viewModeButtonTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: theme.colors.card,
      // Remove border, use shadows instead
    },
    dateNavigationCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
    },
    dateText: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    },
    navButton: {
      padding: 8,
    },
    calendarContainer: {
      flex: 1,
    },
  });

  // Show error state if trips query failed
  if (tripsError && !isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error || '#EF4444'} />
        <Text style={[styles.headerTitle, { color: theme.colors.error || '#EF4444', marginTop: 16 }]}>
          Error Loading Trips
        </Text>
        <Text style={[styles.statLabel, { marginTop: 8, textAlign: 'center' }]}>
          {tripsError instanceof Error ? tripsError.message : 'Failed to load trips. Please try again.'}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{
            marginTop: 20,
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: theme.colors.primary,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: theme.colors.primaryForeground, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <Text style={[styles.statLabel, { marginTop: 16, fontSize: 10, fontFamily: 'monospace' }]}>
            {JSON.stringify(tripsError, null, 2)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <AvailabilityPopup
        visible={showAvailabilityPopup}
        onClose={() => setShowAvailabilityPopup(false)}
        onBypass={() => {
          setShowAvailabilityPopup(false);
          // Driver can view trips without enabling availability
        }}
        driverProfileId={driverProfile?.id}
        initialAvailability={driverProfile?.is_available ?? false}
        showBypass={true}
        onAvailabilityEnabled={() => {
          // Already on dashboard, just close popup
          setShowAvailabilityPopup(false);
        }}
      />
      <View style={styles.container}>
        {/* Header with Title, Stats, and Notification Bell */}
        <NeumorphicView
          style={isDark ? 'debossed' : 'embossed'}
          intensity="subtle"
          borderRadius={0}
          containerStyle={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <TouchableOpacity
              style={styles.notificationBell}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={24} color={theme.colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount.toString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Stats Row */}
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.inProgressTrips}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.scheduledTrips}</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
          </View>
        </NeumorphicView>

        {/* View Mode Selector */}
        <NeumorphicView
          style={isDark ? 'debossed' : 'embossed'}
          intensity="subtle"
          borderRadius={0}
          containerStyle={styles.viewModeSelector}
        >
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              onPress={() => setViewMode('day')}
              activeOpacity={0.7}
              style={{ flex: 1, marginHorizontal: 2 }}
            >
              <NeumorphicView
                style={viewMode === 'day' ? (isDark ? 'embossed' : 'debossed') : (isDark ? 'debossed' : 'embossed')}
                intensity={viewMode === 'day' ? 'medium' : 'subtle'}
                borderRadius={6}
                containerStyle={styles.viewModeButton}
                backgroundColor={viewMode === 'day' ? theme.colors.primary : theme.colors.background}
              >
                <Text style={[styles.viewModeButtonText, viewMode === 'day' && styles.viewModeButtonTextActive]}>
                  Day
                </Text>
              </NeumorphicView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('week')}
              activeOpacity={0.7}
              style={{ flex: 1, marginHorizontal: 2 }}
            >
              <NeumorphicView
                style={viewMode === 'week' ? (isDark ? 'embossed' : 'debossed') : (isDark ? 'debossed' : 'embossed')}
                intensity={viewMode === 'week' ? 'medium' : 'subtle'}
                borderRadius={6}
                containerStyle={styles.viewModeButton}
                backgroundColor={viewMode === 'week' ? theme.colors.primary : theme.colors.background}
              >
                <Text style={[styles.viewModeButtonText, viewMode === 'week' && styles.viewModeButtonTextActive]}>
                  Week
                </Text>
              </NeumorphicView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('month')}
              activeOpacity={0.7}
              style={{ flex: 1, marginHorizontal: 2 }}
            >
              <NeumorphicView
                style={viewMode === 'month' ? (isDark ? 'embossed' : 'debossed') : (isDark ? 'debossed' : 'embossed')}
                intensity={viewMode === 'month' ? 'medium' : 'subtle'}
                borderRadius={6}
                containerStyle={styles.viewModeButton}
                backgroundColor={viewMode === 'month' ? theme.colors.primary : theme.colors.background}
              >
                <Text style={[styles.viewModeButtonText, viewMode === 'month' && styles.viewModeButtonTextActive]}>
                  Month
                </Text>
              </NeumorphicView>
            </TouchableOpacity>
          </View>
        </NeumorphicView>

        {/* Date Navigation */}
        <NeumorphicView
          style={isDark ? 'debossed' : 'embossed'}
          intensity="subtle"
          borderRadius={0}
          containerStyle={styles.dateNavigation}
        >
          <View style={styles.dateNavigationCenter}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateDate('prev')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.dateText}>
              {viewMode === 'day' && formatDate(selectedDate)}
              {viewMode === 'week' && `Week of ${formatDate(selectedDate)}`}
              {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateDate('next')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
        </NeumorphicView>

        {/* Trip Calendar - defaults to day view showing current day */}
        <View style={styles.calendarContainer}>
          <TripCalendar 
            trips={trips} 
            onTripPress={handleTripPress}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            hideHeader={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
          />
        </View>
      </View>
    </>
  );
}

